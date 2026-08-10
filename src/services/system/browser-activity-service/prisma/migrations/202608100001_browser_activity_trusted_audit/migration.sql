-- Stores Auth-signed session evidence for Browser Activity's append-only trusted execution audit.
ALTER TABLE "BrowserActivityReadAudit" ADD COLUMN "sessionId" TEXT;
