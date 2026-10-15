import { createPrismaClient, PrismaClient } from './createPrismaClient';
import { PrismaWorkItemPrincipleSnapshotRepository } from './PrismaWorkItemPrincipleSnapshotRepository';

describe('PrismaWorkItemPrincipleSnapshotRepository', () => {
    let prisma: PrismaClient;
    let repo: PrismaWorkItemPrincipleSnapshotRepository;

    beforeAll(() => {
        prisma = createPrismaClient(process.env.DATABASE_URL);
        repo = new PrismaWorkItemPrincipleSnapshotRepository(prisma);
    });

    beforeEach(async () => {
        await prisma.workItemPrincipleSnapshot.deleteMany();
    });

    afterAll(async () => {
        await prisma.workItemPrincipleSnapshot.deleteMany();
        await prisma.$disconnect();
    });

    it('returns null for a work item that was never seen', async () => {
        await expect(repo.find('inst-1', '42')).resolves.toBeNull();
    });

    it('saves and retrieves a principle snapshot', async () => {
        await repo.save('inst-1', '42', ['Autonomy', 'Privacy']);
        await expect(repo.find('inst-1', '42')).resolves.toEqual(['Autonomy', 'Privacy']);
    });

    it('distinguishes a recorded empty snapshot from a missing one', async () => {
        await repo.save('inst-1', '42', []);

        // Recorded as empty — not the same as "never seen", which returns null.
        await expect(repo.find('inst-1', '42')).resolves.toEqual([]);
        await expect(repo.find('inst-1', '99')).resolves.toBeNull();
    });

    it('overwrites an existing snapshot on save', async () => {
        await repo.save('inst-1', '42', ['Autonomy']);
        await repo.save('inst-1', '42', ['Privacy', 'Justice']);

        await expect(repo.find('inst-1', '42')).resolves.toEqual(['Privacy', 'Justice']);
    });

    it('keeps snapshots of the same work item id apart per installation', async () => {
        await repo.save('inst-1', '42', ['Autonomy']);
        await repo.save('inst-2', '42', ['Privacy']);

        await expect(repo.find('inst-1', '42')).resolves.toEqual(['Autonomy']);
        await expect(repo.find('inst-2', '42')).resolves.toEqual(['Privacy']);
    });

    it('keeps snapshots of different work items in one installation apart', async () => {
        await repo.save('inst-1', '42', ['Autonomy']);
        await repo.save('inst-1', '43', ['Privacy']);

        await expect(repo.find('inst-1', '42')).resolves.toEqual(['Autonomy']);
        await expect(repo.find('inst-1', '43')).resolves.toEqual(['Privacy']);
    });
});
