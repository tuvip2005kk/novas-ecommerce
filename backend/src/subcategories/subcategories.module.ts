import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SubcategoriesController } from './subcategories.controller';
import { SubcategoriesService } from './subcategories.service';

@Module({
    imports: [
        JwtModule.register({
            secret: 'sanitary-store-secret-key-2024',
            signOptions: { expiresIn: '7d' },
        }),
    ],
    controllers: [SubcategoriesController],
    providers: [SubcategoriesService],
    exports: [SubcategoriesService]
})
export class SubcategoriesModule { }
