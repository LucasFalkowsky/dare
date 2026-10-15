import { Injectable, Inject } from '@nestjs/common';
import { Installation } from '../model/Installation';
import { IDeckRepository } from '../ports/outbound/IDeckRepository';
import { IPrincipleWorkItemMappingRepository } from '../ports/outbound/IPrincipleWorkItemMappingRepository';
import { IWorkItemCommentPort } from '../ports/outbound/IWorkItemCommentPort';
import {
  DECK_REPOSITORY,
  PRINCIPLE_WORK_ITEM_MAPPING_REPOSITORY,
  WORK_ITEM_COMMENT_PORT,
} from '../ports/injection-tokens';
import { buildPrincipleCommentBody } from '../model/principleComment';
import {
  allPrincipleLabelNames,
  principleIdForLabel,
} from '../model/principleVocabulary';

const ALL_LABEL_NAMES = allPrincipleLabelNames();

@Injectable()
export class PrincipleCommentService {
  constructor(
    @Inject(PRINCIPLE_WORK_ITEM_MAPPING_REPOSITORY) private readonly mappingRepo: IPrincipleWorkItemMappingRepository,
    @Inject(WORK_ITEM_COMMENT_PORT) private readonly workItemCommentPort: IWorkItemCommentPort,
    @Inject(DECK_REPOSITORY) private readonly deckRepo: IDeckRepository,
  ) {}

  /** In-flight work per work item, keyed by installation and work-item id. */
  private readonly pending = new Map<string, Promise<void>>();

  /**
   * Brings the work item's DARE comments in line with the principles it
   * currently carries. Which names those are is the adapter's business — the
   * platforms disagree (GitLab labels vs. GitHub issue fields), so they are
   * read through the port instead of being passed in from a webhook payload.
   */
  async addPrincipleCommentForIssue(
    installation: Installation,
    workItemId: string,
  ): Promise<void> {
    return this.serialize(`${installation.installationId}#${workItemId}`, () =>
      this.syncComments(installation, workItemId),
    );
  }

  /**
   * Events for one work item overlap: adding two principles in the UI emits two
   * platform events milliseconds apart. Run concurrently, both would read the
   * vocabulary, find no mapping yet and post the same comment twice — the
   * mapping's primary key would then be written twice with different comment
   * ids. Work per work item is therefore queued; different work items still run
   * in parallel. A failing run must not break the queue, hence the swallowed
   * rejection on the chain — the caller still sees it through the returned
   * promise. This holds within one process, which is what the single-replica
   * deployment needs; scaling out would require a shared lock instead.
   */
  private serialize(key: string, work: () => Promise<void>): Promise<void> {
    const previous = this.pending.get(key) ?? Promise.resolve();
    const next = previous.then(work, work);
    this.pending.set(key, next);

    next.catch(() => undefined).then(() => {
      if (this.pending.get(key) === next) this.pending.delete(key);
    });

    return next;
  }

  private async syncComments(
    installation: Installation,
    workItemId: string,
  ): Promise<void> {
    const principleNames = await this.workItemCommentPort.getPrinciples(installation, workItemId);

    const activePrincipleIds = new Set(
      principleNames
        .map(l => principleIdForLabel(l))
        .filter((id): id is string => id !== undefined),
    );

    // Remove stale mappings whose principle the work item no longer carries
    const existingMappings = await this.mappingRepo.findAllByWorkItem(
      installation.installationId,
      workItemId,
    );
    for (const mapping of existingMappings) {
      if (!activePrincipleIds.has(mapping.principleId)) {
        await this.workItemCommentPort.deleteComment(installation, workItemId, mapping.commentId);
        await this.mappingRepo.delete(mapping.principleId, installation.installationId, workItemId);
      }
    }

    if (activePrincipleIds.size === 0) return;

    await this.workItemCommentPort.ensureLabels(installation, ALL_LABEL_NAMES);

    const interpretations = await this.interpretations();

    // One comment per principle — that is what the mapping's composite key
    // (principleId, installationId, workItemId) describes. Sorted so that the
    // order of comments does not depend on how the platform happens to return
    // the vocabulary.
    for (const principleId of [...activePrincipleIds].sort()) {
      await this.syncCommentFor(installation, workItemId, principleId, interpretations);
    }
  }

  /**
   * The project interpretations of the current deck, keyed by principle.
   *
   * A webhook knows an issue, not a deck, so the deck the project is working on
   * is taken to be the latest one — the same deck the UI operates on. Keys are
   * normalised to the bare principle number, because a deck entry may carry
   * either form ("P007" or "P007_privacy").
   */
  private async interpretations(): Promise<Map<string, string>> {
    const contexts = new Map<string, string>();

    const deck = await this.deckRepo.findLatest();
    if (!deck) return contexts;

    for (const dp of await this.deckRepo.findPrinciplesByDeckId(deck.deckId)) {
      const context = dp.projectContext?.trim();
      if (context) contexts.set(dp.principleId.split('_')[0], context);
    }

    return contexts;
  }

  private async syncCommentFor(
    installation: Installation,
    workItemId: string,
    principleId: string,
    interpretations: Map<string, string>,
  ): Promise<void> {
    const body = buildPrincipleCommentBody(
      principleId,
      interpretations.get(principleId.split('_')[0]),
    );

    const existing = await this.mappingRepo.findByIssue(
      principleId,
      installation.installationId,
      workItemId,
    );

    if (existing) {
      await this.workItemCommentPort.updateComment(
        installation,
        existing.workItemId,
        existing.commentId,
        body,
      );
      return;
    }

    const commentId = await this.workItemCommentPort.addComment(installation, workItemId, body);
    await this.mappingRepo.save({
      principleId,
      installationId: installation.installationId,
      workItemId,
      commentId,
    });
  }
}
