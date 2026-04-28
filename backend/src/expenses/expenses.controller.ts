import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('expenses')
export class ExpensesController {
    constructor(private readonly expensesService: ExpensesService) {}

    @Get()
    @UseGuards(AdminGuard)
    findAll() {
        return this.expensesService.findAll();
    }

    @Post()
    @UseGuards(AdminGuard)
    create(@Body() body: any) {
        return this.expensesService.create(body);
    }

    @Post('bulk')
    @UseGuards(AdminGuard)
    createBulk(@Body() body: any[]) {
        return this.expensesService.createBulk(body);
    }

    @Put(':id')
    @UseGuards(AdminGuard)
    update(@Param('id') id: string, @Body() body: any) {
        return this.expensesService.update(+id, body);
    }

    @Delete(':id')
    @UseGuards(AdminGuard)
    delete(@Param('id') id: string) {
        return this.expensesService.delete(+id);
    }
}
