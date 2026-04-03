"use client";
import { API_URL } from "@/config";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown } from "lucide-react";

interface Message {
  role: "user" | "model";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const formatMessage = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Gửi lịch sử hội thoại (bỏ tin nhắn chào hỏi đầu tiên của bot)
      const history = newMessages.slice(1, -1);

      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const botMessage: Message = { role: "model", content: data.reply };
      setMessages((prev) => [...prev, botMessage]);

      if (!isOpen) setHasNewMessage(true);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ hotline để được hỗ trợ nhé! 🙏",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "Sản phẩm bán chạy nhất?",
    "Thiết bị nhà bếp cao cấp?",
    "Bồn cầu thông minh giá bao nhiêu?",
  ];

  return (
    <>
      {/* Nút bong bóng chat nổi */}
      <div className="fixed bottom-20 right-5 z-50 flex flex-col items-end gap-2">
        {/* Widget chat */}
        <div
          className={`transition-all duration-500 ease-in-out origin-bottom-right ${
            isOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-4 pointer-events-none"
          }`}
        >
          <div className="w-[360px] h-[520px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
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
              >
                <ChevronDown className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                    msg.role === "user"
                      ? "bg-slate-700"
                      : "bg-gradient-to-br from-blue-500 to-indigo-600"
                  }`}>
                    {msg.role === "user"
                      ? <User className="w-3.5 h-3.5 text-white" />
                      : <Bot className="w-3.5 h-3.5 text-white" />
                    }
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-slate-800 text-white rounded-tr-sm"
                      : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
                  }`}>
                    <p
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    />
                  </div>
                </div>
              ))}

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
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="flex-shrink-0 text-xs bg-white border border-gray-200 text-gray-600 rounded-full px-3 py-1.5 hover:border-slate-400 hover:text-slate-700 transition-colors whitespace-nowrap"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input area */}
            <div className="px-3 py-3 border-t border-gray-100 bg-white">
              <div className="flex gap-2 items-center bg-gray-50 rounded-xl border border-gray-200 focus-within:border-slate-400 focus-within:bg-white transition-all px-3 py-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập câu hỏi..."
                  className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              </div>
              <p className="text-center text-transparent text-[10px] mt-1.5 select-none"> </p>
            </div>
          </div>
        </div>

        {/* Nút mở/đóng chat */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-700 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
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
