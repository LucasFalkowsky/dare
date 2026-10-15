import type { Principle } from '../../model/Principle';

export interface IPrinciplePort {
    getAllPrinciples(): Promise<Principle[]>;
    getPrincipleById(principleId: string): Promise<Principle | null>;
}