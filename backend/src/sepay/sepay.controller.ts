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
     * Cấu hình URL này trong SePay: https://your-domain.com/sepay/webhook
     */
    @Post('webhook')
    @UsePipes(new ValidationPipe({ transform: true }))
    async handleWebhook(@Body() payload: SePayWebhookDto) {
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
}
