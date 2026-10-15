import { Injectable } from '@nestjs/common';
import { PrismaClient } from './createPrismaClient';
import { Installation } from '../../../domain/model/Installation';
import { IInstallationRepository } from '../../../domain/ports/outbound/IInstallationRepository';

@Injectable()
export class PrismaInstallationRepository implements IInstallationRepository {
    constructor(private prisma: PrismaClient) {}

    async save(installation: Installation): Promise<void> {
        await this.prisma.installation.upsert({
            where: { installationId: installation.installationId },
            update: {
                owner: installation.owner,
                repo: installation.repo,
                platform: installation.platform,
            },
            create: {
                installationId: installation.installationId,
                owner: installation.owner,
                repo: installation.repo,
                platform: installation.platform,
            },
        });
    }

    async findById(installationId: string): Promise<Installation | null> {
        const row = await this.prisma.installation.findUnique({
            where: { installationId },
        });
        if (!row) return null;
        return {
            installationId: row.installationId,
            owner: row.owner,
            repo: row.repo,
            platform: row.platform as Installation['platform'],
        };
    }

    async findAll(): Promise<Installation[]> {
        const rows = await this.prisma.installation.findMany();
        return rows.map(r => ({
            installationId: r.installationId,
            owner: r.owner,
            repo: r.repo,
            platform: r.platform as Installation['platform'],
        }));
    }
}
