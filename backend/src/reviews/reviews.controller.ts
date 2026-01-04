import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Get()
    @UseGuards(AdminGuard)
    findAll() {
        return this.reviewsService.findAll();
    }

    @Get('product/:productId')
    findByProduct(@Param('productId') productId: string) {
        return this.reviewsService.findByProduct(+productId);
    }

    @Get('product/:productId/stats')
    getStats(@Param('productId') productId: string) {
        return this.reviewsService.getProductStats(+productId);
    }

    @Get('product/:productId/can-review')
    @UseGuards(AuthGuard)
    canReview(@Req() req: any, @Param('productId') productId: string) {
        return this.reviewsService.canReview(req.user.sub, +productId);
    }

    @Post('product/:productId')
    @UseGuards(AuthGuard)
    create(
        @Req() req: any,
        @Param('productId') productId: string,
        @Body() body: { rating: number; comment?: string }
    ) {
        return this.reviewsService.create(req.user.sub, +productId, body.rating, body.comment);
    }

    @Delete(':id')
    @UseGuards(AuthGuard)
    remove(@Req() req: any, @Param('id') id: string) {
        return this.reviewsService.remove(req.user.sub, +id);
    }

    @Delete('admin/:id')
    @UseGuards(AdminGuard)
    adminRemove(@Param('id') id: string) {
        return this.reviewsService.adminRemove(+id);
    }
}
