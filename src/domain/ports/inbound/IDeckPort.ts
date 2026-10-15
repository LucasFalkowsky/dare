import type { Deck, DeckPrincipleWithDetails } from '../../model/Deck';

export interface IDeckPort {
    createDeck(data: { name: string; description?: string }): Promise<Deck>;
    getDeckById(deckId: string): Promise<Deck | null>;
    getLatestDeck(): Promise<Deck | null>;
    updateDeck(deckId: string, data: { name: string; description?: string }): Promise<void>;
    deleteDeck(deckId: string): Promise<void>;

    getDeckPrinciples(deckId: string): Promise<DeckPrincipleWithDetails[]>;
    addPrincipleToDeck(deckId: string, principleId: string, projectContext?: string): Promise<void>;
    removePrincipleFromDeck(deckId: string, principleId: string): Promise<void>;
    updateProjectContext(deckId: string, principleId: string, projectContext: string, locale?: string): Promise<void>;

    rankPrinciples(deckId: string, rankings: { principleId: string; rank: number }[], locale?: string): Promise<void>;
}
