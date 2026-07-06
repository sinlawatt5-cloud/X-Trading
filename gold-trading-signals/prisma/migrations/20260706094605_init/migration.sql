-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "entry" REAL NOT NULL,
    "takeProfit" REAL NOT NULL,
    "stopLoss" REAL NOT NULL,
    "confidence" REAL NOT NULL,
    "confluence" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "analysis" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "signalId" TEXT,
    "date" DATETIME NOT NULL,
    "symbol" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "entry" REAL NOT NULL,
    "exit" REAL NOT NULL,
    "stopLoss" REAL NOT NULL,
    "takeProfit" REAL NOT NULL,
    "pips" REAL NOT NULL,
    "pnl" REAL NOT NULL,
    "notes" TEXT,
    "screenshot" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalEntry_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "llmProvider" TEXT NOT NULL DEFAULT 'anthropic',
    "llmApiKey" TEXT,
    "marketDataProvider" TEXT NOT NULL DEFAULT 'twelvedata',
    "marketDataApiKey" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "cronEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cronInterval" INTEGER NOT NULL DEFAULT 15,
    "minConfidence" REAL NOT NULL DEFAULT 70,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_signalId_key" ON "JournalEntry"("signalId");
