import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PrismaModule } from '../prisma.module';
import { ChatGateway } from './chat.gateway';
import { TelegramService } from './telegram.service';

@Module({
    imports: [PrismaModule],
    controllers: [ChatController],
    providers: [ChatService, ChatGateway, TelegramService],
})
export class ChatModule {}
