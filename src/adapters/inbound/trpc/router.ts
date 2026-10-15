import { router } from './trpc';
import { principleRouter } from './principle';
import { healthRouter } from './health';
import { deckRouter } from './deck';

export const appRouter = router({
    principle: principleRouter,
    health: healthRouter,
    deck: deckRouter,
});

export type AppRouter = typeof appRouter;
