import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('sales')
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    @Get()
    @UseGuards(AdminGuard)
    findAll() {
        return this.salesService.findAll();
    }

    @Post()
    @UseGuards(AdminGuard)
    create(@Body() body: { code: string; discount: number; type?: string; minOrder?: number; maxDiscount?: number; usageLimit?: number; expiresAt?: string }) {
        return this.salesService.create(body);
    }

    @Patch(':id')
    @UseGuards(AdminGuard)
    update(@Param('id') id: string, @Body() body: any) {
        return this.salesService.update(+id, body);
    }

    @Delete(':id')
    @UseGuards(AdminGuard)
    remove(@Param('id') id: string) {
        return this.salesService.remove(+id);
    }

    @Post('apply')
    apply(@Body() body: { code: string; orderTotal: number }) {
        return this.salesService.apply(body.code, body.orderTotal);
    }
}
