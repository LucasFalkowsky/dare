import { Injectable } from '@nestjs/common';
import { PrismaClient } from './createPrismaClient';
import { IWorkItemPrincipleSnapshotRepository } from '../../../domain/ports/outbound/IWorkItemPrincipleSnapshotRepository';

@Injectable()
export class PrismaWorkItemPrincipleSnapshotRepository implements IWorkItemPrincipleSnapshotRepository {
  constructor(private prisma: PrismaClient) {}

  async find(installationId: string, workItemId: string): Promise<string[] | null> {
    const row = await this.prisma.workItemPrincipleSnapshot.findUnique({
      where: { installationId_workItemId: { installationId, workItemId } },
    });
    if (!row) return null;
    return row.principleNames;
  }

  async save(installationId: string, workItemId: string, principleNames: string[]): Promise<void> {
    await this.prisma.workItemPrincipleSnapshot.upsert({
      where: { installationId_workItemId: { installationId, workItemId } },
      update: { principleNames },
      create: { installationId, workItemId, principleNames },
    });
  }
}
