import { Module } from '@nestjs/common';
import { SeedController } from './seed.controller';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [SeedController],
    providers: [],
})
export class SeedModule { }
