const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Add category banners
    const result = await prisma.banner.createMany({
        data: [
            { image: '/banner-1.png', title: 'Bồn Cầu Cao Cấp', description: 'Công nghệ xả xoáy', link: '/bon-cau', cta: 'Xem Thêm', pageType: 'category', categorySlug: 'bon-cau', sortOrder: 0, isActive: true },
            { image: '/banner-2.png', title: 'Lavabo Sang Trọng', description: 'Thiết kế hiện đại', link: '/lavabo', cta: 'Khám Phá', pageType: 'category', categorySlug: 'lavabo', sortOrder: 0, isActive: true },
            { image: '/banner-3.png', title: 'Vòi Sen Thông Minh', description: 'Điều chỉnh nhiệt độ', link: '/voi-sen', cta: 'Mua Ngay', pageType: 'category', categorySlug: 'voi-sen', sortOrder: 0, isActive: true },
            { image: '/banner-1.png', title: 'Bồn Tắm Massage', description: 'Thư giãn như spa', link: '/bon-tam', cta: 'Xem Chi Tiết', pageType: 'category', categorySlug: 'bon-tam', sortOrder: 0, isActive: true },
            { image: '/banner-2.png', title: 'Phụ Kiện Phòng Tắm', description: 'Hoàn thiện không gian', link: '/phu-kien', cta: 'Khám Phá', pageType: 'category', categorySlug: 'phu-kien', sortOrder: 0, isActive: true },
        ],
    });
    console.log('Created', result.count, 'category banners');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
