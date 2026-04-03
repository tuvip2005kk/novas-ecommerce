import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class TelegramService implements OnModuleInit {
    private bot: TelegramBot;
    private readonly logger = new Logger(TelegramService.name);
    private chatGateway: ChatGateway; // Will set via setter to avoid circular dependency

    constructor() {}

    setGateway(gateway: ChatGateway) {
        this.chatGateway = gateway;
    }

    onModuleInit() {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            this.logger.warn('TELEGRAM_BOT_TOKEN không được cấu hình. Bỏ qua Telegram Bot.');
            return;
        }

        try {
            this.bot = new TelegramBot(token, { polling: true });
            this.logger.log('Telegram Bot đã khởi động');

            this.setupListeners();
        } catch (error) {
            this.logger.error('Lỗi khi khởi tạo Telegram Bot', error);
        }
    }

    private setupListeners() {
        this.bot.on('message', (msg) => {
            const chatId = msg.chat.id;
            const text = msg.text;

            // Kiểm tra xem tin nhắn có phải là reply một tin nhắn trước đó không
            if (msg.reply_to_message && msg.reply_to_message.text) {
                this.handleAdminReply(msg);
                return;
            }

            if (text === '/start') {
                this.bot.sendMessage(chatId, `Xin chào! Tôi là Bot Quản lý Support của NOVAS.\nChat ID của bạn là: ${chatId}\nHãy cấu hình TELEGRAM_CHAT_ID=${chatId} vào file .env.`);
                return;
            }
        });
    }

    private handleAdminReply(msg: TelegramBot.Message) {
        const adminChatId = process.env.TELEGRAM_CHAT_ID;
        
        // Khớp pattern để lấy Session ID từ tin nhắn hệ thống gốc
        // Pattern: "🔴 CẦN HỖ TRỢ\nSession: [id]\nKhách hàng: [message]"
        const repliedText = msg.reply_to_message.text;
        const sessionMatch = repliedText.match(/Session:\s+(.+)/);
        
        if (sessionMatch && sessionMatch[1]) {
            const sessionId = sessionMatch[1].trim();
            const responseText = msg.text;

            if (this.chatGateway) {
                // Đẩy tin nhắn qua WebSockets về web cho khách
                this.chatGateway.sendToClient(sessionId, {
                    role: 'staff',
                    content: responseText
                });
            }
        }
    }

    async sendMessageToAdmin(sessionId: string, message: string, isInitialHandoff: boolean = false) {
        if (!this.bot) return;

        const adminChatId = process.env.TELEGRAM_CHAT_ID;
        if (!adminChatId) {
            this.logger.warn('TELEGRAM_CHAT_ID chưa được cấu hình. Không thể gửi tin nhắn.');
            return;
        }

        let textToSend = '';
        if (isInitialHandoff) {
            textToSend = `🔴 YÊU CẦU HỖ TRỢ NHÂN VIÊN\nSession: ${sessionId}\nKhách hàng: ${message}\n\n(Hãy Reply tin nhắn này để chat với khách)`;
        } else {
            textToSend = `🟢 Khách hàng đang nhắn:\nSession: ${sessionId}\nNội dung: ${message}\n\n(Hãy Reply tin nhắn này để dáp lại khách)`;
        }

        try {
            await this.bot.sendMessage(adminChatId, textToSend);
        } catch (error) {
            this.logger.error('Lỗi gửi tin nhắn Telegram', error);
        }
    }
}
