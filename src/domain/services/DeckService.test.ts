import { DeckService } from './DeckService';
import { IDeckRepository } from '../ports/outbound/IDeckRepository';
import { IDeckWorkItemSyncPort } from '../ports/inbound/IDeckWorkItemSyncPort';

function createMockDeckRepository(): jest.Mocked<IDeckRepository> {
    return {
        save: jest.fn().mockResolvedValue(undefined),
        findById: jest.fn().mockResolvedValue(null),
        findLatest: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue(undefined),
        softDelete: jest.fn().mockResolvedValue(undefined),
        findPrinciplesByDeckId: jest.fn().mockResolvedValue([]),
        addPrinciple: jest.fn().mockResolvedValue(undefined),
        removePrinciple: jest.fn().mockResolvedValue(undefined),
        updateProjectContext: jest.fn().mockResolvedValue(undefined),
        rankPrinciples: jest.fn().mockResolvedValue(undefined),
    };
}

function createMockWorkItemSyncPort(): jest.Mocked<IDeckWorkItemSyncPort> {
    return {
        syncDeckToWorkItems: jest.fn().mockResolvedValue(undefined),
        syncPrincipleContextToWorkItems: jest.fn().mockResolvedValue(undefined),
    };
}

function createService(
    deckRepository: jest.Mocked<IDeckRepository>,
    workItemSyncPort?: jest.Mocked<IDeckWorkItemSyncPort>,
): DeckService {
    return new DeckService(deckRepository, workItemSyncPort ?? createMockWorkItemSyncPort());
}

describe('Feature: Create deck', () => {
    let service: DeckService;
    let deckRepository: jest.Mocked<IDeckRepository>;

    beforeEach(() => {
        deckRepository = createMockDeckRepository();
        service = createService(deckRepository);
    });

    it('Given a valid deck name "Ethics Deck", When createDeck is called, Then deckRepository.save is called with a generated UUID and the deck is returned', async () => {
        const result = await service.createDeck({ name: 'Ethics Deck' });

        expect(deckRepository.save).toHaveBeenCalledTimes(1);
        expect(result.name).toBe('Ethics Deck');
        expect(result.deckId).toBeDefined();
        expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('Given a valid name with description, When createDeck is called, Then the description is stored in the deck', async () => {
        const result = await service.createDeck({ name: 'Ethics Deck', description: 'A test deck' });

        expect(result.description).toBe('A test deck');
    });

    it('Given an empty deck name, When createDeck is called, Then a validation error is thrown', async () => {
        await expect(service.createDeck({ name: '' })).rejects.toThrow('Deck name is required');
        expect(deckRepository.save).not.toHaveBeenCalled();
    });
});

describe('Feature: Retrieve deck by ID', () => {
    let service: DeckService;
    let deckRepository: jest.Mocked<IDeckRepository>;

    beforeEach(() => {
        deckRepository = createMockDeckRepository();
        service = createService(deckRepository);
    });

    it('Given a deck with ID "deck-1" exists, When getDeckById is called, Then the deck is returned', async () => {
        const deck = { deckId: 'deck-1', name: 'Test', createdAt: new Date(), updatedAt: new Date() };
        deckRepository.findById.mockResolvedValue(deck);

        const result = await service.getDeckById('deck-1');

        expect(result).toEqual(deck);
        expect(deckRepository.findById).toHaveBeenCalledWith('deck-1');
    });
});

describe('Feature: Update deck', () => {
    let service: DeckService;
    let deckRepository: jest.Mocked<IDeckRepository>;

    beforeEach(() => {
        deckRepository = createMockDeckRepository();
        service = createService(deckRepository);
    });

    it('Given valid input data, When updateDeck is called, Then deckRepository.update is called', async () => {
        await service.updateDeck('deck-1', { name: 'Updated' });

        expect(deckRepository.update).toHaveBeenCalledWith('deck-1', { name: 'Updated' });
    });

    it('Given an empty name, When updateDeck is called, Then a validation error is thrown', async () => {
        await expect(service.updateDeck('deck-1', { name: '' })).rejects.toThrow('Deck name is required');
        expect(deckRepository.update).not.toHaveBeenCalled();
    });
});

describe('Feature: Delete deck', () => {
    let service: DeckService;
    let deckRepository: jest.Mocked<IDeckRepository>;

    beforeEach(() => {
        deckRepository = createMockDeckRepository();
        service = createService(deckRepository);
    });

    it('Given a valid deckId, When deleteDeck is called, Then deckRepository.softDelete is called', async () => {
        await service.deleteDeck('deck-1');

        expect(deckRepository.softDelete).toHaveBeenCalledWith('deck-1');
    });
});

describe('Feature: Retrieve deck principles', () => {
    let service: DeckService;
    let deckRepository: jest.Mocked<IDeckRepository>;

    beforeEach(() => {
        deckRepository = createMockDeckRepository();
        service = createService(deckRepository);
    });

    it('Given a deck with principles, When getDeckPrinciples is called, Then the principles are returned', async () => {
        const principles = [
            { principleId: 'P001', category: 'Data protection', projectContext: 'Context' },
        ];
        deckRepository.findPrinciplesByDeckId.mockResolvedValue(principles);

        const result = await service.getDeckPrinciples('deck-1');

        expect(result).toEqual(principles);
        expect(deckRepository.findPrinciplesByDeckId).toHaveBeenCalledWith('deck-1');
    });
});

describe('Feature: Add standard principle to deck', () => {
    let service: DeckService;
    let deckRepository: jest.Mocked<IDeckRepository>;

    beforeEach(() => {
        deckRepository = createMockDeckRepository();
        service = createService(deckRepository);
    });

    it('Given a deck and a principle exist, When addPrincipleToDeck is called, Then deckRepository.addPrinciple is called', async () => {
        await service.addPrincipleToDeck('deck-1', 'P001', 'Some context');

        expect(deckRepository.addPrinciple).toHaveBeenCalledWith('deck-1', 'P001', 'Some context');
    });
});

describe('Feature: Remove principle from deck', () => {
    let service: DeckService;
    let deckRepository: jest.Mocked<IDeckRepository>;

    beforeEach(() => {
        deckRepository = createMockDeckRepository();
        service = createService(deckRepository);
    });

    it('Given a deck "deck-1" with principle "P001", When removePrincipleFromDeck is called, Then deckRepository.removePrinciple is called', async () => {
        await service.removePrincipleFromDeck('deck-1', 'P001');

        expect(deckRepository.removePrinciple).toHaveBeenCalledWith('deck-1', 'P001');
    });
});

describe('Feature: Update project context', () => {
    let service: DeckService;
    let deckRepository: jest.Mocked<IDeckRepository>;

    beforeEach(() => {
        deckRepository = createMockDeckRepository();
        service = createService(deckRepository);
    });

    it('Given a deck with a principle, When updateProjectContext is called with "New context", Then deckRepository.updateProjectContext is called', async () => {
        await service.updateProjectContext('deck-1', 'P001', 'New context');

        expect(deckRepository.updateProjectContext).toHaveBeenCalledWith('deck-1', 'P001', 'New context');
    });

    it('Given a changed interpretation, When updateProjectContext is called, Then the comments of that principle are resynchronised', async () => {
        const syncPort = createMockWorkItemSyncPort();
        service = createService(deckRepository, syncPort);

        await service.updateProjectContext('deck-1', 'P001', 'New context', 'de');

        expect(syncPort.syncPrincipleContextToWorkItems).toHaveBeenCalledWith('deck-1', 'P001', 'de');
    });

    it('Given the comment sync fails, When updateProjectContext is called, Then the interpretation is still saved', async () => {
        const syncPort = createMockWorkItemSyncPort();
        syncPort.syncPrincipleContextToWorkItems.mockRejectedValue(new Error('GitHub down'));
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        service = createService(deckRepository, syncPort);

        await expect(service.updateProjectContext('deck-1', 'P001', 'New context')).resolves.toBeUndefined();

        expect(deckRepository.updateProjectContext).toHaveBeenCalled();
        await new Promise(r => setTimeout(r, 10));
        errorSpy.mockRestore();
    });

    it('Given an empty projectContext, When updateProjectContext is called, Then no sync is triggered', async () => {
        const syncPort = createMockWorkItemSyncPort();
        service = createService(deckRepository, syncPort);

        await expect(service.updateProjectContext('deck-1', 'P001', '')).rejects.toThrow();

        expect(syncPort.syncPrincipleContextToWorkItems).not.toHaveBeenCalled();
    });

    it('Given an empty projectContext, When updateProjectContext is called, Then a validation error is thrown', async () => {
        await expect(service.updateProjectContext('deck-1', 'P001', '')).rejects.toThrow('Project context is required');
        expect(deckRepository.updateProjectContext).not.toHaveBeenCalled();
    });
});

describe('Feature: Rank principles with non-blocking work-item sync', () => {
    let service: DeckService;
    let deckRepository: jest.Mocked<IDeckRepository>;
    let syncPort: jest.Mocked<IDeckWorkItemSyncPort>;

    beforeEach(() => {
        deckRepository = createMockDeckRepository();
        syncPort = createMockWorkItemSyncPort();
        service = createService(deckRepository, syncPort);
    });

    it('Given a deck with principles, When rankPrinciples is called, Then deckRepository.rankPrinciples is called with deckId and rankings', async () => {
        const rankings = [
            { principleId: 'P001', rank: 0 },
            { principleId: 'P002', rank: 1 },
            { principleId: 'P003', rank: 2 },
        ];

        await service.rankPrinciples('deck-1', rankings);

        expect(deckRepository.rankPrinciples).toHaveBeenCalledWith('deck-1', rankings);
    });

    it('Given a successful rank, When rankPrinciples is called, Then syncDeckToWorkItems is triggered with the same deckId', async () => {
        await service.rankPrinciples('deck-1', []);

        await Promise.resolve();

        expect(syncPort.syncDeckToWorkItems).toHaveBeenCalledWith('deck-1', undefined);
    });

    it('Given the work-item sync throws an error, When rankPrinciples is called, Then the mutation still resolves successfully (non-blocking)', async () => {
        syncPort.syncDeckToWorkItems.mockRejectedValue(new Error('sync unreachable'));

        await expect(
            service.rankPrinciples('deck-1', []),
        ).resolves.toBeUndefined();

        expect(deckRepository.rankPrinciples).toHaveBeenCalled();
    });
});
