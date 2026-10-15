import {
  Controller,
  Post,
  Headers,
  Body,
  Req,
  Inject,
  HttpCode,
  ForbiddenException,
  RawBodyRequest,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { IWorkflowEventPort } from '../../../domain/ports/inbound/IWorkflowEventPort';
import { Installation } from '../../../domain/model/Installation';
import { WORKFLOW_EVENT_PORT } from '../../../domain/ports/injection-tokens';
import { GITHUB_WEBHOOK_SECRET } from '../../outbound/pm/github.config';

@Controller('webhooks/github')
export class GitHubWebhookAdapter {
  constructor(
    @Inject(WORKFLOW_EVENT_PORT) private readonly workflowEventPort: IWorkflowEventPort,
    @Inject(GITHUB_WEBHOOK_SECRET) private readonly webhookSecret: string,
  ) {}

  /**
   * Compares `x-hub-signature-256` against an HMAC-SHA256 of the raw request
   * body. Uses a length-checked timing-safe comparison rather than `===` so the
   * check cannot be probed byte by byte.
   */
  private signatureMatches(signature: string, rawBody: Buffer): boolean {
    const expected = 'sha256=' + createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    const received = Buffer.from(signature);
    const computed = Buffer.from(expected);

    if (received.length !== computed.length) return false;
    return timingSafeEqual(received, computed);
  }

  private installationFrom(payload: any): Installation {
    const owner = payload?.repository?.owner?.login ?? '';
    const repo = payload?.repository?.name ?? '';

    return {
      installationId: payload?.repository?.full_name ?? `${owner}/${repo}`,
      owner,
      repo,
      platform: 'github',
    };
  }

  @Post()
  @HttpCode(200)
  async handle(
    @Headers('x-github-event') event: string = '',
    @Headers('x-hub-signature-256') signature: string = '',
    @Req() req: RawBodyRequest<Request>,
    @Body() payload: any,
  ): Promise<{ received: boolean }> {
    if (this.webhookSecret) {
      const rawBody = req?.rawBody;
      if (!rawBody) {
        console.error(
          '[GitHubWebhookAdapter] 403: raw body unavailable — the Nest app must be created with { rawBody: true }',
        );
        throw new ForbiddenException('Invalid webhook signature');
      }
      if (!signature || !this.signatureMatches(signature, rawBody)) {
        console.debug('[GitHubWebhookAdapter] 403: signature mismatch');
        throw new ForbiddenException('Invalid webhook signature');
      }
    }

    const action: string = payload?.action ?? '';

    // Both actions describe the same fact from the two ends of the new edge.
    if (event === 'sub_issues' && (action === 'sub_issue_added' || action === 'parent_issue_added')) {
      const parentId = payload?.parent_issue?.number;
      const childId = payload?.sub_issue?.number;

      if (parentId && childId) {
        this.dispatch(
          this.workflowEventPort.onSubWorkItemAttached(
            this.installationFrom(payload),
            String(parentId),
            String(childId),
          ),
          `sub-issue #${childId} attached to #${parentId}`,
        );
      }
      return { received: true };
    }

    if (event !== 'issues') {
      return { received: true };
    }

    const issueId = payload?.issue?.number;
    if (!issueId) {
      return { received: true };
    }

    const installation = this.installationFrom(payload);

    // A changed field value drives the principle inheritance. GitHub does not
    // say which value changed, so the delta is derived downstream.
    if (action === 'field_added' || action === 'field_removed') {
      this.dispatch(
        this.workflowEventPort.onWorkItemPrinciplesChanged(installation, String(issueId)),
        `principles changed on #${issueId}`,
      );
      return { received: true };
    }

    // A new issue may already carry field values, so the comment is attempted
    // here too — the values are read back through the adapter.
    if (action === 'opened') {
      this.dispatch(
        this.workflowEventPort.onWorkItemOpened(installation, String(issueId)),
        `issue #${issueId} opened`,
      );
      return { received: true };
    }

    // GitHub labels are deliberately ignored: on this platform the principle
    // vocabulary is the organization's issue field, which arrives as
    // field_added / field_removed above.

    return { received: true };
  }

  /**
   * Webhooks are acknowledged immediately and processed in the background, so a
   * slow or failing propagation never makes GitHub retry or time out.
   */
  private dispatch(work: Promise<void>, what: string): void {
    work.catch(err =>
      console.error(`[GitHubWebhookAdapter] ${what} failed:`, err),
    );
  }
}
