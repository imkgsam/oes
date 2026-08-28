-- AlterTable
ALTER TABLE "AssetSiteMediaAvailabilityProjection" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SiteCapabilityRegistrationStream" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "SiteContentCategory_tenantId_siteId_deletedAt_idx" ON "SiteContentCategory"("tenantId", "siteId", "deletedAt");

-- RenameIndex
ALTER INDEX "SitePublicViewRevision_siteId_resourceType_resourceId_locale_pu" RENAME TO "SitePublicViewRevision_siteId_resourceType_resourceId_local_key";
