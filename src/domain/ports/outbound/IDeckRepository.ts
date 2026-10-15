import type { Deck, DeckPrincipleWithDetails } from '../../model/Deck';

export interface IDeckRepository {
    save(deck: Deck): Promise<void>;
    findById(deckId: string): Promise<Deck | null>;
    findLatest(): Promise<Deck | null>;
    update(deckId: string, data: { name: string; description?: string }): Promise<void>;
    softDelete(deckId: string): Promise<void>;

    findPrinciplesByDeckId(deckId: string): Promise<DeckPrincipleWithDetails[]>;
    addPrinciple(deckId: string, principleId: string, projectContext?: string): Promise<void>;
    removePrinciple(deckId: string, principleId: string): Promise<void>;
    updateProjectContext(deckId: string, principleId: string, projectContext: string): Promise<void>;
    rankPrinciples(deckId: string, rankings: { principleId: string; rank: number }[]): Promise<void>;
}
