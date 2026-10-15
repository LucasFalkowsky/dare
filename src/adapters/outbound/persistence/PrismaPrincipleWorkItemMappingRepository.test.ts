import { createPrismaClient, PrismaClient } from './createPrismaClient';
import { PrismaPrincipleWorkItemMappingRepository } from './PrismaPrincipleWorkItemMappingRepository';
import { PrincipleWorkItemMapping } from '../../../domain/model/PrincipleWorkItemMapping';

describe('PrismaPrincipleWorkItemMappingRepository', () => {
  let prisma: PrismaClient;
  let repo: PrismaPrincipleWorkItemMappingRepository;

  beforeAll(() => {
    prisma = createPrismaClient(process.env.DATABASE_URL);
    repo = new PrismaPrincipleWorkItemMappingRepository(prisma);
  });

  beforeEach(async () => {
    await prisma.principleWorkItemMapping.deleteMany();
  });

  afterAll(async () => {
    await prisma.principleWorkItemMapping.deleteMany();
    await prisma.$disconnect();
  });

  // ─── Feature: save and retrieve via findByIssue ───────────────────────────

  it('Given a new PrincipleWorkItemMapping entry, When save is called, Then findByIssue returns that exact entry', async () => {
    const entry: PrincipleWorkItemMapping = {
      principleId: 'P001',
      installationId: 'inst-1',
      workItemId: 'issue-42',
      commentId: 'note-99',
    };

    await repo.save(entry);
    const result = await repo.findByIssue('P001', 'inst-1', 'issue-42');

    expect(result).toEqual(entry);
  });

  it('Given no entry has been saved, When findByIssue is called, Then null is returned', async () => {
    const result = await repo.findByIssue('P999', 'inst-unknown', 'issue-0');

    expect(result).toBeNull();
  });

  it('Given a query for a principleId that exists but with a different workItemId, When findByIssue is called, Then null is returned', async () => {
    await repo.save({
      principleId: 'P001',
      installationId: 'inst-A',
      workItemId: 'issue-1',
      commentId: 'note-1',
    });

    const result = await repo.findByIssue('P001', 'inst-A', 'issue-999');

    expect(result).toBeNull();
  });

  // ─── Feature: upsert behavior ────────────────────────────────────────────

  it('Given an entry already exists with (P002, inst-1, issue-10), When save is called again with a new commentId, Then the entry is updated (upsert)', async () => {
    const original: PrincipleWorkItemMapping = {
      principleId: 'P002',
      installationId: 'inst-1',
      workItemId: 'issue-10',
      commentId: 'note-old',
    };
    await repo.save(original);

    await repo.save({ ...original, commentId: 'note-new' });

    const result = await repo.findByIssue('P002', 'inst-1', 'issue-10');
    expect(result?.commentId).toBe('note-new');
  });

  // ─── Feature: findAllByPrincipleAndInstallation ───────────────────────────

  it('Given two mappings for the same principle and installation but different work items, When findAllByPrincipleAndInstallation is called, Then both mappings are returned', async () => {
    await repo.save({ principleId: 'P001', installationId: 'inst-1', workItemId: 'issue-1', commentId: 'n-1' });
    await repo.save({ principleId: 'P001', installationId: 'inst-1', workItemId: 'issue-2', commentId: 'n-2' });

    const results = await repo.findAllByPrincipleAndInstallation('P001', 'inst-1');

    expect(results).toHaveLength(2);
    expect(results.map(r => r.workItemId).sort()).toEqual(['issue-1', 'issue-2']);
  });

  it('Given mappings for different principles under the same installation, When findAllByPrincipleAndInstallation is called for one, Then only that principle mappings are returned', async () => {
    await repo.save({ principleId: 'P001', installationId: 'inst-1', workItemId: 'issue-1', commentId: 'n-1' });
    await repo.save({ principleId: 'P002', installationId: 'inst-1', workItemId: 'issue-2', commentId: 'n-2' });

    const results = await repo.findAllByPrincipleAndInstallation('P001', 'inst-1');

    expect(results).toHaveLength(1);
    expect(results[0].principleId).toBe('P001');
  });

  it('Given no mappings exist for a given principle, When findAllByPrincipleAndInstallation is called, Then an empty array is returned', async () => {
    const results = await repo.findAllByPrincipleAndInstallation('P999', 'inst-1');

    expect(results).toEqual([]);
  });

  // ─── Feature: composite key isolation ────────────────────────────────────

  it('Given the same principleId and installationId but different workItemIds, When queried individually via findByIssue, Then each returns its own independent entry', async () => {
    await repo.save({ principleId: 'P004', installationId: 'inst-A', workItemId: 'i1', commentId: 'n-A' });
    await repo.save({ principleId: 'P004', installationId: 'inst-A', workItemId: 'i2', commentId: 'n-B' });

    const resultA = await repo.findByIssue('P004', 'inst-A', 'i1');
    const resultB = await repo.findByIssue('P004', 'inst-A', 'i2');

    expect(resultA?.commentId).toBe('n-A');
    expect(resultB?.commentId).toBe('n-B');
  });

  it('Given an upsert overwrites one entry, When the sibling entry is queried, Then the sibling entry remains unchanged', async () => {
    await repo.save({ principleId: 'P007', installationId: 'inst-1', workItemId: 'i-7', commentId: 'n-7' });
    await repo.save({ principleId: 'P007', installationId: 'inst-1', workItemId: 'i-8', commentId: 'n-8' });

    // Upsert P007/i-7 with new commentId
    await repo.save({ principleId: 'P007', installationId: 'inst-1', workItemId: 'i-7', commentId: 'n-7-updated' });

    // i-8 must be untouched
    const result8 = await repo.findByIssue('P007', 'inst-1', 'i-8');
    expect(result8?.commentId).toBe('n-8');
  });
});
