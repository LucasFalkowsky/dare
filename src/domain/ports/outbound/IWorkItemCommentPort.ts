import { Installation } from '../../model/Installation';

export interface IWorkItemCommentPort {
  readonly platform: string;
  ensureLabels(installation: Installation, labelNames: string[]): Promise<void>;

  /**
   * The principle names the work item currently carries, read from whatever the
   * platform uses as its vocabulary: GitLab exposes them as issue labels,
   * GitHub as the values of an organization-wide issue field. Callers must not
   * take them from a webhook payload — only the adapter knows where they live.
   * May contain foreign names; the caller filters.
   */
  getPrinciples(installation: Installation, workItemId: string): Promise<string[]>;
  addComment(installation: Installation, workItemId: string, body: string): Promise<string>;
  updateComment(installation: Installation, workItemId: string, commentId: string, body: string): Promise<void>;
  commentExists(installation: Installation, workItemId: string, commentId: string): Promise<boolean>;
  deleteComment(installation: Installation, workItemId: string, commentId: string): Promise<void>;
  findWorkItemsByLabel(installation: Installation, label: string): Promise<string[]>;
}
