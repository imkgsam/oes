CREATE TABLE "DelegationGrant" (
  "id" UUID NOT NULL,
  "humanPrincipalId" VARCHAR(100) NOT NULL,
  "sessionId" VARCHAR(100) NOT NULL,
  "tenantId" VARCHAR(100) NOT NULL,
  "orgId" VARCHAR(100),
  "agentPrincipalId" VARCHAR(100) NOT NULL,
  "toolContractId" VARCHAR(180) NOT NULL,
  "toolContractVersion" VARCHAR(40) NOT NULL,
  "operationKeys" TEXT[] NOT NULL,
  "permissionCodes" TEXT[] NOT NULL,
  "authzVersion" VARCHAR(100) NOT NULL,
  "authorizationDecisionReference" VARCHAR(100) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "revokeReasonCategory" VARCHAR(80),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DelegationGrant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DelegatedExecutionAudit" (
  "id" UUID NOT NULL,
  "eventType" VARCHAR(80) NOT NULL,
  "result" VARCHAR(40) NOT NULL,
  "humanPrincipalId" VARCHAR(100) NOT NULL,
  "tenantId" VARCHAR(100) NOT NULL,
  "orgId" VARCHAR(100),
  "delegationReference" UUID NOT NULL,
  "actionGrantJti" UUID,
  "operationKey" VARCHAR(180),
  "descriptorDigest" VARCHAR(43),
  "authorizationDecisionReference" VARCHAR(100) NOT NULL,
  "traceId" VARCHAR(100) NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DelegatedExecutionAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DelegationGrant_humanPrincipalId_tenantId_expiresAt_idx" ON "DelegationGrant"("humanPrincipalId", "tenantId", "expiresAt");
CREATE INDEX "DelegationGrant_tenantId_agentPrincipalId_expiresAt_idx" ON "DelegationGrant"("tenantId", "agentPrincipalId", "expiresAt");
CREATE INDEX "DelegatedExecutionAudit_tenantId_humanPrincipalId_occurredAt_idx" ON "DelegatedExecutionAudit"("tenantId", "humanPrincipalId", "occurredAt");
CREATE INDEX "DelegatedExecutionAudit_delegationReference_occurredAt_idx" ON "DelegatedExecutionAudit"("delegationReference", "occurredAt");
CREATE INDEX "DelegatedExecutionAudit_actionGrantJti_idx" ON "DelegatedExecutionAudit"("actionGrantJti");
