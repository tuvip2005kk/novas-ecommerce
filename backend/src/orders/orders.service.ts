import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { SalesService } from '../sales/sales.service';

@Injectable()
export class OrdersService {
    private readonly orderProductSelect = {
        id: true,
        name: true,
        slug: true,
        image: true,
        price: true,
    };

    constructor(
        private prisma: PrismaService,
        private salesService: SalesService,
    ) { }

    async create(createOrderDto: CreateOrderDto) {
        const { items, customerName, customerPhone, customerAddress, note, userId, saleCode, discount } = createOrderDto;

        // Tính tổng giá trước giảm
        let subtotal = 0;
        const priceByProductId = new Map<number, number>();
        for (const item of items) {
            const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
            if (!product) {
                throw new BadRequestException(`Product ${item.productId} not found`);
            }

            if (product.stock < item.quantity) {
                throw new BadRequestException(`Không đủ tồn kho cho sản phẩm "${product.name}". Còn ${product.stock}, cần ${item.quantity}.`);
            }

            priceByProductId.set(item.productId, product.price);
            subtotal += product.price * item.quantity;
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
                        price: priceByProductId.get(item.productId) || 0,
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
                items: { include: { product: { select: this.orderProductSelect } } },
                user: { select: { id: true, email: true, name: true } }
            },
        });
    }

    async findAll() {
        return this.prisma.order.findMany({
            include: { items: { include: { product: { select: this.orderProductSelect } } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateStatus(id: number, status: string) {
        const INVENTORY_STATUSES = ['PAID', 'COMPLETED', 'SHIPPED', 'Đã thanh toán', 'Đang chuẩn bị', 'Đang giao hàng', 'Đang giao', 'Đã giao thành công', 'Đã giao', 'Hoàn thành'];

        const shouldApplyInventory = (value: string) => INVENTORY_STATUSES.includes((value || '').trim());

        const currentOrder = await this.prisma.order.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!currentOrder) {
            throw new Error('Order not found');
        }

        const hadInventoryApplied = shouldApplyInventory(currentOrder.status);
        const shouldApplyInventoryNow = shouldApplyInventory(status);

        if (shouldApplyInventoryNow && !hadInventoryApplied) {
            for (const item of currentOrder.items) {
                const product = await this.prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { name: true, stock: true }
                });

                if (!product) {
                    throw new Error(`Product ${item.productId} not found`);
                }

                if (product.stock < item.quantity) {
                    throw new BadRequestException(`Không đủ tồn kho cho sản phẩm "${product.name}". Còn ${product.stock}, cần ${item.quantity}.`);
                }
            }
        }

        const updates: any[] = [
            this.prisma.order.update({
                where: { id },
                data: { status },
                include: { items: true }
            })
        ];

        if (shouldApplyInventoryNow && !hadInventoryApplied) {
            for (const item of currentOrder.items) {
                updates.push(this.prisma.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { decrement: item.quantity },
                        soldCount: { increment: item.quantity }
                    }
                }));
            }
        }

        if (!shouldApplyInventoryNow && hadInventoryApplied) {
            for (const item of currentOrder.items) {
                updates.push(this.prisma.product.updateMany({
                    where: { id: item.productId, soldCount: { lt: item.quantity } },
                    data: {
                        stock: { increment: item.quantity },
                        soldCount: 0
                    }
                }));
                updates.push(this.prisma.product.updateMany({
                    where: { id: item.productId, soldCount: { gte: item.quantity } },
                    data: {
                        stock: { increment: item.quantity },
                        soldCount: { decrement: item.quantity }
                    }
                }));
            }
        }

        const [order] = await this.prisma.$transaction(updates);
        return order;
    }
}
