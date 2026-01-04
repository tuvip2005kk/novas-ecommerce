import { Module } from '@nestjs/common';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
    controllers: [LikesController],
    providers: [LikesService, JwtService],
})
export class LikesModule { }
