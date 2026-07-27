-- Stores Collaboration-owned immutable public facts until JetStream acknowledges publication.
CREATE TYPE "CollaborationTaskOutboxStatus" AS ENUM ('PENDING', 'PUBLISHED', 'QUARANTINED');

CREATE TABLE "CollaborationTaskOutbox" (
  "eventId" UUID NOT NULL,
  "eventType" VARCHAR(120) NOT NULL,
  "eventVersion" INTEGER NOT NULL,
  "ownerService" VARCHAR(80) NOT NULL,
  "tenantId" VARCHAR(100) NOT NULL,
  "aggregateType" VARCHAR(80) NOT NULL,
  "aggregateId" UUID NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "cloudEventBody" JSONB NOT NULL,
  "status" "CollaborationTaskOutboxStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leaseToken" UUID,
  "leaseExpiresAt" TIMESTAMP(3),
  "lastErrorCode" VARCHAR(120),
  "lastErrorMessage" VARCHAR(1000),
  "publishedAt" TIMESTAMP(3),
  "quarantinedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CollaborationTaskOutbox_pkey" PRIMARY KEY ("eventId")
);

CREATE INDEX "CollaborationTaskOutbox_status_nextAttemptAt_idx" ON "CollaborationTaskOutbox"("status", "nextAttemptAt");
CREATE INDEX "CollaborationTaskOutbox_tenantId_aggregateType_aggregateId_idx" ON "CollaborationTaskOutbox"("tenantId", "aggregateType", "aggregateId");
CREATE INDEX "CollaborationTaskOutbox_leaseExpiresAt_idx" ON "CollaborationTaskOutbox"("leaseExpiresAt");
