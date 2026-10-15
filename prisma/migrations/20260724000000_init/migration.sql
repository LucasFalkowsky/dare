-- CreateTable
CREATE TABLE "Installation" (
    "installationId" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "platform" TEXT NOT NULL,

    CONSTRAINT "Installation_pkey" PRIMARY KEY ("installationId")
);

-- CreateTable
CREATE TABLE "Principle" (
    "principleId" TEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "Principle_pkey" PRIMARY KEY ("principleId")
);

-- CreateTable
CREATE TABLE "Deck" (
    "deckId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("deckId")
);

-- CreateTable
CREATE TABLE "DeckPrinciple" (
    "deckId" TEXT NOT NULL,
    "principleId" TEXT NOT NULL,
    "projectContext" TEXT,
    "rank" INTEGER,

    CONSTRAINT "DeckPrinciple_pkey" PRIMARY KEY ("deckId","principleId")
);

-- CreateTable
CREATE TABLE "PrincipleWorkItemMapping" (
    "principleId" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,

    CONSTRAINT "PrincipleWorkItemMapping_pkey" PRIMARY KEY ("principleId","installationId","workItemId")
);

-- AddForeignKey
ALTER TABLE "DeckPrinciple" ADD CONSTRAINT "DeckPrinciple_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("deckId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckPrinciple" ADD CONSTRAINT "DeckPrinciple_principleId_fkey" FOREIGN KEY ("principleId") REFERENCES "Principle"("principleId") ON DELETE RESTRICT ON UPDATE CASCADE;
