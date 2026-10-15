import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../outbound/persistence/persistence.module';
import { WebhookAdapter } from './WebhookAdapter';
import { GitLabWebhookAdapter } from './GitLabWebhookAdapter';
import { GitHubWebhookAdapter } from './GitHubWebhookAdapter';
import { FrameworkActivationService } from '../../../domain/services/FrameworkActivationService';
import { WorkItemReminderService } from '../../../domain/services/WorkItemReminderService';
import { PrincipleCommentService } from '../../../domain/services/PrincipleCommentService';
import { PrincipleInheritanceService } from '../../../domain/services/PrincipleInheritanceService';
import { GitLabModule } from '../../outbound/pm/gitlab.module';
import { GitHubModule } from '../../outbound/pm/github.module';
import { ACTIVE_PLATFORM } from '../../outbound/pm/pm.config';
import { DeckWorkItemSyncModule } from '../http/deck-work-item-sync.module';
import { WORKFLOW_EVENT_PORT } from '../../../domain/ports/injection-tokens';
import { IWorkflowEventPort } from '../../../domain/ports/inbound/IWorkflowEventPort';

/**
 * Exactly one platform is active at a time: both platform modules bind
 * WORK_ITEM_COMMENT_PORT and PRINCIPLE_INHERITANCE_PORT, so importing both
 * would silently let one overwrite the other. Each platform's webhook
 * controller also depends on its own config tokens, so the controller is
 * registered together with its module.
 *
 * The selection itself lives in pm.config (ACTIVE_PLATFORM), because
 * DeckWorkItemSyncModule has to make the same choice.
 */
@Module({
  imports: [
    PersistenceModule,
    ACTIVE_PLATFORM === 'github' ? GitHubModule : GitLabModule,
    DeckWorkItemSyncModule,
  ],
  controllers: [
    WebhookAdapter,
    ACTIVE_PLATFORM === 'github' ? GitHubWebhookAdapter : GitLabWebhookAdapter,
  ],
  providers: [
    FrameworkActivationService,
    WorkItemReminderService,
    PrincipleCommentService,
    PrincipleInheritanceService,
    {
      provide: WORKFLOW_EVENT_PORT,
      useFactory: (
        activation: FrameworkActivationService,
        reminder: WorkItemReminderService,
        principleCommentService: PrincipleCommentService,
        inheritance: PrincipleInheritanceService,
      ): IWorkflowEventPort => ({
        onFrameworkActivated: (i) => activation.activate(i),
        onWorkItemOpened: async (i, id) => {
          await reminder.remindOnWorkItemOpened(i, id);
          principleCommentService.addPrincipleCommentForIssue(i, id).catch(err =>
            console.error('[WebhookModule] principle comment failed:', err),
          );
        },
        // These two reject on failure; the webhook adapters log it. No inner
        // catch, so there is a single place where the error surfaces.
        onSubWorkItemAttached: (i, parentId, childId) =>
          inheritance.inheritOnAttach(i, parentId, childId),
        // A changed vocabulary drives both the comment and the inheritance. The
        // comment is caught here because it must not stop the propagation.
        onWorkItemPrinciplesChanged: async (i, id) => {
          principleCommentService.addPrincipleCommentForIssue(i, id).catch(err =>
            console.error('[WebhookModule] principle comment failed:', err),
          );
          await inheritance.propagateAddedPrinciples(i, id);
        },
      }),
      inject: [
        FrameworkActivationService,
        WorkItemReminderService,
        PrincipleCommentService,
        PrincipleInheritanceService,
      ],
    },
  ],
})
export class WebhookModule {}
