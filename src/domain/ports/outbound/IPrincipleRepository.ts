import { Principle } from "../../model/Principle";

export interface IPrincipleRepository {
    findById(principleId: string): Promise<Principle | null>;
    findAll(): Promise<Principle[]>;
}