import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class TelegramService implements OnModuleInit {
    private bot: TelegramBot;
    private readonly logger = new Logger(TelegramService.name);
    private chatGateway: ChatGateway;

    constructor() {}

    setGateway(gateway: ChatGateway) {
        this.chatGateway = gateway;
    }

    onModuleInit() {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            this.logger.warn('TELEGRAM_BOT_TOKEN chưa được cấu hình. Bỏ qua Telegram Bot.');
            return;
        }

        try {
            this.bot = new TelegramBot(token, { polling: true });
            this.logger.log('Telegram Bot đã khởi động');

            this.bot.on('polling_error', (error: any) => {
                this.logger.error(
                    `Lỗi polling Telegram, có thể do chạy 2 máy cùng lúc: ${error.message}`,
                );

                if (error.code === 'ETELEGRAM' && error.message.includes('409')) {
                    this.bot.stopPolling();
                    this.logger.warn('Tạm ngưng Telegram Bot do lỗi 409 Conflict.');
                }
            });

            this.setupListeners();
        } catch (error) {
            this.logger.error('Lỗi khi khởi tạo Telegram Bot', error);
        }
    }

    private setupListeners() {
        this.bot.on('message', (msg) => {
            const chatId = msg.chat.id;
            const text = msg.text;

            if (msg.reply_to_message && msg.reply_to_message.text) {
                this.handleAdminReply(msg);
                return;
            }

            if (text === '/start') {
                this.bot.sendMessage(
                    chatId,
                    `Xin chào! Tôi là Bot quản lý Support của NOVAS.\nChat ID của bạn là: ${chatId}\nHãy cấu hình TELEGRAM_CHAT_ID=${chatId} vào file .env.`,
                );
            }
        });
    }

    private async handleAdminReply(msg: TelegramBot.Message) {
        const repliedText = msg.reply_to_message?.text;
        if (!repliedText) return;

        const sessionMatch = repliedText.match(/(session_[a-zA-Z0-9]+)/);

        if (!sessionMatch?.[1]) return;

        const sessionId = sessionMatch[1].trim();
        const responseText = msg.text;

        if (!responseText) return;

        this.logger.log(`Nhận tin nhắn từ Admin cho session ${sessionId}: ${responseText}`);

        if (!this.chatGateway) {
            this.logger.error('ChatGateway chưa được inject vào TelegramService.');
            return;
        }

        if (this.chatGateway.saveMessage) {
            await this.chatGateway.saveMessage(sessionId, 'staff', responseText);
        }

        this.chatGateway.sendToClient(sessionId, {
            role: 'staff',
            content: responseText,
        });
        this.logger.log(`Đã đẩy tin nhắn tới khách hàng, phòng ${sessionId}`);
    }

    async sendMessageToAdmin(sessionId: string, message: string, isInitialHandoff = false) {
        if (!this.bot) return;

        const adminChatId = process.env.TELEGRAM_CHAT_ID;
        if (!adminChatId) {
            this.logger.warn('TELEGRAM_CHAT_ID chưa được cấu hình. Không thể gửi tin nhắn.');
            return;
        }

        const colors = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '🟤', '⚫', '⚪'];
        const charSum = sessionId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const colorEmoji = colors[charSum % colors.length];
        const prefix = isInitialHandoff ? 'Yêu cầu hỗ trợ mới' : 'Khách nhắn thêm';
        const textToSend = `${colorEmoji} ${prefix}\nSession: ${sessionId}\n${message}`;

        try {
            await this.bot.sendMessage(adminChatId, textToSend);
        } catch (error) {
            this.logger.error('Lỗi gửi tin nhắn Telegram', error);
        }
    }
}
