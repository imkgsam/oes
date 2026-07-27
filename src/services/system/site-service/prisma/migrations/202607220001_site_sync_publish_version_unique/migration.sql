-- Prevent two concurrent publish transactions from committing the same Site version.
CREATE UNIQUE INDEX "SiteSyncBatch_siteId_publishVersion_key"
ON "SiteSyncBatch"("siteId", "publishVersion");
