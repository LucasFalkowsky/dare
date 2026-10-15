import { z } from 'zod';
import { router, publicProcedure } from './trpc';

export const principleRouter = router({
    getAll: publicProcedure.query(({ ctx }) => {
        return ctx.principlePort.getAllPrinciples();
    }),

    getById: publicProcedure
        .input(z.object({ principleId: z.string() }))
        .query(({ ctx, input }) => {
            return ctx.principlePort.getPrincipleById(input.principleId);
        }),
});
