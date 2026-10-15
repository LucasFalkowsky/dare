import { Module } from '@nestjs/common';
import { HttpAdapter } from './HttpAdapter';

@Module({
  controllers: [HttpAdapter],
})
export class HealthModule {}
