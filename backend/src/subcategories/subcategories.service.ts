import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class SubcategoriesService {
    async findAll() {
        return prisma.subcategory.findMany({
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
        return prisma.subcategory.findUnique({
            where: { id },
            include: {
                category: true,
                products: true
            }
        });
    }

    async findBySlug(slug: string) {
        return prisma.subcategory.findUnique({
            where: { slug },
            include: {
                category: true,
                products: true
            }
        });
    }

    async create(data: { name: string; slug: string; image?: string; categoryId: number }) {
        return prisma.subcategory.create({ data });
    }

    async update(id: number, data: { name?: string; slug?: string; image?: string; categoryId?: number }) {
        return prisma.subcategory.update({ where: { id }, data });
    }

    async delete(id: number) {
        return prisma.subcategory.delete({ where: { id } });
    }
}
