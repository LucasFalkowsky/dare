import { Injectable, Inject } from '@nestjs/common';
import { Installation } from '../model/Installation';
import { filterPrincipleLabels } from '../model/principleVocabulary';
import { IPrincipleInheritancePort } from '../ports/outbound/IPrincipleInheritancePort';
import { IWorkItemPrincipleSnapshotRepository } from '../ports/outbound/IWorkItemPrincipleSnapshotRepository';
import {
  PRINCIPLE_INHERITANCE_PORT,
  WORK_ITEM_PRINCIPLE_SNAPSHOT_REPOSITORY,
} from '../ports/injection-tokens';

/**
 * Propagates DARE principles from a work item down to its descendants.
 *
 * Inheritance is strictly additive and happens on two occasions only:
 *  - a parent/child relationship is established: the child inherits everything
 *    the parent carries;
 *  - a principle is added to a work item: that principle alone travels down.
 *
 * Removing a principle from a parent propagates nothing, and a principle a user
 * removed from a child is never restored. That last guarantee is what the
 * snapshot repository is for: comparing the parent's current principles against
 * the last recorded set isolates what is genuinely new, so a later unrelated
 * change cannot resurrect a principle somebody deliberately took off a child.
 */
@Injectable()
export class PrincipleInheritanceService {
  constructor(
    @Inject(PRINCIPLE_INHERITANCE_PORT) private readonly inheritancePort: IPrincipleInheritancePort,
    @Inject(WORK_ITEM_PRINCIPLE_SNAPSHOT_REPOSITORY) private readonly snapshotRepo: IWorkItemPrincipleSnapshotRepository,
  ) {}

  private async principlesOf(installation: Installation, workItemId: string): Promise<string[]> {
    return filterPrincipleLabels(await this.inheritancePort.getPrinciples(installation, workItemId));
  }

  private async recordSnapshot(
    installation: Installation,
    workItemId: string,
    principleNames: string[],
  ): Promise<void> {
    await this.snapshotRepo.save(installation.installationId, workItemId, principleNames);
  }

  /**
   * A child was attached to a parent: the child — and everything below it —
   * takes over the parent's principles.
   */
  async inheritOnAttach(
    installation: Installation,
    parentWorkItemId: string,
    childWorkItemId: string,
  ): Promise<void> {
    if (!this.inheritancePort.supported) {
      console.log(
        `[PrincipleInheritanceService] platform "${installation.platform}" does not support principle inheritance, skipping attach of #${childWorkItemId}`,
      );
      return;
    }

    const parentPrinciples = await this.principlesOf(installation, parentWorkItemId);

    // Record the parent too, so its next change diffs against a known state
    // instead of counting everything as new.
    await this.recordSnapshot(installation, parentWorkItemId, parentPrinciples);

    if (parentPrinciples.length === 0) return;

    await this.applyToSubtree(installation, childWorkItemId, parentPrinciples, new Set());
  }

  /**
   * A work item's principles changed: whatever is new compared to the last
   * recorded state is pushed down the subtree.
   */
  async propagateAddedPrinciples(installation: Installation, workItemId: string): Promise<void> {
    if (!this.inheritancePort.supported) {
      console.log(
        `[PrincipleInheritanceService] platform "${installation.platform}" does not support principle inheritance, skipping change on #${workItemId}`,
      );
      return;
    }

    const current = await this.principlesOf(installation, workItemId);
    const previous = await this.snapshotRepo.find(installation.installationId, workItemId);

    // Never seen before: there is no evidence anything was ever propagated, so
    // everything it carries counts as new.
    const added = current.filter(name => !(previous ?? []).includes(name));

    // Always record, even when nothing was added. Otherwise a principle that is
    // removed and later added again would not register as new the second time.
    await this.recordSnapshot(installation, workItemId, current);

    if (added.length === 0) return;

    const children = await this.inheritancePort.findChildWorkItems(installation, workItemId);
    const visited = new Set<string>([workItemId]);
    for (const child of children) {
      await this.applyToSubtree(installation, child, added, visited);
    }
  }

  /**
   * Adds `principleNames` to this work item and every descendant, skipping what
   * is already there. `visited` guards against cycles in the hierarchy.
   */
  private async applyToSubtree(
    installation: Installation,
    workItemId: string,
    principleNames: string[],
    visited: Set<string>,
  ): Promise<void> {
    if (visited.has(workItemId)) return;
    visited.add(workItemId);

    const existing = await this.principlesOf(installation, workItemId);
    const missing = principleNames.filter(name => !existing.includes(name));

    if (missing.length > 0) {
      await this.inheritancePort.addPrinciples(installation, workItemId, missing);
      await this.recordSnapshot(installation, workItemId, [...existing, ...missing]);
    }

    // Descend even when nothing was missing here — a deeper descendant may
    // still be lacking the principle.
    const children = await this.inheritancePort.findChildWorkItems(installation, workItemId);
    for (const child of children) {
      await this.applyToSubtree(installation, child, principleNames, visited);
    }
  }
}
