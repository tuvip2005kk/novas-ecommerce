import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Clear existing data in correct order
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.like.deleteMany();
    await prisma.review.deleteMany();
    await prisma.product.deleteMany();
    await prisma.subcategory.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.banner.deleteMany();
    await prisma.showroom.deleteMany();
    await prisma.siteSetting.deleteMany();

    // Create Admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
        data: {
            email: 'admin@novas.com',
            password: hashedPassword,
            name: 'Admin Novas',
            role: 'ADMIN'
        }
    });
    console.log('✅ Admin created: admin@novas.com / admin123');

    // Create Categories
    const categories = await Promise.all([
        prisma.category.create({
            data: {
                name: 'Bồn Cầu',
                slug: 'bon-cau',
                image: '/images/categories/bon-cau.png',
                description: 'Bộ sưu tập bồn cầu thông minh, bồn cầu 1 khối, bồn cầu trứng cao cấp'
            }
        }),
        prisma.category.create({
            data: {
                name: 'Lavabo',
                slug: 'lavabo',
                image: '/images/categories/lavabo.png',
                description: 'Chậu rửa mặt lavabo, vòi lavabo cao cấp'
            }
        }),
        prisma.category.create({
            data: {
                name: 'Vòi Sen',
                slug: 'voi-sen',
                image: '/images/categories/voi-sen.png',
                description: 'Sen cây, sen tắm, vòi sen nhiệt độ thông minh'
            }
        }),
        prisma.category.create({
            data: {
                name: 'Bồn Tắm',
                slug: 'bon-tam',
                image: '/images/categories/bon-tam.png',
                description: 'Bồn tắm massage, bồn tắm đứng cao cấp'
            }
        }),
        prisma.category.create({
            data: {
                name: 'Phụ Kiện',
                slug: 'phu-kien',
                image: '/images/categories/phu-kien.png',
                description: 'Phụ kiện phòng tắm: kệ, móc, gương, hộp giấy'
            }
        }),
    ]);
    console.log('✅ Categories created:', categories.length);

    // Create Subcategories
    const subcategories: { [key: string]: any } = {};

    // Bồn cầu subcategories
    subcategories['boncau-thongminh'] = await prisma.subcategory.create({
        data: { name: 'Bồn cầu thông minh', slug: 'bon-cau-thong-minh', image: '/images/subcategories/smart-toilet.png', categoryId: categories[0].id }
    });
    subcategories['boncau-1khoi'] = await prisma.subcategory.create({
        data: { name: 'Bồn cầu 1 khối', slug: 'bon-cau-1-khoi', image: '/images/subcategories/one-piece-toilet.png', categoryId: categories[0].id }
    });
    subcategories['boncau-trung'] = await prisma.subcategory.create({
        data: { name: 'Bồn cầu trứng', slug: 'bon-cau-trung', image: '/images/subcategories/egg-toilet.png', categoryId: categories[0].id }
    });
    subcategories['boncau-treotuong'] = await prisma.subcategory.create({
        data: { name: 'Bồn cầu treo tường', slug: 'bon-cau-treo-tuong', image: '/images/subcategories/wall-hung-toilet.png', categoryId: categories[0].id }
    });

    // Lavabo subcategories
    subcategories['lavabo-datban'] = await prisma.subcategory.create({
        data: { name: 'Lavabo đặt bàn', slug: 'lavabo-dat-ban', image: '/images/subcategories/lavabo.png', categoryId: categories[1].id }
    });
    subcategories['voi-lavabo'] = await prisma.subcategory.create({
        data: { name: 'Vòi lavabo', slug: 'voi-lavabo', image: '/images/subcategories/lavabo.png', categoryId: categories[1].id }
    });

    // Vòi sen subcategories
    subcategories['sencay'] = await prisma.subcategory.create({
        data: { name: 'Sen cây nhiệt độ', slug: 'sen-cay-nhiet-do', image: '/images/subcategories/shower.png', categoryId: categories[2].id }
    });
    subcategories['sendung'] = await prisma.subcategory.create({
        data: { name: 'Sen tắm đứng', slug: 'sen-tam-dung', image: '/images/subcategories/shower.png', categoryId: categories[2].id }
    });
    subcategories['voisen-tay'] = await prisma.subcategory.create({
        data: { name: 'Vòi sen tay', slug: 'voi-sen-tay', image: '/images/subcategories/shower.png', categoryId: categories[2].id }
    });

    // Bồn tắm subcategories
    subcategories['bontam-massage'] = await prisma.subcategory.create({
        data: { name: 'Bồn tắm massage', slug: 'bon-tam-massage', image: '/images/subcategories/bathtub.png', categoryId: categories[3].id }
    });
    subcategories['bontam-dung'] = await prisma.subcategory.create({
        data: { name: 'Bồn tắm đứng', slug: 'bon-tam-dung', image: '/images/subcategories/bathtub.png', categoryId: categories[3].id }
    });

    // Phụ kiện subcategories
    subcategories['ke-giado'] = await prisma.subcategory.create({
        data: { name: 'Kệ & Giá đỡ', slug: 'ke-gia-do', image: '/images/subcategories/accessories.png', categoryId: categories[4].id }
    });
    subcategories['moc-treo'] = await prisma.subcategory.create({
        data: { name: 'Móc treo', slug: 'moc-treo', image: '/images/subcategories/accessories.png', categoryId: categories[4].id }
    });

    console.log('✅ Subcategories created:', Object.keys(subcategories).length);

    // Create Products
    const products = [
        // Bồn cầu thông minh
        { name: 'Bồn cầu thông minh Novas Smart K1', slug: 'bon-cau-thong-minh-novas-smart-k1', description: 'Bồn cầu thông minh tích hợp vòi rửa, sấy khô, nắp đóng êm. Cảm biến tự động mở nắp.', price: 25000000, image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500', subcategoryId: subcategories['boncau-thongminh'].id, stock: 50, soldCount: 320 },
        { name: 'Bồn cầu thông minh Novas Smart V1', slug: 'bon-cau-thong-minh-novas-smart-v1', description: 'Thiết kế hiện đại, xả xoáy mạnh mẽ, chống ám mùi. Điều khiển remote.', price: 18000000, image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500', subcategoryId: subcategories['boncau-thongminh'].id, stock: 30, soldCount: 215 },
        { name: 'Bồn cầu thông minh Novas Smart F5', slug: 'bon-cau-thong-minh-novas-smart-f5', description: 'Công nghệ Nano chống bám bẩn, sưởi ấm ghế ngồi, khử mùi tự động.', price: 32000000, image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500', subcategoryId: subcategories['boncau-thongminh'].id, stock: 20, soldCount: 156 },

        // Bồn cầu 1 khối
        { name: 'Bồn cầu 1 khối Novas N09', slug: 'bon-cau-1-khoi-novas-n09', description: 'Thiết kế liền khối sang trọng, xả 2 chế độ tiết kiệm nước.', price: 4500000, image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500', subcategoryId: subcategories['boncau-1khoi'].id, stock: 100, soldCount: 520 },
        { name: 'Bồn cầu 1 khối Novas V68', slug: 'bon-cau-1-khoi-novas-v68', description: 'Men sứ cao cấp, dễ lau chùi, nắp đóng êm Soft-Close.', price: 5200000, image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500', subcategoryId: subcategories['boncau-1khoi'].id, stock: 80, soldCount: 430 },
        { name: 'Bồn cầu 1 khối Novas C04', slug: 'bon-cau-1-khoi-novas-c04', description: 'Thiết kế tối giản, phù hợp mọi không gian phòng tắm.', price: 3800000, image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500', subcategoryId: subcategories['boncau-1khoi'].id, stock: 150, soldCount: 680 },

        // Bồn cầu trứng
        { name: 'Bồn cầu trứng Novas E33', slug: 'bon-cau-trung-novas-e33', description: 'Thiết kế hình trứng độc đáo, tay vịn an toàn.', price: 8500000, image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500', subcategoryId: subcategories['boncau-trung'].id, stock: 40, soldCount: 180 },
        { name: 'Bồn cầu trứng Novas EV', slug: 'bon-cau-trung-novas-ev', description: 'Phiên bản cao cấp, viền mạ vàng sang trọng.', price: 12000000, image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500', subcategoryId: subcategories['boncau-trung'].id, stock: 25, soldCount: 95 },

        // Bồn cầu treo tường
        { name: 'Bồn cầu treo tường Novas H10', slug: 'bon-cau-treo-tuong-novas-h10', description: 'Két âm tường, tiết kiệm không gian, chịu tải 400kg.', price: 15000000, image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500', subcategoryId: subcategories['boncau-treotuong'].id, stock: 35, soldCount: 120 },
        { name: 'Bồn cầu treo tường Novas H06', slug: 'bon-cau-treo-tuong-novas-h06', description: 'Thiết kế vuông vắn hiện đại, dễ vệ sinh.', price: 12500000, image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500', subcategoryId: subcategories['boncau-treotuong'].id, stock: 45, soldCount: 85 },

        // Vòi sen
        { name: 'Sen cây nhiệt độ Novas S100', slug: 'sen-cay-nhiet-do-novas-s100', description: 'Hệ thống sen cây với màn hình hiển thị nhiệt độ, tăng áp lực nước.', price: 8500000, image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500', subcategoryId: subcategories['sencay'].id, stock: 60, soldCount: 450 },
        { name: 'Sen tắm đứng Novas R50', slug: 'sen-tam-dung-novas-r50', description: 'Sen tắm đứng Rain Shower, đầu phun rộng 30cm.', price: 4200000, image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500', subcategoryId: subcategories['sendung'].id, stock: 90, soldCount: 380 },
        { name: 'Vòi sen tay Novas H20', slug: 'voi-sen-tay-novas-h20', description: 'Vòi sen tay 5 chế độ phun, tiết kiệm nước 40%.', price: 850000, image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500', subcategoryId: subcategories['voisen-tay'].id, stock: 200, soldCount: 920 },

        // Lavabo
        { name: 'Chậu lavabo đặt bàn Novas L01', slug: 'chau-lavabo-dat-ban-novas-l01', description: 'Chậu rửa mặt đặt bàn, men sứ cao cấp không bám bẩn.', price: 2800000, image: 'https://images.unsplash.com/photo-1585909695284-32d2985ac9c0?w=500', subcategoryId: subcategories['lavabo-datban'].id, stock: 80, soldCount: 340 },
        { name: 'Vòi lavabo nóng lạnh Novas F01', slug: 'voi-lavabo-nong-lanh-novas-f01', description: 'Vòi chậu nóng lạnh, đồng mạ chrome sáng bóng.', price: 1200000, image: 'https://images.unsplash.com/photo-1585909695284-32d2985ac9c0?w=500', subcategoryId: subcategories['voi-lavabo'].id, stock: 150, soldCount: 620 },

        // Bồn tắm
        { name: 'Bồn tắm massage Novas M100', slug: 'bon-tam-massage-novas-m100', description: 'Bồn tắm massage sục khí, giữ nhiệt tốt, chất liệu Acrylic.', price: 35000000, image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=500', subcategoryId: subcategories['bontam-massage'].id, stock: 15, soldCount: 45 },
        { name: 'Bồn tắm đứng Novas S50', slug: 'bon-tam-dung-novas-s50', description: 'Bồn tắm đứng freestanding, thiết kế Scandinavian.', price: 18000000, image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=500', subcategoryId: subcategories['bontam-dung'].id, stock: 25, soldCount: 78 },

        // Phụ kiện
        { name: 'Kệ để đồ inox Novas A01', slug: 'ke-de-do-inox-novas-a01', description: 'Kệ phòng tắm inox 304, chống gỉ sét, chịu tải 15kg.', price: 450000, image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=500', subcategoryId: subcategories['ke-giado'].id, stock: 300, soldCount: 1200 },
        { name: 'Móc treo khăn mạ vàng Novas G01', slug: 'moc-treo-khan-ma-vang-novas-g01', description: 'Móc treo khăn đồng mạ vàng 24K, sang trọng.', price: 680000, image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=500', subcategoryId: subcategories['moc-treo'].id, stock: 250, soldCount: 890 },
    ];

    for (const product of products) {
        await prisma.product.create({ data: product });
    }

    console.log('✅ Products created:', products.length);

    // Seed Banners
    await prisma.banner.createMany({
        data: [
            // Homepage banners
            { image: '/banner-1.png', title: 'BST Phòng Tắm Luxury', description: 'Không gian thư giãn đẳng cấp 5 sao', link: '/products', cta: 'Khám Phá Ngay', pageType: 'homepage', sortOrder: 0, isActive: true },
            { image: '/banner-2.png', title: 'Bồn Cầu Thông Minh 2024', description: 'Công nghệ tự động hóa, kháng khuẩn', link: '/bon-cau', cta: 'Xem Chi Tiết', pageType: 'homepage', sortOrder: 1, isActive: true },
            { image: '/banner-3.png', title: 'Sen Tắm Nhiệt Độ Spa', description: 'Trải nghiệm tắm mưa massage', link: '/voi-sen', cta: 'Mua Ngay', pageType: 'homepage', sortOrder: 2, isActive: true },
            // Category banners
            { image: '/banner-1.png', title: 'Bồn Cầu Cao Cấp', description: 'Công nghệ xả xoáy, tiết kiệm nước', link: '/bon-cau', cta: 'Xem Thêm', pageType: 'category', categorySlug: 'bon-cau', sortOrder: 0, isActive: true },
            { image: '/banner-2.png', title: 'Lavabo Sang Trọng', description: 'Thiết kế hiện đại, chất liệu cao cấp', link: '/lavabo', cta: 'Khám Phá', pageType: 'category', categorySlug: 'lavabo', sortOrder: 0, isActive: true },
            { image: '/banner-3.png', title: 'Vòi Sen Thông Minh', description: 'Điều chỉnh nhiệt độ tự động', link: '/voi-sen', cta: 'Mua Ngay', pageType: 'category', categorySlug: 'voi-sen', sortOrder: 0, isActive: true },
            { image: '/banner-1.png', title: 'Bồn Tắm Massage', description: 'Thư giãn như spa tại nhà', link: '/bon-tam', cta: 'Xem Chi Tiết', pageType: 'category', categorySlug: 'bon-tam', sortOrder: 0, isActive: true },
            { image: '/banner-2.png', title: 'Phụ Kiện Phòng Tắm', description: 'Hoàn thiện không gian của bạn', link: '/phu-kien', cta: 'Khám Phá', pageType: 'category', categorySlug: 'phu-kien', sortOrder: 0, isActive: true },
        ],
    });
    console.log('✅ Banners created: 8');

    // Seed Showrooms
    await prisma.showroom.createMany({
        data: [
            { name: 'Showroom Hà Nội', address: '502 Xã Đàn, Đống Đa, Hà Nội', mapUrl: 'https://maps.google.com', sortOrder: 0, isActive: true },
            { name: 'Showroom HCM', address: '94-96-98 Đinh Thị Thi, Thủ Đức', mapUrl: 'https://maps.google.com', sortOrder: 1, isActive: true },
            { name: 'Showroom Đà Nẵng', address: '460 Nguyễn Hữu Thọ, Cẩm Lệ', mapUrl: 'https://maps.google.com', sortOrder: 2, isActive: true },
        ],
    });
    console.log('✅ Showrooms created: 3');

    // Seed Site Settings
    const settings = [
        { key: 'hotline1', value: '1900 9430' },
        { key: 'hotline2', value: '1800 8149' },
        { key: 'emailSales', value: 'sell@novas.vn' },
        { key: 'emailSupport', value: 'cskh@novas.vn' },
        { key: 'emailHR', value: 'hr@novas.vn' },
        { key: 'facebookUrl', value: 'https://www.facebook.com/profile.php?id=61577455030584' },
        { key: 'messengerUrl', value: 'https://m.me/61577455030584' },
    ];
    for (const s of settings) {
        await prisma.siteSetting.create({ data: s });
    }
    console.log('✅ Site settings created:', settings.length);

    console.log('🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
