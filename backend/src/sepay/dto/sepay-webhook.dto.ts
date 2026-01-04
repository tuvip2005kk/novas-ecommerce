import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SePayWebhookDto {
    @IsNotEmpty()
    @IsNumber()
    id: number; // Transaction ID

    @IsNotEmpty()
    @IsString()
    gateway: string;

    @IsNotEmpty()
    @IsString()
    transactionDate: string;

    @IsNotEmpty()
    @IsString()
    accountNumber: string;

    @IsNotEmpty()
    @IsString()
    content: string; // Transfer Content (e.g. DH123456)

    @IsOptional()
    @IsString()
    transferType?: string; // 'in' or 'out'

    @IsNotEmpty()
    @IsNumber()
    transferAmount: number;

    @IsNotEmpty()
    @IsNumber()
    accumulated: number;

    @IsOptional()
    @IsString()
    subAccount?: string;

    @IsOptional()
    @IsString()
    referenceCode?: string;

    @IsOptional()
    @IsString()
    description?: string;
}
