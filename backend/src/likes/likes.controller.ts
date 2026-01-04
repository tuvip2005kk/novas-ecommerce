import { Controller, Delete, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { LikesService } from './likes.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('likes')
@UseGuards(AuthGuard)
export class LikesController {
    constructor(private readonly likesService: LikesService) { }

    @Get()
    findAll(@Req() req: any) {
        return this.likesService.findAllByUser(req.user.sub);
    }

    @Post(':productId')
    add(@Req() req: any, @Param('productId') productId: string) {
        return this.likesService.add(req.user.sub, +productId);
    }

    @Delete(':productId')
    remove(@Req() req: any, @Param('productId') productId: string) {
        return this.likesService.remove(req.user.sub, +productId);
    }

    @Get('check/:productId')
    check(@Req() req: any, @Param('productId') productId: string) {
        return this.likesService.check(req.user.sub, +productId);
    }
}
