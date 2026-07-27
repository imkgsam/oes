-- Immutable revisions retain target-addressable published output after a newer Sync overwrites the current projection.
CREATE TABLE "SitePublicViewRevision" (
  "id" UUID NOT NULL, "siteId" VARCHAR(128) NOT NULL, "tenantId" VARCHAR(128) NOT NULL,
  "resourceType" VARCHAR(32) NOT NULL, "resourceId" VARCHAR(128) NOT NULL, "locale" VARCHAR(32) NOT NULL,
  "slug" VARCHAR(255) NOT NULL, "status" VARCHAR(32) NOT NULL, "publishVersion" INTEGER NOT NULL,
  "payload" JSONB NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SitePublicViewRevision_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SitePublicViewRevision_siteId_resourceType_resourceId_locale_publishVersion_key" ON "SitePublicViewRevision"("siteId", "resourceType", "resourceId", "locale", "publishVersion");
CREATE INDEX "SitePublicViewRevision_siteId_publishVersion_idx" ON "SitePublicViewRevision"("siteId", "publishVersion");
ALTER TABLE "SitePublicViewRevision" ADD CONSTRAINT "SitePublicViewRevision_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
