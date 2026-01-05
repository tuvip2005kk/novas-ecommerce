import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Product } from '@prisma/client';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    async findAll(search?: string, category?: string, sort?: string, subcategoryId?: number): Promise<any[]> {
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { description: { contains: search } },
            ];
        }

        if (subcategoryId) {
            where.subcategoryId = subcategoryId;
        }

        const orderBy: any = {};
        if (sort === 'sold') {
            orderBy.soldCount = 'desc';
        } else {
            orderBy.createdAt = 'desc';
        }

        return this.prisma.product.findMany({
            where,
            orderBy,
            include: {
                subcategory: {
                    include: {
                        category: true
                    }
                }
            }
        });
    }

    async findOne(id: number): Promise<any | null> {
        return this.prisma.product.findUnique({
            where: { id },
            include: {
                subcategory: {
                    include: {
                        category: true
                    }
                }
            }
        });
    }

    async findBySlug(slug: string): Promise<any | null> {
        return this.prisma.product.findUnique({
            where: { slug },
            include: {
                subcategory: {
                    include: {
                        category: true
                    }
                }
            }
        });
    }

    async create(data: { name: string; slug: string; description: string; price: number; image: string; subcategoryId?: number; stock: number }): Promise<Product> {
        return this.prisma.product.create({
            data,
        });
    }

    async update(id: number, data: { name?: string; slug?: string; description?: string; price?: number; image?: string; subcategoryId?: number; stock?: number }): Promise<Product> {
        return this.prisma.product.update({
            where: { id },
            data,
        });
    }

    async delete(id: number): Promise<Product> {
        return this.prisma.product.delete({
            where: { id },
        });
    }
}
