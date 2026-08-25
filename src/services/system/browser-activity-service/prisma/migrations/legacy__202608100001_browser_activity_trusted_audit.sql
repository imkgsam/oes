-- Stores complete trusted-request evidence for Browser Activity's append-only execution audit.
ALTER TABLE "BrowserActivityReadAudit" ADD COLUMN "requestId" TEXT NOT NULL DEFAULT 'HISTORICAL_AUDIT';
ALTER TABLE "BrowserActivityReadAudit" ADD COLUMN "sessionId" TEXT;
UPDATE "BrowserActivityReadAudit" SET "sessionId" = 'HISTORICAL_AUDIT' WHERE "sessionId" IS NULL;
UPDATE "BrowserActivityReadAudit" SET "traceId" = 'HISTORICAL_AUDIT' WHERE "traceId" IS NULL;
ALTER TABLE "BrowserActivityReadAudit" ALTER COLUMN "sessionId" SET NOT NULL;
ALTER TABLE "BrowserActivityReadAudit" ALTER COLUMN "traceId" SET NOT NULL;
ALTER TABLE "BrowserActivityReadAudit" ALTER COLUMN "requestId" DROP DEFAULT;
