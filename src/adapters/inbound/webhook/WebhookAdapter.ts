import { Controller, Post, Headers, Body, Inject, HttpCode } from '@nestjs/common';
import { IWorkflowEventPort } from '../../../domain/ports/inbound/IWorkflowEventPort';
import { Installation } from '../../../domain/model/Installation';
import { WORKFLOW_EVENT_PORT } from '../../../domain/ports/injection-tokens';

@Controller('webhooks')
export class WebhookAdapter {
  constructor(@Inject(WORKFLOW_EVENT_PORT) private workflowEventPort: IWorkflowEventPort) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Headers('x-event-type') event: string = 'unknown',
    @Body() payload: any,
  ): Promise<{ received: boolean }> {
    console.log(`[WebhookAdapter] received event: ${event}`);

    const installation: Installation = {
      installationId: payload?.installation?.id ?? 'unknown',
      owner:          payload?.repository?.owner ?? 'unknown',
      repo:           payload?.repository?.name  ?? 'unknown',
      platform:       'github',
    };

    switch (event) {
      case 'framework.activated':
        await this.workflowEventPort.onFrameworkActivated(installation);
        break;
      case 'workitem.opened':
        await this.workflowEventPort.onWorkItemOpened(installation, payload?.workItem?.id ?? '0');
        break;
      default:
        console.log(`[WebhookAdapter] unhandled event: ${event}`);
    }

    return { received: true };
  }
}
