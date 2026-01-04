const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
    const cats = await p.category.count();
    const subs = await p.subcategory.count();
    const prods = await p.product.count();
    console.log('Categories:', cats);
    console.log('Subcategories:', subs);
    console.log('Products:', prods);
    await p.$disconnect();
})();
