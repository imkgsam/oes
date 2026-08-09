ALTER TABLE "SiteMediaLifecycleOperation" ADD COLUMN "leaseExpiresAt" TIMESTAMP(3);
CREATE INDEX "SiteMediaLifecycleOperation_kind_status_nextAttemptAt_leaseExpiresAt_idx" ON "SiteMediaLifecycleOperation"("kind", "status", "nextAttemptAt", "leaseExpiresAt");
