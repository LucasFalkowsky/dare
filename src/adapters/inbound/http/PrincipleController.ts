import { Controller, Get, Param, Inject, NotFoundException } from '@nestjs/common';
import { IPrinciplePort } from '../../../domain/ports/inbound/IPrinciplePort';
import { Principle } from '../../../domain/model/Principle';
import { PRINCIPLE_PORT } from '../../../domain/ports/injection-tokens';

@Controller('principles')
export class PrincipleController {
    constructor(@Inject(PRINCIPLE_PORT) private principlePort: IPrinciplePort) { }

    @Get()
    async getAll(): Promise<Principle[]> {
        return this.principlePort.getAllPrinciples();
    }

    @Get(':principleId')
    async getById(@Param('principleId') principleId: string): Promise<Principle> {
        const principle = await this.principlePort.getPrincipleById(principleId);

        if (!principle) {
            throw new NotFoundException(`Principle with id '${principleId}' not found`);
        }

        return principle;
    }
}
