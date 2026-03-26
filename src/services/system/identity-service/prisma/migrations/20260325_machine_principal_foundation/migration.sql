DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MachinePrincipalScopeLevel') THEN
    CREATE TYPE "MachinePrincipalScopeLevel" AS ENUM ('SYSTEM', 'TENANT');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MachinePrincipalType') THEN
    CREATE TYPE "MachinePrincipalType" AS ENUM (
      'INTERNAL_SERVICE',
      'EXTERNAL_INTEGRATION',
      'AI_AGENT',
      'AUTOMATION_BOT'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MachinePrincipalStatus') THEN
    CREATE TYPE "MachinePrincipalStatus" AS ENUM ('ACTIVE', 'DISABLED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ServiceAccount" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "scopeLevel" "MachinePrincipalScopeLevel" NOT NULL,
  "type" "MachinePrincipalType" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "MachinePrincipalStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  "disabledAt" TIMESTAMP(3),
  "disabledBy" TEXT,

  CONSTRAINT "ServiceAccount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ServiceAccount_tenantId_idx"
ON "ServiceAccount"("tenantId");

CREATE INDEX IF NOT EXISTS "ServiceAccount_scopeLevel_idx"
ON "ServiceAccount"("scopeLevel");

CREATE INDEX IF NOT EXISTS "ServiceAccount_type_idx"
ON "ServiceAccount"("type");

CREATE INDEX IF NOT EXISTS "ServiceAccount_status_idx"
ON "ServiceAccount"("status");
