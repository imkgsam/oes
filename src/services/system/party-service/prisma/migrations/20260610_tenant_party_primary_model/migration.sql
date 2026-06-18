-- Migrates party-service from system-wide Party + TenantParty binding to tenant-scoped TenantParty.
-- The final Prisma schema no longer maps old partyId paths; partyId is only touched here to backfill and unblock migration.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE "TenantParty"
  ADD COLUMN IF NOT EXISTS "type" "PartyType",
  ADD COLUMN IF NOT EXISTS "legalName" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "displayName" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "registeredCountry" VARCHAR(50);

UPDATE "TenantParty" tp
SET
  "type" = COALESCE(tp."type", p."type"),
  "legalName" = COALESCE(tp."legalName", p."legalName"),
  "displayName" = COALESCE(tp."displayName", tp."localDisplayName", p."legalName"),
  "registeredCountry" = COALESCE(tp."registeredCountry", op."registeredCountry")
FROM "Party" p
LEFT JOIN "OrganizationParty" op ON op."partyId" = p."id"
WHERE tp."partyId" = p."id";

ALTER TABLE "TenantParty"
  ALTER COLUMN "type" SET NOT NULL,
  ALTER COLUMN "legalName" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "TenantPartyIdentifier" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" VARCHAR(64) NOT NULL,
  "tenantPartyId" UUID NOT NULL,
  "identifierType" VARCHAR(100) NOT NULL,
  "normalizedValue" VARCHAR(255) NOT NULL,
  "rawValue" VARCHAR(255) NOT NULL,
  "issuerCountryOrRegion" VARCHAR(50) NOT NULL DEFAULT '',
  "status" "IdentifierStatus" NOT NULL DEFAULT 'DECLARED',
  "effectiveFrom" TIMESTAMP(3),
  "effectiveTo" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantPartyIdentifier_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TenantPartyIdentifier_tenantPartyId_fkey'
  ) THEN
    ALTER TABLE "TenantPartyIdentifier"
      ADD CONSTRAINT "TenantPartyIdentifier_tenantPartyId_fkey"
      FOREIGN KEY ("tenantPartyId") REFERENCES "TenantParty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "TenantPartyIdentifier_tenantId_identifierType_issuerCountryOrRegion_normalizedValue_key"
  ON "TenantPartyIdentifier"("tenantId", "identifierType", "issuerCountryOrRegion", "normalizedValue");

CREATE INDEX IF NOT EXISTS "TenantPartyIdentifier_tenantId_tenantPartyId_idx"
  ON "TenantPartyIdentifier"("tenantId", "tenantPartyId");

INSERT INTO "TenantPartyIdentifier" (
  "id",
  "tenantId",
  "tenantPartyId",
  "identifierType",
  "normalizedValue",
  "rawValue",
  "issuerCountryOrRegion",
  "status",
  "effectiveFrom",
  "effectiveTo",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  tp."tenantId",
  tp."id",
  pi."identifierType",
  pi."normalizedValue",
  pi."rawValue",
  pi."issuerCountryOrRegion",
  pi."status",
  pi."effectiveFrom",
  pi."effectiveTo",
  pi."createdAt",
  pi."updatedAt"
FROM "PartyIdentifier" pi
JOIN "TenantParty" tp ON tp."partyId" = pi."partyId"
ON CONFLICT ("tenantId", "identifierType", "issuerCountryOrRegion", "normalizedValue") DO NOTHING;

UPDATE "PartyRegistrationIdempotency" pri
SET "tenantPartyId" = tp."id"
FROM "TenantParty" tp
WHERE pri."tenantPartyId" IS NULL
  AND pri."partyId" = tp."partyId";

DELETE FROM "PartyRegistrationIdempotency"
WHERE "tenantPartyId" IS NULL;

ALTER TABLE "PartyRegistrationIdempotency"
  ALTER COLUMN "tenantPartyId" SET NOT NULL;

ALTER TABLE "TenantParty"
  ALTER COLUMN "partyId" DROP NOT NULL;

ALTER TABLE "PartyRegistrationIdempotency"
  ALTER COLUMN "partyId" DROP NOT NULL;

ALTER TABLE "TenantParty"
  DROP COLUMN IF EXISTS "localDisplayName";
