import { PrismaDeckRepository } from './PrismaDeckRepository';
import { Deck } from '../../../domain/model/Deck';

function createMockPrismaClient() {
    return {
        deck: {
            create: jest.fn().mockResolvedValue({}),
            findFirst: jest.fn().mockResolvedValue(null),
            update: jest.fn().mockResolvedValue({}),
        },
        deckPrinciple: {
            findMany: jest.fn().mockResolvedValue([]),
            upsert: jest.fn().mockResolvedValue({}),
            delete: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
        },
    } as any;
}

describe('Feature: Save deck', () => {
    let repository: PrismaDeckRepository;
    let prisma: ReturnType<typeof createMockPrismaClient>;

    beforeEach(() => {
        prisma = createMockPrismaClient();
        repository = new PrismaDeckRepository(prisma);
    });

    it('Given a valid deck, When save is called, Then prisma.deck.create is called with the correct data', async () => {
        const deck: Deck = {
            deckId: 'deck-1',
            name: 'Test Deck',
            description: 'A test deck',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await repository.save(deck);

        expect(prisma.deck.create).toHaveBeenCalledWith({
            data: {
                deckId: 'deck-1',
                name: 'Test Deck',
                description: 'A test deck',
            },
        });
    });
});

describe('Feature: Find deck by ID', () => {
    let repository: PrismaDeckRepository;
    let prisma: ReturnType<typeof createMockPrismaClient>;

    beforeEach(() => {
        prisma = createMockPrismaClient();
        repository = new PrismaDeckRepository(prisma);
    });

    it('Given a non-deleted deck exists, When findById is called, Then the deck is returned', async () => {
        const now = new Date();
        prisma.deck.findFirst.mockResolvedValue({
            deckId: 'deck-1',
            name: 'Test',
            description: null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        const result = await repository.findById('deck-1');

        expect(prisma.deck.findFirst).toHaveBeenCalledWith({
            where: { deckId: 'deck-1', deletedAt: null },
        });
        expect(result).toEqual({
            deckId: 'deck-1',
            name: 'Test',
            description: undefined,
            createdAt: now,
            updatedAt: now,
            deletedAt: undefined,
        });
    });

    it('Given a soft-deleted deck, When findById is called, Then null is returned', async () => {
        prisma.deck.findFirst.mockResolvedValue(null);

        const result = await repository.findById('deleted-deck');

        expect(result).toBeNull();
    });
});

describe('Feature: Soft-delete deck', () => {
    let repository: PrismaDeckRepository;
    let prisma: ReturnType<typeof createMockPrismaClient>;

    beforeEach(() => {
        prisma = createMockPrismaClient();
        repository = new PrismaDeckRepository(prisma);
    });

    it('Given a deck exists, When softDelete is called, Then deletedAt is set to the current date', async () => {
        const beforeCall = new Date();

        await repository.softDelete('deck-1');

        const afterCall = new Date();
        expect(prisma.deck.update).toHaveBeenCalledTimes(1);
        const callArgs = prisma.deck.update.mock.calls[0][0];
        expect(callArgs.where).toEqual({ deckId: 'deck-1' });
        expect(callArgs.data.deletedAt).toBeInstanceOf(Date);
        expect(callArgs.data.deletedAt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
        expect(callArgs.data.deletedAt.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });
});

describe('Feature: Load deck principles', () => {
    let repository: PrismaDeckRepository;
    let prisma: ReturnType<typeof createMockPrismaClient>;

    beforeEach(() => {
        prisma = createMockPrismaClient();
        repository = new PrismaDeckRepository(prisma);
    });

    it('Given a deck with principles, When findPrinciplesByDeckId is called, Then principles are returned with correct fields', async () => {
        prisma.deckPrinciple.findMany.mockResolvedValue([
            {
                deckId: 'deck-1',
                principleId: 'P001',
                projectContext: 'Context A',
                rank: 1,
                principle: { principleId: 'P001', category: 'Cat' },
            },
            {
                deckId: 'deck-1',
                principleId: 'P002',
                projectContext: null,
                rank: null,
                principle: { principleId: 'P002', category: 'Other' },
            },
        ]);

        const result = await repository.findPrinciplesByDeckId('deck-1');

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            principleId: 'P001',
            category: 'Cat',
            projectContext: 'Context A',
            rank: 1,
        });
        expect(result[1]).toEqual({
            principleId: 'P002',
            category: 'Other',
            projectContext: undefined,
            rank: undefined,
        });
    });

    it('Given a deck without principles, When findPrinciplesByDeckId is called, Then an empty list is returned', async () => {
        prisma.deckPrinciple.findMany.mockResolvedValue([]);

        const result = await repository.findPrinciplesByDeckId('deck-1');

        expect(result).toEqual([]);
    });
});

describe('Feature: Add principle to deck', () => {
    let repository: PrismaDeckRepository;
    let prisma: ReturnType<typeof createMockPrismaClient>;

    beforeEach(() => {
        prisma = createMockPrismaClient();
        repository = new PrismaDeckRepository(prisma);
    });

    it('Given valid deckId and principleId, When addPrinciple is called, Then prisma.deckPrinciple.upsert is called with the correct data', async () => {
        await repository.addPrinciple('deck-1', 'P001', 'Project context');

        expect(prisma.deckPrinciple.upsert).toHaveBeenCalledWith({
            where: { deckId_principleId: { deckId: 'deck-1', principleId: 'P001' } },
            update: { projectContext: 'Project context' },
            create: { deckId: 'deck-1', principleId: 'P001', projectContext: 'Project context' },
        });
    });

    it('Given a principle already exists in the deck, When addPrinciple is called again, Then the projectContext is updated via upsert', async () => {
        await repository.addPrinciple('deck-1', 'P001', 'Updated context');

        expect(prisma.deckPrinciple.upsert).toHaveBeenCalledTimes(1);
    });
});

describe('Feature: Remove principle from deck', () => {
    let repository: PrismaDeckRepository;
    let prisma: ReturnType<typeof createMockPrismaClient>;

    beforeEach(() => {
        prisma = createMockPrismaClient();
        repository = new PrismaDeckRepository(prisma);
    });

    it('Given a principle exists in the deck, When removePrinciple is called, Then prisma.deckPrinciple.delete is called', async () => {
        await repository.removePrinciple('deck-1', 'P001');

        expect(prisma.deckPrinciple.delete).toHaveBeenCalledWith({
            where: { deckId_principleId: { deckId: 'deck-1', principleId: 'P001' } },
        });
    });
});

describe('Feature: Update project context', () => {
    let repository: PrismaDeckRepository;
    let prisma: ReturnType<typeof createMockPrismaClient>;

    beforeEach(() => {
        prisma = createMockPrismaClient();
        repository = new PrismaDeckRepository(prisma);
    });

    it('Given a principle exists in the deck, When updateProjectContext is called, Then prisma.deckPrinciple.update is called with the new context', async () => {
        await repository.updateProjectContext('deck-1', 'P001', 'New context');

        expect(prisma.deckPrinciple.update).toHaveBeenCalledWith({
            where: { deckId_principleId: { deckId: 'deck-1', principleId: 'P001' } },
            data: { projectContext: 'New context' },
        });
    });
});
