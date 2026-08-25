-- Existing rows remain fail-closed until Common-owned catalog sync supplies exact scope metadata.
CREATE TYPE "PermissionScopeLevel" AS ENUM ('SYSTEM', 'TENANT');
ALTER TABLE "Permission"
  ADD COLUMN "allowedScopeLevels" "PermissionScopeLevel"[] NOT NULL DEFAULT ARRAY[]::"PermissionScopeLevel"[],
  ADD COLUMN "definitionFingerprint" TEXT NOT NULL DEFAULT '';
ALTER TYPE "Modules" ADD VALUE IF NOT EXISTS 'BROWSER_ACTIVITY_SERVICE';
