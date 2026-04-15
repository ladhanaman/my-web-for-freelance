-- CreateTable
CREATE TABLE "ParallaxSession" (
    "id" TEXT NOT NULL,
    "userAgent" TEXT,
    "language" TEXT,
    "timezone" TEXT,
    "platform" TEXT,
    "viewportWidth" INTEGER,
    "viewportHeight" INTEGER,
    "screenWidth" INTEGER,
    "screenHeight" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParallaxSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParallaxMatchCycle" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "promptMessage" TEXT NOT NULL,
    "assistantReply" TEXT NOT NULL,
    "rankedPoemIds" TEXT[],
    "selectedPoemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParallaxMatchCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParallaxChatTurn" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "matchCycleId" TEXT,
    "userMessage" TEXT NOT NULL,
    "assistantReply" TEXT NOT NULL,
    "intent" JSONB,
    "nextAction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParallaxChatTurn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParallaxSession_updatedAt_idx" ON "ParallaxSession"("updatedAt");

-- CreateIndex
CREATE INDEX "ParallaxMatchCycle_sessionId_createdAt_idx" ON "ParallaxMatchCycle"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "ParallaxChatTurn_sessionId_createdAt_idx" ON "ParallaxChatTurn"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "ParallaxChatTurn_matchCycleId_idx" ON "ParallaxChatTurn"("matchCycleId");

-- AddForeignKey
ALTER TABLE "ParallaxMatchCycle" ADD CONSTRAINT "ParallaxMatchCycle_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ParallaxSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParallaxChatTurn" ADD CONSTRAINT "ParallaxChatTurn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ParallaxSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParallaxChatTurn" ADD CONSTRAINT "ParallaxChatTurn_matchCycleId_fkey" FOREIGN KEY ("matchCycleId") REFERENCES "ParallaxMatchCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
