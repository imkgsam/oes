-- FAQ is a site-scoped, locale-versioned directory whose public resource is one stable site+locale view.
CREATE TABLE "SiteFaqCategory" (
  "categoryId" VARCHAR(128) NOT NULL,
  "siteId" VARCHAR(128) NOT NULL,
  "tenantId" VARCHAR(128) NOT NULL,
  "status" VARCHAR(32) NOT NULL,
  "syncStatus" VARCHAR(32) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteFaqCategory_pkey" PRIMARY KEY ("categoryId")
);
CREATE TABLE "SiteFaqCategoryLocaleVersion" (
  "categoryVersionId" VARCHAR(128) NOT NULL, "categoryId" VARCHAR(128) NOT NULL, "siteId" VARCHAR(128) NOT NULL,
  "locale" VARCHAR(32) NOT NULL, "title" VARCHAR(255) NOT NULL, "anchorKey" VARCHAR(255) NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "syncStatus" VARCHAR(32) NOT NULL, "syncRevision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteFaqCategoryLocaleVersion_pkey" PRIMARY KEY ("categoryVersionId")
);
CREATE TABLE "SiteFaqEntry" (
  "entryId" VARCHAR(128) NOT NULL, "siteId" VARCHAR(128) NOT NULL, "tenantId" VARCHAR(128) NOT NULL,
  "categoryId" VARCHAR(128) NOT NULL, "status" VARCHAR(32) NOT NULL, "syncStatus" VARCHAR(32) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteFaqEntry_pkey" PRIMARY KEY ("entryId")
);
CREATE TABLE "SiteFaqEntryLocaleVersion" (
  "entryVersionId" VARCHAR(128) NOT NULL, "entryId" VARCHAR(128) NOT NULL, "locale" VARCHAR(32) NOT NULL,
  "question" VARCHAR(1024) NOT NULL, "answerHtml" TEXT NOT NULL, "sortOrder" INTEGER NOT NULL DEFAULT 0, "status" VARCHAR(32) NOT NULL DEFAULT 'draft',
  "syncStatus" VARCHAR(32) NOT NULL, "syncRevision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteFaqEntryLocaleVersion_pkey" PRIMARY KEY ("entryVersionId")
);
CREATE TABLE "SiteFaqDirectoryDraft" (
  "siteId" VARCHAR(128) NOT NULL, "locale" VARCHAR(32) NOT NULL, "syncStatus" VARCHAR(32) NOT NULL DEFAULT 'synced',
  "syncRevision" INTEGER NOT NULL DEFAULT 1, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteFaqDirectoryDraft_pkey" PRIMARY KEY ("siteId", "locale")
);
CREATE UNIQUE INDEX "SiteFaqCategoryLocaleVersion_categoryId_locale_key" ON "SiteFaqCategoryLocaleVersion"("categoryId", "locale");
CREATE UNIQUE INDEX "SiteFaqCategoryLocaleVersion_siteId_locale_anchorKey_key" ON "SiteFaqCategoryLocaleVersion"("siteId", "locale", "anchorKey");
CREATE UNIQUE INDEX "SiteFaqEntryLocaleVersion_entryId_locale_key" ON "SiteFaqEntryLocaleVersion"("entryId", "locale");
CREATE INDEX "SiteFaqCategory_tenantId_siteId_status_idx" ON "SiteFaqCategory"("tenantId", "siteId", "status");
CREATE INDEX "SiteFaqCategory_siteId_syncStatus_idx" ON "SiteFaqCategory"("siteId", "syncStatus");
CREATE INDEX "SiteFaqCategoryLocaleVersion_siteId_locale_syncStatus_idx" ON "SiteFaqCategoryLocaleVersion"("siteId", "locale", "syncStatus");
CREATE INDEX "SiteFaqEntry_tenantId_siteId_categoryId_status_idx" ON "SiteFaqEntry"("tenantId", "siteId", "categoryId", "status");
CREATE INDEX "SiteFaqEntry_siteId_syncStatus_idx" ON "SiteFaqEntry"("siteId", "syncStatus");
CREATE INDEX "SiteFaqEntryLocaleVersion_locale_syncStatus_idx" ON "SiteFaqEntryLocaleVersion"("locale", "syncStatus");
CREATE INDEX "SiteFaqDirectoryDraft_siteId_syncStatus_idx" ON "SiteFaqDirectoryDraft"("siteId", "syncStatus");
ALTER TABLE "SiteFaqCategory" ADD CONSTRAINT "SiteFaqCategory_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteFaqCategoryLocaleVersion" ADD CONSTRAINT "SiteFaqCategoryLocaleVersion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SiteFaqCategory"("categoryId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteFaqEntry" ADD CONSTRAINT "SiteFaqEntry_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteFaqEntry" ADD CONSTRAINT "SiteFaqEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SiteFaqCategory"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SiteFaqEntryLocaleVersion" ADD CONSTRAINT "SiteFaqEntryLocaleVersion_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "SiteFaqEntry"("entryId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteFaqDirectoryDraft" ADD CONSTRAINT "SiteFaqDirectoryDraft_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
