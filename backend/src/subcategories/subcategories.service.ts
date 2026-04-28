import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SubcategoriesService {
    constructor(private readonly prisma: PrismaService) { }

    private readonly publicProductSelect = {
        id: true,
        name: true,
        description: true,
        price: true,
        originalPrice: true,
        image: true,
        images: true,
        slug: true,
        subcategoryId: true,
        stock: true,
        soldCount: true,
        specs: true,
        createdAt: true,
        updatedAt: true,
    };

    async findAll() {
        return this.prisma.subcategory.findMany({
            include: {
                category: true,
                _count: {
                    select: { products: true }
                }
            },
            orderBy: { name: 'asc' }
        });
    }

    async findOne(id: number) {
        const subcategory = await this.prisma.subcategory.findUnique({
            where: { id },
            include: {
                category: true,
                products: {
                    select: this.publicProductSelect
                }
            }
        });

        return subcategory;
    }

    async findBySlug(slug: string) {
        const subcategory = await this.prisma.subcategory.findUnique({
            where: { slug },
            include: {
                category: true,
                products: {
                    select: this.publicProductSelect
                }
            }
        });

        return subcategory;
    }

    async create(data: { name: string; slug: string; image?: string; categoryId: number }) {
        console.log('[SubcategoriesService] Creating subcategory with data:', data);
        const result = await this.prisma.subcategory.create({ data });
        console.log('[SubcategoriesService] Created subcategory:', result);
        return result;
    }

    async update(id: number, data: { name?: string; slug?: string; image?: string; categoryId?: number }) {
        console.log('[SubcategoriesService] Updating subcategory', id, 'with data:', data);
        const result = await this.prisma.subcategory.update({ where: { id }, data });
        console.log('[SubcategoriesService] Updated subcategory:', result);
        return result;
    }

    async delete(id: number) {
        // Disconnect products first
        await this.prisma.product.updateMany({
            where: { subcategoryId: id },
            data: { subcategoryId: null }
        });
        return this.prisma.subcategory.delete({ where: { id } });
    }
}
