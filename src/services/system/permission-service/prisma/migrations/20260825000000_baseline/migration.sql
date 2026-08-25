-- CreateEnum
CREATE TYPE "PermissionKind" AS ENUM ('BUSINESS', 'INTERNAL');

-- CreateEnum
CREATE TYPE "PermissionScopeLevel" AS ENUM ('SYSTEM', 'TENANT');

-- CreateEnum
CREATE TYPE "Modules" AS ENUM ('PERMISSION_SERVICE', 'AUTH_SERVICE', 'COLLABORATION_SERVICE', 'TERMINAL_DEVICE_SERVICE', 'IDENTITY_SERVICE', 'TENANT_ORG_SERVICE', 'HR_SERVICE', 'ITEM_MASTER_SERVICE', 'CRM_SERVICE', 'SRM_SERVICE', 'SALES_SERVICE', 'PROCUREMENT_SERVICE', 'FINANCE_SERVICE', 'PUBLIC_ENTRY_SERVICE', 'PARTY_SERVICE', 'WMS_SERVICE', 'MES_SERVICE', 'SITE_SERVICE', 'ASSET_SERVICE', 'NOTIFICATION_SERVICE', 'BROWSER_ACTIVITY_SERVICE');

-- CreateEnum
CREATE TYPE "PrincipalType" AS ENUM ('HUMAN', 'MACHINE');

-- CreateEnum
CREATE TYPE "RoleKind" AS ENUM ('SYSTEM_TEMPLATE', 'SYSTEM_INSTANCE', 'TENANT_INSTANCE');

-- CreateEnum
CREATE TYPE "ScopeLevel" AS ENUM ('SYSTEM', 'TENANT');

-- CreateEnum
CREATE TYPE "PolicyEffect" AS ENUM ('ALLOW', 'DENY');

-- CreateEnum
CREATE TYPE "PolicySubjectType" AS ENUM ('ROLE', 'ACCOUNT', 'ANY');

-- CreateEnum
CREATE TYPE "PolicyInstanceSubjectSelectorType" AS ENUM ('ROLE', 'ACCOUNT', 'TENANT_WIDE');

-- CreateEnum
CREATE TYPE "EvaluationMode" AS ENUM ('RBAC', 'RBAC_ABAC');

-- CreateEnum
CREATE TYPE "AuthorizationDecision" AS ENUM ('ALLOW', 'DENY');

-- CreateEnum
CREATE TYPE "OnboardingGrantStatus" AS ENUM ('PENDING', 'SUCCEEDED');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "scopeKey" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" "RoleKind" NOT NULL,
    "templateRoleId" TEXT,
    "allowTenantPermissionOverride" BOOLEAN NOT NULL DEFAULT true,
    "isProtected" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleTerminalAccess" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "allowedTerminals" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleTerminalAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountTerminalAccessOverride" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "scopeLevel" "ScopeLevel" NOT NULL,
    "tenantId" TEXT,
    "allowedTerminals" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountTerminalAccessOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "module" "Modules" NOT NULL,
    "kind" "PermissionKind" NOT NULL DEFAULT 'BUSINESS',
    "externalApiEligible" BOOLEAN NOT NULL DEFAULT false,
    "allowedScopeLevels" "PermissionScopeLevel"[] DEFAULT ARRAY[]::"PermissionScopeLevel"[],
    "definitionFingerprint" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrincipalRoleBinding" (
    "id" TEXT NOT NULL,
    "principalType" "PrincipalType" NOT NULL,
    "principalId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "tenantId" TEXT,
    "scopeLevel" "ScopeLevel" NOT NULL DEFAULT 'TENANT',
    "effectiveAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedByOperatorId" TEXT,
    "revokeReason" TEXT,
    "revokeAuditEventId" TEXT,
    "createdByOperatorId" TEXT,
    "createdRequestId" TEXT,
    "createdTraceId" TEXT,
    "grantAuditEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrincipalRoleBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingGrantRequest" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "roleIds" TEXT[],
    "bindingIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fingerprint" TEXT NOT NULL,
    "status" "OnboardingGrantStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingGrantRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrincipalRoleBindingMigrationAudit" (
    "id" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "legacyBindingCount" INTEGER NOT NULL,
    "canonicalBindingCount" INTEGER NOT NULL,
    "parityVerified" BOOLEAN NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrincipalRoleBindingMigrationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrincipalRoleBindingRevokeTombstone" (
    "bindingId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3) NOT NULL,
    "revokedByOperatorId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "opaqueRevokeOutcomeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrincipalRoleBindingRevokeTombstone_pkey" PRIMARY KEY ("bindingId")
);

-- CreateTable
CREATE TABLE "NavigationEntry" (
    "id" TEXT NOT NULL,
    "entryKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "featureKey" TEXT,
    "supportedTerminals" JSONB NOT NULL,
    "registryPriority" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "entryType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleNavigationVisibility" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "entryKey" TEXT NOT NULL,
    "terminal" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RoleNavigationVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleLandingPolicy" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "terminal" TEXT NOT NULL,
    "defaultEntryKey" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RoleLandingPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tenantId" TEXT,
    "effect" "PolicyEffect" NOT NULL,
    "subjectType" "PolicySubjectType" NOT NULL DEFAULT 'ANY',
    "subjectId" TEXT,
    "permissionCode" TEXT NOT NULL,
    "resourceType" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "conditionAstJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyInstance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subjectSelectorType" "PolicyInstanceSubjectSelectorType" NOT NULL,
    "subjectSelectorValue" TEXT,
    "permissionCode" TEXT NOT NULL,
    "resourceType" TEXT,
    "templateCode" TEXT NOT NULL,
    "effect" "PolicyEffect" NOT NULL,
    "params" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "result" TEXT NOT NULL,
    "operatorId" TEXT,
    "operatorType" TEXT NOT NULL,
    "tenantId" TEXT,
    "orgId" TEXT,
    "traceId" TEXT,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "accountId" TEXT NOT NULL,
    "permissionCode" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "evaluationMode" "EvaluationMode" NOT NULL,
    "decision" "AuthorizationDecision" NOT NULL,
    "matchedPolicyId" TEXT,
    "matchedPolicyName" TEXT,
    "reason" TEXT,
    "requestContext" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Role_tenantId_kind_idx" ON "Role"("tenantId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Role_scopeKey_kind_code_key" ON "Role"("scopeKey", "kind", "code");

-- CreateIndex
CREATE UNIQUE INDEX "RoleTerminalAccess_roleId_key" ON "RoleTerminalAccess"("roleId");

-- CreateIndex
CREATE INDEX "AccountTerminalAccessOverride_accountId_scopeLevel_tenantId_idx" ON "AccountTerminalAccessOverride"("accountId", "scopeLevel", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "PrincipalRoleBinding_principalId_scopeLevel_tenantId_idx" ON "PrincipalRoleBinding"("principalId", "scopeLevel", "tenantId");

-- CreateIndex
CREATE INDEX "PrincipalRoleBinding_roleId_revokedAt_idx" ON "PrincipalRoleBinding"("roleId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingGrantRequest_idempotencyKey_key" ON "OnboardingGrantRequest"("idempotencyKey");

-- CreateIndex
CREATE INDEX "OnboardingGrantRequest_tenantId_accountId_idx" ON "OnboardingGrantRequest"("tenantId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "NavigationEntry_entryKey_key" ON "NavigationEntry"("entryKey");

-- CreateIndex
CREATE INDEX "NavigationEntry_featureKey_enabled_idx" ON "NavigationEntry"("featureKey", "enabled");

-- CreateIndex
CREATE INDEX "RoleNavigationVisibility_roleId_terminal_idx" ON "RoleNavigationVisibility"("roleId", "terminal");

-- CreateIndex
CREATE UNIQUE INDEX "RoleNavigationVisibility_roleId_entryKey_terminal_key" ON "RoleNavigationVisibility"("roleId", "entryKey", "terminal");

-- CreateIndex
CREATE INDEX "RoleLandingPolicy_roleId_terminal_idx" ON "RoleLandingPolicy"("roleId", "terminal");

-- CreateIndex
CREATE UNIQUE INDEX "RoleLandingPolicy_roleId_terminal_defaultEntryKey_key" ON "RoleLandingPolicy"("roleId", "terminal", "defaultEntryKey");

-- CreateIndex
CREATE INDEX "Policy_tenantId_isEnabled_idx" ON "Policy"("tenantId", "isEnabled");

-- CreateIndex
CREATE INDEX "Policy_permissionCode_isEnabled_idx" ON "Policy"("permissionCode", "isEnabled");

-- CreateIndex
CREATE INDEX "Policy_subjectType_subjectId_idx" ON "Policy"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "PolicyInstance_tenantId_permissionCode_isEnabled_idx" ON "PolicyInstance"("tenantId", "permissionCode", "isEnabled");

-- CreateIndex
CREATE INDEX "PolicyInstance_subjectSelectorType_subjectSelectorValue_idx" ON "PolicyInstance"("subjectSelectorType", "subjectSelectorValue");

-- CreateIndex
CREATE INDEX "PolicyInstance_templateCode_idx" ON "PolicyInstance"("templateCode");

-- CreateIndex
CREATE INDEX "AuditEvent_service_module_eventType_occurredAt_idx" ON "AuditEvent"("service", "module", "eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_tenantId_occurredAt_idx" ON "AuditEvent"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_operatorId_occurredAt_idx" ON "AuditEvent"("operatorId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_resourceType_resourceId_occurredAt_idx" ON "AuditEvent"("resourceType", "resourceId", "occurredAt");

-- CreateIndex
CREATE INDEX "DecisionEvent_accountId_createdAt_idx" ON "DecisionEvent"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "DecisionEvent_permissionCode_createdAt_idx" ON "DecisionEvent"("permissionCode", "createdAt");

-- CreateIndex
CREATE INDEX "DecisionEvent_tenantId_createdAt_idx" ON "DecisionEvent"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_templateRoleId_fkey" FOREIGN KEY ("templateRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleTerminalAccess" ADD CONSTRAINT "RoleTerminalAccess_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrincipalRoleBinding" ADD CONSTRAINT "PrincipalRoleBinding_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleNavigationVisibility" ADD CONSTRAINT "RoleNavigationVisibility_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleNavigationVisibility" ADD CONSTRAINT "RoleNavigationVisibility_entryKey_fkey" FOREIGN KEY ("entryKey") REFERENCES "NavigationEntry"("entryKey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleLandingPolicy" ADD CONSTRAINT "RoleLandingPolicy_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleLandingPolicy" ADD CONSTRAINT "RoleLandingPolicy_defaultEntryKey_fkey" FOREIGN KEY ("defaultEntryKey") REFERENCES "NavigationEntry"("entryKey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_permissionCode_fkey" FOREIGN KEY ("permissionCode") REFERENCES "Permission"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyInstance" ADD CONSTRAINT "PolicyInstance_permissionCode_fkey" FOREIGN KEY ("permissionCode") REFERENCES "Permission"("code") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Prisma cannot express these grant-window invariants; retain the canonical database constraints.
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
