const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        console.log('Fetching users...');
        const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
        users.forEach(u => console.log(u.email, '-', u.role));

        console.log('\nPromoting admin users...');
        const emails = ['admin@gmail.com', 'admin@admin.com', 'tuvip2005kk@gmail.com'];
        for (const user of users) {
            if (user.email.includes('admin') || Object.values(user).some(v => String(v).includes('admin'))) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { role: 'ADMIN' }
                });
                console.log(`Promoted: ${user.email}`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
