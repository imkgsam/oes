DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccountContactAssetType') THEN
    CREATE TYPE "AccountContactAssetType" AS ENUM ('WORK_EMAIL', 'WORK_PHONE');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccountContactAssetStatus') THEN
    CREATE TYPE "AccountContactAssetStatus" AS ENUM ('ACTIVE', 'DISABLED', 'REVOKED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AccountContactAsset" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "type" "AccountContactAssetType" NOT NULL,
  "value" TEXT NOT NULL,
  "status" "AccountContactAssetStatus" NOT NULL DEFAULT 'ACTIVE',
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "assignedBy" TEXT NOT NULL,
  "revokedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AccountContactAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AccountContactAsset_accountId_type_status_idx"
ON "AccountContactAsset"("accountId", "type", "status");

CREATE INDEX IF NOT EXISTS "AccountContactAsset_tenantId_type_value_idx"
ON "AccountContactAsset"("tenantId", "type", "value");

CREATE INDEX IF NOT EXISTS "AccountContactAsset_accountId_type_isPrimary_idx"
ON "AccountContactAsset"("accountId", "type", "isPrimary");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'AccountContactAsset_tenantId_fkey'
  ) THEN
    ALTER TABLE "AccountContactAsset"
    ADD CONSTRAINT "AccountContactAsset_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'AccountContactAsset_accountId_fkey'
  ) THEN
    ALTER TABLE "AccountContactAsset"
    ADD CONSTRAINT "AccountContactAsset_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "UserAccount"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
