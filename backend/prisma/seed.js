const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('=== START SEEDING ===');

    // Create Admin User
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@novas.vn' },
        update: { role: 'admin' },
        create: {
            email: 'admin@novas.vn',
            password: hashedPassword,
            name: 'Admin',
            role: 'admin',
        },
    });
    console.log('Admin user created: admin@novas.vn / admin123');

    // Categories (matching local MySQL data)
    console.log('Creating categories...');

    await prisma.category.upsert({
        where: { slug: 'bon-cau' },
        update: {},
        create: {
            name: 'Bồn Cầu',
            slug: 'bon-cau',
            image: '/images/categories/bon-cau.jpg',
            description: 'Bộ sưu tập bồn cầu thông minh',
        },
    });

    await prisma.category.upsert({
        where: { slug: 'phu-kien' },
        update: {},
        create: {
            name: 'Phụ Kiện',
            slug: 'phu-kien',
            image: '/images/categories/phu-kien.jpg',
            description: 'Phụ kiện phòng tắm: kệ, móc, giá đỡ',
        },
    });

    await prisma.category.upsert({
        where: { slug: 'lavabo' },
        update: {},
        create: {
            name: 'Lavabo',
            slug: 'lavabo',
            image: '/images/categories/lavabo.jpg',
            description: 'Chậu rửa mặt lavabo, vòi lavabo',
        },
    });

    await prisma.category.upsert({
        where: { slug: 'voi-sen' },
        update: {},
        create: {
            name: 'Vòi Sen',
            slug: 'voi-sen',
            image: '/images/categories/voi-sen.jpg',
            description: 'Sen cây, sen tắm, vòi sen các loại',
        },
    });

    await prisma.category.upsert({
        where: { slug: 'bon-tam' },
        update: {},
        create: {
            name: 'Bồn Tắm',
            slug: 'bon-tam',
            image: '/images/categories/bon-tam.jpg',
            description: 'Bồn tắm massage, bồn tắm đứng',
        },
    });

    // Products (sample products for testing payment)
    console.log('Creating products...');

    await prisma.product.upsert({
        where: { slug: 'bon-cau-thong-minh-enic-v8' },
        update: { price: 2000 },
        create: {
            name: 'Bồn Cầu Thông Minh Enic V8',
            slug: 'bon-cau-thong-minh-enic-v8',
            description: 'Bồn cầu thông minh với nhiều tính năng hiện đại: tự động xả, sưởi ấm, vệ sinh tự động.',
            price: 2000,
            image: '/images/products/bon-cau-v8.jpg',
            images: ['/images/products/bon-cau-v8.jpg', '/images/products/bon-cau-v8-2.jpg'],
            stock: 50,
            subcategoryId: null,
        },
    });

    await prisma.product.upsert({
        where: { slug: 'lavabo-dat-ban-sl01' },
        update: {},
        create: {
            name: 'Lavabo Đặt Bàn SL01',
            slug: 'lavabo-dat-ban-sl01',
            description: 'Lavabo thiết kế sang trọng, men sứ cao cấp, phù hợp mọi không gian.',
            price: 2500000,
            image: '/images/products/lavabo-sl01.jpg',
            images: ['/images/products/lavabo-sl01.jpg'],
            stock: 100,
            subcategoryId: null,
        },
    });

    await prisma.product.upsert({
        where: { slug: 'voi-sen-tam-inox-304' },
        update: {},
        create: {
            name: 'Vòi Sen Tắm Inox 304',
            slug: 'voi-sen-tam-inox-304',
            description: 'Vòi sen inox 304 cao cấp, chống gỉ sét, bền bỉ theo thời gian.',
            price: 1200000,
            image: '/images/products/voi-sen-inox.jpg',
            images: ['/images/products/voi-sen-inox.jpg'],
            stock: 200,
            subcategoryId: null,
        },
    });

    console.log('=== SEEDING FINISHED ===');
}

main()
    .catch((e) => {
        console.error('=== SEEDING ERROR ===', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
