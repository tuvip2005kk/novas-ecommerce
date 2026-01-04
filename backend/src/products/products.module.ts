import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
    controllers: [ProductsController],
    providers: [ProductsService, PrismaService, JwtService],
})
export class ProductsModule {
    constructor() {
        console.log('ProductsModule initialized');
    }
}

