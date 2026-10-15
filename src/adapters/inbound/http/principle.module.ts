import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../outbound/persistence/persistence.module';
import { PrincipleController } from './PrincipleController';
import { PrincipleService } from '../../../domain/services/PrincipleService';
import { PRINCIPLE_PORT } from '../../../domain/ports/injection-tokens';

@Module({
  imports: [PersistenceModule],
  controllers: [PrincipleController],
  providers: [
    {
      provide: PRINCIPLE_PORT,
      useClass: PrincipleService,
    },
  ],
})
export class PrincipleModule {}
