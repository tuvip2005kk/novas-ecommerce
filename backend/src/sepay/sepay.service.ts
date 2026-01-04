import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SePayWebhookDto } from './dto/sepay-webhook.dto';

// SePay Configuration - CẬP NHẬT THÔNG TIN CỦA BẠN
const SEPAY_CONFIG = {
    // Lấy từ my.sepay.vn → Tích hợp → API Key
    API_KEY: process.env.SEPAY_API_KEY || 'YOUR_SEPAY_API_KEY',

    // Thông tin tài khoản ngân hàng đã liên kết SePay
    BANK_CODE: process.env.SEPAY_BANK_CODE || 'TPB', // TPBank
    ACCOUNT_NUMBER: process.env.SEPAY_ACCOUNT_NUMBER || '10000606788', // Số TK TPBank
    ACCOUNT_NAME: process.env.SEPAY_ACCOUNT_NAME || 'VUONG XUAN TU', // Tên chủ TK (viết hoa)

    // Prefix nội dung chuyển khoản
    CONTENT_PREFIX: 'DH',
};

export interface QRPaymentInfo {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    content: string;
    qrUrl: string;
}

// Map mã ngân hàng sang tên
const BANK_NAMES: Record<string, string> = {
    'MB': 'MB Bank',
    'VCB': 'Vietcombank',
    'TCB': 'Techcombank',
    'BIDV': 'BIDV',
    'VPB': 'VPBank',
    'ACB': 'ACB',
    'VIB': 'VIB',
    'TPB': 'TPBank',
    'STB': 'Sacombank',
    'HDB': 'HDBank',
    'MSB': 'MSB',
    'OCB': 'OCB',
    'SHB': 'SHB',
};

@Injectable()
export class SePayService {
    private readonly logger = new Logger(SePayService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Tạo thông tin thanh toán QR cho đơn hàng
     */
    async createQRPayment(orderId: number): Promise<QRPaymentInfo> {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new Error('Đơn hàng không tồn tại');
        }

        const content = `${SEPAY_CONFIG.CONTENT_PREFIX}${orderId}`;
        const amount = order.total;

        // VietQR URL format (miễn phí, không cần API key)
        const qrUrl = `https://img.vietqr.io/image/${SEPAY_CONFIG.BANK_CODE}-${SEPAY_CONFIG.ACCOUNT_NUMBER}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(SEPAY_CONFIG.ACCOUNT_NAME)}`;

        // Cập nhật paymentContent trong order
        await this.prisma.order.update({
            where: { id: orderId },
            data: { paymentContent: content }
        });

        return {
            bankCode: SEPAY_CONFIG.BANK_CODE,
            bankName: BANK_NAMES[SEPAY_CONFIG.BANK_CODE] || SEPAY_CONFIG.BANK_CODE,
            accountNumber: SEPAY_CONFIG.ACCOUNT_NUMBER,
            accountName: SEPAY_CONFIG.ACCOUNT_NAME,
            amount,
            content,
            qrUrl
        };
    }

    /**
     * Xử lý webhook từ SePay khi có giao dịch mới
     */
    async processWebhook(data: SePayWebhookDto) {
        this.logger.log(`Received Payment Webhook: ${JSON.stringify(data)}`);

        // Chỉ xử lý giao dịch tiền vào
        if (data.transferType !== 'in') {
            this.logger.log('Ignored: not money in');
            return { success: true, message: 'Ignored: not money in' };
        }

        // Parse order ID từ nội dung
        const orderId = this.parseOrderId(data.content);

        if (!orderId) {
            this.logger.warn('Order ID not found in content');
            return { success: false, message: 'Order ID not found in content' };
        }

        this.logger.log(`Detected Payment for Order #${orderId}`);

        // Tìm đơn hàng
        const order = await this.prisma.order.findUnique({
            where: { id: parseInt(orderId) }
        });

        if (!order) {
            this.logger.warn(`Order not found: ${orderId}`);
            return { success: false, message: 'Order not found' };
        }

        // Kiểm tra số tiền (cho phép sai số nhỏ do phí)
        const receivedAmount = data.transferAmount;
        if (receivedAmount < order.total * 0.99) {
            this.logger.warn(`Amount mismatch: received ${receivedAmount}, expected ${order.total}`);
            // Vẫn cập nhật nếu cần thiết
        }

        // Cập nhật trạng thái đơn hàng
        await this.prisma.order.update({
            where: { id: parseInt(orderId) },
            data: { status: 'Đã thanh toán' }
        });

        this.logger.log(`Order #${orderId} updated to "Đã thanh toán"`);

        return {
            success: true,
            orderId,
            message: 'Payment confirmed'
        };
    }

    /**
     * Kiểm tra trạng thái thanh toán
     */
    async checkPaymentStatus(orderId: number): Promise<{ paid: boolean; status: string }> {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true }
        });

        if (!order) {
            return { paid: false, status: 'not_found' };
        }

        return {
            paid: order.status === 'Đã thanh toán',
            status: order.status
        };
    }

    /**
     * Parse Order ID từ nội dung chuyển khoản
     */
    private parseOrderId(content: string): string | null {
        const match = content.match(/DH(\d+)/i);
        return match ? match[1] : null;
    }
}
