import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../outbound/persistence/persistence.module';
import { DeckWorkItemSyncModule } from './deck-work-item-sync.module';
import { DeckController } from './DeckController';
import { DeckService } from '../../../domain/services/DeckService';
import { DECK_PORT } from '../../../domain/ports/injection-tokens';

@Module({
  imports: [PersistenceModule, DeckWorkItemSyncModule],
  controllers: [DeckController],
  providers: [
    {
      provide: DECK_PORT,
      useClass: DeckService,
    },
  ],
  exports: [DECK_PORT],
})
export class DeckModule {}
