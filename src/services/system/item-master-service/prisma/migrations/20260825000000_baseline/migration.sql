-- CreateEnum
CREATE TYPE "ItemModelKind" AS ENUM ('PHYSICAL', 'SERVICE', 'DIGITAL', 'VIRTUAL');

-- CreateEnum
CREATE TYPE "ItemModelType" AS ENUM ('FINISHED_PRODUCT', 'SEMI_FINISHED_PRODUCT', 'ACCESSORY', 'PART', 'SUB_ASSEMBLY', 'RAW_MATERIAL', 'PACKAGING_MATERIAL', 'SERVICE', 'VIRTUAL_KIT');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('STANDARD', 'PACKAGED_FINISHED_GOOD');

-- CreateEnum
CREATE TYPE "BomType" AS ENUM ('COMPOSITION', 'TRANSFORMATION', 'PACKAGING');

-- CreateEnum
CREATE TYPE "BomLineRole" AS ENUM ('PRIMARY_INPUT', 'COMPONENT', 'PACKAGING_MATERIAL');

-- CreateTable
CREATE TABLE "ItemModel" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(64) NOT NULL,
    "modelCode" VARCHAR(128) NOT NULL,
    "modelName" VARCHAR(255) NOT NULL,
    "modelKind" "ItemModelKind" NOT NULL,
    "modelType" "ItemModelType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sellable" BOOLEAN NOT NULL DEFAULT false,
    "purchasable" BOOLEAN NOT NULL DEFAULT false,
    "stockable" BOOLEAN NOT NULL DEFAULT false,
    "manufacturable" BOOLEAN NOT NULL DEFAULT false,
    "assemblable" BOOLEAN NOT NULL DEFAULT false,
    "transformable" BOOLEAN NOT NULL DEFAULT false,
    "packable" BOOLEAN NOT NULL DEFAULT false,
    "packaged" BOOLEAN NOT NULL DEFAULT false,
    "primaryCategoryId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeDefinition" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(64) NOT NULL,
    "attributeCode" VARCHAR(128) NOT NULL,
    "attributeName" VARCHAR(255) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttributeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeOption" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(64) NOT NULL,
    "attributeDefinitionId" UUID NOT NULL,
    "optionCode" VARCHAR(128) NOT NULL,
    "optionName" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttributeOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemModelAttributeRule" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(64) NOT NULL,
    "itemModelId" UUID NOT NULL,
    "attributeDefinitionId" UUID NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "allowedOptionIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemModelAttributeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(64) NOT NULL,
    "itemModelId" UUID NOT NULL,
    "itemCode" VARCHAR(128) NOT NULL,
    "itemName" VARCHAR(255) NOT NULL,
    "itemType" "ItemType" NOT NULL,
    "lockedAttributeOptionIds" TEXT[],
    "variantKey" VARCHAR(1024) NOT NULL,
    "packagingSpecId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sellable" BOOLEAN NOT NULL DEFAULT false,
    "purchasable" BOOLEAN NOT NULL DEFAULT false,
    "stockable" BOOLEAN NOT NULL DEFAULT false,
    "manufacturable" BOOLEAN NOT NULL DEFAULT false,
    "assemblable" BOOLEAN NOT NULL DEFAULT false,
    "transformable" BOOLEAN NOT NULL DEFAULT false,
    "packable" BOOLEAN NOT NULL DEFAULT false,
    "packaged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemCategory" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(64) NOT NULL,
    "categoryCode" VARCHAR(128) NOT NULL,
    "categoryName" VARCHAR(255) NOT NULL,
    "parentCategoryId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagingMethod" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(64) NOT NULL,
    "methodCode" VARCHAR(128) NOT NULL,
    "methodName" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackagingMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagingSpec" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(64) NOT NULL,
    "itemModelId" UUID NOT NULL,
    "packagingMethodId" UUID NOT NULL,
    "customerId" VARCHAR(64),
    "specCode" VARCHAR(128) NOT NULL,
    "specName" VARCHAR(255) NOT NULL,
    "grossWeight" VARCHAR(64),
    "volume" VARCHAR(64),
    "outerLength" VARCHAR(64),
    "outerWidth" VARCHAR(64),
    "outerHeight" VARCHAR(64),
    "workInstruction" TEXT,
    "version" VARCHAR(64),
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackagingSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bom" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(64) NOT NULL,
    "bomCode" VARCHAR(128) NOT NULL,
    "bomName" VARCHAR(255) NOT NULL,
    "bomType" "BomType" NOT NULL,
    "outputItemId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BomLine" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(64) NOT NULL,
    "bomId" UUID NOT NULL,
    "componentItemId" UUID NOT NULL,
    "lineRole" "BomLineRole" NOT NULL,
    "quantity" VARCHAR(64) NOT NULL,
    "uomCode" VARCHAR(64) NOT NULL,
    "lineNote" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BomLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierItemMapping" (
    "id" UUID NOT NULL,
    "tenantId" VARCHAR(64) NOT NULL,
    "supplierId" VARCHAR(64) NOT NULL,
    "supplierItemCode" VARCHAR(255),
    "supplierItemName" VARCHAR(255),
    "supplierItemCodeKey" VARCHAR(255),
    "supplierItemNameKey" VARCHAR(255),
    "itemId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierItemMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "result" TEXT NOT NULL,
    "operatorId" TEXT,
    "operatorType" TEXT NOT NULL,
    "tenantId" TEXT,
    "orgId" TEXT,
    "traceId" TEXT,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemModel_tenantId_active_idx" ON "ItemModel"("tenantId", "active");

-- CreateIndex
CREATE INDEX "ItemModel_tenantId_modelKind_modelType_idx" ON "ItemModel"("tenantId", "modelKind", "modelType");

-- CreateIndex
CREATE INDEX "ItemModel_tenantId_primaryCategoryId_idx" ON "ItemModel"("tenantId", "primaryCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemModel_tenantId_modelCode_key" ON "ItemModel"("tenantId", "modelCode");

-- CreateIndex
CREATE INDEX "AttributeDefinition_tenantId_active_idx" ON "AttributeDefinition"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeDefinition_tenantId_attributeCode_key" ON "AttributeDefinition"("tenantId", "attributeCode");

-- CreateIndex
CREATE INDEX "AttributeOption_tenantId_active_idx" ON "AttributeOption"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeOption_tenantId_attributeDefinitionId_optionCode_key" ON "AttributeOption"("tenantId", "attributeDefinitionId", "optionCode");

-- CreateIndex
CREATE INDEX "ItemModelAttributeRule_tenantId_itemModelId_idx" ON "ItemModelAttributeRule"("tenantId", "itemModelId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemModelAttributeRule_tenantId_itemModelId_attributeDefini_key" ON "ItemModelAttributeRule"("tenantId", "itemModelId", "attributeDefinitionId");

-- CreateIndex
CREATE INDEX "Item_tenantId_active_idx" ON "Item"("tenantId", "active");

-- CreateIndex
CREATE INDEX "Item_tenantId_itemModelId_idx" ON "Item"("tenantId", "itemModelId");

-- CreateIndex
CREATE INDEX "Item_tenantId_itemType_idx" ON "Item"("tenantId", "itemType");

-- CreateIndex
CREATE INDEX "Item_tenantId_packagingSpecId_idx" ON "Item"("tenantId", "packagingSpecId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_tenantId_itemCode_key" ON "Item"("tenantId", "itemCode");

-- CreateIndex
CREATE UNIQUE INDEX "Item_tenantId_itemModelId_variantKey_key" ON "Item"("tenantId", "itemModelId", "variantKey");

-- CreateIndex
CREATE INDEX "ItemCategory_tenantId_parentCategoryId_idx" ON "ItemCategory"("tenantId", "parentCategoryId");

-- CreateIndex
CREATE INDEX "ItemCategory_tenantId_active_idx" ON "ItemCategory"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ItemCategory_tenantId_categoryCode_key" ON "ItemCategory"("tenantId", "categoryCode");

-- CreateIndex
CREATE INDEX "PackagingMethod_tenantId_active_idx" ON "PackagingMethod"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "PackagingMethod_tenantId_methodCode_key" ON "PackagingMethod"("tenantId", "methodCode");

-- CreateIndex
CREATE INDEX "PackagingSpec_tenantId_itemModelId_idx" ON "PackagingSpec"("tenantId", "itemModelId");

-- CreateIndex
CREATE INDEX "PackagingSpec_tenantId_packagingMethodId_idx" ON "PackagingSpec"("tenantId", "packagingMethodId");

-- CreateIndex
CREATE INDEX "PackagingSpec_tenantId_customerId_idx" ON "PackagingSpec"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "PackagingSpec_tenantId_active_idx" ON "PackagingSpec"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "PackagingSpec_tenantId_specCode_key" ON "PackagingSpec"("tenantId", "specCode");

-- CreateIndex
CREATE INDEX "Bom_tenantId_bomType_idx" ON "Bom"("tenantId", "bomType");

-- CreateIndex
CREATE INDEX "Bom_tenantId_outputItemId_idx" ON "Bom"("tenantId", "outputItemId");

-- CreateIndex
CREATE INDEX "Bom_tenantId_active_idx" ON "Bom"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Bom_tenantId_bomCode_key" ON "Bom"("tenantId", "bomCode");

-- CreateIndex
CREATE INDEX "BomLine_tenantId_bomId_sortOrder_idx" ON "BomLine"("tenantId", "bomId", "sortOrder");

-- CreateIndex
CREATE INDEX "BomLine_tenantId_componentItemId_idx" ON "BomLine"("tenantId", "componentItemId");

-- CreateIndex
CREATE INDEX "SupplierItemMapping_tenantId_supplierId_idx" ON "SupplierItemMapping"("tenantId", "supplierId");

-- CreateIndex
CREATE INDEX "SupplierItemMapping_tenantId_itemId_idx" ON "SupplierItemMapping"("tenantId", "itemId");

-- CreateIndex
CREATE INDEX "SupplierItemMapping_tenantId_active_idx" ON "SupplierItemMapping"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierItemMapping_tenantId_supplierId_supplierItemCodeKey_key" ON "SupplierItemMapping"("tenantId", "supplierId", "supplierItemCodeKey");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierItemMapping_tenantId_supplierId_supplierItemNameKey_key" ON "SupplierItemMapping"("tenantId", "supplierId", "supplierItemNameKey");

-- CreateIndex
CREATE INDEX "AuditEvent_service_module_eventType_occurredAt_idx" ON "AuditEvent"("service", "module", "eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_tenantId_occurredAt_idx" ON "AuditEvent"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_resourceType_resourceId_occurredAt_idx" ON "AuditEvent"("resourceType", "resourceId", "occurredAt");

-- AddForeignKey
ALTER TABLE "ItemModel" ADD CONSTRAINT "ItemModel_primaryCategoryId_fkey" FOREIGN KEY ("primaryCategoryId") REFERENCES "ItemCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeOption" ADD CONSTRAINT "AttributeOption_attributeDefinitionId_fkey" FOREIGN KEY ("attributeDefinitionId") REFERENCES "AttributeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemModelAttributeRule" ADD CONSTRAINT "ItemModelAttributeRule_itemModelId_fkey" FOREIGN KEY ("itemModelId") REFERENCES "ItemModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemModelAttributeRule" ADD CONSTRAINT "ItemModelAttributeRule_attributeDefinitionId_fkey" FOREIGN KEY ("attributeDefinitionId") REFERENCES "AttributeDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_itemModelId_fkey" FOREIGN KEY ("itemModelId") REFERENCES "ItemModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_packagingSpecId_fkey" FOREIGN KEY ("packagingSpecId") REFERENCES "PackagingSpec"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCategory" ADD CONSTRAINT "ItemCategory_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "ItemCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingSpec" ADD CONSTRAINT "PackagingSpec_itemModelId_fkey" FOREIGN KEY ("itemModelId") REFERENCES "ItemModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingSpec" ADD CONSTRAINT "PackagingSpec_packagingMethodId_fkey" FOREIGN KEY ("packagingMethodId") REFERENCES "PackagingMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bom" ADD CONSTRAINT "Bom_outputItemId_fkey" FOREIGN KEY ("outputItemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomLine" ADD CONSTRAINT "BomLine_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "Bom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BomLine" ADD CONSTRAINT "BomLine_componentItemId_fkey" FOREIGN KEY ("componentItemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierItemMapping" ADD CONSTRAINT "SupplierItemMapping_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
