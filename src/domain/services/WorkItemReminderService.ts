import { Injectable, Inject } from '@nestjs/common';
import { Installation } from '../model/Installation';
import { ITeamNotificationPort } from '../ports/outbound/ITeamNotificationPort';
import { TEAM_NOTIFICATION_PORT } from '../ports/injection-tokens';

@Injectable()
export class WorkItemReminderService {
  constructor(@Inject(TEAM_NOTIFICATION_PORT) private notificationPort: ITeamNotificationPort) {}

  async remindOnWorkItemOpened(installation: Installation, workItemId: string): Promise<void> {
    console.log(`[WorkItemReminderService] reminding on work item ${workItemId}`);

    await this.notificationPort.pinReminder(
      installation,
      workItemId,
      'Example reminder pinned by DARE.'
    );
  }
}
