import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
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

    @Get('version')
    version() {
        return { version: '1.0.4', timestamp: new Date().toISOString(), message: "AuthGuard Refactored & Global JWT" };
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

    @Get('product/:productId/debug')
    async debug(@Param('productId') productId: string) {
        console.log(`[DEBUG] Requesting debug info for Product ${productId}`);
        // Pass 0 or dummy userId since we just want to see orders regardless of user for this specific debug
        // Actually debugCheck uses userId. Use a broader check or just accept it might return nothing if userId is required.
        // Wait, debugCheck filters by userId. If we remove AuthGuard, we don't have req.user.
        // Let's modify debugCheck to NOT filter by userId if we want to debug "why I can't review".
        // Use a hardcoded debug flow or just rely on debugOrder which searches by code.

        // For product debug, without user, it's hard to say "can THIS user review". 
        // Let's focus on debugOrder which searches by unique code.
        return { message: "Use /debug-order/:orderCode for easier debugging" };
    }

    @Get('debug-order/:orderCode')
    async debugOrder(@Param('orderCode') orderCode: string) {
        console.log(`[DEBUG] Requesting debug info for Order ${orderCode}`);
        const order = await this.reviewsService.debugOrder(orderCode);
        return {
            searchCode: orderCode,
            orderFound: order,
            explanation: order ? "Order found. Check status field." : "Order NOT found."
        };
    }

    @Post('product/:productId')
    @UseGuards(AuthGuard)
    create(
        @Req() req: any,
        @Param('productId') productId: string,
        @Body() body: CreateReviewDto
    ) {
        console.log(`[ReviewsController] Received payload:`, body);
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
