CREATE TABLE "SiteMediaDeliveryBinding" (
  "tenantId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'LOCAL_ONLY',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteMediaDeliveryBinding_pkey" PRIMARY KEY ("tenantId", "siteId")
);
CREATE TABLE "SiteMediaLifecycleOperation" (
  "operationId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "kind" TEXT NOT NULL DEFAULT 'TAKEDOWN_PURGE',
  "immutableTargetUrl" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "providerRequestId" TEXT,
  "lastSafeError" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteMediaLifecycleOperation_pkey" PRIMARY KEY ("operationId"),
  CONSTRAINT "SiteMediaLifecycleOperation_scope_key" UNIQUE ("tenantId", "assetId", "idempotencyKey")
);
CREATE TABLE "AssetEventOutbox" (
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssetEventOutbox_pkey" PRIMARY KEY ("eventId")
);
CREATE INDEX "AssetEventOutbox_status_nextAttemptAt_idx" ON "AssetEventOutbox"("status", "nextAttemptAt");
