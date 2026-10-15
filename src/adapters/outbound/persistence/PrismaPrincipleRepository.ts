import { Injectable } from '@nestjs/common';
import { PrismaClient } from './createPrismaClient';
import { Principle } from '../../../domain/model/Principle';
import { IPrincipleRepository } from '../../../domain/ports/outbound/IPrincipleRepository';

@Injectable()
export class PrismaPrincipleRepository implements IPrincipleRepository {
    constructor(private prisma: PrismaClient) { }

    async findById(principleId: string): Promise<Principle | null> {
        const row = await this.prisma.principle.findUnique({
            where: {
                principleId,
            },
        });

        if (!row) {
            return null;
        }

        return {
            principleId: row.principleId,
            category: row.category ?? undefined,
        };
    }

    async findAll(): Promise<Principle[]> {
        const rows = await this.prisma.principle.findMany({
            orderBy: {
                principleId: 'asc',
            },
        });

        return rows.map((row) => ({
            principleId: row.principleId,
            category: row.category ?? undefined,
        }));
    }
}
