import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
    controllers: [SalesController],
    providers: [SalesService, JwtService],
    exports: [SalesService],
})
export class SalesModule { }
