import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('showrooms')
export class ShowroomsController {
    constructor(private prisma: PrismaService) { }

    @Get()
    async findAll() {
        return this.prisma.showroom.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }

    @Get('all')
    async findAllAdmin() {
        return this.prisma.showroom.findMany({
            orderBy: { sortOrder: 'asc' },
        });
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.prisma.showroom.findUnique({
            where: { id: parseInt(id) },
        });
    }

    @Post()
    async create(@Body() data: any) {
        return this.prisma.showroom.create({ data });
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: any) {
        return this.prisma.showroom.update({
            where: { id: parseInt(id) },
            data,
        });
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.prisma.showroom.delete({
            where: { id: parseInt(id) },
        });
    }
}
