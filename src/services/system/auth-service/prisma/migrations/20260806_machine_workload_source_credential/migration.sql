CREATE TABLE "MachineWorkloadSourceCredential" (
  "id" TEXT NOT NULL,
  "machinePrincipalId" TEXT NOT NULL,
  "machineWorkloadBindingId" TEXT NOT NULL,
  "machineWorkloadBindingVersion" BIGINT NOT NULL,
  "workloadSpiffeId" TEXT NOT NULL,
  "certificateThumbprint" TEXT NOT NULL,
  "certificateNotAfter" TIMESTAMP(3) NOT NULL,
  "profileVersion" INTEGER NOT NULL,
  "signingKid" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL,
  "predecessorId" TEXT,
  "revokedAt" TIMESTAMP(3),
  "revokedReasonCode" TEXT,
  "auditId" TEXT NOT NULL,
  "traceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MachineWorkloadSourceCredential_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MachineWorkloadSourceCredential_issued_expires_check" CHECK ("expiresAt" > "issuedAt" AND "expiresAt" <= "issuedAt" + INTERVAL '15 minutes' AND "expiresAt" <= "certificateNotAfter")
);
CREATE UNIQUE INDEX "MachineWorkloadSourceCredential_auditId_key" ON "MachineWorkloadSourceCredential"("auditId");
CREATE INDEX "MachineWorkloadSourceCredential_machineWorkloadBindingId_status_idx" ON "MachineWorkloadSourceCredential"("machineWorkloadBindingId", "status");
CREATE INDEX "MachineWorkloadSourceCredential_machinePrincipalId_expiresAt_idx" ON "MachineWorkloadSourceCredential"("machinePrincipalId", "expiresAt");
CREATE UNIQUE INDEX "MachineWorkloadSourceCredential_one_active_per_binding" ON "MachineWorkloadSourceCredential"("machineWorkloadBindingId") WHERE "status" = 'ACTIVE';
ALTER TABLE "MachineWorkloadSourceCredential" ADD CONSTRAINT "MachineWorkloadSourceCredential_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "AuditEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MachineWorkloadSourceCredential" ADD CONSTRAINT "MachineWorkloadSourceCredential_predecessorId_fkey" FOREIGN KEY ("predecessorId") REFERENCES "MachineWorkloadSourceCredential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
