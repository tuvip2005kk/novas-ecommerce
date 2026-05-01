import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { PrismaModule } from '../prisma.module';
import { CardPaymentsController } from './card-payments.controller';
import { CardPaymentsService } from './card-payments.service';

@Module({
    imports: [PrismaModule, OrdersModule],
    controllers: [CardPaymentsController],
    providers: [CardPaymentsService],
})
export class CardPaymentsModule {}
