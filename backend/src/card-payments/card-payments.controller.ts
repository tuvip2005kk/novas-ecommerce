import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { CardPaymentsService } from './card-payments.service';

type RawBodyRequest = Request & { rawBody?: Buffer };

@Controller('card-payments')
export class CardPaymentsController {
    constructor(private readonly cardPaymentsService: CardPaymentsService) {}

    @Post('checkout')
    createCheckoutSession(@Body('orderId') orderId: number) {
        return this.cardPaymentsService.createCheckoutSession(Number(orderId));
    }

    @Get('session/:sessionId/confirm')
    confirmCheckoutSession(@Param('sessionId') sessionId: string) {
        return this.cardPaymentsService.confirmCheckoutSession(sessionId);
    }

    @Post('webhook')
    handleWebhook(
        @Req() req: RawBodyRequest,
        @Headers('stripe-signature') signature: string,
    ) {
        return this.cardPaymentsService.handleWebhook(req.rawBody, signature);
    }
}
