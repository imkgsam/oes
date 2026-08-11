ALTER TABLE "TerminalDevice"
  ADD COLUMN "deviceCredentialHash" TEXT,
  ADD COLUMN "deviceCredentialPreviousHash" TEXT,
  ADD COLUMN "deviceCredentialVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "deviceCredentialPreviousVersion" INTEGER,
  ADD COLUMN "deviceCredentialExpiresAt" TIMESTAMP(3),
  ADD COLUMN "deviceCredentialPreviousExpiresAt" TIMESTAMP(3),
  ADD COLUMN "deviceCredentialState" TEXT NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX "TerminalDevice_deviceCredentialState_idx"
  ON "TerminalDevice"("deviceCredentialState");
