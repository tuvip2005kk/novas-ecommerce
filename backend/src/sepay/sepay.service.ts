import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SePayWebhookDto } from './dto/sepay-webhook.dto';
import { SePayPgClient } from 'sepay-pg-node';

// SePay Configuration - Thay đổi thành Production khi deploy
const SEPAY_CONFIG = {
    env: 'sandbox' as const, // 'sandbox' hoặc 'production'
    merchant_id: 'SP-TEST-VX5AB778',
    secret_key: 'spsk_test_rqtxXYvutdiw1aAV2ZHEPF5FbjY9s69S',
};

// Base URLs for redirects
const BASE_URL = process.env.FRONTEND_URL || 'https://novas-ecommerce.vercel.app';

export interface QRPaymentInfo {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    content: string;
    qrUrl: string;
}

export interface SePayCheckoutData {
    checkoutUrl: string;
    formFields: any; // SePay SDK returns mixed types
}

@Injectable()
export class SePayService {
    private readonly logger = new Logger(SePayService.name);
    private client: SePayPgClient;

    constructor(private prisma: PrismaService) {
        this.client = new SePayPgClient(SEPAY_CONFIG);
    }

    /**
     * Tạo checkout data để gửi đến SePay
     */
    async createCheckout(orderId: number): Promise<SePayCheckoutData> {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { product: true } } }
        });

        if (!order) {
            throw new Error('Đơn hàng không tồn tại');
        }

        const checkoutUrl = this.client.checkout.initCheckoutUrl();
        const orderDescription = order.items
            .map(item => item.product?.name || 'Sản phẩm')
            .join(', ')
            .substring(0, 100);

        const formFields = this.client.checkout.initOneTimePaymentFields({
            payment_method: 'BANK_TRANSFER',
            order_invoice_number: `DH${orderId}`,
            order_amount: Math.round(order.total),
            currency: 'VND',
            order_description: orderDescription || `Thanh toán đơn hàng DH${orderId}`,
            success_url: `${BASE_URL}/order/${orderId}?payment=success`,
            error_url: `${BASE_URL}/order/${orderId}?payment=error`,
            cancel_url: `${BASE_URL}/order/${orderId}?payment=cancel`,
        });

        // Update payment content in order
        await this.prisma.order.update({
            where: { id: orderId },
            data: { paymentContent: `DH${orderId}` }
        });

        this.logger.log(`Created SePay checkout for order #${orderId}`);

        return {
            checkoutUrl,
            formFields
        };
    }

    /**
     * Tạo QR Payment (VietQR fallback)
     */
    async createQRPayment(orderId: number): Promise<QRPaymentInfo> {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new Error('Đơn hàng không tồn tại');
        }

        const content = `DH${orderId}`;
        const amount = order.total;

        // VietQR URL format (miễn phí, không cần API key)
        const qrUrl = `https://img.vietqr.io/image/TPB-10000606788-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent('VUONG XUAN TU')}`;

        // Cập nhật paymentContent trong order
        await this.prisma.order.update({
            where: { id: orderId },
            data: { paymentContent: content }
        });

        return {
            bankCode: 'TPB',
            bankName: 'TPBank',
            accountNumber: '10000606788',
            accountName: 'VUONG XUAN TU',
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
