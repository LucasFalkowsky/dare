import { Injectable } from '@nestjs/common';
import { PrismaClient } from './createPrismaClient';
import { Deck, DeckPrincipleWithDetails } from '../../../domain/model/Deck';
import { IDeckRepository } from '../../../domain/ports/outbound/IDeckRepository';

@Injectable()
export class PrismaDeckRepository implements IDeckRepository {
    constructor(private prisma: PrismaClient) {}

    async save(deck: Deck): Promise<void> {
        await this.prisma.deck.create({
            data: {
                deckId: deck.deckId,
                name: deck.name,
                description: deck.description ?? null,
            },
        });
    }

    async findById(deckId: string): Promise<Deck | null> {
        const row = await this.prisma.deck.findFirst({
            where: { deckId, deletedAt: null },
        });
        if (!row) return null;
        return {
            deckId: row.deckId,
            name: row.name,
            description: row.description ?? undefined,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            deletedAt: row.deletedAt ?? undefined,
        };
    }

    async findLatest(): Promise<Deck | null> {
        const row = await this.prisma.deck.findFirst({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
        if (!row) return null;
        return {
            deckId: row.deckId,
            name: row.name,
            description: row.description ?? undefined,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            deletedAt: row.deletedAt ?? undefined,
        };
    }

    async update(deckId: string, data: { name: string; description?: string }): Promise<void> {
        await this.prisma.deck.update({
            where: { deckId },
            data: {
                name: data.name,
                description: data.description ?? null,
            },
        });
    }

    async softDelete(deckId: string): Promise<void> {
        await this.prisma.deck.update({
            where: { deckId },
            data: { deletedAt: new Date() },
        });
    }

    async findPrinciplesByDeckId(deckId: string): Promise<DeckPrincipleWithDetails[]> {
        const rows = await this.prisma.deckPrinciple.findMany({
            where: { deckId },
            include: { principle: true },
            orderBy: { rank: 'asc' },
        });
        return rows.map(row => ({
            principleId: row.principle.principleId,
            category: row.principle.category ?? '',
            projectContext: row.projectContext ?? undefined,
            rank: row.rank ?? undefined,
        }));
    }

    async addPrinciple(deckId: string, principleId: string, projectContext?: string): Promise<void> {
        await this.prisma.deckPrinciple.upsert({
            where: { deckId_principleId: { deckId, principleId } },
            update: { projectContext: projectContext ?? null },
            create: { deckId, principleId, projectContext: projectContext ?? null },
        });
    }

    async removePrinciple(deckId: string, principleId: string): Promise<void> {
        await this.prisma.deckPrinciple.delete({
            where: { deckId_principleId: { deckId, principleId } },
        });
    }

    async updateProjectContext(deckId: string, principleId: string, projectContext: string): Promise<void> {
        await this.prisma.deckPrinciple.update({
            where: { deckId_principleId: { deckId, principleId } },
            data: { projectContext },
        });
    }

    async rankPrinciples(deckId: string, rankings: { principleId: string; rank: number }[]): Promise<void> {
        await this.prisma.$transaction(
            rankings.map(({ principleId, rank }) =>
                this.prisma.deckPrinciple.upsert({
                    where: { deckId_principleId: { deckId, principleId } },
                    update: { rank },
                    create: { deckId, principleId, rank },
                }),
            ),
        );
    }
}
