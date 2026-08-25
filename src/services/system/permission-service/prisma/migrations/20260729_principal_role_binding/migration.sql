-- Preserve every legacy grant ID while promoting AccountRole into the canonical binding truth.
CREATE TYPE "PrincipalType" AS ENUM ('HUMAN', 'MACHINE');

CREATE TEMP TABLE "_PrincipalRoleBindingLegacySnapshot" AS
SELECT
  "id",
  "accountId",
  "roleId",
  "tenantId",
  "scopeLevel"::text AS "scopeLevel",
  "effectiveAt",
  "expiresAt"
FROM "AccountRole";

ALTER TABLE "AccountRole" RENAME TO "PrincipalRoleBinding";
ALTER TABLE "PrincipalRoleBinding" RENAME COLUMN "accountId" TO "principalId";

ALTER TABLE "PrincipalRoleBinding"
  ADD COLUMN "principalType" "PrincipalType",
  ADD COLUMN "revokedAt" TIMESTAMP(3),
  ADD COLUMN "revokedByOperatorId" TEXT,
  ADD COLUMN "revokeReason" TEXT,
  ADD COLUMN "revokeAuditEventId" TEXT,
  ADD COLUMN "createdByOperatorId" TEXT,
  ADD COLUMN "createdRequestId" TEXT,
  ADD COLUMN "createdTraceId" TEXT,
  ADD COLUMN "grantAuditEventId" TEXT,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Every legacy AccountRole remains a HUMAN grant; MACHINE is enabled only on the canonical write path.
UPDATE "PrincipalRoleBinding"
SET "principalType" = 'HUMAN'::"PrincipalType";

ALTER TABLE "PrincipalRoleBinding"
  ALTER COLUMN "principalType" SET NOT NULL,
  DROP COLUMN "accountType";

DROP INDEX IF EXISTS "AccountRole_accountId_roleId_key";
DROP INDEX IF EXISTS "AccountRole_accountId_scopeLevel_tenantId_idx";

CREATE INDEX "PrincipalRoleBinding_principalId_scopeLevel_tenantId_idx"
  ON "PrincipalRoleBinding"("principalId", "scopeLevel", "tenantId");
CREATE INDEX "PrincipalRoleBinding_roleId_revokedAt_idx"
  ON "PrincipalRoleBinding"("roleId", "revokedAt");

ALTER TABLE "PrincipalRoleBinding"
  ADD CONSTRAINT "principal_role_binding_scope_tenant_check"
    CHECK (
      ("scopeLevel" = 'SYSTEM' AND "tenantId" IS NULL)
      OR ("scopeLevel" = 'TENANT' AND "tenantId" IS NOT NULL)
    ),
  ADD CONSTRAINT "principal_role_binding_time_window_check"
    CHECK ("expiresAt" IS NULL OR "effectiveAt" IS NULL OR "effectiveAt" < "expiresAt"),
  ADD CONSTRAINT "principal_role_binding_revoke_facts_check"
    CHECK (
      ("revokedAt" IS NULL AND "revokedByOperatorId" IS NULL AND "revokeAuditEventId" IS NULL)
      OR ("revokedAt" IS NOT NULL AND "revokedByOperatorId" IS NOT NULL AND "revokeAuditEventId" IS NOT NULL)
    );

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "PrincipalRoleBinding"
  ADD CONSTRAINT "principal_role_binding_non_overlapping_window"
  EXCLUDE USING gist (
    "principalType" WITH =,
    "principalId" WITH =,
    "roleId" WITH =,
    "scopeLevel" WITH =,
    (COALESCE("tenantId", '')) WITH =,
    (tsrange(
      COALESCE("effectiveAt", '-infinity'::timestamp),
      GREATEST(
        COALESCE("effectiveAt", '-infinity'::timestamp),
        LEAST(
          COALESCE("expiresAt", 'infinity'::timestamp),
          COALESCE("revokedAt", 'infinity'::timestamp)
        )
      ),
      '[)'
    )) WITH &&
  );

-- Canonical grant coordinates and time windows are immutable after insertion; only revoke facts may close them.
CREATE OR REPLACE FUNCTION prevent_principal_role_binding_identity_mutation()
RETURNS trigger AS $$
BEGIN
  IF NEW."id" IS DISTINCT FROM OLD."id"
    OR NEW."principalType" IS DISTINCT FROM OLD."principalType"
    OR NEW."principalId" IS DISTINCT FROM OLD."principalId"
    OR NEW."roleId" IS DISTINCT FROM OLD."roleId"
    OR NEW."scopeLevel" IS DISTINCT FROM OLD."scopeLevel"
    OR NEW."tenantId" IS DISTINCT FROM OLD."tenantId"
    OR NEW."effectiveAt" IS DISTINCT FROM OLD."effectiveAt"
    OR NEW."expiresAt" IS DISTINCT FROM OLD."expiresAt"
  THEN
    RAISE EXCEPTION 'PrincipalRoleBinding grant identity and window are immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "PrincipalRoleBinding_immutable_grant"
BEFORE UPDATE ON "PrincipalRoleBinding"
FOR EACH ROW EXECUTE FUNCTION prevent_principal_role_binding_identity_mutation();

ALTER TABLE "OnboardingGrantRequest"
  ADD COLUMN "bindingIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "PrincipalRoleBindingMigrationAudit" (
  "id" TEXT NOT NULL,
  "phase" TEXT NOT NULL,
  "legacyBindingCount" INTEGER NOT NULL,
  "canonicalBindingCount" INTEGER NOT NULL,
  "parityVerified" BOOLEAN NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrincipalRoleBindingMigrationAudit_pkey" PRIMARY KEY ("id")
);

-- Unknown binding IDs receive a stable opaque outcome so retries remain idempotent without enumerating grants.
CREATE TABLE "PrincipalRoleBindingRevokeTombstone" (
  "bindingId" TEXT NOT NULL,
  "revokedAt" TIMESTAMP(3) NOT NULL,
  "revokedByOperatorId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "opaqueRevokeOutcomeId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrincipalRoleBindingRevokeTombstone_pkey" PRIMARY KEY ("bindingId")
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "_PrincipalRoleBindingLegacySnapshot" legacy
    FULL OUTER JOIN "PrincipalRoleBinding" canonical
      ON canonical."id" = legacy."id"
    WHERE legacy."id" IS NULL
      OR canonical."id" IS NULL
      OR canonical."principalType" <> 'HUMAN'
      OR canonical."principalId" IS DISTINCT FROM legacy."accountId"
      OR canonical."roleId" IS DISTINCT FROM legacy."roleId"
      OR canonical."tenantId" IS DISTINCT FROM legacy."tenantId"
      OR canonical."scopeLevel"::text IS DISTINCT FROM legacy."scopeLevel"
      OR canonical."effectiveAt" IS DISTINCT FROM legacy."effectiveAt"
      OR canonical."expiresAt" IS DISTINCT FROM legacy."expiresAt"
  ) THEN
    RAISE EXCEPTION 'PrincipalRoleBinding backfill parity failed';
  END IF;
END;
$$;

INSERT INTO "PrincipalRoleBindingMigrationAudit" (
  "id",
  "phase",
  "legacyBindingCount",
  "canonicalBindingCount",
  "parityVerified"
)
SELECT
  '20260729_principal_role_binding_backfill',
  'BACKFILL_CUTOVER',
  (SELECT COUNT(*) FROM "_PrincipalRoleBindingLegacySnapshot"),
  (SELECT COUNT(*) FROM "PrincipalRoleBinding"),
  true;
