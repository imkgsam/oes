DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'APIKeyStatus') THEN
    CREATE TYPE "APIKeyStatus" AS ENUM ('ACTIVE', 'REVOKED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "APIKey" (
  "id" TEXT NOT NULL,
  "serviceAccountId" TEXT NOT NULL,
  "keyCode" TEXT NOT NULL,
  "hashedValue" TEXT NOT NULL,
  "status" "APIKeyStatus" NOT NULL DEFAULT 'ACTIVE',
  "expiresAt" TIMESTAMP(3),
  "lastUsedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  "revokedAt" TIMESTAMP(3),
  "revokedBy" TEXT,

  CONSTRAINT "APIKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "APIKey_keyCode_key"
ON "APIKey"("keyCode");

CREATE INDEX IF NOT EXISTS "APIKey_serviceAccountId_status_idx"
ON "APIKey"("serviceAccountId", "status");

CREATE INDEX IF NOT EXISTS "APIKey_expiresAt_idx"
ON "APIKey"("expiresAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'APIKey_serviceAccountId_fkey'
  ) THEN
    ALTER TABLE "APIKey"
    ADD CONSTRAINT "APIKey_serviceAccountId_fkey"
    FOREIGN KEY ("serviceAccountId") REFERENCES "ServiceAccount"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
