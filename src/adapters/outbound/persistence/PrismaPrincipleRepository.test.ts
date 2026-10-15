import { PrismaPrincipleRepository } from './PrismaPrincipleRepository';

function createMockPrismaClient() {
    return {
        principle: {
            findUnique: jest.fn().mockResolvedValue(null),
            findMany: jest.fn().mockResolvedValue([]),
        },
    } as any;
}

describe('Feature: Load all principles', () => {
    let repository: PrismaPrincipleRepository;
    let prisma: ReturnType<typeof createMockPrismaClient>;

    beforeEach(() => {
        prisma = createMockPrismaClient();
        repository = new PrismaPrincipleRepository(prisma);
    });

    it('Given principles exist, When findAll is called, Then all principles are returned', async () => {
        const rows = [
            { principleId: 'p-1', category: 'Cat' },
            { principleId: 'p-2', category: 'Other' },
        ];
        prisma.principle.findMany.mockResolvedValue(rows);

        const result = await repository.findAll();

        expect(prisma.principle.findMany).toHaveBeenCalledWith({ orderBy: { principleId: 'asc' } });
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            principleId: 'p-1',
            category: 'Cat',
        });
    });
});

describe('Feature: Load principle by ID', () => {
    let repository: PrismaPrincipleRepository;
    let prisma: ReturnType<typeof createMockPrismaClient>;

    beforeEach(() => {
        prisma = createMockPrismaClient();
        repository = new PrismaPrincipleRepository(prisma);
    });

    it('Given a principle exists, When findById is called, Then the principle is returned', async () => {
        const row = { principleId: 'p-1', category: 'Cat' };
        prisma.principle.findUnique.mockResolvedValue(row);

        const result = await repository.findById('p-1');

        expect(prisma.principle.findUnique).toHaveBeenCalledWith({
            where: { principleId: 'p-1' },
        });
        expect(result).toEqual({
            principleId: 'p-1',
            category: 'Cat',
        });
    });

    it('Given no principle exists, When findById is called, Then null is returned', async () => {
        prisma.principle.findUnique.mockResolvedValue(null);

        const result = await repository.findById('p-missing');

        expect(result).toBeNull();
    });
});
