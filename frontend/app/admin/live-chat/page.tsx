"use client";

import { useState, useEffect, useRef } from "react";
import { API_URL } from "@/config";
import io, { Socket } from "socket.io-client";
import { Loader2, Send, User, HeadphonesIcon, Bot, CornerUpLeft } from "lucide-react";

interface ChatMessage {
  id: number;
  sessionId: string;
  role: string;
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  status: string;
  userId: number | null;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[]; // Lấy tin nhắn mới nhất
}

export default function AdminLiveChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const selectedSessionIdRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [readItems, setReadItems] = useState<Record<string, number>>({});

  useEffect(() => {
    // Load read status from local storage
    const stored = localStorage.getItem('novas_admin_read_status');
    if (stored) {
      try { setReadItems(JSON.parse(stored)); } catch {}
    }

    fetchSessions();

    const newSocket = io(`${API_URL}/chat`, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      newSocket.emit("adminJoin");
    });

    newSocket.on("adminReceiveMessage", (data: { sessionId: string; message: any }) => {
      const { sessionId, message } = data;
      
      // Nếu đang mở khung chat của khách này, thêm tin nhắn vào màn hình
      if (sessionId === selectedSessionIdRef.current) {
        setMessages((prev) => [...prev, message as ChatMessage]);
        
        // Đánh dấu đã đọc ngay lập tức vì Admin đang xem
        setReadItems(prev => {
          const next = { ...prev, [sessionId]: message.id };
          localStorage.setItem('novas_admin_read_status', JSON.stringify(next));
          return next;
        });
      }
      
      // Cập nhật lại danh sách session
      fetchSessions();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []); // Run only once to prevent infinite socket reconnects

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chat/admin/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/admin/sessions/${sessionId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Lỗi lấy lịch sử chat:", error);
    }
  };

  const markAsRead = (sessionId: string, latestMsgId: number) => {
    setReadItems(prev => {
      const next = { ...prev, [sessionId]: latestMsgId };
      localStorage.setItem('novas_admin_read_status', JSON.stringify(next));
      return next;
    });
  };

  const handleSelectSession = (sessionId: string, latestMsgId?: number) => {
    setSelectedSessionId(sessionId);
    selectedSessionIdRef.current = sessionId;
    setMessages([]);
    fetchMessages(sessionId);
    if (latestMsgId) markAsRead(sessionId, latestMsgId);
  };

  const handleSendMessage = () => {
    if (!input.trim() || !socket || !selectedSessionId) return;

    socket.emit("adminSendMessage", {
      sessionId: selectedSessionId,
      message: input.trim(),
    });

    setInput("");
  };

  const handleEndChat = () => {
    if (!socket || !selectedSessionId) return;

    socket.emit("adminEndChat", selectedSessionId);
    
    // Chờ server xử lý xong rồi fecth lại tin nhắn để thấy thông báo "Kết thúc"
    setTimeout(() => {
      fetchMessages(selectedSessionId);
      fetchSessions();
    }, 500);
  };

  // Tự động cuộn xuống tin nhắn cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatMessage = (text: string) => {
    if (!text) return "";
    return text.replace(/\n/g, "<br>");
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
      }).format(date);
    } catch {
      return "";
    }
  };

  const selectedSessionData = sessions.find(s => s.id === selectedSessionId);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 h-[calc(100vh-100px)] flex overflow-hidden">
      {/* Sidebar - Sessions List */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col h-full bg-slate-50">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-bold text-slate-800">Khách hàng trực tuyến</h2>
          <p className="text-xs text-slate-500">Quản lý các phiên hội thoại</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Không có cuộc trò chuyện nào.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sessions.map((session) => {
                const latestMsg = session.messages?.[0];
                // Tính là chưa đọc nếu có tin nhắn mới nhất, khác với id đã lưu, VÀ tin đó không phải do chính Admin (staff) gửi.
                const isUnread = latestMsg && readItems[session.id] !== latestMsg.id && latestMsg.role !== 'staff';
                const isSelected = selectedSessionId === session.id;

                let cardBgClass = "bg-slate-50 hover:bg-slate-100 border-l-[3px] border-transparent"; // Đã xem (Read)
                if (isSelected) {
                    cardBgClass = "bg-slate-100 border-l-[3px] border-[#21246b]"; // Đang Focus
                } else if (isUnread) {
                    cardBgClass = "bg-white border-l-[3px] border-transparent shadow-sm relative"; // Chưa xem (Unread)
                }

                return (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session.id, latestMsg?.id)}
                    className={`p-4 cursor-pointer transition-colors ${cardBgClass}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`text-sm truncate ${isUnread ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                        ID: {session.id.substring(0, 8)}...
                      </h3>
                      {latestMsg && (
                        <span className={`text-[10px] whitespace-nowrap ml-2 ${isUnread ? "text-[#21246b] font-medium" : "text-slate-400"}`}>
                          {getTimeAgo(latestMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    {/* Bỏ tag CẦN HỖ TRỢ, thay vào đó tập trung vào UX Read/Unread */}
                    <div className="flex justify-between items-center mt-1">
                      {latestMsg && (
                        <p className={`text-xs truncate flex-1 ${isUnread ? "text-slate-800 font-medium" : "text-slate-500"}`}>
                          {latestMsg.role === 'staff' ? 'Bạn: ' : 
                           latestMsg.role === 'model' ? 'AI: ' : 
                           latestMsg.role === 'system' ? 'Hệ thống: ' : 'Khách: '}
                          {latestMsg.content.substring(0, 40)}
                        </p>
                      )}
                      
                      {/* Chấm bi màu xanh đặc trưng (chưa đọc) */}
                      {isUnread && !isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#21246b] ml-3 flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {!selectedSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <HeadphonesIcon className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Chọn một khách hàng để bắt đầu chat</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm z-10">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#21246b]" />
                  Khách hàng: {selectedSessionId.substring(0, 12)}...
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">ID đầy đủ: {selectedSessionId}</p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg, i) => {
                if (msg.role === "system") {
                  return (
                    <div key={i} className="flex justify-center my-2">
                      <p className="text-[11px] text-gray-500 bg-gray-200/50 px-3 py-1 rounded-sm border border-gray-200">
                        Hệ thống: {msg.content}
                      </p>
                    </div>
                  );
                }

                const isMe = msg.role === "staff";
                const isUser = msg.role === "user";
                const isAI = msg.role === "model";

                return (
                  <div key={i} className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"}`}>
                    {!isMe && (
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                        isUser ? "bg-slate-700" : "bg-[#21246b]"
                      }`}>
                        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                      </div>
                    )}

                    <div className={`max-w-[70%] rounded-md px-4 py-3 shadow-sm text-sm ${
                      isMe
                        ? "bg-[#21246b] text-white rounded-tr-none"
                        : isUser 
                          ? "bg-white text-slate-800 rounded-tl-none border border-slate-200" 
                          : "bg-blue-50 text-slate-800 rounded-tl-none border border-blue-100"
                    }`}>
                      {isAI && <p className="text-[10px] font-bold text-blue-600 mb-1">Bot AI Tư vấn</p>}
                      <p dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} className="leading-relaxed" />
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200">
              {selectedSessionData?.status === 'HANDOFF' && (
                <div className="mb-2">
                  <button 
                    onClick={handleEndChat} 
                    className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <CornerUpLeft className="w-4 h-4 mr-1.5" />
                    Kết thúc phiên chat
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Nhập tin nhắn trả lời khách hàng..."
                  className="flex-1 border border-slate-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#21246b]"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim()}
                  className="bg-[#21246b] text-white px-5 py-2 rounded-md hover:bg-[#1a1c54] disabled:opacity-50 flex items-center gap-2 font-medium"
                >
                  <Send className="w-4 h-4" />
                  Gửi
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
