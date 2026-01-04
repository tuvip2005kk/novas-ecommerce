console.log('--- SYSTEM STARTING: READING IMPORTS ---');
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import * as fs from 'fs';

console.log('--- SYSTEM LOADING: IMPORTS COMPLETE ---');

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

        // Set global API prefix for all controllers
        app.setGlobalPrefix('api', {
            exclude: ['/', 'sepay/webhook'] // Exclude root health check and sepay webhook
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

        // Railway injects PORT environment variable
        const port = process.env.PORT || 3000;
        console.log(`[BOOTSTRAP] Railway PORT env: ${process.env.PORT}`);
        console.log(`[BOOTSTRAP] Binding to 0.0.0.0 (IPv4) on port ${port}`);

        // Manual Health Check Route (Bypassing Controllers)
        const server = app.getHttpAdapter().getInstance();
        server.get('/', (req, res) => {
            console.log(`[REQUEST] GET / (Health Check) - REMOTE IP: ${req.ip}`);
            res.send('Server is Up! (IPv4 Binding)');
        });

        // Listen on 0.0.0.0 specifically
        await app.listen(port, '0.0.0.0', () => {
            console.log(`Server successfully started on 0.0.0.0:${port}`);

            // SELF-DIAGNOSTIC PING
            const http = require('http');
            console.log(`[DIAGNOSTIC] Pinging http://127.0.0.1:${port}/ ...`);
            http.get(`http://127.0.0.1:${port}/`, (res) => {
                console.log(`[DIAGNOSTIC] Self-Ping Response: ${res.statusCode}`);
                res.on('data', (d) => process.stdout.write(`[DIAGNOSTIC] Body: ${d.toString()}\n`));
            }).on('error', (e) => {
                console.error(`[DIAGNOSTIC] Self-Ping FAILED:`, e);
            });
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
