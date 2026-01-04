import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Controller('users')
export class UsersController {
    constructor(private prisma: PrismaService) { }

    @Get('all')
    async findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                _count: {
                    select: { orders: true, likes: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.prisma.user.findUnique({
            where: { id: +id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                orders: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        paymentContent: true,
                        total: true,
                        status: true,
                        createdAt: true
                    }
                },
                likes: {
                    take: 5,
                    include: { product: { select: { id: true, name: true, image: true } } }
                },
                _count: {
                    select: { orders: true, likes: true }
                }
            }
        });
    }

    @Post()
    async create(@Body() data: { email: string; password: string; name?: string; role?: string }) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        return this.prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name || null,
                role: data.role || 'USER'
            }
        });
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: { email?: string; name?: string; role?: string }) {
        return this.prisma.user.update({
            where: { id: +id },
            data
        });
    }

    @Patch(':id/role')
    async updateRole(@Param('id') id: string, @Body('role') role: string) {
        return this.prisma.user.update({
            where: { id: +id },
            data: { role }
        });
    }

    @Patch(':id/password')
    async resetPassword(@Param('id') id: string, @Body('password') password: string) {
        const hashedPassword = await bcrypt.hash(password, 10);
        return this.prisma.user.update({
            where: { id: +id },
            data: { password: hashedPassword }
        });
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.prisma.user.delete({
            where: { id: +id }
        });
    }
}
