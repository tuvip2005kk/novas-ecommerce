import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SePayModule } from './sepay/sepay.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LikesModule } from './likes/likes.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SalesModule } from './sales/sales.module';
import { CategoriesModule } from './categories/categories.module';
import { SubcategoriesModule } from './subcategories/subcategories.module';
import { UploadModule } from './upload/upload.module';
import { BannersModule } from './banners/banners.module';
import { ShowroomsModule } from './showrooms/showrooms.module';
import { SettingsModule } from './settings/settings.module';

import { SeedModule } from './seed/seed.module';

import { PrismaModule } from './prisma.module';

@Module({
    imports: [
        PrismaModule,
        SePayModule,
        ProductsModule,
        OrdersModule,
        AuthModule,
        UsersModule,
        LikesModule,
        ReviewsModule,
        SalesModule,
        CategoriesModule,
        SubcategoriesModule,
        UploadModule,
        BannersModule,
        ShowroomsModule,
        SettingsModule,
        SeedModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
    constructor() {
        console.log('AppModule initialized');
    }
}
