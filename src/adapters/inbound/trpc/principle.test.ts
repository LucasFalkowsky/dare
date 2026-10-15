import { principleRouter } from './principle';
import { IPrinciplePort } from '../../../domain/ports/inbound/IPrinciplePort';

function createMockPort(): jest.Mocked<IPrinciplePort> {
    return {
        getAllPrinciples: jest.fn().mockResolvedValue([]),
        getPrincipleById: jest.fn().mockResolvedValue(null),
    };
}

function createCaller(port: IPrinciplePort) {
    return principleRouter.createCaller({ principlePort: port, deckPort: {} as any });
}

describe('Feature: Retrieve all principles', () => {
    let port: jest.Mocked<IPrinciplePort>;
    let caller: ReturnType<typeof createCaller>;

    beforeEach(() => {
        port = createMockPort();
        caller = createCaller(port);
    });

    it('Given principles exist in the database, When getAll is called, Then all principles are returned', async () => {
        const principles = [
            { principleId: 'p-1', category: 'cat-1' },
        ];
        port.getAllPrinciples.mockResolvedValue(principles);

        const result = await caller.getAll();

        expect(result).toEqual(principles);
        expect(port.getAllPrinciples).toHaveBeenCalledTimes(1);
    });
});

describe('Feature: Retrieve principle by ID', () => {
    let port: jest.Mocked<IPrinciplePort>;
    let caller: ReturnType<typeof createCaller>;

    beforeEach(() => {
        port = createMockPort();
        caller = createCaller(port);
    });

    it('Given a principle with ID "p-1" exists, When getById is called with "p-1", Then the principle is returned', async () => {
        const principle = { principleId: 'p-1', category: 'cat' };
        port.getPrincipleById.mockResolvedValue(principle);

        const result = await caller.getById({ principleId: 'p-1' });

        expect(result).toEqual(principle);
        expect(port.getPrincipleById).toHaveBeenCalledWith('p-1');
    });
});
