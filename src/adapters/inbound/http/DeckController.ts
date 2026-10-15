import { Controller, Get, Post, Put, Delete, Param, Body, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IDeckPort } from '../../../domain/ports/inbound/IDeckPort';
import { Deck } from '../../../domain/model/Deck';
import { DECK_PORT } from '../../../domain/ports/injection-tokens';

@Controller('decks')
export class DeckController {
    constructor(@Inject(DECK_PORT) private deckPort: IDeckPort) {}

    @Post()
    async create(@Body() body: { name: string; description?: string }): Promise<Deck> {
        if (!body?.name) {
            throw new BadRequestException('name is required');
        }
        return this.deckPort.createDeck(body);
    }

    @Get(':deckId')
    async getById(@Param('deckId') deckId: string): Promise<Deck> {
        const deck = await this.deckPort.getDeckById(deckId);
        if (!deck) {
            throw new NotFoundException(`Deck with id '${deckId}' not found`);
        }
        return deck;
    }

    @Put(':deckId')
    async update(
        @Param('deckId') deckId: string,
        @Body() body: { name: string; description?: string },
    ): Promise<void> {
        if (!body?.name) {
            throw new BadRequestException('name is required');
        }
        await this.deckPort.updateDeck(deckId, body);
    }

    @Delete(':deckId')
    async delete(@Param('deckId') deckId: string): Promise<void> {
        await this.deckPort.deleteDeck(deckId);
    }

    @Get(':deckId/principles')
    async getPrinciples(@Param('deckId') deckId: string) {
        return this.deckPort.getDeckPrinciples(deckId);
    }

    @Post(':deckId/principles')
    async addPrinciple(
        @Param('deckId') deckId: string,
        @Body() body: { principleId: string; projectContext?: string },
    ): Promise<void> {
        if (!body?.principleId) {
            throw new BadRequestException('principleId is required');
        }
        await this.deckPort.addPrincipleToDeck(deckId, body.principleId, body.projectContext);
    }

    @Delete(':deckId/principles/:principleId')
    async removePrinciple(
        @Param('deckId') deckId: string,
        @Param('principleId') principleId: string,
    ): Promise<void> {
        await this.deckPort.removePrincipleFromDeck(deckId, principleId);
    }

    @Put(':deckId/principles/:principleId/context')
    async updateProjectContext(
        @Param('deckId') deckId: string,
        @Param('principleId') principleId: string,
        @Body() body: { projectContext: string; locale?: string },
    ): Promise<void> {
        if (!body?.projectContext) {
            throw new BadRequestException('projectContext is required');
        }
        await this.deckPort.updateProjectContext(deckId, principleId, body.projectContext, body.locale);
    }

}
