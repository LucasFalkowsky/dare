import { PrincipleController } from './PrincipleController';
import { IPrinciplePort } from '../../../domain/ports/inbound/IPrinciplePort';
import { NotFoundException } from '@nestjs/common';

function createMockPort(): jest.Mocked<IPrinciplePort> {
    return {
        getAllPrinciples: jest.fn().mockResolvedValue([]),
        getPrincipleById: jest.fn().mockResolvedValue(null),
    };
}

describe('Feature: Retrieve all principles via REST', () => {
    let controller: PrincipleController;
    let port: jest.Mocked<IPrinciplePort>;

    beforeEach(() => {
        port = createMockPort();
        controller = new PrincipleController(port);
    });

    it('Given principles exist, When GET /principles is called, Then all principles are returned', async () => {
        const principles = [
            { principleId: 'p-1', category: 'Data protection' },
        ];
        port.getAllPrinciples.mockResolvedValue(principles);

        const result = await controller.getAll();

        expect(result).toEqual(principles);
        expect(port.getAllPrinciples).toHaveBeenCalledTimes(1);
    });
});

describe('Feature: Retrieve principle by ID via REST', () => {
    let controller: PrincipleController;
    let port: jest.Mocked<IPrinciplePort>;

    beforeEach(() => {
        port = createMockPort();
        controller = new PrincipleController(port);
    });

    it('Given a principle with ID "p-1" exists, When GET /principles/p-1 is called, Then the principle is returned', async () => {
        const principle = { principleId: 'p-1', category: 'Data protection' };
        port.getPrincipleById.mockResolvedValue(principle);

        const result = await controller.getById('p-1');

        expect(result).toEqual(principle);
        expect(port.getPrincipleById).toHaveBeenCalledWith('p-1');
    });

    it('Given no principle with the ID exists, When GET /principles/non-existent is called, Then a NotFoundException is thrown', async () => {
        port.getPrincipleById.mockResolvedValue(null);

        await expect(controller.getById('non-existent')).rejects.toThrow(NotFoundException);
    });
});
