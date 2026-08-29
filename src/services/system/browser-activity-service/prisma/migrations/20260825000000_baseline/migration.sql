-- CreateTable
CREATE TABLE "BrowserActivityPolicy" (
    "tenantId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "rawRetentionDays" INTEGER NOT NULL,
    "aggregateRetentionDays" INTEGER NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrowserActivityPolicy_pkey" PRIMARY KEY ("tenantId")
);

-- CreateTable
CREATE TABLE "BrowserActivityVisitSession" (
    "visitSessionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientVisitId" TEXT NOT NULL,
    "extensionSessionId" TEXT NOT NULL,
    "mergeKey" TEXT NOT NULL,
    "employeeAccountId" TEXT NOT NULL,
    "employeeDisplayName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "pageTitle" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "lastFlushedAt" TIMESTAMP(3) NOT NULL,
    "dwellDurationSeconds" INTEGER NOT NULL,
    "activeDurationSeconds" INTEGER NOT NULL,
    "idleDurationSeconds" INTEGER NOT NULL,
    "foregroundDurationSeconds" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrowserActivityVisitSession_pkey" PRIMARY KEY ("visitSessionId")
);

-- CreateTable
CREATE TABLE "BrowserActivityEmployeeAuditGrant" (
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrowserActivityEmployeeAuditGrant_pkey" PRIMARY KEY ("tenantId","accountId")
);

-- CreateTable
CREATE TABLE "BrowserActivityHeartbeat" (
    "heartbeatId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "extensionSessionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "traceId" TEXT,

    CONSTRAINT "BrowserActivityHeartbeat_pkey" PRIMARY KEY ("heartbeatId")
);

-- CreateTable
CREATE TABLE "BrowserActivityOnlinePresence" (
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "extensionSessionId" TEXT NOT NULL,
    "sessionStartedAt" TIMESTAMP(3) NOT NULL,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL,
    "lastObservedDomain" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrowserActivityOnlinePresence_pkey" PRIMARY KEY ("tenantId","accountId")
);

-- CreateTable
CREATE TABLE "BrowserActivityReadAudit" (
    "readAuditId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "operatorAccountId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "keyword" TEXT,
    "employeeAccountId" TEXT,
    "requestId" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrowserActivityReadAudit_pkey" PRIMARY KEY ("readAuditId")
);

-- CreateIndex
CREATE INDEX "BrowserActivityVisitSession_tenantId_employeeAccountId_star_idx" ON "BrowserActivityVisitSession"("tenantId", "employeeAccountId", "startedAt");

-- CreateIndex
CREATE INDEX "BrowserActivityVisitSession_tenantId_domain_startedAt_idx" ON "BrowserActivityVisitSession"("tenantId", "domain", "startedAt");

-- CreateIndex
CREATE INDEX "BrowserActivityVisitSession_tenantId_endedAt_idx" ON "BrowserActivityVisitSession"("tenantId", "endedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BrowserActivityVisitSession_tenantId_employeeAccountId_clie_key" ON "BrowserActivityVisitSession"("tenantId", "employeeAccountId", "clientVisitId");

-- CreateIndex
CREATE INDEX "BrowserActivityEmployeeAuditGrant_tenantId_enabled_idx" ON "BrowserActivityEmployeeAuditGrant"("tenantId", "enabled");

-- CreateIndex
CREATE INDEX "BrowserActivityEmployeeAuditGrant_tenantId_updatedBy_idx" ON "BrowserActivityEmployeeAuditGrant"("tenantId", "updatedBy");

-- CreateIndex
CREATE INDEX "BrowserActivityHeartbeat_tenantId_accountId_observedAt_idx" ON "BrowserActivityHeartbeat"("tenantId", "accountId", "observedAt");

-- CreateIndex
CREATE INDEX "BrowserActivityHeartbeat_tenantId_extensionSessionId_observ_idx" ON "BrowserActivityHeartbeat"("tenantId", "extensionSessionId", "observedAt");

-- CreateIndex
CREATE INDEX "BrowserActivityOnlinePresence_tenantId_lastHeartbeatAt_idx" ON "BrowserActivityOnlinePresence"("tenantId", "lastHeartbeatAt");

-- CreateIndex
CREATE INDEX "BrowserActivityOnlinePresence_tenantId_extensionSessionId_idx" ON "BrowserActivityOnlinePresence"("tenantId", "extensionSessionId");

-- CreateIndex
CREATE INDEX "BrowserActivityReadAudit_tenantId_operatorAccountId_occurre_idx" ON "BrowserActivityReadAudit"("tenantId", "operatorAccountId", "occurredAt");

-- CreateIndex
CREATE INDEX "BrowserActivityReadAudit_tenantId_action_occurredAt_idx" ON "BrowserActivityReadAudit"("tenantId", "action", "occurredAt");
