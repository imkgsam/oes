CREATE TABLE "SiteAssetSiteMediaDlq" (
  "consumerName" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "bodyDigest" TEXT NOT NULL,
  "retryCount" INTEGER NOT NULL,
  "lastSafeError" TEXT NOT NULL,
  "envelope" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteAssetSiteMediaDlq_pkey" PRIMARY KEY ("consumerName", "eventId", "bodyDigest")
);
CREATE INDEX "SiteAssetSiteMediaDlq_consumerName_createdAt_idx" ON "SiteAssetSiteMediaDlq"("consumerName", "createdAt");
