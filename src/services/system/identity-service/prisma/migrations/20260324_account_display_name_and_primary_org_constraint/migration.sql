ALTER TABLE "UserAccount"
ADD COLUMN IF NOT EXISTS "displayName" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "ux_user_account_org_membership_primary_per_account"
ON "UserAccountOrgMembership" ("accountId")
WHERE "isPrimary" = true;
