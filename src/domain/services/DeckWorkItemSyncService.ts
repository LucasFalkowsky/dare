import { Injectable, Inject } from '@nestjs/common';
import { IDeckWorkItemSyncPort } from '../ports/inbound/IDeckWorkItemSyncPort';
import { IDeckRepository } from '../ports/outbound/IDeckRepository';
import { IInstallationRepository } from '../ports/outbound/IInstallationRepository';
import { IPrincipleWorkItemMappingRepository } from '../ports/outbound/IPrincipleWorkItemMappingRepository';
import { IWorkItemCommentPort } from '../ports/outbound/IWorkItemCommentPort';
import {
  DECK_REPOSITORY,
  INSTALLATION_REPOSITORY,
  PRINCIPLE_WORK_ITEM_MAPPING_REPOSITORY,
  WORK_ITEM_COMMENT_PORT,
} from '../ports/injection-tokens';
import { PM_PROJECT_PATH } from '../../adapters/outbound/pm/pm.config';
import { resolvePrincipleContent, LocaleCode } from '../../locales';
import { buildPrincipleCommentBody } from '../model/principleComment';
import { principleLabelNames } from '../model/principleVocabulary';
import { Installation } from '../model/Installation';

@Injectable()
export class DeckWorkItemSyncService implements IDeckWorkItemSyncPort {
  constructor(
    @Inject(DECK_REPOSITORY) private readonly deckRepo: IDeckRepository,
    @Inject(INSTALLATION_REPOSITORY) private readonly installationRepo: IInstallationRepository,
    @Inject(PRINCIPLE_WORK_ITEM_MAPPING_REPOSITORY) private readonly mappingRepo: IPrincipleWorkItemMappingRepository,
    @Inject(WORK_ITEM_COMMENT_PORT) private readonly workItemCommentPort: IWorkItemCommentPort,
    @Inject(PM_PROJECT_PATH) private readonly projectPath: string,
  ) {}

  /**
   * Without a webhook installation in the database, the project configured in
   * the environment is used. The two platforms address a project differently:
   * GitLab takes a single encoded path (`owner/repo` or a numeric id), while
   * GitHub needs owner and repo as separate segments — an empty owner makes the
   * GitHub adapter reject the installation, as its issue fields live on the
   * organization.
   *
   * The installationId is the project path, not a marker like "env": it is the
   * key every comment mapping and principle snapshot is stored under, and the
   * webhook adapters derive it from the payload the same way
   * (`repository.full_name` / `project.path_with_namespace`). A separate
   * identity here would make the deck side look up rows the webhook side never
   * wrote — comments would be duplicated instead of updated.
   */
  private resolveInstallation(dbInstallations: Installation[]): Installation | null {
    const platform = this.workItemCommentPort.platform;

    const fromDb = dbInstallations.find(i => i.platform === platform);
    if (fromDb) return fromDb;

    if (!this.projectPath) return null;

    if (platform === 'github') {
      const [owner, repo, ...rest] = this.projectPath.split('/');
      if (!owner || !repo || rest.length > 0) {
        console.error(
          `[DeckWorkItemSyncService] GITHUB_PROJECT_PATH must be "owner/repo", got "${this.projectPath}" — skipping sync`,
        );
        return null;
      }
      return { installationId: this.projectPath, owner, repo, platform: 'github' };
    }

    if (platform === 'gitlab') {
      return { installationId: this.projectPath, owner: '', repo: this.projectPath, platform: 'gitlab' };
    }

    return null;
  }

  async syncPrincipleContextToWorkItems(
    deckId: string,
    principleId: string,
    locale?: string,
  ): Promise<void> {
    const installation = this.resolveInstallation(await this.installationRepo.findAll());
    if (!installation) {
      console.log(
        `[DeckWorkItemSyncService] no installation found for platform "${this.workItemCommentPort.platform}", skipping context sync of ${principleId}`,
      );
      return;
    }

    console.log(
      `[DeckWorkItemSyncService] context sync for ${principleId} on installation "${installation.installationId}"`,
    );

    const principles = await this.deckRepo.findPrinciplesByDeckId(deckId);
    const deckPrinciple = principles.find(dp => dp.principleId === principleId);
    if (!deckPrinciple) {
      console.log(
        `[DeckWorkItemSyncService] principle ${principleId} is not in deck "${deckId}", skipping context sync`,
      );
      return;
    }

    const body = buildPrincipleCommentBody(
      principleId,
      deckPrinciple.projectContext,
      (locale ?? 'en') as LocaleCode,
    );

    // Every work item that already carries a comment for this principle, across
    // the whole installation — the interpretation is project-wide, not per issue.
    const mappings = await this.mappingRepo.findAllByPrincipleAndInstallation(
      principleId,
      installation.installationId,
    );
    console.log(
      `[DeckWorkItemSyncService] updating ${mappings.length} comment(s) for ${principleId} after its interpretation changed`,
    );

    for (const mapping of mappings) {
      if (!(await this.workItemCommentPort.commentExists(installation, mapping.workItemId, mapping.commentId))) {
        // Somebody deleted the comment in the platform; drop the dangling row
        // instead of failing the whole run on it.
        await this.mappingRepo.delete(principleId, installation.installationId, mapping.workItemId);
        continue;
      }

      await this.workItemCommentPort.updateComment(
        installation,
        mapping.workItemId,
        mapping.commentId,
        body,
      );
    }
  }

  async syncDeckToWorkItems(deckId: string, locale?: string): Promise<void> {
    console.log(`[DeckWorkItemSyncService] syncDeckToWorkItems called for deck="${deckId}", locale="${locale}"`);

    const installations = await this.installationRepo.findAll();
    const installation = this.resolveInstallation(installations);
    if (!installation) {
      console.log(`[DeckWorkItemSyncService] no installation found for platform "${this.workItemCommentPort.platform}", skipping sync`);
      return;
    }
    console.log(`[DeckWorkItemSyncService] resolved installation: id="${installation.installationId}", repo="${installation.repo}", platform="${installation.platform}"`);

    const labelLocale = (locale ?? 'en') as LocaleCode;
    const labelNames = principleLabelNames(labelLocale);
    console.log(`[DeckWorkItemSyncService] ensuring ${labelNames.length} labels for locale "${labelLocale}":`, labelNames);
    await this.workItemCommentPort.ensureLabels(installation, labelNames);

    const principles = await this.deckRepo.findPrinciplesByDeckId(deckId);

    for (const dp of principles) {
      const body = buildPrincipleCommentBody(dp.principleId, dp.projectContext, labelLocale);
      const labelName = resolvePrincipleContent(dp.principleId, labelLocale).name;

      // Find issues with matching label and create/update comments
      const issueIds = labelName
        ? await this.workItemCommentPort.findWorkItemsByLabel(installation, labelName)
        : [];

      for (const workItemId of issueIds) {
        const existing = await this.mappingRepo.findByIssue(
          dp.principleId,
          installation.installationId,
          workItemId,
        );

        if (existing) {
          const exists = await this.workItemCommentPort.commentExists(
            installation,
            workItemId,
            existing.commentId,
          );
          if (exists) {
            await this.workItemCommentPort.updateComment(
              installation,
              workItemId,
              existing.commentId,
              body,
            );
          } else {
            await this.mappingRepo.delete(dp.principleId, installation.installationId, workItemId);
            const commentId = await this.workItemCommentPort.addComment(installation, workItemId, body);
            await this.mappingRepo.save({
              principleId: dp.principleId,
              installationId: installation.installationId,
              workItemId,
              commentId,
            });
          }
        } else {
          const commentId = await this.workItemCommentPort.addComment(
            installation,
            workItemId,
            body,
          );
          await this.mappingRepo.save({
            principleId: dp.principleId,
            installationId: installation.installationId,
            workItemId,
            commentId,
          });
        }
      }

      // Clean up stale mappings for issues that no longer have the label
      const existingMappings = await this.mappingRepo.findAllByPrincipleAndInstallation(
        dp.principleId,
        installation.installationId,
      );
      const discoveredIds = new Set(issueIds);
      for (const mapping of existingMappings) {
        if (!discoveredIds.has(mapping.workItemId)) {
          const exists = await this.workItemCommentPort.commentExists(
            installation,
            mapping.workItemId,
            mapping.commentId,
          );
          if (exists) {
            await this.workItemCommentPort.updateComment(
              installation,
              mapping.workItemId,
              mapping.commentId,
              body,
            );
          } else {
            await this.mappingRepo.delete(dp.principleId, installation.installationId, mapping.workItemId);
          }
        }
      }
    }
    console.log(`[DeckWorkItemSyncService] sync complete for deck="${deckId}"`);
  }
}
