import { Module } from '@nestjs/common';
import { SePayController } from './sepay.controller';
import { SePayService } from './sepay.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
    imports: [OrdersModule],
    controllers: [SePayController],
    providers: [SePayService],
})
export class SePayModule { }
