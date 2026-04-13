CREATE TYPE "AuditEventResult" AS ENUM ('SUCCEEDED', 'REJECTED', 'FAILED');

CREATE TYPE "AuditOperatorType" AS ENUM ('HUMAN', 'SYSTEM');

CREATE TABLE "AuditEvent" (
    "eventId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "result" "AuditEventResult" NOT NULL,
    "operatorId" TEXT,
    "operatorType" "AuditOperatorType" NOT NULL,
    "tenantId" TEXT,
    "orgId" TEXT,
    "traceId" TEXT,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("eventId")
);

CREATE INDEX "AuditEvent_service_occurredAt_idx" ON "AuditEvent"("service", "occurredAt");

CREATE INDEX "AuditEvent_module_occurredAt_idx" ON "AuditEvent"("module", "occurredAt");

CREATE INDEX "AuditEvent_eventType_occurredAt_idx" ON "AuditEvent"("eventType", "occurredAt");

CREATE INDEX "AuditEvent_tenantId_occurredAt_idx" ON "AuditEvent"("tenantId", "occurredAt");

CREATE INDEX "AuditEvent_resourceType_resourceId_idx" ON "AuditEvent"("resourceType", "resourceId");
