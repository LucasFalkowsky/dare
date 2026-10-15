import { Module, OnModuleDestroy } from '@nestjs/common';
import { createPrismaClient, PrismaClient } from './createPrismaClient';

const prismaProvider = {
  provide: PrismaClient,
  useFactory: () => createPrismaClient(),
};

@Module({
  providers: [prismaProvider],
  exports: [PrismaClient],
})
export class PrismaModule implements OnModuleDestroy {
  constructor(private prisma: PrismaClient) {}

  async onModuleDestroy(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
