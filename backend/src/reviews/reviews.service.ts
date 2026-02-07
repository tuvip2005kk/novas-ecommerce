import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// Order status flow:
// PENDING -> PAID -> PREPARING -> SHIPPING -> DELIVERED -> (optional) RETURNED

@Injectable()
export class ReviewsService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.review.findMany({
            include: {
                user: { select: { id: true, name: true, email: true } },
                product: { select: { id: true, name: true, slug: true, image: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByProduct(productId: number) {
        return this.prisma.review.findMany({
            where: { productId },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async adminRemove(reviewId: number) {
        return this.prisma.review.delete({ where: { id: reviewId } });
    }

    async getProductStats(productId: number) {
        const reviews = await this.prisma.review.findMany({
            where: { productId },
            select: { rating: true },
        });

        if (reviews.length === 0) {
            return { averageRating: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
        }

        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(r => distribution[r.rating as 1 | 2 | 3 | 4 | 5]++);

        return {
            averageRating: Math.round(avg * 10) / 10,
            totalReviews: reviews.length,
            distribution,
        };
    }

    // Check if user can review a product (must have a DELIVERED order containing this product)
    async canReview(userId: number, productId: number): Promise<boolean> {
        const orders = await this.prisma.order.findMany({
            where: {
                userId,
                items: {
                    some: { productId }
                }
            }
        });

        const COMPLETED = ['Đã giao thành công', 'Đã giao', 'Hoàn thành'];
        return orders.some(o => o.status && COMPLETED.includes(o.status.trim()));
    }

    async create(userId: number, productId: number, rating: number, comment?: string) {
        // Check if user has a delivered order with this product
        console.log(`[Reviews] Checking validation for User ${userId}, Product ${productId}`);
        const canReview = await this.canReview(userId, productId);
        console.log(`[Reviews] canReview result: ${canReview}`);

        if (!canReview) {
            console.log(`[Reviews] Validation Failed. Throwing BadRequestException.`);
            throw new BadRequestException('Bạn chỉ có thể đánh giá sau khi đơn hàng đã giao thành công');
        }

        return this.prisma.review.upsert({
            where: { userId_productId: { userId, productId } },
            update: { rating, comment },
            create: { userId, productId, rating, comment },
            include: { user: { select: { id: true, name: true, email: true } } },
        });
    }

    async remove(userId: number, reviewId: number) {
        const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
        if (review && review.userId === userId) {
            return this.prisma.review.delete({ where: { id: reviewId } });
        }
        return { error: 'Unauthorized' };
    }

    async debugCheck(userId: number, productId: number) {
        const orders = await this.prisma.order.findMany({
            where: {
                userId,
                items: {
                    some: { productId }
                }
            },
            select: {
                id: true,
                status: true,
                paymentContent: true,
                createdAt: true
            }
        });
        return orders;
    }
}
