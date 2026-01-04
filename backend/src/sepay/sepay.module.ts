import { Module } from '@nestjs/common';
import { SePayController } from './sepay.controller';
import { SePayService } from './sepay.service';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [SePayController],
    providers: [SePayService, PrismaService],
})
export class SePayModule { }
