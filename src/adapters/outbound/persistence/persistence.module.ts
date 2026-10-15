import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { PrismaInstallationRepository } from './PrismaInstallationRepository';
import { PrismaPrincipleRepository } from './PrismaPrincipleRepository';
import { PrismaDeckRepository } from './PrismaDeckRepository';
import { PrismaPrincipleWorkItemMappingRepository } from './PrismaPrincipleWorkItemMappingRepository';
import { PrismaWorkItemPrincipleSnapshotRepository } from './PrismaWorkItemPrincipleSnapshotRepository';
import {
  INSTALLATION_REPOSITORY,
  PRINCIPLE_REPOSITORY,
  DECK_REPOSITORY,
  PRINCIPLE_WORK_ITEM_MAPPING_REPOSITORY,
  WORK_ITEM_PRINCIPLE_SNAPSHOT_REPOSITORY,
} from '../../../domain/ports/injection-tokens';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: INSTALLATION_REPOSITORY,
      useClass: PrismaInstallationRepository,
    },
    {
      provide: PRINCIPLE_REPOSITORY,
      useClass: PrismaPrincipleRepository,
    },
    {
      provide: DECK_REPOSITORY,
      useClass: PrismaDeckRepository,
    },
    {
      provide: PRINCIPLE_WORK_ITEM_MAPPING_REPOSITORY,
      useClass: PrismaPrincipleWorkItemMappingRepository,
    },
    {
      provide: WORK_ITEM_PRINCIPLE_SNAPSHOT_REPOSITORY,
      useClass: PrismaWorkItemPrincipleSnapshotRepository,
    },
  ],
  exports: [
    INSTALLATION_REPOSITORY,
    PRINCIPLE_REPOSITORY,
    DECK_REPOSITORY,
    PRINCIPLE_WORK_ITEM_MAPPING_REPOSITORY,
    WORK_ITEM_PRINCIPLE_SNAPSHOT_REPOSITORY,
  ],
})
export class PersistenceModule { }
