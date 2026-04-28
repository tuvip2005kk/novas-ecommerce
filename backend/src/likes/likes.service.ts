import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class LikesService {
    constructor(private prisma: PrismaService) { }

    private readonly productSelect = {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        originalPrice: true,
        image: true,
        images: true,
        stock: true,
        soldCount: true,
        subcategoryId: true,
        specs: true,
        createdAt: true,
        updatedAt: true,
    };

    async findAllByUser(userId: number) {
        return this.prisma.like.findMany({
            where: { userId },
            include: { product: { select: this.productSelect } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async add(userId: number, productId: number) {
        return this.prisma.like.upsert({
            where: { userId_productId: { userId, productId } },
            update: {},
            create: { userId, productId },
            include: { product: { select: this.productSelect } },
        });
    }

    async remove(userId: number, productId: number) {
        return this.prisma.like.deleteMany({
            where: { userId, productId },
        });
    }

    async check(userId: number, productId: number) {
        const item = await this.prisma.like.findUnique({
            where: { userId_productId: { userId, productId } },
        });
        return { isLiked: !!item };
    }
}
