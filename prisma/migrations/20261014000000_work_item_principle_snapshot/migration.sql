-- CreateTable
CREATE TABLE "WorkItemPrincipleSnapshot" (
    "installationId" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "principleNames" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkItemPrincipleSnapshot_pkey" PRIMARY KEY ("installationId","workItemId")
);
