-- Rename OrgUnit organizationPartyId to organizationTenantPartyId while preserving existing values.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'OrgUnit'
      AND column_name = 'organizationTenantPartyId'
  ) THEN
    ALTER TABLE "OrgUnit" ADD COLUMN "organizationTenantPartyId" UUID;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'OrgUnit'
      AND column_name = 'organizationPartyId'
  ) THEN
    UPDATE "OrgUnit"
    SET "organizationTenantPartyId" = COALESCE("organizationTenantPartyId", "organizationPartyId");

    ALTER TABLE "OrgUnit" DROP COLUMN "organizationPartyId";
  END IF;
END $$;
