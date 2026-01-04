import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('api/categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    findAll() {
        return this.categoriesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.categoriesService.findOne(+id);
    }

    @Get('slug/:slug')
    findBySlug(@Param('slug') slug: string) {
        return this.categoriesService.findBySlug(slug);
    }

    @Post()
    @UseGuards(AdminGuard)
    create(@Body() body: { name: string; slug: string; image?: string; description?: string }) {
        return this.categoriesService.create(body);
    }

    @Patch(':id')
    @UseGuards(AdminGuard)
    update(@Param('id') id: string, @Body() body: { name?: string; slug?: string; image?: string; description?: string }) {
        return this.categoriesService.update(+id, body);
    }

    @Delete(':id')
    @UseGuards(AdminGuard)
    delete(@Param('id') id: string) {
        return this.categoriesService.delete(+id);
    }
}
