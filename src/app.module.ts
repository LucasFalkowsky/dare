import { Module } from '@nestjs/common';
import { PersistenceModule } from './adapters/outbound/persistence/persistence.module';
import { PrincipleModule } from './adapters/inbound/http/principle.module';
import { HealthModule } from './adapters/inbound/http/health.module';
import { WebhookModule } from './adapters/inbound/webhook/webhook.module';
import { DeckModule } from './adapters/inbound/http/deck.module';
import { DeckWorkItemSyncModule } from './adapters/inbound/http/deck-work-item-sync.module';

@Module({
  imports: [
    PersistenceModule,
    PrincipleModule,
    HealthModule,
    WebhookModule,
    DeckModule,
    DeckWorkItemSyncModule,
  ],
})
export class AppModule {}
