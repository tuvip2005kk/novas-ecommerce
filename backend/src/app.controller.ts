import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get()
    getHello() {
        return { status: 'Backend Online', timestamp: new Date(), version: '1.0.0' };
    }

    @Get('test-products')
    getTest() {
        return "Products Test Works";
    }
}
