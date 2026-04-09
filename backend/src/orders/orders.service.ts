import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { SalesService } from '../sales/sales.service';

@Injectable()
export class OrdersService {
    constructor(
        private prisma: PrismaService,
        private salesService: SalesService,
    ) { }

    async create(createOrderDto: CreateOrderDto) {
        const { items, customerName, customerPhone, customerAddress, note, userId, saleCode, discount } = createOrderDto;

        // Tính tổng giá trước giảm
        let subtotal = 0;
        for (const item of items) {
            const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
            if (product) {
                subtotal += product.price * item.quantity;
            }
        }

        // Tính tổng sau giảm giá
        const discountAmount = discount || 0;
        const total = Math.max(0, subtotal - discountAmount);

        // Tạo đơn hàng
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

        // Nếu có userId, cập nhật thông tin người dùng để lần sau tự điền
        if (userId) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    name: customerName,
                    phone: customerPhone,
                    address: customerAddress
                }
            }).catch(err => console.warn(`[OrdersService] Could not update user profile: ${err.message}`));
        }

        // Cập nhật paymentContent
        const paymentContent = `DH${order.id}`;
        await this.prisma.order.update({
            where: { id: order.id },
            data: { paymentContent }
        });

        // Tăng usedCount nếu có mã giảm giá
        if (saleCode) {
            try {
                await this.salesService.incrementUsage(saleCode);
            } catch (e) {
                console.warn(`[OrdersService] Could not increment usage for code ${saleCode}:`, e.message);
            }
        }

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
        const COMPLETED_STATUSES = ['Đã giao thành công', 'Đã giao', 'Hoàn thành'];

        const currentOrder = await this.prisma.order.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!currentOrder) {
            throw new Error('Order not found');
        }

        const order = await this.prisma.order.update({
            where: { id },
            data: { status },
            include: { items: true }
        });

        if (COMPLETED_STATUSES.includes(status) && !COMPLETED_STATUSES.includes(currentOrder.status)) {
            for (const item of order.items) {
                await this.prisma.product.update({
                    where: { id: item.productId },
                    data: { soldCount: { increment: item.quantity } }
                });
            }
        }

        return order;
    }
}
