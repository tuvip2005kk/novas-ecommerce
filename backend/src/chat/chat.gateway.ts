import { 
    WebSocketGateway, 
    WebSocketServer, 
    SubscribeMessage, 
    MessageBody, 
    ConnectedSocket,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService, ChatMessage } from './chat.service';
import { TelegramService } from './telegram.service';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@WebSocketGateway({
    cors: {
        origin: '*', // Trong môi trường thật nên set thành domain Frontend
    },
    namespace: '/chat'
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);
    
    // Lưu trữ trạng thái Session: true nếu đang chat với nhân viên (Handoff)
    private handoffSessions: Map<string, boolean> = new Map();
    // Lưu mapping client.id -> sessionId để biết ai disconnect
    private clientSessions: Map<string, string> = new Map();
    // Lưu timer đếm ngược 5 phút không hoạt động
    private handoffTimeouts: Map<string, NodeJS.Timeout> = new Map();

    constructor(
        private readonly chatService: ChatService,
        private readonly telegramService: TelegramService,
        private readonly prisma: PrismaService
    ) {}

    afterInit(server: Server) {
        this.telegramService.setGateway(this);
        this.logger.log('Chat Socket Gateway Initialized');
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        const sessionId = this.clientSessions.get(client.id);
        if (sessionId) {
            this.clientSessions.delete(client.id);
            // Nếu khách hàng F5 (disconnect) thì tự động kết thúc phiên hỗ trợ
            if (this.handoffSessions.get(sessionId)) {
                this.forceEndHandoff(sessionId, 'Khách hàng đã tải lại trang hoặc rời khỏi. Hệ thống tự động kết thúc phiên hỗ trợ.');
            }
        }
    }

    // Đảm bảo session tồn tại trong DB, nếu chưa có thì tạo mới
    private async ensureSessionExists(sessionId: string) {
        const session = await this.prisma.chatSession.findUnique({
            where: { id: sessionId }
        });
        if (!session) {
            await this.prisma.chatSession.create({
                data: { id: sessionId, status: 'AI' }
            });
        }
        return session;
    }

    // Lưu tin nhắn vào DB
    async saveMessage(sessionId: string, role: string, content: string) {
        await this.ensureSessionExists(sessionId);
        let finalContent = content;
        // Tránh lưu chuỗi [ACTION:HANDOFF] vào CSDL
        if (role === 'model' && content.includes('[ACTION:HANDOFF]')) {
             finalContent = content.replace('[ACTION:HANDOFF]', '').trim();
        }

        const msg = await this.prisma.chatMessage.create({
            data: { sessionId, role, content: finalContent }
        });
        return msg;
    }

    // Hàm dùng chung để ép kết thúc Handoff và đưa về AI
    private async forceEndHandoff(sessionId: string, sysMsg: string) {
        this.handoffSessions.set(sessionId, false);
        
        if (this.handoffTimeouts.has(sessionId)) {
            clearTimeout(this.handoffTimeouts.get(sessionId));
            this.handoffTimeouts.delete(sessionId);
        }

        await this.prisma.chatSession.update({ where: { id: sessionId }, data: { status: 'AI' } });
        await this.saveMessage(sessionId, 'system', sysMsg);
        this.sendToClient(sessionId, { role: 'system', content: sysMsg });
        
        // Báo cho Admin UI biết
        this.server.to('admin_dashboard').emit('adminReceiveMessage', { 
            sessionId, 
            message: { role: 'system', content: sysMsg, id: Date.now() } 
        });
    }

    // Reset lại timer 5 phút không hoạt động
    private resetHandoffTimeout(sessionId: string) {
        if (!this.handoffSessions.get(sessionId)) return; // Chỉ áp dụng khi đang handoff

        if (this.handoffTimeouts.has(sessionId)) {
            clearTimeout(this.handoffTimeouts.get(sessionId));
        }

        const timeout = setTimeout(() => {
            this.forceEndHandoff(sessionId, 'Phiên hỗ trợ tự động kết thúc do không có phản hồi trong 5 phút. Bạn đã được kết nối lại với Bot AI.');
        }, 5 * 60 * 1000); // 5 phút

        this.handoffTimeouts.set(sessionId, timeout);
    }

    @SubscribeMessage('joinSession')
    async handleJoinSession(
        @ConnectedSocket() client: Socket,
        @MessageBody() sessionId: string
    ) {
        if (sessionId) {
            client.join(sessionId);
            this.clientSessions.set(client.id, sessionId);
            this.logger.log(`Client ${client.id} joined session room: ${sessionId}`);
        }
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { sessionId: string; message: string; history: ChatMessage[] }
    ) {
        const { sessionId, message, history } = payload;
        
        // Cho client tham gia vào room ứng với sessionId
        client.join(sessionId);
        this.clientSessions.set(client.id, sessionId);

        const isHandedOff = this.handoffSessions.get(sessionId) || false;

        // Lưu tin nhắn người dùng và broadcast tới Admin
        if (message !== '[SYSTEM:REQUEST_HANDOFF]') {
            const savedMsg = await this.saveMessage(sessionId, 'user', message);
            // Gửi ngay cho Admin Dashboard biết để realtime
            this.server.to('admin_dashboard').emit('adminReceiveMessage', { 
                sessionId, 
                message: { id: savedMsg.id, role: 'user', content: message } 
            });
        }

        // Xử lý cờ handoff cứng từ frontend (nếu người dùng bấm nút yêu cầu nhân viên)
        if (message === '[SYSTEM:REQUEST_HANDOFF]') {
            this.handoffSessions.set(sessionId, true);
            await this.prisma.chatSession.update({ where: { id: sessionId }, data: { status: 'HANDOFF' } });

            await this.telegramService.sendMessageToAdmin(sessionId, "Khách vừa bấm nút YÊU CẦU GẶP NHÂN VIÊN.", true);
            
            const sysMsg = 'Hệ thống đang chuyển kết nối đến nhân viên hỗ trợ. Bạn vui lòng đợi giây lát nhé! 😊';
            await this.saveMessage(sessionId, 'system', sysMsg);
            this.sendToClient(sessionId, { role: 'system', content: sysMsg });
            
            this.resetHandoffTimeout(sessionId); // Bắt đầu đếm giờ 5p
            return;
        }

        if (isHandedOff) {
            // Đã chuyển sang chế độ Live Chat với nhân viên
            await this.telegramService.sendMessageToAdmin(sessionId, message, false);
            this.resetHandoffTimeout(sessionId); // Reset timer vì khách vừa nhắn
            return;
        }

        // Đang ở chế độ Chatbot AI
        try {
            const aiResponse = await this.chatService.chat(message, history);

            // Kiểm tra xem AI có trả về cờ Handoff không
            if (aiResponse.includes('[ACTION:HANDOFF]')) {
                this.handoffSessions.set(sessionId, true);
                await this.prisma.chatSession.update({ where: { id: sessionId }, data: { status: 'HANDOFF' } });
                
                // Lọc bỏ chuỗi [ACTION:HANDOFF] ra khỏi câu trả lời
                const cleanResponse = aiResponse.replace('[ACTION:HANDOFF]', '').trim();
                
                if (cleanResponse) {
                    await this.saveMessage(sessionId, 'model', cleanResponse);
                    this.sendToClient(sessionId, { role: 'model', content: cleanResponse });
                }

                const sysMsg = 'Hệ thống đang chuyển kết nối đến nhân viên hỗ trợ. Bạn vui lòng đợi giây lát nhé! 😊';
                await this.saveMessage(sessionId, 'system', sysMsg);
                this.sendToClient(sessionId, { role: 'system', content: sysMsg });

                // Gửi thông báo đến Telegram
                await this.telegramService.sendMessageToAdmin(sessionId, message, true);
                
                this.resetHandoffTimeout(sessionId); // Bắt đầu đếm giờ 5p
            } else {
                // Phản hồi bình thường
                await this.saveMessage(sessionId, 'model', aiResponse);
                this.sendToClient(sessionId, { role: 'model', content: aiResponse });
            }
        } catch (error) {
            this.logger.error('Lỗi khi gọi AI:', error);
            const sysMsg = 'Xin lỗi, AI đang gặp sự cố kỹ thuật. Bạn có muốn kết nối với nhân viên tư vấn không?';
            await this.saveMessage(sessionId, 'system', sysMsg);
            this.sendToClient(sessionId, { role: 'system', content: sysMsg });
        }
    }

    @SubscribeMessage('adminJoin')
    async handleAdminJoin(@ConnectedSocket() client: Socket) {
        client.join('admin_dashboard');
        this.logger.log(`Admin ${client.id} joined dashboard`);
    }

    @SubscribeMessage('adminSendMessage')
    async handleAdminSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { sessionId: string; message: string }
    ) {
        const { sessionId, message } = payload;
        
        // Save to DB
        const savedMsg = await this.saveMessage(sessionId, 'staff', message);

        // Send to the specific user's room
        this.sendToClient(sessionId, { role: 'staff', content: message, id: savedMsg.id });
        
        // Reset timeout vì Admin vừa phản hồi
        this.resetHandoffTimeout(sessionId);
    }

    @SubscribeMessage('adminEndChat')
    async handleAdminEndChat(
        @ConnectedSocket() client: Socket,
        @MessageBody() sessionId: string
    ) {
        this.logger.log(`Admin manually ended chat for session: ${sessionId}`);
        await this.forceEndHandoff(sessionId, 'Nhân viên đã kết thúc phiên hỗ trợ. Bạn đã được kết nối lại với Bot AI.');
    }

    sendToClient(sessionId: string, message: { role: string; content: string; id?: number }) {
        this.logger.log(`Gửi tin nhắn (role: ${message.role}) tới phòng: ${sessionId}`);
        this.server.to(sessionId).emit('receiveMessage', message);
        
        // Cập nhật cho Admin Dashboard biết có tin nhắn mới trong session này
        this.server.to('admin_dashboard').emit('adminReceiveMessage', { sessionId, message });
    }
}
