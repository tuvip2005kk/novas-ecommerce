import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class CategoriesService {
    async findAll() {
        return prisma.category.findMany({
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
        return prisma.category.findUnique({
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
        return prisma.category.findUnique({
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
        return prisma.category.create({ data });
    }

    async update(id: number, data: { name?: string; slug?: string; image?: string; description?: string }) {
        return prisma.category.update({ where: { id }, data });
    }

    async delete(id: number) {
        await prisma.subcategory.deleteMany({ where: { categoryId: id } });
        return prisma.category.delete({ where: { id } });
    }
}
