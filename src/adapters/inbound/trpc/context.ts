import type { IPrinciplePort } from '../../../domain/ports/inbound/IPrinciplePort';
import type { IDeckPort } from '../../../domain/ports/inbound/IDeckPort';

export interface Context {
    principlePort: IPrinciplePort;
    deckPort: IDeckPort;
}
