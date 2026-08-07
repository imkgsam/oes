CREATE TABLE "MachineWorkloadBinding" (
  "id" TEXT NOT NULL,
  "serviceAccountId" TEXT NOT NULL,
  "workloadSpiffeId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "version" BIGINT NOT NULL DEFAULT 1,
  "createdBy" TEXT,
  "disabledAt" TIMESTAMP(3),
  "disabledBy" TEXT,
  "disableReasonCode" TEXT,
  "enrollmentAuditRef" TEXT NOT NULL,
  "disableAuditRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MachineWorkloadBinding_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MachineWorkloadBinding_enrollmentAuditRef_key" ON "MachineWorkloadBinding"("enrollmentAuditRef");
CREATE UNIQUE INDEX "MachineWorkloadBinding_disableAuditRef_key" ON "MachineWorkloadBinding"("disableAuditRef");
CREATE INDEX "MachineWorkloadBinding_serviceAccountId_status_idx" ON "MachineWorkloadBinding"("serviceAccountId", "status");
CREATE INDEX "MachineWorkloadBinding_workloadSpiffeId_status_idx" ON "MachineWorkloadBinding"("workloadSpiffeId", "status");
CREATE UNIQUE INDEX "MachineWorkloadBinding_one_active_per_principal_spiffe" ON "MachineWorkloadBinding"("serviceAccountId", "workloadSpiffeId") WHERE "status" = 'ACTIVE';
ALTER TABLE "MachineWorkloadBinding" ADD CONSTRAINT "MachineWorkloadBinding_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId") REFERENCES "ServiceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MachineWorkloadBinding" ADD CONSTRAINT "MachineWorkloadBinding_enrollmentAuditRef_fkey" FOREIGN KEY ("enrollmentAuditRef") REFERENCES "AuditEvent"("eventId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MachineWorkloadBinding" ADD CONSTRAINT "MachineWorkloadBinding_disableAuditRef_fkey" FOREIGN KEY ("disableAuditRef") REFERENCES "AuditEvent"("eventId") ON DELETE RESTRICT ON UPDATE CASCADE;
