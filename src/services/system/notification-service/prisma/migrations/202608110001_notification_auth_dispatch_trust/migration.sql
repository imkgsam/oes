-- Auth dispatch is SYSTEM-scoped: it keeps no synthetic tenant and moves secrets to an encrypted provider outbox.
ALTER TABLE "NotificationDispatch" ADD COLUMN "machinePrincipal" TEXT NOT NULL DEFAULT 'legacy-untrusted';
ALTER TABLE "NotificationDispatch" ALTER COLUMN "tenantId" DROP NOT NULL;
ALTER TABLE "NotificationDispatch" ADD COLUMN "commandDigest" TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE "NotificationDispatch" ADD COLUMN "protectedPayload" TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE "NotificationDispatch" ADD COLUMN "protectedPayloadExpiresAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "NotificationDispatch" DROP CONSTRAINT IF EXISTS "NotificationDispatch_idempotencyKey_key";
DROP INDEX IF EXISTS "NotificationDispatch_idempotencyKey_key";
CREATE UNIQUE INDEX "NotificationDispatch_sourceService_machinePrincipal_channel_idempotencyKey_key" ON "NotificationDispatch"("sourceService", "machinePrincipal", "channel", "idempotencyKey");

CREATE TABLE "NotificationDispatchAudit" (
  "id" TEXT NOT NULL,
  "dispatchId" TEXT NOT NULL,
  "sourceService" TEXT NOT NULL,
  "machinePrincipal" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "category" "NotificationCategory" NOT NULL,
  "templateKey" TEXT NOT NULL,
  "idempotencyRef" TEXT NOT NULL,
  "recipientFingerprint" TEXT NOT NULL,
  "traceId" TEXT,
  "requestId" TEXT,
  "result" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationDispatchAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NotificationDispatchAudit_dispatchId_createdAt_idx" ON "NotificationDispatchAudit"("dispatchId", "createdAt");
ALTER TABLE "NotificationDispatchAudit" ADD CONSTRAINT "NotificationDispatchAudit_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "NotificationDispatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TYPE "NotificationProviderOutboxStatus" AS ENUM ('PENDING', 'RETRYING', 'DELIVERED', 'TERMINAL', 'EXPIRED');
CREATE TABLE "NotificationProviderOutbox" (
  "id" TEXT NOT NULL,
  "dispatchId" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "encryptedPayload" TEXT NOT NULL,
  "payloadExpiresAt" TIMESTAMP(3) NOT NULL,
  "status" "NotificationProviderOutboxStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "terminalReason" TEXT,
  "leaseOwner" TEXT,
  "leaseExpiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationProviderOutbox_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotificationProviderOutbox_dispatchId_key" ON "NotificationProviderOutbox"("dispatchId");
CREATE INDEX "NotificationProviderOutbox_status_nextAttemptAt_idx" ON "NotificationProviderOutbox"("status", "nextAttemptAt");
ALTER TABLE "NotificationProviderOutbox" ADD CONSTRAINT "NotificationProviderOutbox_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "NotificationDispatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
