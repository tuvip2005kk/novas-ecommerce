const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetUserPassword() {
    const email = process.argv[2];
    const newPassword = process.argv[3] || 'newpass123';

    if (!email) {
        console.log('Cach dung: node reset-user.js email matkhaumoi');
        console.log('Vi du: node reset-user.js admin@gmail.com matkhau123');
        process.exit(1);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log('Khong tim thay user voi email:', email);
        process.exit(1);
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { email },
        data: { password: hash }
    });

    console.log('Reset thanh cong!');
    console.log('Email:', email);
    console.log('Mat khau moi:', newPassword);
    console.log('Ten:', user.name || 'N/A');
    console.log('Role:', user.role);
}

resetUserPassword()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
