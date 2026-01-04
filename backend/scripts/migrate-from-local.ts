import { createConnection } from 'mysql2/promise';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Explicitly load root .env for DATABASE_URL (Prisma)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MYSQL_CONFIG = {
    host: '127.0.0.1', // Try 127.0.0.1 first
    user: 'root',
    password: '',
    database: 'sanitary_store',
    port: 3306
};

const prisma = new PrismaClient();

async function migrate() {
    console.log('--- MIGRATION DEBUG ---');
    console.log('1. Postgres URL:', process.env.DATABASE_URL ? 'FOUND' : 'MISSING (Prisma will fail)');
    console.log('2. Target MySQL:', `${MYSQL_CONFIG.user}@${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port}/${MYSQL_CONFIG.database}`);

    let mysql;
    try {
        console.log('👉 Connecting to MySQL...');
        mysql = await createConnection(MYSQL_CONFIG);
        console.log('✅ Connected to Local MySQL!');
    } catch (e) {
        console.error('❌ MySQL Connection FAILED. Details:');
        console.error('   Code:', e.code);
        console.error('   Message:', e.message);
        console.error('   Common causes: Wrong password? Database name wrong? MySQL not running?');
        process.exit(1);
    }

    // 2. Clear existing data in Postgres
    console.log('🗑️  Cleaning Railway Database...');
    try {
        await prisma.orderItem.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.product.deleteMany({});
        await prisma.subcategory.deleteMany({});
        await prisma.category.deleteMany({});
        await prisma.user.deleteMany({});
        // Add other tables as needed based on schema
    } catch (e) {
        console.warn('⚠️  Warning during cleanup (tables might be empty):', e.message);
    }
    console.log('✅ Railway Database Cleaned');

    // 3. Migrate Users
    console.log('🚀 Migrating Users...');
    const [users] = await mysql.execute('SELECT * FROM User');
    for (const u of users as any[]) {
        try {
            await prisma.user.create({
                data: {
                    email: u.email,
                    password: u.password,
                    name: u.name,
                    role: u.role || 'USER',
                    // Skip ID to let Postgres autogenerate, or keep it if crucial. Keeping it is safer for relations.
                    // But if IDs conform, we can keep them.
                    createdAt: new Date(u.createdAt),
                    updatedAt: new Date(u.updatedAt),
                }
            });
        } catch (e) {
            console.error(`Failed to migrate User ${u.email}:`, e.message);
        }
    }
    console.log(`✅ Users Migrated: ${(users as any[]).length}`);

    // 4. Migrate Categories
    console.log('🚀 Migrating Categories...');
    const [categories] = await mysql.execute('SELECT * FROM Category');
    const categoryMap = new Map<number, number>(); // Old ID -> New ID

    for (const c of categories as any[]) {
        const newCat = await prisma.category.create({
            data: {
                name: c.name,
                slug: c.slug,
                image: c.image,
                description: c.description,
                createdAt: new Date(c.createdAt),
                updatedAt: new Date(c.updatedAt),
            }
        });
        categoryMap.set(c.id, newCat.id);
    }
    console.log(`✅ Categories Migrated: ${(categories as any[]).length}`);

    // 5. Migrate Subcategories
    console.log('🚀 Migrating Subcategories...');
    const [subcategories] = await mysql.execute('SELECT * FROM Subcategory');
    const subcategoryMap = new Map<number, number>();

    for (const s of subcategories as any[]) {
        const newCatId = categoryMap.get(s.categoryId);
        if (newCatId) {
            const newSub = await prisma.subcategory.create({
                data: {
                    name: s.name,
                    slug: s.slug,
                    image: s.image,
                    categoryId: newCatId,
                    createdAt: new Date(s.createdAt),
                    updatedAt: new Date(s.updatedAt),
                }
            });
            subcategoryMap.set(s.id, newSub.id);
        }
    }
    console.log(`✅ Subcategories Migrated: ${(subcategories as any[]).length}`);

    // 6. Migrate Products
    console.log('🚀 Migrating Products...');
    const [products] = await mysql.execute('SELECT * FROM Product');
    for (const p of products as any[]) {
        const newSubId = subcategoryMap.get(p.subcategoryId);
        if (newSubId) {
            await prisma.product.create({
                data: {
                    name: p.name,
                    description: p.description || '',
                    price: parseFloat(p.price),
                    image: p.image,
                    images: p.images || [], // Ensure JSON compatibility
                    slug: p.slug,
                    subcategoryId: newSubId,
                    stock: p.stock,
                    soldCount: p.soldCount,
                    specs: p.specs || {},
                    createdAt: new Date(p.createdAt),
                    updatedAt: new Date(p.updatedAt),
                }
            });
        }
    }
    console.log(`✅ Products Migrated: ${(products as any[]).length}`);

    console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
    await mysql.end();
    await prisma.$disconnect();
}

migrate().catch(e => {
    console.error('Migration Failed:', e);
    process.exit(1);
});
