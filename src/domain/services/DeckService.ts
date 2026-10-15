import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Deck, DeckPrincipleWithDetails } from '../model/Deck';
import { IDeckPort } from '../ports/inbound/IDeckPort';
import { IDeckWorkItemSyncPort } from '../ports/inbound/IDeckWorkItemSyncPort';
import { IDeckRepository } from '../ports/outbound/IDeckRepository';
import { DECK_REPOSITORY, DECK_WORK_ITEM_SYNC_PORT } from '../ports/injection-tokens';

@Injectable()
export class DeckService implements IDeckPort {
    constructor(
        @Inject(DECK_REPOSITORY) private deckRepository: IDeckRepository,
        @Inject(DECK_WORK_ITEM_SYNC_PORT) private workItemSyncPort: IDeckWorkItemSyncPort,
    ) {}

    async createDeck(data: { name: string; description?: string }): Promise<Deck> {
        if (!data.name) {
            throw new Error('Deck name is required');
        }
        const now = new Date();
        const deck: Deck = {
            deckId: randomUUID(),
            name: data.name,
            description: data.description,
            createdAt: now,
            updatedAt: now,
        };
        await this.deckRepository.save(deck);
        return deck;
    }

    async getDeckById(deckId: string): Promise<Deck | null> {
        return this.deckRepository.findById(deckId);
    }

    async getLatestDeck(): Promise<Deck | null> {
        return this.deckRepository.findLatest();
    }

    async updateDeck(deckId: string, data: { name: string; description?: string }): Promise<void> {
        if (!data.name) {
            throw new Error('Deck name is required');
        }
        await this.deckRepository.update(deckId, data);
    }

    async deleteDeck(deckId: string): Promise<void> {
        await this.deckRepository.softDelete(deckId);
    }

    async getDeckPrinciples(deckId: string): Promise<DeckPrincipleWithDetails[]> {
        return this.deckRepository.findPrinciplesByDeckId(deckId);
    }

    async addPrincipleToDeck(deckId: string, principleId: string, projectContext?: string): Promise<void> {
        await this.deckRepository.addPrinciple(deckId, principleId, projectContext);
        this.workItemSyncPort.syncDeckToWorkItems(deckId).catch(err =>
            console.error('[DeckService] work-item sync failed (non-blocking):', err),
        );
    }

    async removePrincipleFromDeck(deckId: string, principleId: string): Promise<void> {
        await this.deckRepository.removePrinciple(deckId, principleId);
    }

    async updateProjectContext(deckId: string, principleId: string, projectContext: string, locale?: string): Promise<void> {
        if (!projectContext) {
            throw new Error('Project context is required');
        }
        await this.deckRepository.updateProjectContext(deckId, principleId, projectContext);
        // The interpretation is the comment's body text, so every work item
        // carrying this principle has to be rewritten. Non-blocking like the
        // other syncs: the deck is saved either way.
        this.workItemSyncPort.syncPrincipleContextToWorkItems(deckId, principleId, locale).catch(err =>
            console.error('[DeckService] principle context sync failed (non-blocking):', err),
        );
    }

    async rankPrinciples(deckId: string, rankings: { principleId: string; rank: number }[], locale?: string): Promise<void> {
        await this.deckRepository.rankPrinciples(deckId, rankings);
        this.workItemSyncPort.syncDeckToWorkItems(deckId, locale).catch(err =>
            console.error('[DeckService] work-item sync failed (non-blocking):', err),
        );
    }
}
