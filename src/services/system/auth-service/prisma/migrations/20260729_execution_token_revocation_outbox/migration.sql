CREATE TABLE "ExecutionTokenRevocation" (
  "selectorKind" TEXT NOT NULL,
  "selectorRef" TEXT NOT NULL,
  "revocationVersion" INTEGER NOT NULL,
  "effectiveAt" TIMESTAMP(3) NOT NULL,
  "denyUntil" TIMESTAMP(3) NOT NULL,
  "reasonCode" TEXT NOT NULL,
  "auditRef" TEXT NOT NULL,
  "traceId" TEXT NOT NULL,
  "correlationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExecutionTokenRevocation_pkey" PRIMARY KEY ("selectorKind", "selectorRef")
);

CREATE TABLE "AuthEventOutbox" (
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventVersion" INTEGER NOT NULL,
  "payload" JSONB NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthEventOutbox_pkey" PRIMARY KEY ("eventId")
);

CREATE INDEX "AuthEventOutbox_eventType_occurredAt_idx" ON "AuthEventOutbox"("eventType", "occurredAt");
