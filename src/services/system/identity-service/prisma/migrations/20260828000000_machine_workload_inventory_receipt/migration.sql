CREATE TABLE "MachineWorkloadProvisioningReceipt" (
  "inventoryEntryKey" TEXT NOT NULL,
  "manifestVersion" TEXT NOT NULL,
  "manifestDigest" TEXT NOT NULL,
  "serviceAccountId" TEXT NOT NULL,
  "machineWorkloadBindingId" TEXT NOT NULL,
  "provisionedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deploymentRevision" TEXT NOT NULL,
  "auditReference" TEXT NOT NULL,
  CONSTRAINT "MachineWorkloadProvisioningReceipt_pkey" PRIMARY KEY ("inventoryEntryKey")
);

CREATE UNIQUE INDEX "MachineWorkloadProvisioningReceipt_serviceAccountId_key"
  ON "MachineWorkloadProvisioningReceipt"("serviceAccountId");
CREATE UNIQUE INDEX "MachineWorkloadProvisioningReceipt_machineWorkloadBindingId_key"
  ON "MachineWorkloadProvisioningReceipt"("machineWorkloadBindingId");
CREATE UNIQUE INDEX "MachineWorkloadProvisioningReceipt_auditReference_key"
  ON "MachineWorkloadProvisioningReceipt"("auditReference");
CREATE INDEX "MachineWorkloadProvisioningReceipt_manifestVersion_manifestDigest_idx"
  ON "MachineWorkloadProvisioningReceipt"("manifestVersion", "manifestDigest");

ALTER TABLE "MachineWorkloadProvisioningReceipt"
  ADD CONSTRAINT "MachineWorkloadProvisioningReceipt_serviceAccountId_fkey"
  FOREIGN KEY ("serviceAccountId") REFERENCES "ServiceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MachineWorkloadProvisioningReceipt"
  ADD CONSTRAINT "MachineWorkloadProvisioningReceipt_machineWorkloadBindingId_fkey"
  FOREIGN KEY ("machineWorkloadBindingId") REFERENCES "MachineWorkloadBinding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MachineWorkloadProvisioningReceipt"
  ADD CONSTRAINT "MachineWorkloadProvisioningReceipt_auditReference_fkey"
  FOREIGN KEY ("auditReference") REFERENCES "AuditEvent"("eventId") ON DELETE RESTRICT ON UPDATE CASCADE;
