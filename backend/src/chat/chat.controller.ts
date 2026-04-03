import { Controller, Post, Body, HttpException, HttpStatus, Get, Param } from '@nestjs/common';
import { ChatService, ChatMessage } from './chat.service';
import { PrismaService } from '../prisma.service';

class ChatDto {
    message: string;
    history?: ChatMessage[];
}

@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly prisma: PrismaService
    ) {}

    @Post()
    async chat(@Body() body: ChatDto) {
        const { message, history = [] } = body;

        if (!message || message.trim() === '') {
            throw new HttpException('Tin nhắn không được để trống', HttpStatus.BAD_REQUEST);
        }

        try {
            const reply = await this.chatService.chat(message.trim(), history);
            return { reply };
        } catch (error) {
            console.error('Chat error:', error);
            throw new HttpException(
                'Không thể kết nối với AI, vui lòng thử lại sau',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('admin/sessions')
    async getAdminSessions() {
        if (!this.prisma) return [];
        return this.prisma.chatSession.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
    }

    @Get('admin/sessions/:id/messages')
    async getAdminSessionMessages(@Param('id') id: string) {
        if (!this.prisma) return [];
        return this.prisma.chatMessage.findMany({
            where: { sessionId: id },
            orderBy: { createdAt: 'asc' }
        });
    }
}
