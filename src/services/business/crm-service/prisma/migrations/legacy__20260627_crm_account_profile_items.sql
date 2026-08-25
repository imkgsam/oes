DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'CrmAccountProfileItemType'
  ) THEN
    CREATE TYPE "CrmAccountProfileItemType" AS ENUM (
      'DOMAIN',
      'WEBSITE',
      'EMAIL',
      'PHONE',
      'WHATSAPP',
      'WECHAT',
      'SOCIAL_PROFILE',
      'MARKETPLACE_STORE',
      'IDENTIFIER',
      'ADDRESS',
      'BRAND_NAME',
      'COMPANY_NAME'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'CrmAccountProfileItemStatus'
  ) THEN
    CREATE TYPE "CrmAccountProfileItemStatus" AS ENUM (
      'ACTIVE',
      'REJECTED',
      'ARCHIVED',
      'PROMOTED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "CrmAccountProfileItem" (
  "id" UUID NOT NULL,
  "tenantId" VARCHAR(128) NOT NULL,
  "crmAccountId" UUID NOT NULL,
  "itemType" "CrmAccountProfileItemType" NOT NULL,
  "normalizedValue" VARCHAR(255) NOT NULL,
  "rawValue" VARCHAR(255) NOT NULL,
  "label" VARCHAR(100),
  "role" VARCHAR(80),
  "status" "CrmAccountProfileItemStatus" NOT NULL DEFAULT 'ACTIVE',
  "sourceRecordId" UUID,
  "promotedTargetType" VARCHAR(80),
  "promotedTargetId" VARCHAR(128),
  "promotedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CrmAccountProfileItem_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CrmAccountProfileItem_crmAccountId_fkey'
  ) THEN
    ALTER TABLE "CrmAccountProfileItem"
      ADD CONSTRAINT "CrmAccountProfileItem_crmAccountId_fkey"
      FOREIGN KEY ("crmAccountId") REFERENCES "CrmAccount"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "CrmAccountProfileItem_tenantId_crmAccountId_status_idx"
  ON "CrmAccountProfileItem"("tenantId", "crmAccountId", "status");

CREATE INDEX IF NOT EXISTS "CrmAccountProfileItem_tenantId_itemType_normalizedValue_idx"
  ON "CrmAccountProfileItem"("tenantId", "itemType", "normalizedValue");
