ALTER TABLE "UserAccount" DROP CONSTRAINT IF EXISTS "UserAccount_tenantId_fkey";
ALTER TABLE "AccountContactAsset" DROP CONSTRAINT IF EXISTS "AccountContactAsset_tenantId_fkey";

DROP TABLE IF EXISTS "UserAccountOrgMembership";
DROP TABLE IF EXISTS "Org";
DROP TABLE IF EXISTS "Tenant";

DROP TYPE IF EXISTS "AccountOrgRelationType";
DROP TYPE IF EXISTS "OrgType";
