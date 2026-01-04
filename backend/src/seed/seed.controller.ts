import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('seed')
export class SeedController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    async seedData() {
        try {
            console.log('Start manual seeding ...');

            // Categories
            await this.prisma.category.upsert({
                where: { slug: 'thiet-bi-ve-sinh' },
                update: {},
                create: {
                    name: 'Thiết Bị Vệ Sinh',
                    slug: 'thiet-bi-ve-sinh',
                    image: '/uploads/categories/sanitary.jpg',
                    description: 'Các sản phẩm thiết bị vệ sinh cao cấp',
                },
            });

            await this.prisma.category.upsert({
                where: { slug: 'gach-op-lat' },
                update: {},
                create: {
                    name: 'Gạch Ốp Lát',
                    slug: 'gach-op-lat',
                    image: '/uploads/categories/tiles.jpg',
                    description: 'Gạch ốp lát sang trọng',
                },
            });

            // Products
            await this.prisma.product.upsert({
                where: { slug: 'bon-cau-thong-minh-enic-v8' },
                update: {},
                create: {
                    name: 'Bồn Cầu Thông Minh Enic V8',
                    slug: 'bon-cau-thong-minh-enic-v8',
                    description: 'Bồn cầu thông minh với nhiều tính năng hiện đại.',
                    price: 15000000,
                    image: '/uploads/products/bon-cau-v8.jpg',
                    images: JSON.stringify(['/uploads/products/bon-cau-v8.jpg']),
                    stock: 50,
                    subcategoryId: null,
                },
            });

            await this.prisma.product.upsert({
                where: { slug: 'lavabo-dat-ban-sl01' },
                update: {},
                create: {
                    name: 'Lavabo Đặt Bàn SL01',
                    slug: 'lavabo-dat-ban-sl01',
                    description: 'Lavabo thiết kế sang trọng, men sứ cao cấp.',
                    price: 2500000,
                    image: '/uploads/products/lavabo-sl01.jpg',
                    images: JSON.stringify(['/uploads/products/lavabo-sl01.jpg']),
                    stock: 100,
                    subcategoryId: null,
                },
            });

            return { message: 'Seeding finished successfully!' };
        } catch (error) {
            console.error(error);
            return { message: 'Seeding failed', error: error.message };
        }
    }
}
