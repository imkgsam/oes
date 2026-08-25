CREATE TYPE "UserAccountScopeLevel" AS ENUM ('SYSTEM', 'TENANT');

ALTER TABLE "UserAccount"
ADD COLUMN IF NOT EXISTS "scopeLevel" "UserAccountScopeLevel" NOT NULL DEFAULT 'TENANT';

ALTER TABLE "UserAccount"
ADD COLUMN IF NOT EXISTS "contextKey" TEXT;

UPDATE "UserAccount"
SET "contextKey" = "tenantId"
WHERE "contextKey" IS NULL;

ALTER TABLE "UserAccount"
ALTER COLUMN "contextKey" SET NOT NULL;

ALTER TABLE "UserAccount"
ALTER COLUMN "tenantId" DROP NOT NULL;

ALTER TABLE "UserAccount"
DROP CONSTRAINT IF EXISTS "UserAccount_userId_tenantId_key";

DROP INDEX IF EXISTS "UserAccount_userId_tenantId_key";

ALTER TABLE "UserAccount"
ADD CONSTRAINT "UserAccount_userId_scopeLevel_contextKey_key"
UNIQUE ("userId", "scopeLevel", "contextKey");

CREATE INDEX IF NOT EXISTS "UserAccount_scopeLevel_idx"
ON "UserAccount"("scopeLevel");
