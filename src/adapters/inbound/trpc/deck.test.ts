import { deckRouter } from './deck';
import { IDeckPort } from '../../../domain/ports/inbound/IDeckPort';

function createMockPort(): jest.Mocked<IDeckPort> {
    return {
        createDeck: jest.fn().mockResolvedValue({ deckId: 'deck-1', name: 'Test', createdAt: new Date(), updatedAt: new Date() }),
        getDeckById: jest.fn().mockResolvedValue(null),
        getLatestDeck: jest.fn().mockResolvedValue(null),
        updateDeck: jest.fn().mockResolvedValue(undefined),
        deleteDeck: jest.fn().mockResolvedValue(undefined),
        getDeckPrinciples: jest.fn().mockResolvedValue([]),
        addPrincipleToDeck: jest.fn().mockResolvedValue(undefined),
        removePrincipleFromDeck: jest.fn().mockResolvedValue(undefined),
        updateProjectContext: jest.fn().mockResolvedValue(undefined),
        rankPrinciples: jest.fn().mockResolvedValue(undefined),
    };
}

function createCaller(port: IDeckPort) {
    return deckRouter.createCaller({
        principlePort: {} as any,
        deckPort: port,
    });
}

describe('Feature: Create deck via tRPC', () => {
    let port: jest.Mocked<IDeckPort>;
    let caller: ReturnType<typeof createCaller>;

    beforeEach(() => {
        port = createMockPort();
        caller = createCaller(port);
    });

    it('Given valid input with name and description, When deck.create is called, Then deckPort.createDeck is called with the input', async () => {
        await caller.create({ name: 'My Deck', description: 'Desc' });

        expect(port.createDeck).toHaveBeenCalledWith({ name: 'My Deck', description: 'Desc' });
    });

    it('Given an empty name, When deck.create is called, Then a Zod validation error is thrown', async () => {
        await expect(caller.create({ name: '' })).rejects.toThrow();
        expect(port.createDeck).not.toHaveBeenCalled();
    });
});

describe('Feature: Retrieve deck by ID via tRPC', () => {
    let port: jest.Mocked<IDeckPort>;
    let caller: ReturnType<typeof createCaller>;

    beforeEach(() => {
        port = createMockPort();
        caller = createCaller(port);
    });

    it('Given a valid deckId, When deck.getById is called, Then deckPort.getDeckById is called', async () => {
        await caller.getById({ deckId: 'deck-1' });

        expect(port.getDeckById).toHaveBeenCalledWith('deck-1');
    });

    it('Given an empty deckId, When deck.getById is called, Then a Zod validation error is thrown', async () => {
        await expect(caller.getById({ deckId: '' })).rejects.toThrow();
    });
});

describe('Feature: Retrieve deck principles via tRPC', () => {
    let port: jest.Mocked<IDeckPort>;
    let caller: ReturnType<typeof createCaller>;

    beforeEach(() => {
        port = createMockPort();
        caller = createCaller(port);
    });

    it('Given a deck with principles exists, When deck.getPrinciples is called, Then the DeckPrincipleWithDetails are returned', async () => {
        const principles = [
            { principleId: 'P001', category: 'Data protection', projectContext: 'Context' },
        ];
        port.getDeckPrinciples.mockResolvedValue(principles);

        const result = await caller.getPrinciples({ deckId: 'deck-1' });

        expect(result).toEqual(principles);
        expect(port.getDeckPrinciples).toHaveBeenCalledWith('deck-1');
    });

    it('Given an empty deckId, When deck.getPrinciples is called, Then a Zod validation error is thrown', async () => {
        await expect(caller.getPrinciples({ deckId: '' })).rejects.toThrow();
        expect(port.getDeckPrinciples).not.toHaveBeenCalled();
    });
});

describe('Feature: Add principle to deck via tRPC', () => {
    let port: jest.Mocked<IDeckPort>;
    let caller: ReturnType<typeof createCaller>;

    beforeEach(() => {
        port = createMockPort();
        caller = createCaller(port);
    });

    it('Given valid deckId, principleId and projectContext, When deck.addPrinciple is called, Then deckPort.addPrincipleToDeck is called', async () => {
        await caller.addPrinciple({ deckId: 'deck-1', principleId: 'P001', projectContext: 'Context' });

        expect(port.addPrincipleToDeck).toHaveBeenCalledWith('deck-1', 'P001', 'Context');
    });
});

describe('Feature: Remove principle from deck via tRPC', () => {
    let port: jest.Mocked<IDeckPort>;
    let caller: ReturnType<typeof createCaller>;

    beforeEach(() => {
        port = createMockPort();
        caller = createCaller(port);
    });

    it('Given valid deckId and principleId, When deck.removePrinciple is called, Then deckPort.removePrincipleFromDeck is called', async () => {
        await caller.removePrinciple({ deckId: 'deck-1', principleId: 'P001' });

        expect(port.removePrincipleFromDeck).toHaveBeenCalledWith('deck-1', 'P001');
    });
});

describe('Feature: Update project context via tRPC', () => {
    let port: jest.Mocked<IDeckPort>;
    let caller: ReturnType<typeof createCaller>;

    beforeEach(() => {
        port = createMockPort();
        caller = createCaller(port);
    });

    it('Given valid data, When deck.updateProjectContext is called, Then deckPort.updateProjectContext is called', async () => {
        await caller.updateProjectContext({ deckId: 'deck-1', principleId: 'P001', projectContext: 'New context' });

        expect(port.updateProjectContext).toHaveBeenCalledWith('deck-1', 'P001', 'New context', undefined);
    });

    it('Given an empty projectContext, When deck.updateProjectContext is called, Then a Zod validation error is thrown', async () => {
        await expect(caller.updateProjectContext({ deckId: 'deck-1', principleId: 'P001', projectContext: '' })).rejects.toThrow();
        expect(port.updateProjectContext).not.toHaveBeenCalled();
    });
});

describe('Feature: Delete deck via tRPC', () => {
    let port: jest.Mocked<IDeckPort>;
    let caller: ReturnType<typeof createCaller>;

    beforeEach(() => {
        port = createMockPort();
        caller = createCaller(port);
    });

    it('Given a valid deckId, When deck.delete is called, Then deckPort.deleteDeck is called', async () => {
        await caller.delete({ deckId: 'deck-1' });

        expect(port.deleteDeck).toHaveBeenCalledWith('deck-1');
    });
});

describe('Feature: Rank principles via tRPC', () => {
    let port: jest.Mocked<IDeckPort>;
    let caller: ReturnType<typeof createCaller>;

    beforeEach(() => {
        port = createMockPort();
        caller = createCaller(port);
    });

    it('Given valid deckId and rankings, When deck.rankPrinciples is called, Then deckPort.rankPrinciples is called with the correct arguments', async () => {
        const rankings = [
            { principleId: 'P001', rank: 0 },
            { principleId: 'P005', rank: 1 },
        ];

        await caller.rankPrinciples({ deckId: 'deck-1', rankings });

        expect(port.rankPrinciples).toHaveBeenCalledWith('deck-1', rankings, undefined);
    });

    it('Given an empty rankings array, When deck.rankPrinciples is called, Then no Zod error is thrown and the port is called', async () => {
        await caller.rankPrinciples({ deckId: 'deck-1', rankings: [] });

        expect(port.rankPrinciples).toHaveBeenCalledWith('deck-1', [], undefined);
    });

    it('Given an empty deckId, When deck.rankPrinciples is called, Then a Zod validation error is thrown', async () => {
        await expect(caller.rankPrinciples({ deckId: '', rankings: [] })).rejects.toThrow();
        expect(port.rankPrinciples).not.toHaveBeenCalled();
    });
});

describe('Feature: Update deck via tRPC', () => {
    let port: jest.Mocked<IDeckPort>;
    let caller: ReturnType<typeof createCaller>;

    beforeEach(() => {
        port = createMockPort();
        caller = createCaller(port);
    });

    it('Given valid input data, When deck.update is called, Then deckPort.updateDeck is called', async () => {
        await caller.update({ deckId: 'deck-1', name: 'Updated', description: 'Desc' });

        expect(port.updateDeck).toHaveBeenCalledWith('deck-1', { name: 'Updated', description: 'Desc' });
    });

    it('Given an empty name, When deck.update is called, Then a Zod validation error is thrown', async () => {
        await expect(caller.update({ deckId: 'deck-1', name: '' })).rejects.toThrow();
        expect(port.updateDeck).not.toHaveBeenCalled();
    });
});
