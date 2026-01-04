import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import * as fs from 'fs';

async function bootstrap() {
    console.log('--- BOOTSTRAP STARTING ---');
    try {
        const app = await NestFactory.create<NestExpressApplication>(AppModule);

        // Configure CORS for production and development
        app.enableCors({
            origin: [
                'https://novas-ecommerce.vercel.app',
                'http://localhost:3000',
                'http://localhost:3001',
            ],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            credentials: true,
        });

        // Ensure uploads folder exists
        const uploadPath = join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadPath)) {
            console.log('Uploads folder not found, creating...', uploadPath);
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        // Serve uploaded files statically
        app.useStaticAssets(uploadPath, {
            prefix: '/uploads/',
        });

        const port = process.env.PORT || 3005;
        await app.listen(port, '0.0.0.0', () => {
            console.log(`Server running on http://0.0.0.0:${port}`);
        });
    } catch (error) {
        console.error('Fatal error during bootstrap:', error);
        process.exit(1);
    }
}
bootstrap();
