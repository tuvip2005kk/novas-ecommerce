import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ChatService, ChatMessage } from './chat.service';

class ChatDto {
    message: string;
    history?: ChatMessage[];
}

@Controller('api/chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

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
}
