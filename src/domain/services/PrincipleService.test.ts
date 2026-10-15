import { PrincipleService } from './PrincipleService';
import { IPrincipleRepository } from '../ports/outbound/IPrincipleRepository';
import { Principle } from '../model/Principle';

function createMockRepository(): jest.Mocked<IPrincipleRepository> {
    return {
        findById: jest.fn().mockResolvedValue(null),
        findAll: jest.fn().mockResolvedValue([]),
    };
}

describe('Feature: Retrieve all principles', () => {
    let service: PrincipleService;
    let repository: jest.Mocked<IPrincipleRepository>;

    beforeEach(() => {
        repository = createMockRepository();
        service = new PrincipleService(repository);
    });

    it('Given principles exist in the repository, When getAllPrinciples is called, Then all principles are returned', async () => {
        const principles: Principle[] = [
            { principleId: 'p-1', category: 'cat-1' },
            { principleId: 'p-2', category: 'cat-2' },
        ];
        repository.findAll.mockResolvedValue(principles);

        const result = await service.getAllPrinciples();

        expect(result).toHaveLength(2);
        expect(result).toEqual(principles);
    });
});

describe('Feature: Retrieve principle by ID', () => {
    let service: PrincipleService;
    let repository: jest.Mocked<IPrincipleRepository>;

    beforeEach(() => {
        repository = createMockRepository();
        service = new PrincipleService(repository);
    });

    it('Given a principle with ID "p-1" exists, When getPrincipleById is called, Then the principle is returned', async () => {
        const principle: Principle = {
            principleId: 'p-1',
            category: 'cat',
        };
        repository.findById.mockResolvedValue(principle);

        const result = await service.getPrincipleById('p-1');

        expect(result).toEqual(principle);
        expect(repository.findById).toHaveBeenCalledWith('p-1');
    });

    it('Given no principle with the ID exists, When getPrincipleById is called, Then null is returned', async () => {
        repository.findById.mockResolvedValue(null);

        const result = await service.getPrincipleById('non-existent');

        expect(result).toBeNull();
    });
});
