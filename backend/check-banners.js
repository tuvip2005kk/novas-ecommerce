const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const banners = await prisma.banner.findMany();
    const fs = require('fs');
    fs.writeFileSync('banners-full.json', JSON.stringify(banners, null, 2));
    console.log("Wrote banners to banners-full.json");
}
main().catch(console.error).finally(() => prisma.$disconnect());
