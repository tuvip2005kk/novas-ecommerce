import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

class OrderItemDto {
    @IsNotEmpty()
    @IsNumber()
    productId: number;

    @IsNotEmpty()
    @IsNumber()
    quantity: number;
}

export class CreateOrderDto {
    @IsOptional()
    @IsNumber()
    userId?: number;

    @IsOptional()
    @IsString()
    customerName?: string;

    @IsOptional()
    @IsString()
    customerPhone?: string;

    @IsOptional()
    @IsString()
    customerAddress?: string;

    @IsOptional()
    @IsString()
    note?: string;

    @IsOptional()
    @IsString()
    saleCode?: string;

    @IsOptional()
    @IsNumber()
    discount?: number;

    @IsNotEmpty()
    @IsArray()
    items: OrderItemDto[];
}
