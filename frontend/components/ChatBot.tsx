"use client";
import { API_URL } from "@/config";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown, HeadphonesIcon } from "lucide-react";
import { io, Socket } from "socket.io-client";

interface Message {
  role: "user" | "model" | "staff" | "system";
  content: string;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: "Xin chào! 👋 Tôi là trợ lý tư vấn của **NOVAS**. Tôi có thể giúp bạn tìm kiếm sản phẩm thiết bị vệ sinh, nhà bếp và Smart Home phù hợp nhất. Bạn cần tư vấn gì ạ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessionId, setSessionId] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Khởi tạo Socket và Session ID
  useEffect(() => {
    let currentSessionId = localStorage.getItem("novas_chat_session");
    if (!currentSessionId) {
      currentSessionId = "session_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("novas_chat_session", currentSessionId);
    }
    setSessionId(currentSessionId);

    const newSocket = io(`${API_URL}/chat`, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("Chat Socket connected:", newSocket.id);
      newSocket.emit("joinSession", currentSessionId);
    });

    newSocket.on("receiveMessage", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      setIsLoading(false);
      
      // Nếu không mở chat thì hiển thị badge tin nhắn mới
      setHasNewMessage(true);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasNewMessage(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  // Scroll when new message arrives even if open
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const formatMessage = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");
  };

  const sendMessage = (text: string = input) => {
    if (!text.trim() || isLoading || !socket) return;

    if (text !== "[SYSTEM:REQUEST_HANDOFF]") {
      const userMessage: Message = { role: "user", content: text.trim() };
      setMessages((prev) => [...prev, userMessage]);
    }
    
    setInput("");
    setIsLoading(true);

    const history = messages.filter(m => m.role === 'user' || m.role === 'model').slice(1, -1);

    socket.emit("sendMessage", {
      sessionId,
      message: text.trim(),
      history,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "Sản phẩm bán chạy nhất?",
    "Bồn cầu thông minh giá bao nhiêu?",
  ];

  return (
    <>
      {/* Nút bong bóng chat nổi */}
      <div className={`fixed bottom-20 right-5 flex flex-col items-end gap-2 ${isOpen ? 'z-40' : 'z-40 pointer-events-none'}`}>
        {/* Widget chat */}
        <div
          className={`pointer-events-auto transition-all duration-500 ease-in-out origin-bottom-right ${
            isOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-4 pointer-events-none"
          }`}
        >
          <div className="w-[360px] h-[520px] bg-white rounded-sm shadow-2xl flex flex-col overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-800" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Trợ lý NOVAS</p>
                  <p className="text-white/60 text-xs">Tư vấn sản phẩm 24/7</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Đóng"
              >
                <ChevronDown className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
              {messages.map((msg, i) => {
                if (msg.role === "system") {
                  return (
                    <div key={i} className="flex justify-center my-2">
                      <p className="text-xs text-gray-500 italic bg-gray-200/50 px-3 py-1 rounded-sm">{msg.content}</p>
                    </div>
                  );
                }

                return (
                  <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar */}
                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                      msg.role === "user"
                        ? "bg-slate-700"
                        : msg.role === "staff" 
                          ? "bg-[#21246b]"
                          : "bg-[#21246b]"
                    }`}>
                      {msg.role === "user" ? <User className="w-3.5 h-3.5 text-white" /> :
                       msg.role === "staff" ? <HeadphonesIcon className="w-3.5 h-3.5 text-white" /> :
                       <Bot className="w-3.5 h-3.5 text-white" />}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[75%] rounded-sm px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-slate-800 text-white rounded-tr-none"
                        : msg.role === "staff"
                          ? "bg-[#21246b] text-white rounded-tl-none"
                          : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                    }`}>
                      {msg.role === "staff" && <p className="text-[10px] font-bold text-white/80 mb-0.5 uppercase tracking-wider">Nhân viên CSKH</p>}
                      <p dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                    </div>
                  </div>
                );
              })}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                    <div className="flex gap-1 items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick questions (chỉ hiện khi mới mở) */}
            {messages.length === 1 && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => sendMessage("[SYSTEM:REQUEST_HANDOFF]")}
                    className="flex-shrink-0 text-xs bg-[#21246b]/5 border border-[#21246b]/20 text-[#21246b] rounded-sm px-3 py-1.5 hover:bg-[#21246b]/10 font-bold transition-colors whitespace-nowrap flex items-center gap-1"
                  >
                    <HeadphonesIcon className="w-3 h-3" /> Chat với nhân viên tư vấn
                </button>
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="flex-shrink-0 text-xs bg-white border border-gray-200 text-gray-600 rounded-sm px-3 py-1.5 hover:border-slate-400 hover:text-slate-700 transition-colors whitespace-nowrap"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input area */}
            <div className="px-3 py-3 border-t border-gray-100 bg-white">
              <div className="flex gap-2 items-center bg-gray-50 rounded-sm border border-gray-200 focus-within:border-slate-400 focus-within:bg-white transition-all px-3 py-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập câu trả lời..."
                  className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400"
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="w-8 h-8 bg-[#21246b] rounded-sm flex items-center justify-center hover:bg-[#1a1c54] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Nút mở/đóng chat - luôn clickable */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="pointer-events-auto relative w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-700 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label="Mở chat tư vấn"
        >
          <div className={`transition-all duration-300 absolute ${isOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"}`}>
            <X className="w-6 h-6 text-white" />
          </div>
          <div className={`transition-all duration-300 absolute ${isOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"}`}>
            <MessageCircle className="w-6 h-6 text-white" />
          </div>

          {/* Badge tin nhắn mới */}
          {hasNewMessage && !isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
      </div>
    </>
  );
}
