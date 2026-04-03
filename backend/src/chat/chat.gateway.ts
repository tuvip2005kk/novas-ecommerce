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

    constructor(
        private readonly chatService: ChatService,
        private readonly telegramService: TelegramService
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
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { sessionId: string; message: string; history: ChatMessage[] }
    ) {
        const { sessionId, message, history } = payload;
        
        // Cho client tham gia vào room ứng với sessionId
        client.join(sessionId);

        const isHandedOff = this.handoffSessions.get(sessionId) || false;

        // Xử lý cờ handoff cứng từ frontend (nếu người dùng bấm nút yêu cầu nhân viên)
        if (message === '[SYSTEM:REQUEST_HANDOFF]') {
            this.handoffSessions.set(sessionId, true);
            await this.telegramService.sendMessageToAdmin(sessionId, "Khách vừa bấm nút YÊU CẦU GẶP NHÂN VIÊN.", true);
            this.sendToClient(sessionId, {
                role: 'system',
                content: 'Hệ thống đang chuyển kết nối đến nhân viên hỗ trợ. Bạn vui lòng đợi giây lát nhé! 😊'
            });
            return;
        }

        if (isHandedOff) {
            // Đã chuyển sang chế độ Live Chat với nhân viên
            await this.telegramService.sendMessageToAdmin(sessionId, message, false);
            return;
        }

        // Đang ở chế độ Chatbot AI
        try {
            const aiResponse = await this.chatService.chat(message, history);

            // Kiểm tra xem AI có trả về cờ Handoff không
            if (aiResponse.includes('[ACTION:HANDOFF]')) {
                this.handoffSessions.set(sessionId, true);
                
                // Lọc bỏ chuỗi [ACTION:HANDOFF] ra khỏi câu trả lời
                const cleanResponse = aiResponse.replace('[ACTION:HANDOFF]', '').trim();
                
                if (cleanResponse) {
                    this.sendToClient(sessionId, { role: 'model', content: cleanResponse });
                }

                this.sendToClient(sessionId, {
                    role: 'system',
                    content: 'Hệ thống đang chuyển kết nối đến nhân viên hỗ trợ. Bạn vui lòng đợi giây lát nhé! 😊'
                });

                // Gửi thông báo đến Telegram
                await this.telegramService.sendMessageToAdmin(sessionId, message, true);
            } else {
                // Phản hồi bình thường
                this.sendToClient(sessionId, { role: 'model', content: aiResponse });
            }
        } catch (error) {
            this.logger.error('Lỗi khi gọi AI:', error);
            this.sendToClient(sessionId, {
                role: 'system',
                content: 'Xin lỗi, AI đang gặp sự cố kỹ thuật. Bạn có muốn kết nối với nhân viên tư vấn không?'
            });
        }
    }

    sendToClient(sessionId: string, message: { role: string; content: string }) {
        this.server.to(sessionId).emit('receiveMessage', message);
    }
}
