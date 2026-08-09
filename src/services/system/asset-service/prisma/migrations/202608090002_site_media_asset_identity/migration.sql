CREATE TABLE "SiteMediaAsset" (
  "assetId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "ownerSubject" TEXT NOT NULL,
  "mediaKind" TEXT NOT NULL,
  "lifecycleStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
  "deliveryStatus" TEXT NOT NULL DEFAULT 'LOCAL_ONLY',
  "storageKey" TEXT NOT NULL,
  "immutablePublicUrl" TEXT,
  "checksum" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "contentType" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "availabilityVersion" BIGINT NOT NULL DEFAULT 1,
  "protectedReferenceCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteMediaAsset_pkey" PRIMARY KEY ("assetId")
);
CREATE UNIQUE INDEX "SiteMediaAsset_storageKey_key" ON "SiteMediaAsset"("storageKey");
CREATE UNIQUE INDEX "SiteMediaAsset_tenantId_siteId_idempotencyKey_key" ON "SiteMediaAsset"("tenantId", "siteId", "idempotencyKey");
CREATE INDEX "SiteMediaAsset_tenantId_siteId_lifecycleStatus_idx" ON "SiteMediaAsset"("tenantId", "siteId", "lifecycleStatus");
CREATE INDEX "SiteMediaAsset_tenantId_assetId_idx" ON "SiteMediaAsset"("tenantId", "assetId");

CREATE TABLE "SiteMediaPublicationReference" (
  "tenantId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "publishVersion" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteMediaPublicationReference_pkey" PRIMARY KEY ("tenantId", "siteId", "publishVersion", "assetId")
);
CREATE INDEX "SiteMediaPublicationReference_tenantId_assetId_idx" ON "SiteMediaPublicationReference"("tenantId", "assetId");
