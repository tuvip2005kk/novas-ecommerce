import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ExpensesService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        return this.prisma.expense.findMany({
            orderBy: { date: 'desc' }
        });
    }

    async create(data: any) {
        return this.prisma.expense.create({ data });
    }

    async createBulk(data: any[]) {
        return this.prisma.expense.createMany({ data });
    }

    async update(id: number, data: any) {
        return this.prisma.expense.update({
            where: { id },
            data
        });
    }

    async delete(id: number) {
        return this.prisma.expense.delete({
            where: { id }
        });
    }
}
