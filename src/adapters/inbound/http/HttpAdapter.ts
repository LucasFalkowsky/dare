import { Controller, Get } from '@nestjs/common';
import { IHealthPort } from '../../../domain/ports/inbound/IHealthPort';

@Controller('health')
export class HttpAdapter implements IHealthPort {
  getSystemStatus(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get()
  handle(): { status: string; timestamp: string } {
    return this.getSystemStatus();
  }
}
