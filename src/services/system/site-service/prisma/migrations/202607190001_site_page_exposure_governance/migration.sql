-- Persist Storefront discovery independently from operator-owned SitePage governance.
CREATE TABLE "SitePageCapability" (
    "id" UUID NOT NULL,
    "siteId" VARCHAR(128) NOT NULL,
    "pageKey" VARCHAR(128) NOT NULL,
    "supportedLocales" JSONB NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "firstDiscoveredAt" TIMESTAMP(3) NOT NULL,
    "lastDiscoveredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SitePageCapability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SitePageGovernance" (
    "id" UUID NOT NULL,
    "siteId" VARCHAR(128) NOT NULL,
    "pageKey" VARCHAR(128) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "indexable" BOOLEAN NOT NULL DEFAULT false,
    "syncStatus" VARCHAR(32) NOT NULL DEFAULT 'synced',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SitePageGovernance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiteCapabilityRegistration" (
    "id" UUID NOT NULL,
    "siteId" VARCHAR(128) NOT NULL,
    "clientId" VARCHAR(128) NOT NULL,
    "idempotencyKey" VARCHAR(255) NOT NULL,
    "manifestHash" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteCapabilityRegistration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiteExposureDraft" (
    "siteId" VARCHAR(128) NOT NULL,
    "syncStatus" VARCHAR(32) NOT NULL DEFAULT 'synced',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteExposureDraft_pkey" PRIMARY KEY ("siteId")
);

CREATE TABLE "SiteExposurePublication" (
    "id" UUID NOT NULL,
    "siteId" VARCHAR(128) NOT NULL,
    "publishVersion" INTEGER NOT NULL,
    "defaultLocale" VARCHAR(32) NOT NULL,
    "activeLocales" JSONB NOT NULL,
    "pages" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteExposurePublication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SitePageCapability_siteId_pageKey_key" ON "SitePageCapability"("siteId", "pageKey");
CREATE INDEX "SitePageCapability_siteId_available_idx" ON "SitePageCapability"("siteId", "available");
CREATE UNIQUE INDEX "SitePageGovernance_siteId_pageKey_key" ON "SitePageGovernance"("siteId", "pageKey");
CREATE INDEX "SitePageGovernance_siteId_enabled_syncStatus_idx" ON "SitePageGovernance"("siteId", "enabled", "syncStatus");
CREATE UNIQUE INDEX "SiteCapabilityRegistration_siteId_idempotencyKey_key" ON "SiteCapabilityRegistration"("siteId", "idempotencyKey");
CREATE INDEX "SiteCapabilityRegistration_siteId_createdAt_idx" ON "SiteCapabilityRegistration"("siteId", "createdAt");
CREATE UNIQUE INDEX "SiteExposurePublication_siteId_publishVersion_key" ON "SiteExposurePublication"("siteId", "publishVersion");
CREATE INDEX "SiteExposurePublication_siteId_publishVersion_idx" ON "SiteExposurePublication"("siteId", "publishVersion");

ALTER TABLE "SitePageCapability" ADD CONSTRAINT "SitePageCapability_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SitePageGovernance" ADD CONSTRAINT "SitePageGovernance_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteCapabilityRegistration" ADD CONSTRAINT "SiteCapabilityRegistration_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteExposureDraft" ADD CONSTRAINT "SiteExposureDraft_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteExposurePublication" ADD CONSTRAINT "SiteExposurePublication_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing sites begin with no pending exposure change until an operator changes page or locale governance.
INSERT INTO "SiteExposureDraft" ("siteId", "syncStatus", "updatedAt")
SELECT "siteId", 'synced', CURRENT_TIMESTAMP FROM "Site";
