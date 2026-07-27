DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'TenantPartyContactPointType'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'TenantPartyProfileItemType'
  ) THEN
    ALTER TYPE "TenantPartyContactPointType" RENAME TO "TenantPartyProfileItemType";
  END IF;
END $$;

ALTER TYPE "TenantPartyProfileItemType" ADD VALUE IF NOT EXISTS 'WECHAT';
ALTER TYPE "TenantPartyProfileItemType" ADD VALUE IF NOT EXISTS 'SOCIAL_PROFILE';
ALTER TYPE "TenantPartyProfileItemType" ADD VALUE IF NOT EXISTS 'MARKETPLACE_STORE';

ALTER TABLE IF EXISTS "TenantPartyContactPoint"
  RENAME TO "TenantPartyProfileItem";

ALTER TABLE IF EXISTS "TenantPartyProfileItem"
  RENAME COLUMN "contactPointType" TO "itemType";

ALTER TABLE IF EXISTS "TenantPartyProfileItem"
  ADD COLUMN IF NOT EXISTS "role" VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "status" VARCHAR(40) NOT NULL DEFAULT 'ASSERTED';

ALTER TABLE IF EXISTS "TenantPartyProfileItem"
  RENAME CONSTRAINT "TenantPartyContactPoint_pkey" TO "TenantPartyProfileItem_pkey";

ALTER TABLE IF EXISTS "TenantPartyProfileItem"
  RENAME CONSTRAINT "TenantPartyContactPoint_tenantPartyId_fkey" TO "TenantPartyProfileItem_tenantPartyId_fkey";

DROP INDEX IF EXISTS "TenantPartyContactPoint_tenantId_contactPointType_normalizedValue_idx";
DROP INDEX IF EXISTS "TenantPartyContactPoint_tenantId_tenantPartyId_idx";

CREATE INDEX IF NOT EXISTS "TenantPartyProfileItem_tenantId_itemType_normalizedValue_idx"
  ON "TenantPartyProfileItem"("tenantId", "itemType", "normalizedValue");

CREATE INDEX IF NOT EXISTS "TenantPartyProfileItem_tenantId_tenantPartyId_idx"
  ON "TenantPartyProfileItem"("tenantId", "tenantPartyId");
