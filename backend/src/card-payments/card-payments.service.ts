import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma.service';
import { OrdersService } from '../orders/orders.service';

type StripeCheckoutSession = {
    id: string;
    url?: string;
    payment_status?: string;
    client_reference_id?: string;
    metadata?: { orderId?: string };
};

@Injectable()
export class CardPaymentsService {
    private readonly stripeApiBase = 'https://api.stripe.com/v1';

    constructor(
        private readonly prisma: PrismaService,
        private readonly ordersService: OrdersService,
    ) {}

    async createCheckoutSession(orderId: number) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { product: true } } },
        });

        if (!order) {
            throw new BadRequestException('Đơn hàng không tồn tại');
        }

        if (!order.note?.includes('[Thanh toán bằng thẻ]')) {
            throw new BadRequestException('Đơn hàng không chọn phương thức thanh toán bằng thẻ');
        }

        if (order.status === 'Đã thanh toán') {
            throw new BadRequestException('Đơn hàng đã được thanh toán');
        }

        if (order.total <= 0) {
            throw new BadRequestException('Số tiền thanh toán thẻ phải lớn hơn 0');
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const currency = (process.env.STRIPE_CURRENCY || 'vnd').toLowerCase();
        const paymentContent = order.paymentContent || `DH${order.id}`;
        const params = new URLSearchParams();

        params.append('mode', 'payment');
        params.append('payment_method_types[0]', 'card');
        params.append('client_reference_id', String(order.id));
        params.append('success_url', `${frontendUrl}/order/${order.id}?payment=card_success&session_id={CHECKOUT_SESSION_ID}`);
        params.append('cancel_url', `${frontendUrl}/order/${order.id}?payment=card_cancel`);
        params.append('line_items[0][price_data][currency]', currency);
        params.append('line_items[0][price_data][product_data][name]', `Đơn hàng ${paymentContent}`);
        params.append('line_items[0][price_data][unit_amount]', String(Math.round(order.total)));
        params.append('line_items[0][quantity]', '1');
        params.append('metadata[orderId]', String(order.id));
        params.append('metadata[paymentContent]', paymentContent);
        params.append('payment_intent_data[metadata][orderId]', String(order.id));
        params.append('payment_intent_data[metadata][paymentContent]', paymentContent);

        const session = await this.requestStripe<StripeCheckoutSession>('/checkout/sessions', {
            method: 'POST',
            body: params,
        });

        if (!session.url) {
            throw new InternalServerErrorException('Stripe không trả về link thanh toán');
        }

        return {
            checkoutUrl: session.url,
            sessionId: session.id,
        };
    }

    async confirmCheckoutSession(sessionId: string) {
        const session = await this.requestStripe<StripeCheckoutSession>(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
        const orderId = this.getOrderIdFromSession(session);

        if (!orderId) {
            throw new BadRequestException('Phiên thanh toán không gắn với đơn hàng');
        }

        if (session.payment_status === 'paid') {
            await this.ordersService.updateStatus(orderId, 'Đã thanh toán');
            return { paid: true, orderId };
        }

        return { paid: false, orderId, paymentStatus: session.payment_status || 'unknown' };
    }

    async handleWebhook(rawBody: Buffer | string | undefined, signature: string | undefined) {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            throw new InternalServerErrorException('Missing STRIPE_WEBHOOK_SECRET');
        }

        if (!rawBody || !signature || !this.isValidSignature(rawBody, signature, webhookSecret)) {
            throw new UnauthorizedException('Invalid Stripe signature');
        }

        const event = JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody);

        if (event.type === 'checkout.session.completed') {
            const session = event.data?.object as StripeCheckoutSession;
            const orderId = this.getOrderIdFromSession(session);

            if (orderId && session.payment_status === 'paid') {
                await this.ordersService.updateStatus(orderId, 'Đã thanh toán');
            }
        }

        return { received: true };
    }

    private async requestStripe<T>(path: string, init?: RequestInit): Promise<T> {
        const secretKey = process.env.STRIPE_SECRET_KEY;

        if (!secretKey) {
            throw new InternalServerErrorException('Missing STRIPE_SECRET_KEY');
        }

        const res = await fetch(`${this.stripeApiBase}${path}`, {
            ...init,
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                ...(init?.headers || {}),
            },
        });

        const data = await res.json();

        if (!res.ok) {
            throw new BadRequestException(data?.error?.message || 'Stripe request failed');
        }

        return data as T;
    }

    private getOrderIdFromSession(session: StripeCheckoutSession) {
        const rawOrderId = session.metadata?.orderId || session.client_reference_id;
        const orderId = Number(rawOrderId);
        return Number.isFinite(orderId) ? orderId : null;
    }

    private isValidSignature(rawBody: Buffer | string, signatureHeader: string, webhookSecret: string) {
        const timestamp = signatureHeader
            .split(',')
            .find((part) => part.startsWith('t='))
            ?.slice(2);
        const signatures = signatureHeader
            .split(',')
            .filter((part) => part.startsWith('v1='))
            .map((part) => part.slice(3));

        if (!timestamp || signatures.length === 0) {
            return false;
        }

        const timestampAgeInSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
        if (!Number.isFinite(timestampAgeInSeconds) || timestampAgeInSeconds > 300) {
            return false;
        }

        const body = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
        const payload = `${timestamp}.${body}`;
        const expectedSignature = createHmac('sha256', webhookSecret).update(payload).digest('hex');
        const expected = Buffer.from(expectedSignature, 'hex');

        return signatures.some((signature) => {
            const actual = Buffer.from(signature, 'hex');
            return actual.length === expected.length && timingSafeEqual(actual, expected);
        });
    }
}
