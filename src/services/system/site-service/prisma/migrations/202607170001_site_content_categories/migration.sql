-- This migration renames the blog/news taxonomy persistence boundary while retaining stable opaque IDs.
-- ID values can be referenced by ordered content relations and sync cursors, so they must not be rewritten.
ALTER TABLE "SiteContentLocaleVersion"
  RENAME COLUMN "topicIds" TO "categoryIds";

ALTER TABLE "SiteContentTopic"
  RENAME TO "SiteContentCategory";

ALTER TABLE "SiteContentTopicLocaleVersion"
  RENAME TO "SiteContentCategoryLocaleVersion";

ALTER TABLE "SiteContentCategory"
  RENAME COLUMN "topicId" TO "categoryId";

ALTER TABLE "SiteContentCategoryLocaleVersion"
  RENAME COLUMN "topicVersionId" TO "categoryVersionId";

ALTER TABLE "SiteContentCategoryLocaleVersion"
  RENAME COLUMN "topicId" TO "categoryId";

ALTER TABLE "SiteContentCategory"
  RENAME COLUMN "showInBlogNav" TO "isVisibleInBlogArchive";

ALTER TABLE "SiteContentCategory"
  RENAME COLUMN "showInNewsNav" TO "isVisibleInNewsArchive";

ALTER TABLE "SiteContentCategoryLocaleVersion"
  RENAME COLUMN "name" TO "displayName";

ALTER TABLE "SiteContentCategoryLocaleVersion"
  RENAME COLUMN "description" TO "archiveIntro";

ALTER TABLE "SiteContentCategoryLocaleVersion"
  RENAME COLUMN "navLabel" TO "archiveLabel";

ALTER TABLE "SiteContentCategory"
  RENAME CONSTRAINT "SiteContentTopic_pkey" TO "SiteContentCategory_pkey";

ALTER TABLE "SiteContentCategoryLocaleVersion"
  RENAME CONSTRAINT "SiteContentTopicLocaleVersion_pkey" TO "SiteContentCategoryLocaleVersion_pkey";

ALTER TABLE "SiteContentCategory"
  RENAME CONSTRAINT "SiteContentTopic_siteId_fkey" TO "SiteContentCategory_siteId_fkey";

ALTER TABLE "SiteContentCategoryLocaleVersion"
  RENAME CONSTRAINT "SiteContentTopicLocaleVersion_topicId_fkey" TO "SiteContentCategoryLocaleVersion_categoryId_fkey";

ALTER INDEX "SiteContentTopic_tenantId_siteId_status_idx"
  RENAME TO "SiteContentCategory_tenantId_siteId_status_idx";

ALTER INDEX "SiteContentTopic_tenantId_siteId_syncStatus_idx"
  RENAME TO "SiteContentCategory_tenantId_siteId_syncStatus_idx";

ALTER INDEX "SiteContentTopic_siteId_appliesTo_status_idx"
  RENAME TO "SiteContentCategory_siteId_appliesTo_status_idx";

ALTER INDEX "SiteContentTopicLocaleVersion_topicId_locale_key"
  RENAME TO "SiteContentCategoryLocaleVersion_categoryId_locale_key";

ALTER INDEX "SiteContentTopicLocaleVersion_siteId_locale_slug_key"
  RENAME TO "SiteContentCategoryLocaleVersion_siteId_locale_slug_key";

ALTER INDEX "SiteContentTopicLocaleVersion_siteId_locale_syncStatus_idx"
  RENAME TO "SiteContentCategoryLocaleVersion_siteId_locale_syncStatus_idx";

-- Rebuild legacy Topic public views from the renamed Category source so existing Runtime snapshots
-- and delta consumers receive the current article-category resource contract immediately.
UPDATE "SitePublicView" AS view
SET
  "resourceType" = 'article-category',
  "payload" = jsonb_build_object(
    'content_category_id', category."categoryId",
    'applies_to', category."appliesTo",
    'display_name', locale_version."displayName",
    'archive_intro', locale_version."archiveIntro",
    'archive_label', COALESCE(locale_version."archiveLabel", locale_version."displayName"),
    'is_visible_in_blog_archive', category."isVisibleInBlogArchive",
    'is_visible_in_news_archive', category."isVisibleInNewsArchive",
    'sort_order', category."sortOrder",
    'historical_slugs', locale_version."historicalSlugs",
    'seo', jsonb_build_object(
      'title', locale_version."seoTitle",
      'description', locale_version."seoDescription",
      'image', locale_version."seoImage"
    )
  )
FROM "SiteContentCategory" AS category
JOIN "SiteContentCategoryLocaleVersion" AS locale_version
  ON locale_version."categoryId" = category."categoryId"
WHERE view."resourceType" = 'topic'
  AND view."resourceId" = category."categoryId"
  AND view."siteId" = category."siteId"
  AND view."locale" = locale_version."locale"
  AND locale_version."siteId" = category."siteId";

-- Keep already-published Blog and News payloads readable by the Category-aware Runtime.
-- Existing tag fields remain untouched because Tags are independent article metadata.
UPDATE "SitePublicView" AS view
SET "payload" = jsonb_set(
  jsonb_set(
    jsonb_set(
      (view."payload" - 'topic_ids' - 'primary_topic_id'),
      '{category_ids}',
      content."categoryIds",
      true
    ),
    '{historical_slugs}',
    content."historicalSlugs",
    true
  ),
  '{cover_image_alt}',
  COALESCE(to_jsonb(content."coverImageAlt"), 'null'::jsonb),
  true
)
FROM "SiteContentLocaleVersion" AS content
JOIN "SiteContentEntry" AS entry
  ON entry."contentId" = content."contentId"
WHERE view."resourceType" IN ('blog', 'news')
  AND view."resourceId" = content."contentId"
  AND view."locale" = content."locale"
  AND view."siteId" = entry."siteId"
  AND view."resourceType" = entry."contentType";

-- Existing completed sync batches remain the Runtime delta index, so their resource vocabulary
-- must change with the public view. SiteAuditEnvelope and SiteWebhookDelivery stay immutable
-- historical evidence and intentionally retain their original recorded details.
UPDATE "SiteSyncResource"
SET "resourceType" = 'article-category'
WHERE "resourceType" = 'topic';
