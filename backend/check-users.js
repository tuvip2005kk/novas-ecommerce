const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log('Fetching users...');
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
    console.log(users);
    await prisma.$disconnect();
}
main();
