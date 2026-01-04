import { Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
    imports: [
        JwtModule.register({
            secret: 'sanitary-store-secret-key-2024',
            signOptions: { expiresIn: '7d' },
        }),
    ],
    controllers: [CategoriesController],
    providers: [CategoriesService],
    exports: [CategoriesService]
})
export class CategoriesModule implements OnModuleInit {
    onModuleInit() {
        console.log('CategoriesModule Initialized');
    }
}
