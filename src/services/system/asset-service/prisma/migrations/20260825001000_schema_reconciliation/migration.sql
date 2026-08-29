-- CreateEnum
CREATE TYPE "AssetScopeLevel" AS ENUM ('SYSTEM', 'TENANT');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('ACCOUNT_AVATAR', 'EMPLOYEE_OFFICIAL_PHOTO');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('PENDING_BIND', 'ACTIVE', 'REPLACED', 'DELETED');

-- AlterTable
ALTER TABLE "SiteMediaAsset" ALTER COLUMN "codec" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "scopeLevel" "AssetScopeLevel" NOT NULL,
    "tenantId" TEXT,
    "ownerAccountId" TEXT,
    "ownerEmployeeId" TEXT,
    "activeEmployeeOfficialPhotoKey" TEXT,
    "category" "AssetCategory" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "checksum" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'PENDING_BIND',
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_activeEmployeeOfficialPhotoKey_key" ON "Asset"("activeEmployeeOfficialPhotoKey");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_storageKey_key" ON "Asset"("storageKey");

-- CreateIndex
CREATE INDEX "Asset_scopeLevel_tenantId_ownerAccountId_category_status_idx" ON "Asset"("scopeLevel", "tenantId", "ownerAccountId", "category", "status");

-- CreateIndex
CREATE INDEX "Asset_scopeLevel_tenantId_ownerEmployeeId_category_status_idx" ON "Asset"("scopeLevel", "tenantId", "ownerEmployeeId", "category", "status");

-- RenameForeignKey
ALTER TABLE "SiteMediaPublicationReference" RENAME CONSTRAINT "SiteMediaPublicationReference_asset_fkey" TO "SiteMediaPublicationReference_tenantId_assetId_fkey";

-- RenameIndex
ALTER INDEX "SiteMediaLifecycleOperation_kind_status_nextAttemptAt_leaseExpi" RENAME TO "SiteMediaLifecycleOperation_kind_status_nextAttemptAt_lease_idx";

-- RenameIndex
ALTER INDEX "SiteMediaLifecycleOperation_scope_key" RENAME TO "SiteMediaLifecycleOperation_tenantId_assetId_idempotencyKey_key";
