import { Module } from '@nestjs/common';
import { BannersController } from './banners.controller';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [BannersController],
    providers: [PrismaService],
})
export class BannersModule { }
