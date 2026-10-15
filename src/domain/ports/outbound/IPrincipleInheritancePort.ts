import { Installation } from '../../model/Installation';

/**
 * Reading and writing a work item's principles, plus the parent/child
 * hierarchy the inheritance walks.
 *
 * Separate from IWorkItemCommentPort because not every platform can serve it:
 * GitLab exposes no work-item hierarchy over REST v4 and its webhooks carry no
 * parent, so its adapter reports `supported: false` instead of pretending.
 */
export interface IPrincipleInheritancePort {
  /** False when the platform cannot support inheritance; callers then skip it. */
  readonly supported: boolean;

  /** The principle names currently on the work item. May contain foreign labels. */
  getPrinciples(installation: Installation, workItemId: string): Promise<string[]>;

  /** Adds principles without removing any already present. */
  addPrinciples(installation: Installation, workItemId: string, principleNames: string[]): Promise<void>;

  findChildWorkItems(installation: Installation, workItemId: string): Promise<string[]>;
}
