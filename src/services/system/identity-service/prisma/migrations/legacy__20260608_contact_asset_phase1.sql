ALTER TYPE "AccountContactAssetType" ADD VALUE IF NOT EXISTS 'WECHAT';
ALTER TYPE "AccountContactAssetType" ADD VALUE IF NOT EXISTS 'WHATSAPP';
ALTER TYPE "AccountContactAssetType" ADD VALUE IF NOT EXISTS 'EXTERNAL_COMMUNICATION_ACCOUNT';
ALTER TYPE "AccountContactAssetType" ADD VALUE IF NOT EXISTS 'OTHER_SOCIAL';

CREATE TYPE "AccountContactAssetOwnership" AS ENUM ('COMPANY_CONTROLLED', 'EMPLOYEE_OWNED');

ALTER TYPE "AccountContactAssetStatus" ADD VALUE IF NOT EXISTS 'PENDING_HANDOVER';
ALTER TYPE "AccountContactAssetStatus" ADD VALUE IF NOT EXISTS 'RELEASED';

ALTER TABLE "AccountContactAsset"
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "employeeId" TEXT,
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "displayName" TEXT,
  ADD COLUMN "ownership" "AccountContactAssetOwnership" NOT NULL DEFAULT 'COMPANY_CONTROLLED',
  ADD COLUMN "usage" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "releasedAt" TIMESTAMP(3);

CREATE INDEX "AccountContactAsset_tenantId_accountId_idx" ON "AccountContactAsset"("tenantId", "accountId");
CREATE INDEX "AccountContactAsset_employeeId_idx" ON "AccountContactAsset"("employeeId");
