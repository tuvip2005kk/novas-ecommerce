import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('seed')
export class SeedController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    async seedData() {
        console.log('--- SEEDING REQUEST RECEIVED ---'); // 1. Log entry immediately
        try {
            // Categories
            console.log('Seeding Categories...');
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
            console.log('Seeding Products...');
            await this.prisma.product.upsert({
                where: { slug: 'bon-cau-thong-minh-enic-v8' },
                update: {},
                create: {
                    name: 'Bồn Cầu Thông Minh Enic V8',
                    slug: 'bon-cau-thong-minh-enic-v8',
                    description: 'Bồn cầu thông minh với nhiều tính năng hiện đại.',
                    price: 15000000,
                    image: '/uploads/products/bon-cau-v8.jpg',
                    images: ['/uploads/products/bon-cau-v8.jpg'], // Fix: Pass array directly, not string
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
                    images: ['/uploads/products/lavabo-sl01.jpg'], // Fix: Pass array directly
                    stock: 100,
                    subcategoryId: null,
                },
            });

            console.log('--- SEEDING FINISHED ---');
            return { message: 'Seeding finished successfully!' };
        } catch (error) {
            console.error('--- SEEDING ERROR ---', error);
            // Return error as JSON so we see it in browser 
            return {
                message: 'Seeding failed',
                errorName: error.name,
                errorMessage: error.message
            };
        }
    }

    @Get('create-admin')
    async createAdmin() {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        try {
            const admin = await this.prisma.user.upsert({
                where: { email: 'admin@novas.vn' },
                update: { role: 'admin', password: hashedPassword },
                create: {
                    email: 'admin@novas.vn',
                    password: hashedPassword,
                    name: 'Admin',
                    role: 'admin',
                },
            });
            return { message: 'Admin created!', email: 'admin@novas.vn', password: 'admin123' };
        } catch (error) {
            return { error: error.message };
        }
    }
}
