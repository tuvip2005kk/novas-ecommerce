import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) { }

    async create(createOrderDto: CreateOrderDto) {
        const { items, customerName, customerPhone, customerAddress, note, userId } = createOrderDto;

        // Calculate total price
        let total = 0;
        for (const item of items) {
            const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
            if (product) {
                total += product.price * item.quantity;
            }
        }

        // Create Order with userId
        const order = await this.prisma.order.create({
            data: {
                total,
                status: 'Chờ thanh toán',
                customerName,
                customerPhone,
                customerAddress,
                note,
                userId: userId || null,
                items: {
                    create: items.map((item) => ({
                        quantity: item.quantity,
                        price: 0,
                        product: { connect: { id: item.productId } },
                    })),
                },
            },
            include: { items: true },
        });

        // Update Payment Content
        const paymentContent = `DH${order.id}`;
        await this.prisma.order.update({
            where: { id: order.id },
            data: { paymentContent }
        });

        return { ...order, paymentContent };
    }

    async findOne(id: number) {
        return this.prisma.order.findUnique({
            where: { id },
            include: {
                items: { include: { product: true } },
                user: { select: { id: true, email: true, name: true } }
            },
        });
    }

    async findAll() {
        return this.prisma.order.findMany({
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateStatus(id: number, status: string) {
        return this.prisma.order.update({
            where: { id },
            data: { status },
        });
    }
}
