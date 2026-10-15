import { createPrismaClient, PrismaClient } from './createPrismaClient';
import { PrismaInstallationRepository } from './PrismaInstallationRepository';
import { Installation } from '../../../domain/model/Installation';

describe('PrismaInstallationRepository', () => {
    let prisma: PrismaClient;
    let repo: PrismaInstallationRepository;

    beforeAll(() => {
        prisma = createPrismaClient(process.env.DATABASE_URL);
        repo = new PrismaInstallationRepository(prisma);
    });

    beforeEach(async () => {
        await prisma.installation.deleteMany();
    });

    afterAll(async () => {
        await prisma.installation.deleteMany();
        await prisma.$disconnect();
    });

    it('should save and retrieve an installation', async () => {
        const installation: Installation = {
            installationId: 'test-123',
            owner: 'test-owner',
            repo: 'test-repo',
            platform: 'github',
        };
        await repo.save(installation);
        const retrieved = await repo.findById('test-123');
        expect(retrieved).toEqual(installation);
    });

    it('should return null for non-existent installation', async () => {
        const retrieved = await repo.findById('non-existent');
        expect(retrieved).toBeNull();
    });

    it('should update existing installation (upsert)', async () => {
        const original: Installation = {
            installationId: 'update-123',
            owner: 'old-owner',
            repo: 'old-repo',
            platform: 'github',
        };
        await repo.save(original);
        let retrieved = await repo.findById('update-123');
        expect(retrieved?.owner).toBe('old-owner');

        const updated: Installation = {
            installationId: 'update-123',
            owner: 'new-owner',
            repo: 'new-repo',
            platform: 'jira',
        };
        await repo.save(updated);
        retrieved = await repo.findById('update-123');
        expect(retrieved?.owner).toBe('new-owner');
        expect(retrieved?.platform).toBe('jira');
    });
});
