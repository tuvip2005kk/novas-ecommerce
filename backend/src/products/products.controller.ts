import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {
        console.log('ProductsController initialized');
    }

    @Get()
    findAll(@Query('search') search?: string, @Query('category') category?: string, @Query('sort') sort?: string) {
        return this.productsService.findAll(search, category, sort);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(+id);
    }

    @Get('slug/:slug')
    findBySlug(@Param('slug') slug: string) {
        return this.productsService.findBySlug(slug);
    }

    @Post()
    @UseGuards(AdminGuard)
    create(@Body() data: { name: string; slug: string; description: string; price: number; image: string; category: string; stock: number }) {
        return this.productsService.create(data);
    }

    @Patch(':id')
    @UseGuards(AdminGuard)
    update(@Param('id') id: string, @Body() data: { name?: string; slug?: string; description?: string; price?: number; image?: string; category?: string; stock?: number }) {
        return this.productsService.update(+id, data);
    }

    @Delete(':id')
    @UseGuards(AdminGuard)
    delete(@Param('id') id: string) {
        return this.productsService.delete(+id);
    }
}

