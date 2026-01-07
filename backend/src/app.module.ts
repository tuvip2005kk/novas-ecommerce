import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
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
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100, // 100 requests per minute
        }]),
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
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {
    constructor() {
        console.log('AppModule initialized');
    }
}
