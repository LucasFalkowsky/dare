import { Installation } from '../../model/Installation';

export interface IWorkflowEventPort {
  onFrameworkActivated(installation: Installation): Promise<void>;
  onWorkItemOpened(installation: Installation, workItemId: string): Promise<void>;

  /** A parent/child relationship was established between two work items. */
  onSubWorkItemAttached(
    installation: Installation,
    parentWorkItemId: string,
    childWorkItemId: string,
  ): Promise<void>;

  /**
   * A work item's principles changed — labels on GitLab, issue field values on
   * GitHub. Each webhook adapter maps its own platform event onto this one. No
   * delta and no names are passed: the platform events do not reliably name
   * what changed, so both the delta and the current set are read back through
   * the adapter.
   */
  onWorkItemPrinciplesChanged(installation: Installation, workItemId: string): Promise<void>;
}
