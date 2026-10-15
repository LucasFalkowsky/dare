import { Injectable } from '@nestjs/common';
import { PrismaClient } from './createPrismaClient';
import { PrincipleWorkItemMapping } from '../../../domain/model/PrincipleWorkItemMapping';
import { IPrincipleWorkItemMappingRepository } from '../../../domain/ports/outbound/IPrincipleWorkItemMappingRepository';

@Injectable()
export class PrismaPrincipleWorkItemMappingRepository implements IPrincipleWorkItemMappingRepository {
  constructor(private prisma: PrismaClient) {}

  async save(entry: PrincipleWorkItemMapping): Promise<void> {
    await this.prisma.principleWorkItemMapping.upsert({
      where: {
        principleId_installationId_workItemId: {
          principleId: entry.principleId,
          installationId: entry.installationId,
          workItemId: entry.workItemId,
        },
      },
      update: {
        commentId: entry.commentId,
      },
      create: {
        principleId: entry.principleId,
        installationId: entry.installationId,
        workItemId: entry.workItemId,
        commentId: entry.commentId,
      },
    });
  }

  async delete(
    principleId: string,
    installationId: string,
    workItemId: string,
  ): Promise<void> {
    await this.prisma.principleWorkItemMapping.delete({
      where: {
        principleId_installationId_workItemId: { principleId, installationId, workItemId },
      },
    });
  }

  async findByIssue(
    principleId: string,
    installationId: string,
    workItemId: string,
  ): Promise<PrincipleWorkItemMapping | null> {
    const row = await this.prisma.principleWorkItemMapping.findUnique({
      where: {
        principleId_installationId_workItemId: { principleId, installationId, workItemId },
      },
    });
    if (!row) return null;
    return {
      principleId: row.principleId,
      installationId: row.installationId,
      workItemId: row.workItemId,
      commentId: row.commentId,
    };
  }

  async findAllByWorkItem(
    installationId: string,
    workItemId: string,
  ): Promise<PrincipleWorkItemMapping[]> {
    const rows = await this.prisma.principleWorkItemMapping.findMany({
      where: { installationId, workItemId },
    });
    return rows.map(row => ({
      principleId: row.principleId,
      installationId: row.installationId,
      workItemId: row.workItemId,
      commentId: row.commentId,
    }));
  }

  async findAllByPrincipleAndInstallation(
    principleId: string,
    installationId: string,
  ): Promise<PrincipleWorkItemMapping[]> {
    const rows = await this.prisma.principleWorkItemMapping.findMany({
      where: { principleId, installationId },
    });
    return rows.map(row => ({
      principleId: row.principleId,
      installationId: row.installationId,
      workItemId: row.workItemId,
      commentId: row.commentId,
    }));
  }
}
