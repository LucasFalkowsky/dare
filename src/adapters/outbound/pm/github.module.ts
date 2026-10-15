import { Module } from '@nestjs/common';
import { GitHubIssueSyncAdapter } from './GitHubIssueSyncAdapter';
import { StubTeamNotificationAdapter } from './StubTeamNotificationAdapter';
import { GITHUB_API_URL, GITHUB_ACCESS_TOKEN, GITHUB_ISSUE_FIELD_NAME, GITHUB_WEBHOOK_SECRET } from './github.config';
import { PM_PROJECT_PATH } from './pm.config';
import {
  WORK_ITEM_COMMENT_PORT,
  PRINCIPLE_INHERITANCE_PORT,
  TEAM_NOTIFICATION_PORT,
} from '../../../domain/ports/injection-tokens';

@Module({
  providers: [
    {
      provide: GITHUB_API_URL,
      useValue: process.env.GITHUB_API_URL || 'https://api.github.com',
    },
    {
      provide: GITHUB_ACCESS_TOKEN,
      useFactory: () => {
        const token = process.env.GITHUB_ACCESS_TOKEN;
        if (!token) {
          throw new Error(
            'GITHUB_ACCESS_TOKEN is not set. Please configure a valid GitHub personal access token.',
          );
        }
        return token;
      },
    },
    {
      provide: GITHUB_ISSUE_FIELD_NAME,
      useValue: process.env.GITHUB_ISSUE_FIELD_NAME || 'Principles',
    },
    {
      provide: GITHUB_WEBHOOK_SECRET,
      useValue: process.env.GITHUB_WEBHOOK_SECRET || '',
    },
    {
      provide: PM_PROJECT_PATH,
      useValue: process.env.GITHUB_PROJECT_PATH || '',
    },
    GitHubIssueSyncAdapter,
    {
      provide: WORK_ITEM_COMMENT_PORT,
      useExisting: GitHubIssueSyncAdapter,
    },
    // Same instance behind both ports: the inheritance methods reuse the
    // adapter's request helpers and its resolved issue field.
    {
      provide: PRINCIPLE_INHERITANCE_PORT,
      useExisting: GitHubIssueSyncAdapter,
    },
    // No GitHub counterpart to GitLabNotificationAdapter yet: pinned reminders
    // and the persisted framework setup only log on this platform. Bound so
    // that FrameworkActivationService and WorkItemReminderService — which the
    // webhook module needs — can still be constructed.
    {
      provide: TEAM_NOTIFICATION_PORT,
      useClass: StubTeamNotificationAdapter,
    },
  ],
  exports: [
    WORK_ITEM_COMMENT_PORT,
    PRINCIPLE_INHERITANCE_PORT,
    TEAM_NOTIFICATION_PORT,
    GITHUB_WEBHOOK_SECRET,
    PM_PROJECT_PATH,
  ],
})
export class GitHubModule {}
