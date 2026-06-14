-- Adds tenant-scoped contact and digital evidence points for TenantParty candidate resolution.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'TenantPartyContactPointType'
  ) THEN
    CREATE TYPE "TenantPartyContactPointType" AS ENUM ('EMAIL', 'PHONE', 'WHATSAPP', 'DOMAIN', 'WEBSITE');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "TenantPartyContactPoint" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" VARCHAR(64) NOT NULL,
  "tenantPartyId" UUID NOT NULL,
  "contactPointType" "TenantPartyContactPointType" NOT NULL,
  "normalizedValue" VARCHAR(255) NOT NULL,
  "rawValue" VARCHAR(255) NOT NULL,
  "label" VARCHAR(100),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantPartyContactPoint_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TenantPartyContactPoint_tenantPartyId_fkey'
  ) THEN
    ALTER TABLE "TenantPartyContactPoint"
      ADD CONSTRAINT "TenantPartyContactPoint_tenantPartyId_fkey"
      FOREIGN KEY ("tenantPartyId") REFERENCES "TenantParty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "TenantPartyContactPoint_tenantId_contactPointType_normalizedValue_idx"
  ON "TenantPartyContactPoint"("tenantId", "contactPointType", "normalizedValue");

CREATE INDEX IF NOT EXISTS "TenantPartyContactPoint_tenantId_tenantPartyId_idx"
  ON "TenantPartyContactPoint"("tenantId", "tenantPartyId");
