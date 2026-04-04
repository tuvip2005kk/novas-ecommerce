import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from '../prisma.service';
import { SalesService } from '../sales/sales.service';

@Module({
    controllers: [OrdersController],
    providers: [OrdersService, PrismaService, SalesService],
})
export class OrdersModule { }
