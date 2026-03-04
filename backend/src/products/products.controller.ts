import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {
        console.log('ProductsController initialized');
    }

    @Get()
    findAll(
        @Query('search') search?: string,
        @Query('category') category?: string,
        @Query('sort') sort?: string,
        @Query('subcategoryId') subcategoryId?: string
    ) {
        return this.productsService.findAll(search, category, sort, subcategoryId ? parseInt(subcategoryId) : undefined);
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
    create(@Body() body: any) {
        const { category, ...data } = body;
        return this.productsService.create(data);
    }

    @Patch(':id')
    @UseGuards(AdminGuard)
    update(@Param('id') id: string, @Body() body: any) {
        const { category, ...data } = body;
        return this.productsService.update(+id, data);
    }

    @Delete(':id')
    @UseGuards(AdminGuard)
    delete(@Param('id') id: string) {
        return this.productsService.delete(+id);
    }
}

