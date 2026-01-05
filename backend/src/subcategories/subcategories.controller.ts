import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SubcategoriesService } from './subcategories.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('subcategories')
export class SubcategoriesController {
    constructor(private readonly subcategoriesService: SubcategoriesService) { }

    @Get()
    findAll() {
        return this.subcategoriesService.findAll();
    }

    // Must be before :id to avoid being captured by it
    @Get('slug/:slug')
    findBySlug(@Param('slug') slug: string) {
        return this.subcategoriesService.findBySlug(slug);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.subcategoriesService.findOne(+id);
    }

    @Post()
    @UseGuards(AdminGuard)
    create(@Body() body: { name: string; slug: string; image?: string; categoryId: number }) {
        return this.subcategoriesService.create(body);
    }

    @Patch(':id')
    @UseGuards(AdminGuard)
    update(@Param('id') id: string, @Body() body: { name?: string; slug?: string; image?: string; categoryId?: number }) {
        return this.subcategoriesService.update(+id, body);
    }

    @Delete(':id')
    @UseGuards(AdminGuard)
    delete(@Param('id') id: string) {
        return this.subcategoriesService.delete(+id);
    }
}
