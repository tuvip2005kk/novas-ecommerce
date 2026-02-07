import { Body, Controller, Get, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { SePayService } from './sepay.service';
import { SePayWebhookDto } from './dto/sepay-webhook.dto';

@Controller('sepay')
export class SePayController {
    constructor(private readonly sepayService: SePayService) { }

    /**
     * Tạo checkout data để redirect đến SePay
     * POST /sepay/checkout
     */
    @Post('checkout')
    async createCheckout(@Body('orderId') orderId: number) {
        return this.sepayService.createCheckout(orderId);
    }

    /**
     * Tạo mã QR thanh toán cho đơn hàng (VietQR fallback)
     * POST /sepay/create-qr
     */
    @Post('create-qr')
    async createQR(@Body('orderId') orderId: number) {
        return this.sepayService.createQRPayment(orderId);
    }

    /**
     * Webhook endpoint cho SePay callback
     * POST /sepay/webhook
     * Cấu hình URL này trong SePay: https://your-domain.com/api/sepay/webhook
     */
    @Post('webhook')
    async handleWebhook(@Body() payload: any) {
        console.log('=== SEPAY WEBHOOK RECEIVED ===');
        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.log('Payload type:', typeof payload);
        console.log('Payload keys:', Object.keys(payload));
        console.log('==============================');
        return this.sepayService.processWebhook(payload);
    }

    /**
     * Kiểm tra trạng thái thanh toán (cho frontend polling)
     * GET /sepay/status/:orderId
     */
    @Get('status/:orderId')
    async checkStatus(@Param('orderId') orderId: string) {
        return this.sepayService.checkPaymentStatus(+orderId);
    }

    /**
     * [TEST ONLY] Giả lập thanh toán thành công
     * POST /sepay/test-payment/:orderId
     * Dùng để test local khi chưa có webhook thật
     */
    @Post('test-payment/:orderId')
    async testPayment(@Param('orderId') orderId: string) {
        // Giả lập webhook payload
        const fakePayload = {
            id: Date.now(),
            gateway: 'Test',
            transactionDate: new Date().toISOString(),
            accountNumber: 'TEST',
            content: `DH${orderId}`,
            transferType: 'in',
            transferAmount: 999999,
            accumulated: 999999,
        };
        return this.sepayService.processWebhook(fakePayload as any);
    }

    /**
     * [MANUAL] Xác nhận thanh toán thủ công
     * POST /sepay/confirm-payment/:orderId
     * Dùng khi webhook không hoạt động
     */
    @Post('confirm-payment/:orderId')
    async confirmPayment(@Param('orderId') orderId: string) {
        const fakePayload = {
            id: Date.now(),
            gateway: 'Manual',
            transactionDate: new Date().toISOString(),
            accountNumber: '10000606788',
            content: `DH${orderId}`,
            transferType: 'in',
            transferAmount: 0,
            accumulated: 0,
        };
        return this.sepayService.processWebhook(fakePayload as any);
    }
}
