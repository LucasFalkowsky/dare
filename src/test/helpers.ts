import { createPrismaClient, PrismaClient } from '../adapters/outbound/persistence/createPrismaClient';
import { Installation } from '../domain/model/Installation';
import { ITeamNotificationPort } from '../domain/ports/outbound/ITeamNotificationPort';
import { IWorkItemCommentPort } from '../domain/ports/outbound/IWorkItemCommentPort';
import { IDeckRepository } from '../domain/ports/outbound/IDeckRepository';
import { IPrincipleWorkItemMappingRepository } from '../domain/ports/outbound/IPrincipleWorkItemMappingRepository';
import { PrismaInstallationRepository } from '../adapters/outbound/persistence/PrismaInstallationRepository';
import { PrismaPrincipleWorkItemMappingRepository } from '../adapters/outbound/persistence/PrismaPrincipleWorkItemMappingRepository';

export function createMockNotificationPort(): jest.Mocked<ITeamNotificationPort> {
  return {
    pinReminder: jest.fn().mockResolvedValue(undefined),
    persistFrameworkSetup: jest.fn().mockResolvedValue(undefined),
    frameworkSetupExists: jest.fn().mockResolvedValue(false),
  };
}

export function createTestPrismaClient(): PrismaClient {
  return createPrismaClient(process.env.DATABASE_URL);
}

export function createTestInstallationRepo(prisma: PrismaClient): PrismaInstallationRepository {
  return new PrismaInstallationRepository(prisma);
}

export function createTestInstallation(overrides?: Partial<Installation>): Installation {
  return {
    installationId: 'inst-1',
    owner: 'test-owner',
    repo: 'test-repo',
    platform: 'github',
    ...overrides,
  };
}

export function createMockWorkItemCommentPort(): jest.Mocked<IWorkItemCommentPort> {
  return {
    platform: 'gitlab',
    ensureLabels: jest.fn().mockResolvedValue(undefined),
    getPrinciples: jest.fn().mockResolvedValue([]),
    addComment: jest.fn().mockResolvedValue('comment-42'),
    updateComment: jest.fn().mockResolvedValue(undefined),
    commentExists: jest.fn().mockResolvedValue(true),
    deleteComment: jest.fn().mockResolvedValue(undefined),
    findWorkItemsByLabel: jest.fn().mockResolvedValue([]),
  };
}

export function createMockDeckRepository(): jest.Mocked<IDeckRepository> {
  return {
    save: jest.fn(),
    findById: jest.fn(),
    findLatest: jest.fn().mockResolvedValue(null),
    update: jest.fn(),
    softDelete: jest.fn(),
    findPrinciplesByDeckId: jest.fn().mockResolvedValue([]),
    addPrinciple: jest.fn(),
    removePrinciple: jest.fn(),
    updateProjectContext: jest.fn(),
    rankPrinciples: jest.fn(),
  };
}

export function createMockPrincipleWorkItemMappingRepository(): jest.Mocked<IPrincipleWorkItemMappingRepository> {
  return {
    save: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    findByIssue: jest.fn().mockResolvedValue(null),
    findAllByPrincipleAndInstallation: jest.fn().mockResolvedValue([]),
    findAllByWorkItem: jest.fn().mockResolvedValue([]),
  };
}

export function createTestPrincipleWorkItemMappingRepository(prisma: PrismaClient): PrismaPrincipleWorkItemMappingRepository {
  return new PrismaPrincipleWorkItemMappingRepository(prisma);
}
