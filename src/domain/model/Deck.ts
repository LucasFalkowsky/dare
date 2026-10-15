export interface Deck {
    deckId: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export interface DeckPrincipleWithDetails {
    principleId: string;
    category: string;
    projectContext?: string;
    rank?: number;
}
