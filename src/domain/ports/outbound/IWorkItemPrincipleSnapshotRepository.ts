/**
 * Records the principles a work item was last known to carry, so inheritance
 * can tell a newly added principle from one that was already there.
 *
 * Without this, a parent event could only union its current principles into the
 * children — which would resurrect principles a user had removed from a child.
 */
export interface IWorkItemPrincipleSnapshotRepository {
  /** The last recorded principles, or null if this work item was never seen. */
  find(installationId: string, workItemId: string): Promise<string[] | null>;

  save(installationId: string, workItemId: string, principleNames: string[]): Promise<void>;
}
