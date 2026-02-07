import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SePayWebhookDto } from './dto/sepay-webhook.dto';
import { SePayPgClient } from 'sepay-pg-node';

// SePay Configuration
const SEPAY_CONFIG = {
    env: 'production' as const,
    merchant_id: process.env.SEPAY_MERCHANT_ID || 'SP-LIVE-VX9A7368',
    secret_key: process.env.SEPAY_API_KEY || 'spsk_live_ix8bU8772hsMg6JVj3L6b9Wdf2pMM2Tu',
    api_token: 'DWJ4PKX3DOFBYTEVZ35WQRCLYNIQPUAKMZH1G8BBZ9SG1LNHAJCWMXEMY5RNSEGR',
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
        this.client = new SePayPgClient({
            env: SEPAY_CONFIG.env,
            merchant_id: SEPAY_CONFIG.merchant_id,
            secret_key: SEPAY_CONFIG.secret_key
        });
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
     * Đồng bộ giao dịch từ SePay về (Polling mechanism)
     */
    async syncLatestTransactions() {
        this.logger.log('Syncing transactions from SePay API...');
        try {
            const res = await fetch('https://my.sepay.vn/userapi/transactions/list', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${SEPAY_CONFIG.api_token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`SePay API error: ${res.status} ${text}`);
            }

            const data = await res.json();
            // Expected data: { status: 200, messages: "Success", transactions: [...] }

            let count = 0;
            if (data.status === 200 && Array.isArray(data.transactions)) {
                this.logger.log(`Fetched ${data.transactions.length} transactions from SePay`);

                for (const trans of data.transactions) {
                    // Map API format to our internal Webhook format
                    const mappedData = {
                        gateway: 'SePay API',
                        transactionDate: trans.transaction_date,
                        accountNumber: trans.account_number,
                        content: trans.transaction_content,
                        transferType: trans.amount_in > 0 ? 'in' : 'out',
                        transferAmount: trans.amount_in,
                        id: trans.id,
                    };

                    const result = await this.processWebhook(mappedData);
                    if (result.success && result.message === 'Payment confirmed') {
                        count++;
                    }
                }
            }

            if (count > 0) {
                this.logger.log(`✅ Synced and updated ${count} new orders.`);
            } else {
                this.logger.log('No new orders to update.');
            }

            // Debug data
            const debugInfo = Array.isArray(data.transactions) ? data.transactions.map((t: any) => ({
                id: t.id,
                content: t.transaction_content,
                amount: t.amount_in,
                date: t.transaction_date
            })).slice(0, 10) : [];

            return { success: true, updated: count, debugData: debugInfo };

        } catch (error) {
            this.logger.error(`❌ Sync error: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async processWebhook(data: any) {
        this.logger.log(`=== RECEIVED PAYMENT WEBHOOK ===`);
        this.logger.log(`Raw Payload: ${JSON.stringify(data, null, 2)}`);

        try {
            // Normalize field names (support both camelCase and snake_case)
            const normalized = {
                transferType: data.transferType || data.transfer_type || data.type,
                content: data.content || data.description || data.transfer_content || '',
                id: data.id || data.transaction_id,
                amount: data.transferAmount || data.transfer_amount || data.amount || 0
            };

            this.logger.log(`Normalized: ${JSON.stringify(normalized, null, 2)}`);

            // Chỉ xử lý giao dịch tiền vào
            if (normalized.transferType && normalized.transferType !== 'in') {
                this.logger.log('Ignored: not money in');
                return { success: true, message: 'Ignored: not money in' };
            }

            // Parse order ID từ nội dung
            const orderId = this.parseOrderId(normalized.content);

            if (!orderId) {
                this.logger.warn(`Order ID not found in content: "${normalized.content}"`);
                return { success: false, message: 'Order ID not found in content' };
            }

            this.logger.log(`✅ Detected Payment for Order #${orderId}`);

            // Tìm đơn hàng
            const order = await this.prisma.order.findUnique({
                where: { id: parseInt(orderId) },
                include: { items: true }
            });

            if (!order) {
                this.logger.warn(`❌ Order not found: ${orderId}`);
                return { success: false, message: 'Order not found' };
            }

            // Kiểm tra trạng thái đơn hàng hiện tại
            const COMPLETED_STATUSES = ['Đã thanh toán', 'Đang chuẩn bị', 'Đang giao', 'Đã giao', 'Đã giao thành công', 'Hoàn thành'];

            if (COMPLETED_STATUSES.includes(order.status)) {
                this.logger.log(`⚠️ Order #${orderId} is in status "${order.status}", skipping payment update config.`);
                return { success: true, message: 'Order already processed' };
            }

            // Cập nhật trạng thái đơn hàng
            await this.prisma.order.update({
                where: { id: parseInt(orderId) },
                data: { status: 'Đã thanh toán' }
            });

            // Trừ stock cho từng sản phẩm khi thanh toán thành công
            if (order.items && order.items.length > 0) {
                for (const item of order.items) {
                    await this.prisma.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } }
                    });
                }
                this.logger.log(`📦 Stock decremented for ${order.items.length} products`);
            }

            this.logger.log(`✅ Order #${orderId} updated to "Đã thanh toán"`);
            this.logger.log(`=== WEBHOOK PROCESSED SUCCESSFULLY ===`);

            return {
                success: true,
                orderId,
                message: 'Payment confirmed'
            };
        } catch (error) {
            this.logger.error(`❌ Webhook processing error: ${error.message}`);
            this.logger.error(error.stack);
            return {
                success: false,
                message: `Error: ${error.message}`
            };
        }
    }

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

    private parseOrderId(content: string): string | null {
        if (!content) return null;
        // Allow optional whitespace between DH and number
        const match = content.match(/DH\s*(\d+)/i);
        return match ? match[1] : null;
    }
}
