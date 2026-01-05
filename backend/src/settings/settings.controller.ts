import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('settings')
export class SettingsController {
    constructor(private prisma: PrismaService) { }

    @Get()
    async findAll() {
        const settings = await this.prisma.siteSetting.findMany();
        // Convert to object format
        const result: Record<string, string> = {};
        settings.forEach(s => {
            result[s.key] = s.value;
        });
        return result;
    }

    @Get(':key')
    async findOne(@Param('key') key: string) {
        return this.prisma.siteSetting.findUnique({
            where: { key },
        });
    }

    @Post()
    async upsert(@Body() data: { key: string; value: string }) {
        return this.prisma.siteSetting.upsert({
            where: { key: data.key },
            update: { value: data.value },
            create: { key: data.key, value: data.value },
        });
    }

    @Put('bulk')
    async bulkUpdate(@Body() data: Record<string, string>) {
        const results: any[] = [];
        for (const [key, value] of Object.entries(data)) {
            const result = await this.prisma.siteSetting.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            });
            results.push(result);
        }
        return results;
    }
}
