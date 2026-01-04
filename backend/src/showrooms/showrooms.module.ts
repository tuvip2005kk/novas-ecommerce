import { Module } from '@nestjs/common';
import { ShowroomsController } from './showrooms.controller';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [ShowroomsController],
    providers: [],
})
export class ShowroomsModule { }
