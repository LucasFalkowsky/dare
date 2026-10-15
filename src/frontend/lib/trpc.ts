import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../adapters/inbound/trpc/router';

export const trpc = createTRPCReact<AppRouter>();
