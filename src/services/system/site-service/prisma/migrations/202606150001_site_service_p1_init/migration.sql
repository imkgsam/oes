-- CreateTable
CREATE TABLE "Site" (
    "siteId" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "siteCode" VARCHAR(128) NOT NULL,
    "siteName" VARCHAR(255) NOT NULL,
    "siteType" VARCHAR(64) NOT NULL,
    "brandId" VARCHAR(128),
    "regionCode" VARCHAR(64),
    "channelCode" VARCHAR(64),
    "status" VARCHAR(32) NOT NULL,
    "defaultLocale" VARCHAR(32) NOT NULL,
    "primaryDomain" VARCHAR(255),
    "previewBaseUrl" VARCHAR(1024),
    "allowedOrigins" JSONB NOT NULL,
    "webhookUrl" VARCHAR(1024),
    "runtimeStatusUrl" VARCHAR(1024),
    "latestPublishVersion" INTEGER NOT NULL DEFAULT 0,
    "createdBy" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disabledAt" TIMESTAMP(3),
    CONSTRAINT "Site_pkey" PRIMARY KEY ("siteId")
);

-- CreateTable
CREATE TABLE "SiteLocale" (
    "id" UUID NOT NULL,
    "siteId" VARCHAR(128) NOT NULL,
    "locale" VARCHAR(32) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "isDefault" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteLocale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteCredential" (
    "credentialId" VARCHAR(128) NOT NULL,
    "siteId" VARCHAR(128) NOT NULL,
    "clientId" VARCHAR(128) NOT NULL,
    "secretHash" VARCHAR(255) NOT NULL,
    "secretCiphertext" TEXT,
    "scopes" JSONB NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "createdBy" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotatedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    CONSTRAINT "SiteCredential_pkey" PRIMARY KEY ("credentialId")
);

-- CreateTable
CREATE TABLE "SiteCredentialNonce" (
    "id" UUID NOT NULL,
    "credentialId" VARCHAR(128) NOT NULL,
    "nonce" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteCredentialNonce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteProductPublication" (
    "publicationId" VARCHAR(128) NOT NULL,
    "siteId" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "productId" VARCHAR(128) NOT NULL,
    "locale" VARCHAR(32) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "displayTitle" VARCHAR(255) NOT NULL,
    "displayDescription" TEXT NOT NULL,
    "seoTitle" VARCHAR(255) NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "seoImage" VARCHAR(1024),
    "imageOverride" VARCHAR(1024),
    "categoryIds" JSONB NOT NULL DEFAULT '[]',
    "publishStatus" VARCHAR(32) NOT NULL,
    "syncStatus" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteProductPublication_pkey" PRIMARY KEY ("publicationId")
);

-- CreateTable
CREATE TABLE "SiteCategoryPublication" (
    "id" UUID NOT NULL,
    "categoryId" VARCHAR(128) NOT NULL,
    "siteId" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "parentCategoryId" VARCHAR(128),
    "sourceCategoryId" VARCHAR(128),
    "locale" VARCHAR(32) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "displayTitle" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "image" VARCHAR(1024),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" VARCHAR(255) NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "seoImage" VARCHAR(1024),
    "publishStatus" VARCHAR(32) NOT NULL,
    "syncStatus" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteCategoryPublication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContentEntry" (
    "contentId" VARCHAR(128) NOT NULL,
    "siteId" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "contentType" VARCHAR(32) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteContentEntry_pkey" PRIMARY KEY ("contentId")
);

-- CreateTable
CREATE TABLE "SiteContentLocaleVersion" (
    "contentVersionId" VARCHAR(128) NOT NULL,
    "contentId" VARCHAR(128) NOT NULL,
    "locale" VARCHAR(32) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "summary" TEXT,
    "coverImage" VARCHAR(1024),
    "author" VARCHAR(255),
    "tags" JSONB NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "seoTitle" VARCHAR(255) NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "seoImage" VARCHAR(1024),
    "publishedAt" TIMESTAMP(3),
    "status" VARCHAR(32) NOT NULL,
    "syncStatus" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteContentLocaleVersion_pkey" PRIMARY KEY ("contentVersionId")
);

-- CreateTable
CREATE TABLE "SitePublicView" (
    "id" UUID NOT NULL,
    "siteId" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "resourceType" VARCHAR(32) NOT NULL,
    "resourceId" VARCHAR(128) NOT NULL,
    "locale" VARCHAR(32) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "publishVersion" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SitePublicView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSyncBatch" (
    "syncId" VARCHAR(128) NOT NULL,
    "siteId" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "publishVersion" INTEGER NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "triggeredBy" VARCHAR(128) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    CONSTRAINT "SiteSyncBatch_pkey" PRIMARY KEY ("syncId")
);

-- CreateTable
CREATE TABLE "SiteWebhookDelivery" (
    "deliveryId" VARCHAR(128) NOT NULL,
    "syncId" VARCHAR(128) NOT NULL,
    "siteId" VARCHAR(128) NOT NULL,
    "tenantId" VARCHAR(128) NOT NULL,
    "eventId" VARCHAR(128) NOT NULL,
    "eventType" VARCHAR(128) NOT NULL,
    "publishVersion" INTEGER NOT NULL,
    "targetUrl" VARCHAR(1024),
    "status" VARCHAR(32) NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "resent" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL,
    "headers" JSONB NOT NULL,
    "dispatchedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteWebhookDelivery_pkey" PRIMARY KEY ("deliveryId")
);

-- CreateTable
CREATE TABLE "SiteSyncResource" (
    "id" UUID NOT NULL,
    "syncId" VARCHAR(128) NOT NULL,
    "resourceType" VARCHAR(32) NOT NULL,
    "resourceId" VARCHAR(128) NOT NULL,
    "locale" VARCHAR(32) NOT NULL,
    "changeType" VARCHAR(32) NOT NULL,
    CONSTRAINT "SiteSyncResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteRuntimeStatus" (
    "siteId" VARCHAR(128) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "localPublishVersion" INTEGER NOT NULL DEFAULT 0,
    "lastKnownRemotePublishVersion" INTEGER,
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "lastSyncStatus" VARCHAR(32),
    "lastErrorCode" VARCHAR(128),
    "lastErrorMessage" TEXT,
    "storeReady" BOOLEAN NOT NULL DEFAULT false,
    "syncInProgress" BOOLEAN NOT NULL DEFAULT false,
    "pendingSync" BOOLEAN NOT NULL DEFAULT false,
    "kitVersion" VARCHAR(128),
    "reportedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteRuntimeStatus_pkey" PRIMARY KEY ("siteId")
);

-- CreateTable
CREATE TABLE "SiteAuditEnvelope" (
    "eventId" VARCHAR(128) NOT NULL,
    "service" VARCHAR(128) NOT NULL,
    "module" VARCHAR(128) NOT NULL,
    "eventType" VARCHAR(128) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "result" VARCHAR(32) NOT NULL,
    "operatorId" VARCHAR(128),
    "operatorType" VARCHAR(32) NOT NULL,
    "tenantId" VARCHAR(128),
    "orgId" VARCHAR(128),
    "traceId" VARCHAR(128),
    "resourceType" VARCHAR(128) NOT NULL,
    "resourceId" VARCHAR(128),
    "siteId" VARCHAR(128),
    "details" JSONB NOT NULL,
    CONSTRAINT "SiteAuditEnvelope_pkey" PRIMARY KEY ("eventId")
);

-- CreateIndex
CREATE INDEX "Site_tenantId_status_idx" ON "Site"("tenantId", "status");
CREATE UNIQUE INDEX "Site_tenantId_siteCode_key" ON "Site"("tenantId", "siteCode");
CREATE INDEX "SiteLocale_siteId_status_idx" ON "SiteLocale"("siteId", "status");
CREATE UNIQUE INDEX "SiteLocale_siteId_locale_key" ON "SiteLocale"("siteId", "locale");
CREATE INDEX "SiteCredential_siteId_status_idx" ON "SiteCredential"("siteId", "status");
CREATE UNIQUE INDEX "SiteCredential_siteId_clientId_key" ON "SiteCredential"("siteId", "clientId");
CREATE INDEX "SiteCredentialNonce_expiresAt_idx" ON "SiteCredentialNonce"("expiresAt");
CREATE UNIQUE INDEX "SiteCredentialNonce_credentialId_nonce_key" ON "SiteCredentialNonce"("credentialId", "nonce");
CREATE INDEX "SiteProductPublication_tenantId_siteId_syncStatus_idx" ON "SiteProductPublication"("tenantId", "siteId", "syncStatus");
CREATE UNIQUE INDEX "SiteProductPublication_siteId_productId_locale_key" ON "SiteProductPublication"("siteId", "productId", "locale");
CREATE UNIQUE INDEX "SiteProductPublication_siteId_locale_slug_key" ON "SiteProductPublication"("siteId", "locale", "slug");
CREATE INDEX "SiteCategoryPublication_tenantId_siteId_syncStatus_idx" ON "SiteCategoryPublication"("tenantId", "siteId", "syncStatus");
CREATE INDEX "SiteCategoryPublication_siteId_locale_publishStatus_idx" ON "SiteCategoryPublication"("siteId", "locale", "publishStatus");
CREATE UNIQUE INDEX "SiteCategoryPublication_siteId_categoryId_locale_key" ON "SiteCategoryPublication"("siteId", "categoryId", "locale");
CREATE UNIQUE INDEX "SiteCategoryPublication_siteId_locale_slug_key" ON "SiteCategoryPublication"("siteId", "locale", "slug");
CREATE INDEX "SiteContentEntry_tenantId_siteId_contentType_status_idx" ON "SiteContentEntry"("tenantId", "siteId", "contentType", "status");
CREATE INDEX "SiteContentLocaleVersion_locale_syncStatus_idx" ON "SiteContentLocaleVersion"("locale", "syncStatus");
CREATE UNIQUE INDEX "SiteContentLocaleVersion_contentId_locale_key" ON "SiteContentLocaleVersion"("contentId", "locale");
CREATE INDEX "SitePublicView_tenantId_siteId_publishVersion_idx" ON "SitePublicView"("tenantId", "siteId", "publishVersion");
CREATE UNIQUE INDEX "SitePublicView_siteId_resourceType_resourceId_locale_key" ON "SitePublicView"("siteId", "resourceType", "resourceId", "locale");
CREATE UNIQUE INDEX "SitePublicView_siteId_resourceType_locale_slug_key" ON "SitePublicView"("siteId", "resourceType", "locale", "slug");
CREATE INDEX "SiteSyncBatch_tenantId_siteId_startedAt_idx" ON "SiteSyncBatch"("tenantId", "siteId", "startedAt");
CREATE INDEX "SiteSyncBatch_tenantId_siteId_status_idx" ON "SiteSyncBatch"("tenantId", "siteId", "status");
CREATE INDEX "SiteWebhookDelivery_tenantId_siteId_status_createdAt_idx" ON "SiteWebhookDelivery"("tenantId", "siteId", "status", "createdAt");
CREATE INDEX "SiteWebhookDelivery_eventId_idx" ON "SiteWebhookDelivery"("eventId");
CREATE INDEX "SiteSyncResource_syncId_idx" ON "SiteSyncResource"("syncId");
CREATE INDEX "SiteSyncResource_resourceType_resourceId_locale_idx" ON "SiteSyncResource"("resourceType", "resourceId", "locale");
CREATE INDEX "SiteAuditEnvelope_tenantId_occurredAt_idx" ON "SiteAuditEnvelope"("tenantId", "occurredAt");
CREATE INDEX "SiteAuditEnvelope_resourceType_resourceId_occurredAt_idx" ON "SiteAuditEnvelope"("resourceType", "resourceId", "occurredAt");
CREATE INDEX "SiteAuditEnvelope_operatorId_occurredAt_idx" ON "SiteAuditEnvelope"("operatorId", "occurredAt");
CREATE INDEX "SiteAuditEnvelope_service_module_eventType_occurredAt_idx" ON "SiteAuditEnvelope"("service", "module", "eventType", "occurredAt");

-- AddForeignKey
ALTER TABLE "SiteLocale" ADD CONSTRAINT "SiteLocale_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteCredential" ADD CONSTRAINT "SiteCredential_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteCredentialNonce" ADD CONSTRAINT "SiteCredentialNonce_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "SiteCredential"("credentialId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteProductPublication" ADD CONSTRAINT "SiteProductPublication_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteCategoryPublication" ADD CONSTRAINT "SiteCategoryPublication_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteContentEntry" ADD CONSTRAINT "SiteContentEntry_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteContentLocaleVersion" ADD CONSTRAINT "SiteContentLocaleVersion_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "SiteContentEntry"("contentId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SitePublicView" ADD CONSTRAINT "SitePublicView_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteSyncBatch" ADD CONSTRAINT "SiteSyncBatch_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteWebhookDelivery" ADD CONSTRAINT "SiteWebhookDelivery_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteWebhookDelivery" ADD CONSTRAINT "SiteWebhookDelivery_syncId_fkey" FOREIGN KEY ("syncId") REFERENCES "SiteSyncBatch"("syncId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteSyncResource" ADD CONSTRAINT "SiteSyncResource_syncId_fkey" FOREIGN KEY ("syncId") REFERENCES "SiteSyncBatch"("syncId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteRuntimeStatus" ADD CONSTRAINT "SiteRuntimeStatus_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE CASCADE ON UPDATE CASCADE;
