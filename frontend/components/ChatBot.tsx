"use client";

import { API_URL } from "@/config";
import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  ChevronDown,
  HeadphonesIcon,
  ExternalLink,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { usePathname } from "next/navigation";

interface Message {
  role: "user" | "model" | "staff" | "system";
  content: string;
}

interface ProductCardData {
  name: string;
  price: string;
  href: string;
  image: string;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content:
        "Xin chào! Tôi là trợ lý tư vấn của **NOVAS**. Tôi có thể giúp bạn chọn thiết bị vệ sinh, nhà bếp và Smart Home phù hợp với nhu cầu, ngân sách và không gian lắp đặt. Bạn cần tư vấn gì ạ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessionId, setSessionId] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isOpenRef = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    let currentSessionId = localStorage.getItem("novas_chat_session");
    if (!currentSessionId) {
      currentSessionId =
        "session_" +
        Date.now().toString(36) +
        Math.random().toString(36).substring(2, 9);
      localStorage.setItem("novas_chat_session", currentSessionId);
    }
    setSessionId(currentSessionId);

    const newSocket = io(`${API_URL}/chat`, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("Chat Socket connected:", newSocket.id);
      newSocket.emit("joinSession", currentSessionId);
    });

    newSocket.on("receiveMessage", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      setIsLoading(false);
      setHasNewMessage(!isOpenRef.current);
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

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const getAssetUrl = (value: string) => {
    if (!value) return "/images/placeholder.png";
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith("/uploads")) return `${API_URL}${value}`;
    if (value.startsWith("/")) return value;
    return `${API_URL}/${value}`;
  };

  const decodeField = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const parseProductCard = (token: string): ProductCardData | null => {
    const match = token.match(/^\[\[PRODUCT_CARD\|(.+)\]\]$/);
    if (!match) return null;

    const [name, price, href, image] = match[1].split("|").map(decodeField);
    if (!name || !href) return null;

    return { name, price, href, image };
  };

  const formatMessage = (text: string) => {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    return escaped
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /(^|[\s(])((?:\/[a-z0-9-]+\/[a-z0-9-]+)|(?:\/products\/\d+))/g,
        (_match, prefix, url) =>
          `${prefix}<a href="${url}" class="font-semibold text-[#21246b] underline underline-offset-2">Xem chi tiết</a>`,
      )
      .replace(/\n/g, "<br/>");
  };

  const renderMessageContent = (content: string) => {
    const parts = content
      .split(/(\[\[PRODUCT_CARD\|[^\]]+\]\])/g)
      .filter(Boolean);

    return parts.map((part, index) => {
      const card = parseProductCard(part);

      if (!card) {
        return (
          <p
            key={index}
            dangerouslySetInnerHTML={{ __html: formatMessage(part.trim()) }}
          />
        );
      }

      return (
        <a
          key={index}
          href={card.href}
          className="mt-3 block overflow-hidden rounded-sm border border-gray-200 bg-white text-gray-900 shadow-sm transition hover:border-[#21246b]/40 hover:shadow-md"
        >
          <img
            src={getAssetUrl(card.image)}
            alt={card.name}
            className="h-32 w-full bg-gray-100 object-cover"
            loading="lazy"
          />
          <div className="space-y-1 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Ảnh demo
            </p>
            <p className="text-sm font-semibold leading-snug text-gray-900">
              {card.name}
            </p>
            {card.price && (
              <p className="text-sm font-bold text-[#21246b]">{card.price}</p>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#21246b]">
              Xem chi tiết <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </a>
      );
    });
  };

  const sendMessage = (text: string = input) => {
    if (!text.trim() || isLoading || !socket) return;

    if (text !== "[SYSTEM:REQUEST_HANDOFF]") {
      const userMessage: Message = { role: "user", content: text.trim() };
      setMessages((prev) => [...prev, userMessage]);
    }

    setInput("");
    setIsLoading(true);

    const history = messages
      .filter((m) => m.role === "user" || m.role === "model")
      .slice(1)
      .slice(-12);

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
    "Có mã khuyến mãi không?",
    "Showroom NOVAS ở đâu?",
    "Tư vấn lavabo dưới 3 triệu",
  ];

  return (
    <>
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col items-end gap-2 z-30 pointer-events-none">
        {isOpen && (
          <div className="pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="w-[min(360px,_calc(100vw-2rem))] h-[520px] bg-white rounded-sm shadow-2xl flex flex-col overflow-hidden border border-gray-100">
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

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
                {messages.map((msg, i) => {
                  if (msg.role === "system") {
                    return (
                      <div key={i} className="flex justify-center my-2">
                        <p className="text-xs text-gray-500 italic bg-gray-200/50 px-3 py-1 rounded-sm">
                          {msg.content}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={i}
                      className={`flex gap-2 ${
                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                          msg.role === "user" ? "bg-slate-700" : "bg-[#21246b]"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <User className="w-3.5 h-3.5 text-white" />
                        ) : msg.role === "staff" ? (
                          <HeadphonesIcon className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Bot className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>

                      <div
                        className={`max-w-[75%] rounded-sm px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                          msg.role === "user"
                            ? "bg-slate-800 text-white rounded-tr-none"
                            : msg.role === "staff"
                              ? "bg-[#21246b] text-white rounded-tl-none"
                              : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                        }`}
                      >
                        {msg.role === "staff" && (
                          <p className="text-[10px] font-bold text-white/80 mb-0.5 uppercase tracking-wider">
                            Nhân viên CSKH
                          </p>
                        )}
                        {renderMessageContent(msg.content)}
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                      <div className="flex gap-1 items-center">
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {messages.length === 1 && (
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => sendMessage("[SYSTEM:REQUEST_HANDOFF]")}
                    className="flex-shrink-0 text-xs bg-[#21246b]/5 border border-[#21246b]/20 text-[#21246b] rounded-sm px-3 py-1.5 hover:bg-[#21246b]/10 font-bold transition-colors whitespace-nowrap flex items-center gap-1"
                  >
                    <HeadphonesIcon className="w-3 h-3" /> Chat với nhân viên
                  </button>
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(q);
                        inputRef.current?.focus();
                      }}
                      className="flex-shrink-0 text-xs bg-white border border-gray-200 text-gray-600 rounded-sm px-3 py-1.5 hover:border-slate-400 hover:text-slate-700 transition-colors whitespace-nowrap"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div className="px-3 py-3 border-t border-gray-100 bg-white">
                <div className="flex gap-2 items-center bg-gray-50 rounded-sm border border-gray-200 focus-within:border-slate-400 focus-within:bg-white transition-all px-3 py-2">
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
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="w-8 h-8 bg-[#21246b] rounded-sm flex items-center justify-center hover:bg-[#1a1c54] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                    aria-label="Gửi"
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
        )}

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="pointer-events-auto relative w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-700 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label="Mở chat tư vấn"
        >
          <div
            className={`transition-all duration-300 absolute ${
              isOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
            }`}
          >
            <X className="w-6 h-6 text-white" />
          </div>
          <div
            className={`transition-all duration-300 absolute ${
              isOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"
            }`}
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </div>

          {hasNewMessage && !isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
      </div>
    </>
  );
}
