export interface IDeckWorkItemSyncPort {
  syncDeckToWorkItems(deckId: string, locale?: string): Promise<void>;

  /**
   * Rewrites the comments of a single principle after its project
   * interpretation changed. Scoped to that principle: the interpretation is
   * what the comment body says, so every work item already carrying it has to
   * be brought up to date, and nothing else has to be touched.
   */
  syncPrincipleContextToWorkItems(deckId: string, principleId: string, locale?: string): Promise<void>;
}
