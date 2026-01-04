import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SalesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.sale.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(data: { code: string; discount: number; type?: string; minOrder?: number; maxDiscount?: number; usageLimit?: number; expiresAt?: string }) {
        return this.prisma.sale.create({
            data: {
                code: data.code.toUpperCase(),
                discount: data.discount,
                type: data.type || 'PERCENT',
                minOrder: data.minOrder || 0,
                maxDiscount: data.maxDiscount,
                usageLimit: data.usageLimit || 100,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            },
        });
    }

    async update(id: number, data: any) {
        return this.prisma.sale.update({
            where: { id },
            data,
        });
    }

    async remove(id: number) {
        return this.prisma.sale.delete({ where: { id } });
    }

    async apply(code: string, orderTotal: number) {
        const sale = await this.prisma.sale.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (!sale) {
            return { valid: false, error: 'Mã giảm giá không tồn tại' };
        }

        if (!sale.isActive) {
            return { valid: false, error: 'Mã giảm giá đã bị vô hiệu hóa' };
        }

        if (sale.expiresAt && new Date() > sale.expiresAt) {
            return { valid: false, error: 'Mã giảm giá đã hết hạn' };
        }

        if (sale.usedCount >= sale.usageLimit) {
            return { valid: false, error: 'Mã giảm giá đã hết lượt sử dụng' };
        }

        if (orderTotal < sale.minOrder) {
            return { valid: false, error: `Đơn hàng tối thiểu ${sale.minOrder}$ để sử dụng mã này` };
        }

        let discountAmount = 0;
        if (sale.type === 'PERCENT') {
            discountAmount = (orderTotal * sale.discount) / 100;
            if (sale.maxDiscount && discountAmount > sale.maxDiscount) {
                discountAmount = sale.maxDiscount;
            }
        } else {
            discountAmount = sale.discount;
        }

        return {
            valid: true,
            sale: {
                code: sale.code,
                discount: sale.discount,
                type: sale.type,
                discountAmount: Math.round(discountAmount * 100) / 100,
                finalTotal: Math.round((orderTotal - discountAmount) * 100) / 100,
            },
        };
    }

    async incrementUsage(code: string) {
        return this.prisma.sale.update({
            where: { code: code.toUpperCase() },
            data: { usedCount: { increment: 1 } },
        });
    }
}
