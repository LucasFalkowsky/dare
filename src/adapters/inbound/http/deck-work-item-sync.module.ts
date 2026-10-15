import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../outbound/persistence/persistence.module';
import { GitLabModule } from '../../outbound/pm/gitlab.module';
import { GitHubModule } from '../../outbound/pm/github.module';
import { ACTIVE_PLATFORM } from '../../outbound/pm/pm.config';
import { DeckWorkItemSyncService } from '../../../domain/services/DeckWorkItemSyncService';
import { PrincipleCommentService } from '../../../domain/services/PrincipleCommentService';
import { DECK_WORK_ITEM_SYNC_PORT } from '../../../domain/ports/injection-tokens';

/**
 * Must follow the same platform selection as WebhookModule: this module's
 * DeckWorkItemSyncService resolves WORK_ITEM_COMMENT_PORT from its own import
 * scope, so a hard-wired platform module here would keep the deck sync on that
 * platform regardless of PM_PLATFORM.
 */
@Module({
  imports: [
    PersistenceModule,
    ACTIVE_PLATFORM === 'github' ? GitHubModule : GitLabModule,
  ],
  providers: [
    DeckWorkItemSyncService,
    PrincipleCommentService,
    { provide: DECK_WORK_ITEM_SYNC_PORT, useClass: DeckWorkItemSyncService },
  ],
  exports: [DECK_WORK_ITEM_SYNC_PORT, PrincipleCommentService],
})
export class DeckWorkItemSyncModule {}
