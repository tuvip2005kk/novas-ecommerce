import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import * as fs from 'fs';

async function bootstrap() {
    console.log('--- BOOTSTRAP STARTING ---');
    try {
        const app = await NestFactory.create<NestExpressApplication>(AppModule, {
            logger: ['error', 'warn', 'log', 'debug', 'verbose'],
        });

        // Log every request
        app.use((req, res, next) => {
            console.log(`[REQUEST] ${req.method} ${req.url}`);
            next();
        });

        // Log all network interfaces to debug connectivity
        const networkInterfaces = require('os').networkInterfaces();
        console.log('[BOOTSTRAP] Network Interfaces:', JSON.stringify(networkInterfaces, null, 2));

        // Configure CORS - default permissive
        app.enableCors();

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

        // Railway injects PORT environment variable
        const port = process.env.PORT || 3000;
        console.log(`[BOOTSTRAP] Railway PORT env: ${process.env.PORT}`);
        console.log(`[BOOTSTRAP] Binding to 0.0.0.0:${port}`);

        // Manual Health Check Route (Bypassing Controllers)
        const server = app.getHttpAdapter().getInstance();
        server.get('/', (req, res) => {
            console.log('[REQUEST] GET / (Health Check)');
            res.send('Server is Up! (0.0.0.0 Binding)');
        });

        await app.listen(port, '0.0.0.0', () => {
            console.log(`Server successfully started on 0.0.0.0:${port}`);
        });

        // Heartbeat to check if event loop is blocked or process dies
        setInterval(() => {
            const memory = process.memoryUsage();
            console.log(`[HEARTBEAT] Alive. RAM: ${Math.round(memory.rss / 1024 / 1024)}MB`);
        }, 5000);
    } catch (error) {
        console.error('Fatal error during bootstrap:', error);
        process.exit(1);
    }
}
bootstrap();
