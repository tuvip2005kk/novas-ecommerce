import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('banners')
export class BannersController {
    constructor(private prisma: PrismaService) { }

    @Get()
    async findAll(@Query('pageType') pageType?: string, @Query('categorySlug') categorySlug?: string) {
        const where: any = { isActive: true };
        if (pageType) where.pageType = pageType;
        if (categorySlug) where.categorySlug = categorySlug;

        return this.prisma.banner.findMany({
            where,
            orderBy: { sortOrder: 'asc' },
        });
    }

    @Get('all')
    async findAllAdmin() {
        return this.prisma.banner.findMany({
            orderBy: { sortOrder: 'asc' },
        });
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.prisma.banner.findUnique({
            where: { id: parseInt(id) },
        });
    }

    @Post()
    async create(@Body() data: any) {
        return this.prisma.banner.create({ data });
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: any) {
        return this.prisma.banner.update({
            where: { id: parseInt(id) },
            data,
        });
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.prisma.banner.delete({
            where: { id: parseInt(id) },
        });
    }
}
