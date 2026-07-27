ALTER TABLE "SiteContentLocaleVersion"
  ADD COLUMN "topicIds" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "historicalSlugs" JSONB NOT NULL DEFAULT '[]';

CREATE TABLE "SiteContentTopic" (
  "topicId" VARCHAR(128) NOT NULL,
  "siteId" VARCHAR(128) NOT NULL,
  "tenantId" VARCHAR(128) NOT NULL,
  "appliesTo" VARCHAR(32) NOT NULL,
  "status" VARCHAR(32) NOT NULL,
  "showInBlogNav" BOOLEAN NOT NULL DEFAULT false,
  "showInNewsNav" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "syncStatus" VARCHAR(32) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteContentTopic_pkey" PRIMARY KEY ("topicId")
);

CREATE TABLE "SiteContentTopicLocaleVersion" (
  "topicVersionId" VARCHAR(128) NOT NULL,
  "topicId" VARCHAR(128) NOT NULL,
  "siteId" VARCHAR(128) NOT NULL,
  "locale" VARCHAR(32) NOT NULL,
  "slug" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "navLabel" VARCHAR(255),
  "seoTitle" VARCHAR(255) NOT NULL,
  "seoDescription" TEXT NOT NULL,
  "seoImage" VARCHAR(1024),
  "historicalSlugs" JSONB NOT NULL DEFAULT '[]',
  "syncStatus" VARCHAR(32) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteContentTopicLocaleVersion_pkey" PRIMARY KEY ("topicVersionId")
);

CREATE INDEX "SiteContentTopic_tenantId_siteId_status_idx"
  ON "SiteContentTopic"("tenantId", "siteId", "status");

CREATE INDEX "SiteContentTopic_tenantId_siteId_syncStatus_idx"
  ON "SiteContentTopic"("tenantId", "siteId", "syncStatus");

CREATE INDEX "SiteContentTopic_siteId_appliesTo_status_idx"
  ON "SiteContentTopic"("siteId", "appliesTo", "status");

CREATE UNIQUE INDEX "SiteContentTopicLocaleVersion_topicId_locale_key"
  ON "SiteContentTopicLocaleVersion"("topicId", "locale");

CREATE UNIQUE INDEX "SiteContentTopicLocaleVersion_siteId_locale_slug_key"
  ON "SiteContentTopicLocaleVersion"("siteId", "locale", "slug");

CREATE INDEX "SiteContentTopicLocaleVersion_siteId_locale_syncStatus_idx"
  ON "SiteContentTopicLocaleVersion"("siteId", "locale", "syncStatus");

ALTER TABLE "SiteContentTopic"
  ADD CONSTRAINT "SiteContentTopic_siteId_fkey"
  FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SiteContentTopicLocaleVersion"
  ADD CONSTRAINT "SiteContentTopicLocaleVersion_topicId_fkey"
  FOREIGN KEY ("topicId") REFERENCES "SiteContentTopic"("topicId") ON DELETE CASCADE ON UPDATE CASCADE;
