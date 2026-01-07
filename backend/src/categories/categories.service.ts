import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CategoriesService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.category.findMany({
            include: {
                subcategories: {
                    include: {
                        _count: {
                            select: { products: true }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
    }

    async findOne(id: number) {
        return this.prisma.category.findUnique({
            where: { id },
            include: {
                subcategories: {
                    include: {
                        products: true
                    }
                }
            }
        });
    }

    async findBySlug(slug: string) {
        return this.prisma.category.findUnique({
            where: { slug },
            include: {
                subcategories: {
                    include: {
                        products: true
                    }
                }
            }
        });
    }

    async create(data: { name: string; slug: string; image?: string; description?: string }) {
        return this.prisma.category.create({ data });
    }

    async update(id: number, data: { name?: string; slug?: string; image?: string; description?: string }) {
        return this.prisma.category.update({ where: { id }, data });
    }

    async delete(id: number) {
        // First, get all subcategory IDs for this category
        const subcategories = await this.prisma.subcategory.findMany({
            where: { categoryId: id },
            select: { id: true }
        });
        const subcategoryIds = subcategories.map(s => s.id);

        // Set subcategoryId to null for all products in these subcategories
        if (subcategoryIds.length > 0) {
            await this.prisma.product.updateMany({
                where: { subcategoryId: { in: subcategoryIds } },
                data: { subcategoryId: null }
            });
        }

        // Now delete subcategories
        await this.prisma.subcategory.deleteMany({ where: { categoryId: id } });

        // Finally delete the category
        return this.prisma.category.delete({ where: { id } });
    }
}
