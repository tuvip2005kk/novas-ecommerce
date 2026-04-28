import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Product } from '@prisma/client';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    private removeCostPrice<T>(product: T): T {
        if (!product) return product;
        const { costPrice, ...safeProduct } = product as any;
        return safeProduct;
    }

    private normalizeProductData<T extends { price?: number; costPrice?: number; stock?: number }>(data: T): T {
        const next: any = { ...data };

        if (next.price !== undefined) {
            const price = Number(next.price);
            if (!Number.isFinite(price) || price < 0) {
                throw new BadRequestException('Giá sản phẩm không hợp lệ');
            }
            next.price = price;
        }

        if (next.costPrice !== undefined) {
            const costPrice = Number(next.costPrice);
            if (!Number.isFinite(costPrice) || costPrice < 0) {
                throw new BadRequestException('Giá nhập sản phẩm không hợp lệ');
            }
            next.costPrice = costPrice;
        }

        if (next.stock !== undefined) {
            const stock = Number(next.stock);
            if (!Number.isInteger(stock) || stock < 0) {
                throw new BadRequestException('Tồn kho không hợp lệ');
            }
            next.stock = stock;
        }

        return next;
    }

    async findAll(search?: string, category?: string, sort?: string, subcategoryId?: number, includeCostPrice = false): Promise<any[]> {
        const where: any = {};

        if (search) {
            const words = search.trim().split(/\s+/);
            where.AND = words.map(word => ({
                OR: [
                    { name: { contains: word } },
                    { description: { contains: word } },
                    { slug: { contains: word } },
                ]
            }));
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

        const products = await this.prisma.product.findMany({
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

        return includeCostPrice ? products : products.map((product) => this.removeCostPrice(product));
    }

    async findOne(id: number): Promise<any | null> {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                subcategory: {
                    include: {
                        category: true
                    }
                }
            }
        });

        return this.removeCostPrice(product);
    }

    async findBySlug(slug: string): Promise<any | null> {
        const product = await this.prisma.product.findUnique({
            where: { slug },
            include: {
                subcategory: {
                    include: {
                        category: true
                    }
                },
                reviews: {
                    include: {
                        user: { select: { name: true } }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        return this.removeCostPrice(product);
    }

    async create(data: { name: string; slug: string; description: string; price: number; costPrice?: number; image: string; images?: string[]; subcategoryId?: number; stock: number; specs?: any }): Promise<Product> {
        return this.prisma.product.create({
            data: this.normalizeProductData(data),
        });
    }

    async update(id: number, data: { name?: string; slug?: string; description?: string; price?: number; costPrice?: number; image?: string; images?: string[]; subcategoryId?: number; stock?: number; specs?: any }): Promise<Product> {
        return this.prisma.product.update({
            where: { id },
            data: this.normalizeProductData(data),
        });
    }

    async delete(id: number): Promise<Product> {
        // Delete all related records first to avoid foreign key constraints
        await this.prisma.$transaction([
            // Delete likes for this product
            this.prisma.like.deleteMany({
                where: { productId: id }
            }),
            // Delete reviews for this product
            this.prisma.review.deleteMany({
                where: { productId: id }
            }),
            // Delete order items for this product
            this.prisma.orderItem.deleteMany({
                where: { productId: id }
            })
        ]);

        // Now delete the product
        return this.prisma.product.delete({
            where: { id },
        });
    }

    async applyBulkDiscount(params: { targetType: string, targetId?: number, discountPercent: number, action: 'apply' | 'remove' }) {
        const { targetType, targetId, discountPercent, action } = params;
        
        let where: any = {};
        if (targetType === 'product' && targetId) {
            where.id = targetId;
        } else if (targetType === 'subcategory' && targetId) {
            where.subcategoryId = targetId;
        } else if (targetType === 'category' && targetId) {
            where.subcategory = { categoryId: targetId };
        } 

        const products = await this.prisma.product.findMany({ where });
        const updatePromises: Promise<any>[] = [];

        if (action === 'apply') {
            for (const p of products) {
                const original = p.originalPrice || p.price;
                const newPrice = Math.round(original * (1 - discountPercent / 100));
                updatePromises.push(
                    this.prisma.product.update({
                        where: { id: p.id },
                        data: {
                            originalPrice: original,
                            price: newPrice
                        }
                    })
                );
            }
            await Promise.all(updatePromises);
            return { message: `Đã áp dụng giảm giá ${discountPercent}% cho ${updatePromises.length} sản phẩm.` };
        } else if (action === 'remove') {
            for (const p of products) {
                if (p.originalPrice) {
                    updatePromises.push(
                        this.prisma.product.update({
                            where: { id: p.id },
                            data: {
                                price: p.originalPrice,
                                originalPrice: null
                            }
                        })
                    );
                }
            }
            await Promise.all(updatePromises);
            return { message: `Đã gỡ giảm giá cho ${updatePromises.length} sản phẩm.` };
        }
        
        throw new Error('Hành động không hợp lệ');
    }
}
