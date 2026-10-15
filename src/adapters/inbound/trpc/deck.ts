import { z } from 'zod';
import { router, publicProcedure } from './trpc';

export const deckRouter = router({
    create: publicProcedure
        .input(
            z.object({
                name: z.string().min(1),
                description: z.string().optional(),
            }),
        )
        .mutation(({ ctx, input }) => {
            return ctx.deckPort.createDeck(input);
        }),

    getLatest: publicProcedure
        .query(({ ctx }) => {
            return ctx.deckPort.getLatestDeck();
        }),

    getById: publicProcedure
        .input(z.object({ deckId: z.string().min(1) }))
        .query(({ ctx, input }) => {
            return ctx.deckPort.getDeckById(input.deckId);
        }),

    update: publicProcedure
        .input(
            z.object({
                deckId: z.string().min(1),
                name: z.string().min(1),
                description: z.string().optional(),
            }),
        )
        .mutation(({ ctx, input }) => {
            return ctx.deckPort.updateDeck(input.deckId, { name: input.name, description: input.description });
        }),

    delete: publicProcedure
        .input(z.object({ deckId: z.string().min(1) }))
        .mutation(({ ctx, input }) => {
            return ctx.deckPort.deleteDeck(input.deckId);
        }),

    getPrinciples: publicProcedure
        .input(z.object({ deckId: z.string().min(1) }))
        .query(({ ctx, input }) => {
            return ctx.deckPort.getDeckPrinciples(input.deckId);
        }),

    addPrinciple: publicProcedure
        .input(
            z.object({
                deckId: z.string().min(1),
                principleId: z.string().min(1),
                projectContext: z.string().optional(),
            }),
        )
        .mutation(({ ctx, input }) => {
            return ctx.deckPort.addPrincipleToDeck(input.deckId, input.principleId, input.projectContext);
        }),

    removePrinciple: publicProcedure
        .input(
            z.object({
                deckId: z.string().min(1),
                principleId: z.string().min(1),
            }),
        )
        .mutation(({ ctx, input }) => {
            return ctx.deckPort.removePrincipleFromDeck(input.deckId, input.principleId);
        }),

    updateProjectContext: publicProcedure
        .input(
            z.object({
                deckId: z.string().min(1),
                principleId: z.string().min(1),
                projectContext: z.string().min(1),
                locale: z.string().optional(),
}),
        )
        .mutation(({ ctx, input }) => {
            return ctx.deckPort.updateProjectContext(input.deckId, input.principleId, input.projectContext, input.locale);
        }),

    rankPrinciples: publicProcedure
        .input(
            z.object({
                deckId: z.string().min(1),
                rankings: z.array(
                    z.object({
                        principleId: z.string().min(1),
                        rank: z.number().int().min(0),
                    }),
                ),
                locale: z.string().optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            await ctx.deckPort.rankPrinciples(input.deckId, input.rankings, input.locale);
        }),
});
