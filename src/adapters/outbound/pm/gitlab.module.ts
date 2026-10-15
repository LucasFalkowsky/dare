import { Module } from '@nestjs/common';
import { GitLabNotificationAdapter } from './GitLabNotificationAdapter';
import { GitLabIssueSyncAdapter } from './GitLabIssueSyncAdapter';
import { StubPrincipleInheritanceAdapter } from './StubPrincipleInheritanceAdapter';
import { GITLAB_API_URL, GITLAB_ACCESS_TOKEN, GITLAB_PROJECT_PATH, GITLAB_WEBHOOK_SECRET } from './gitlab.config';
import { PM_PROJECT_PATH } from './pm.config';
import { TEAM_NOTIFICATION_PORT, WORK_ITEM_COMMENT_PORT, PRINCIPLE_INHERITANCE_PORT } from '../../../domain/ports/injection-tokens';

@Module({
  providers: [
    {
      provide: GITLAB_API_URL,
      useValue: process.env.GITLAB_API_URL || 'https://gitlab.com',
    },
    {
      provide: GITLAB_ACCESS_TOKEN,
      useFactory: () => {
        const token = process.env.GITLAB_ACCESS_TOKEN;
        if (!token) {
          throw new Error(
            'GITLAB_ACCESS_TOKEN is not set. Please configure a valid GitLab personal access token.',
          );
        }
        return token;
      },
    },
    {
      provide: GITLAB_PROJECT_PATH,
      useValue: process.env.GITLAB_PROJECT_PATH || '',
    },
    {
      provide: GITLAB_WEBHOOK_SECRET,
      useValue: process.env.GITLAB_WEBHOOK_SECRET || '',
    },
    {
      provide: PM_PROJECT_PATH,
      useValue: process.env.GITLAB_PROJECT_PATH || '',
    },
    {
      provide: TEAM_NOTIFICATION_PORT,
      useClass: GitLabNotificationAdapter,
    },
    {
      provide: WORK_ITEM_COMMENT_PORT,
      useClass: GitLabIssueSyncAdapter,
    },
    // Inheritance is deliberately unavailable on GitLab — see the stub.
    {
      provide: PRINCIPLE_INHERITANCE_PORT,
      useClass: StubPrincipleInheritanceAdapter,
    },
  ],
  exports: [
    TEAM_NOTIFICATION_PORT,
    WORK_ITEM_COMMENT_PORT,
    PRINCIPLE_INHERITANCE_PORT,
    GITLAB_PROJECT_PATH,
    GITLAB_WEBHOOK_SECRET,
    PM_PROJECT_PATH,
  ],
})
export class GitLabModule {}
