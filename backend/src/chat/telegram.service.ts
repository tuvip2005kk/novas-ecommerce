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

            this.bot.on('polling_error', (error: any) => {
                this.logger.error(`Lỗi Polling Telegram (Có thể do chạy 2 máy tính cùng lúc): ${error.message}`);
                // Dừng polling tạm thời nếu lỗi conflict để tránh treo CPU
                if (error.code === 'ETELEGRAM' && error.message.includes('409')) {
                    this.bot.stopPolling();
                    this.logger.warn('Tạm ngưng Telegram Bot do lỗi 409 Conflict!');
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

    private async handleAdminReply(msg: TelegramBot.Message) {
        const adminChatId = process.env.TELEGRAM_CHAT_ID;
        
        // Khớp pattern để lấy Session ID: tìm chuỗi bắt đầu bằng session_
        const repliedText = msg.reply_to_message.text;
        const sessionMatch = repliedText.match(/(session_[a-zA-Z0-9]+)/);
        
        if (sessionMatch && sessionMatch[1]) {
            const sessionId = sessionMatch[1].trim();
            const responseText = msg.text;

            this.logger.log(`Nhận được tin nhắn từ Admin cho session: ${sessionId}. Nội dung: ${responseText}`);

            if (this.chatGateway) {
                // Lưu tin nhắn vào DB
                if (this.chatGateway['saveMessage']) {
                    await this.chatGateway.saveMessage(sessionId, 'staff', responseText);
                }

                // Đẩy tin nhắn qua WebSockets về web cho khách
                this.chatGateway.sendToClient(sessionId, {
                    role: 'staff',
                    content: responseText
                });
                this.logger.log(`Đã đẩy tin nhắn tới khách hàng (phòng: ${sessionId})`);
            } else {
                this.logger.error('ChatGateway chưa được inject vào TelegramService!');
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

        // Tạo màu sắc cố định dựa trên sessionId để nhận diện nhanh khách hàng
        const colors = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '🟤', '⚫', '⚪'];
        const charSum = sessionId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const colorEmoji = colors[charSum % colors.length];

        const textToSend = `${colorEmoji} ${sessionId}\n${message}`;

        try {
            await this.bot.sendMessage(adminChatId, textToSend);
        } catch (error) {
            this.logger.error('Lỗi gửi tin nhắn Telegram', error);
        }
    }
}
