import {
  Controller,
  Post,
  Headers,
  Body,
  Inject,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import { IWorkflowEventPort } from '../../../domain/ports/inbound/IWorkflowEventPort';
import { Installation } from '../../../domain/model/Installation';
import { WORKFLOW_EVENT_PORT } from '../../../domain/ports/injection-tokens';
import { GITLAB_WEBHOOK_SECRET, GITLAB_PROJECT_PATH } from '../../outbound/pm/gitlab.config';

@Controller('webhooks/gitlab')
export class GitLabWebhookAdapter {
  constructor(
    @Inject(WORKFLOW_EVENT_PORT) private readonly workflowEventPort: IWorkflowEventPort,
    @Inject(GITLAB_PROJECT_PATH) private readonly projectPath: string,
    @Inject(GITLAB_WEBHOOK_SECRET) private readonly webhookSecret: string,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Headers('x-gitlab-event') event: string = '',
    @Headers('x-gitlab-token') token: string = '',
    @Body() payload: any,
  ): Promise<{ received: boolean }> {
    if (this.webhookSecret && token !== this.webhookSecret) {
      console.debug(
        `[GitLabWebhookAdapter] 403: token mismatch (expected length=${this.webhookSecret.length}, got length=${token.length})`,
      );
      throw new ForbiddenException('Invalid webhook token');
    }

    if (event !== 'Issue Hook') {
      return { received: true };
    }

    const iid = payload?.object_attributes?.iid;
    if (!iid) {
      return { received: true };
    }

    const projectPathFromPayload =
      payload?.project?.path_with_namespace ?? this.projectPath;
    const [owner, ...repoParts] = projectPathFromPayload.split('/');

    const installation: Installation = {
      installationId: projectPathFromPayload,
      owner: owner ?? '',
      repo: repoParts.join('/') || '',
      platform: 'gitlab',
    };

    // Every Issue Hook — created, labelled, updated — is reported as a possible
    // vocabulary change: on GitLab the principles are the issue's labels, and
    // the payload is not consulted for them, the API is.
    this.workflowEventPort
      .onWorkItemPrinciplesChanged(installation, String(iid))
      .catch((err) =>
        console.error('[GitLabWebhookAdapter] principle comment failed:', err),
      );

    return { received: true };
  }
}
