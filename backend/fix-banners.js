const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Delete old banners with wrong paths
    await prisma.banner.deleteMany({
        where: {
            image: { startsWith: '/banner' }
        }
    });

    // Add homepage banners with correct paths (using images/banners folder)
    const result = await prisma.banner.createMany({
        data: [
            // Homepage banners
            { image: '/images/banners/bon-cau-banner.png', title: 'Bồn Cầu Thông Minh 2024', description: 'Công nghệ tự động hóa, kháng khuẩn', link: '/bon-cau', cta: 'Khám Phá Ngay', pageType: 'homepage', sortOrder: 0, isActive: true },
            { image: '/images/banners/lavabo-banner.png', title: 'Lavabo Cao Cấp', description: 'Thiết kế hiện đại, sang trọng', link: '/lavabo', cta: 'Xem Chi Tiết', pageType: 'homepage', sortOrder: 1, isActive: true },
            { image: '/images/banners/voi-sen-banner.png', title: 'Sen Tắm Nhiệt Độ Spa', description: 'Trải nghiệm tắm mưa massage', link: '/voi-sen', cta: 'Mua Ngay', pageType: 'homepage', sortOrder: 2, isActive: true },
            // Category banners
            { image: '/images/banners/bon-cau-banner.png', title: 'Bồn Cầu Cao Cấp', description: 'Công nghệ xả xoáy, tiết kiệm nước', link: '/bon-cau', cta: 'Xem Thêm', pageType: 'category', categorySlug: 'bon-cau', sortOrder: 0, isActive: true },
            { image: '/images/banners/lavabo-banner.png', title: 'Lavabo Sang Trọng', description: 'Thiết kế hiện đại, chất liệu cao cấp', link: '/lavabo', cta: 'Khám Phá', pageType: 'category', categorySlug: 'lavabo', sortOrder: 0, isActive: true },
            { image: '/images/banners/voi-sen-banner.png', title: 'Vòi Sen Thông Minh', description: 'Điều chỉnh nhiệt độ tự động', link: '/voi-sen', cta: 'Mua Ngay', pageType: 'category', categorySlug: 'voi-sen', sortOrder: 0, isActive: true },
            { image: '/images/banners/bon-tam-banner.png', title: 'Bồn Tắm Massage', description: 'Thư giãn như spa tại nhà', link: '/bon-tam', cta: 'Xem Chi Tiết', pageType: 'category', categorySlug: 'bon-tam', sortOrder: 0, isActive: true },
            { image: '/images/banners/phu-kien-banner.png', title: 'Phụ Kiện Phòng Tắm', description: 'Hoàn thiện không gian của bạn', link: '/phu-kien', cta: 'Khám Phá', pageType: 'category', categorySlug: 'phu-kien', sortOrder: 0, isActive: true },
        ],
    });
    console.log('Created', result.count, 'banners');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
