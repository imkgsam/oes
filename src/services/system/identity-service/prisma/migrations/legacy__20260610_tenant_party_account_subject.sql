ALTER TABLE "UserAccount"
  ADD COLUMN IF NOT EXISTS "tenantPartyId" UUID;

CREATE INDEX IF NOT EXISTS "UserAccount_tenantId_tenantPartyId_idx"
ON "UserAccount"("tenantId", "tenantPartyId");

ALTER TABLE "User"
  DROP COLUMN IF EXISTS "partyId";
