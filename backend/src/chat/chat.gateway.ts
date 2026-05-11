import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService, ChatMessage } from './chat.service';
import { TelegramService } from './telegram.service';
import { PrismaService } from '../prisma.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/chat',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);
    private handoffSessions: Map<string, boolean> = new Map();
    private clientSessions: Map<string, string> = new Map();
    private handoffTimeouts: Map<string, NodeJS.Timeout> = new Map();

    constructor(
        private readonly chatService: ChatService,
        private readonly telegramService: TelegramService,
        private readonly prisma: PrismaService,
    ) {}

    afterInit() {
        this.telegramService.setGateway(this);
        this.logger.log('Chat Socket Gateway initialized');
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        const sessionId = this.clientSessions.get(client.id);

        if (!sessionId) return;

        this.clientSessions.delete(client.id);
        if (this.handoffSessions.get(sessionId)) {
            this.forceEndHandoff(
                sessionId,
                'Khách hàng đã tải lại trang hoặc rời khỏi cuộc trò chuyện. Hệ thống tự động kết thúc phiên hỗ trợ.',
            );
        }
    }

    private async ensureSessionExists(sessionId: string) {
        const session = await this.prisma.chatSession.findUnique({
            where: { id: sessionId },
        });

        if (session) return session;

        return this.prisma.chatSession.create({
            data: { id: sessionId, status: 'AI' },
        });
    }

    private async updateSessionStatus(sessionId: string, status: 'AI' | 'HANDOFF' | 'RESOLVED') {
        await this.prisma.chatSession.upsert({
            where: { id: sessionId },
            update: { status },
            create: { id: sessionId, status },
        });
    }

    async saveMessage(sessionId: string, role: string, content: string) {
        await this.ensureSessionExists(sessionId);

        const finalContent =
            role === 'model' && content.includes('[ACTION:HANDOFF]')
                ? content.replace('[ACTION:HANDOFF]', '').trim()
                : content;

        return this.prisma.chatMessage.create({
            data: { sessionId, role, content: finalContent },
        });
    }

    private async forceEndHandoff(sessionId: string, sysMsg: string) {
        this.handoffSessions.set(sessionId, false);

        if (this.handoffTimeouts.has(sessionId)) {
            clearTimeout(this.handoffTimeouts.get(sessionId));
            this.handoffTimeouts.delete(sessionId);
        }

        await this.updateSessionStatus(sessionId, 'AI');
        await this.saveMessage(sessionId, 'system', sysMsg);
        this.sendToClient(sessionId, { role: 'system', content: sysMsg });

        this.server.to('admin_dashboard').emit('adminReceiveMessage', {
            sessionId,
            message: { role: 'system', content: sysMsg, id: Date.now() },
        });
    }

    private resetHandoffTimeout(sessionId: string) {
        if (!this.handoffSessions.get(sessionId)) return;

        if (this.handoffTimeouts.has(sessionId)) {
            clearTimeout(this.handoffTimeouts.get(sessionId));
        }

        const timeout = setTimeout(() => {
            this.forceEndHandoff(
                sessionId,
                'Phiên hỗ trợ tự động kết thúc do không có phản hồi trong 5 phút. Bạn đã được kết nối lại với Bot AI.',
            );
        }, 5 * 60 * 1000);

        this.handoffTimeouts.set(sessionId, timeout);
    }

    @SubscribeMessage('joinSession')
    async handleJoinSession(@ConnectedSocket() client: Socket, @MessageBody() sessionId: string) {
        if (!sessionId) return;

        client.join(sessionId);
        this.clientSessions.set(client.id, sessionId);
        await this.ensureSessionExists(sessionId);
        this.logger.log(`Client ${client.id} joined session room: ${sessionId}`);
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { sessionId: string; message: string; history?: ChatMessage[] },
    ) {
        const { sessionId, message, history = [] } = payload;

        client.join(sessionId);
        this.clientSessions.set(client.id, sessionId);
        await this.ensureSessionExists(sessionId);

        const isHandedOff = this.handoffSessions.get(sessionId) || false;

        if (message !== '[SYSTEM:REQUEST_HANDOFF]') {
            const savedMsg = await this.saveMessage(sessionId, 'user', message);
            this.server.to('admin_dashboard').emit('adminReceiveMessage', {
                sessionId,
                message: { id: savedMsg.id, role: 'user', content: message },
            });
        }

        if (message === '[SYSTEM:REQUEST_HANDOFF]') {
            this.handoffSessions.set(sessionId, true);
            await this.updateSessionStatus(sessionId, 'HANDOFF');

            await this.telegramService.sendMessageToAdmin(
                sessionId,
                'Khách vừa bấm nút yêu cầu gặp nhân viên.',
                true,
            );

            const sysMsg =
                'Hệ thống đang chuyển kết nối đến nhân viên hỗ trợ. Bạn vui lòng đợi trong giây lát nhé!';
            await this.saveMessage(sessionId, 'system', sysMsg);
            this.sendToClient(sessionId, { role: 'system', content: sysMsg });

            this.resetHandoffTimeout(sessionId);
            return;
        }

        if (isHandedOff) {
            await this.telegramService.sendMessageToAdmin(sessionId, message, false);
            this.resetHandoffTimeout(sessionId);
            return;
        }

        try {
            const aiResponse = await this.chatService.chat(message, history);

            if (aiResponse.includes('[ACTION:HANDOFF]')) {
                this.handoffSessions.set(sessionId, true);
                await this.updateSessionStatus(sessionId, 'HANDOFF');

                const cleanResponse = aiResponse.replace('[ACTION:HANDOFF]', '').trim();

                if (cleanResponse) {
                    await this.saveMessage(sessionId, 'model', cleanResponse);
                    this.sendToClient(sessionId, { role: 'model', content: cleanResponse });
                }

                const sysMsg =
                    'Hệ thống đang chuyển kết nối đến nhân viên hỗ trợ. Bạn vui lòng đợi trong giây lát nhé!';
                await this.saveMessage(sessionId, 'system', sysMsg);
                this.sendToClient(sessionId, { role: 'system', content: sysMsg });

                await this.telegramService.sendMessageToAdmin(sessionId, message, true);
                this.resetHandoffTimeout(sessionId);
                return;
            }

            await this.saveMessage(sessionId, 'model', aiResponse);
            this.sendToClient(sessionId, { role: 'model', content: aiResponse });
        } catch (error) {
            this.logger.error('Lỗi khi gọi AI:', error);
            const sysMsg =
                'Xin lỗi, AI đang gặp sự cố kỹ thuật. Bạn có muốn kết nối với nhân viên tư vấn không?';
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
        @MessageBody() payload: { sessionId: string; message: string },
    ) {
        const { sessionId, message } = payload;

        if (!this.handoffSessions.get(sessionId)) {
            this.handoffSessions.set(sessionId, true);
            await this.updateSessionStatus(sessionId, 'HANDOFF');

            const sysMsg = 'Nhân viên hỗ trợ đã tham gia cuộc trò chuyện.';
            await this.saveMessage(sessionId, 'system', sysMsg);
            this.sendToClient(sessionId, { role: 'system', content: sysMsg });
        }

        const savedMsg = await this.saveMessage(sessionId, 'staff', message);
        this.sendToClient(sessionId, { role: 'staff', content: message, id: savedMsg.id });
        this.resetHandoffTimeout(sessionId);
    }

    @SubscribeMessage('adminEndChat')
    async handleAdminEndChat(@ConnectedSocket() client: Socket, @MessageBody() sessionId: string) {
        this.logger.log(`Admin manually ended chat for session: ${sessionId}`);
        await this.forceEndHandoff(
            sessionId,
            'Nhân viên đã kết thúc phiên hỗ trợ. Bạn đã được kết nối lại với Bot AI.',
        );
    }

    sendToClient(sessionId: string, message: { role: string; content: string; id?: number }) {
        this.logger.log(`Send message role=${message.role} to room=${sessionId}`);
        this.server.to(sessionId).emit('receiveMessage', message);
        this.server.to('admin_dashboard').emit('adminReceiveMessage', { sessionId, message });
    }
}
