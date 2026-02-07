
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = '123@123.com';
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true }
    });
    console.log('CHECK_RESULT:', JSON.stringify(user));

    const user2 = await prisma.user.findUnique({
        where: { id: 2 },
        select: { id: true, email: true, name: true }
    });
    console.log('USER_2_RESULT:', JSON.stringify(user2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
