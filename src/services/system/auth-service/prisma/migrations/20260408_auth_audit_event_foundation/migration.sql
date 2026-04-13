-- This migration creates the auth-service audit event table using the shared envelope-oriented schema.
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

CREATE INDEX "AuditEvent_service_module_eventType_occurredAt_idx"
ON "AuditEvent"("service", "module", "eventType", "occurredAt");

CREATE INDEX "AuditEvent_tenantId_occurredAt_idx"
ON "AuditEvent"("tenantId", "occurredAt");

CREATE INDEX "AuditEvent_operatorId_occurredAt_idx"
ON "AuditEvent"("operatorId", "occurredAt");

CREATE INDEX "AuditEvent_resourceType_resourceId_occurredAt_idx"
ON "AuditEvent"("resourceType", "resourceId", "occurredAt");
