import { Injectable, Inject } from '@nestjs/common';
import { Principle } from "../model/Principle";
import { IPrincipleRepository } from "../ports/outbound/IPrincipleRepository";
import { IPrinciplePort } from "../ports/inbound/IPrinciplePort";
import { PRINCIPLE_REPOSITORY } from "../ports/injection-tokens";

@Injectable()
export class PrincipleService implements IPrinciplePort {
    constructor(@Inject(PRINCIPLE_REPOSITORY) private repository: IPrincipleRepository) { }

    async getAllPrinciples(): Promise<Principle[]> {
        console.log(`[PrincipleService] fetching all principles`);
        return this.repository.findAll();
    }

    async getPrincipleById(principleId: string): Promise<Principle | null> {
        console.log(`[PrincipleService] fetching principle by id ${principleId}`);
        return this.repository.findById(principleId);
    }
}
