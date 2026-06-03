import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  AttributeDefinitionRecord,
  AttributeOptionRecord,
  BomLineInput,
  BomLineRecord,
  BomLineRole,
  BomRecord,
  BomResolutionStatus,
  BomType,
  ItemCapabilities,
  ItemCapabilityFilters,
  ItemCategoryTreeNode,
  ItemModelKind,
  ItemModelRecord,
  ItemModelType,
  ItemSummary,
  ItemType,
  PackagingMethodRecord,
  PackagingSpecRecord,
  SupplierItemMappingRecord,
  SupplierItemResolutionStatus,
  VariantResolutionStatus
} from '@oes/common/generated/item_master_service'
import {
  ITEM_MASTER_ALREADY_EXISTS,
  ITEM_MASTER_FAILED_PRECONDITION,
  ITEM_MASTER_INVALID_ARGUMENT,
  ITEM_MASTER_NOT_FOUND
} from '../common/errors/item-master.errors'
import { PrismaService } from '../infrastructure/prisma/prisma.service'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 50

type Db = ReturnType<PrismaService['getExecutionClient']>

/** ItemMasterQueryV2Service implements the Contract V2 read model without mutating item-master state. */
@Injectable()
export class ItemMasterQueryV2Service {
  constructor(private readonly prisma: PrismaService) {}

  async getItemModel(request: { tenantId?: string; itemModelId?: string }) {
    const record = await this.prisma.itemModel.findFirst({
      where: { tenantId: requireText(request.tenantId, 'tenant_id'), id: requireText(request.itemModelId, 'item_model_id') },
      include: { primaryCategory: true }
    })
    if (!record) throw notFound('item_model')
    return { itemModel: toItemModelRecord(record) }
  }

  async batchGetItemModels(request: { tenantId?: string; itemModelIds?: string[] }) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const ids = request.itemModelIds ?? []
    const records = ids.length
      ? await this.prisma.itemModel.findMany({ where: { tenantId, id: { in: ids } }, include: { primaryCategory: true } })
      : []
    const byId = new Map(records.map((record) => [record.id, toItemModelRecord(record)]))
    return {
      itemModels: ids.map((id) => byId.get(id)).filter(Boolean) as ItemModelRecord[],
      missingItemModelIds: ids.filter((id) => !byId.has(id))
    }
  }

  async searchItemModels(request: {
    tenantId?: string
    keyword?: string
    modelKind?: ItemModelKind
    modelType?: ItemModelType
    capabilityFilters?: ItemCapabilityFilters
    active?: boolean
    categoryId?: string
    includeDescendants?: boolean
    page?: number
    pageSize?: number
  }) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const page = normalizePage(request.page)
    const pageSize = normalizePageSize(request.pageSize)
    const categoryIds = await resolveCategoryFilter(this.prisma, tenantId, request.categoryId, request.includeDescendants)
    const where: any = { tenantId }

    applyKeyword(where, request.keyword, 'modelCode', 'modelName')
    if (request.modelKind) where.modelKind = toDbItemModelKind(request.modelKind)
    if (request.modelType) where.modelType = toDbItemModelType(request.modelType)
    if (request.active !== undefined) where.active = request.active
    if (categoryIds) where.primaryCategoryId = { in: categoryIds }
    applyCapabilityFilters(where, request.capabilityFilters)

    const [total, records] = await this.prisma.$transaction([
      this.prisma.itemModel.count({ where }),
      this.prisma.itemModel.findMany({
        where,
        include: { primaryCategory: true },
        orderBy: [{ modelCode: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return { itemModels: records.map(toItemModelRecord), total, page, pageSize }
  }

  async listAttributeDefinitions(request: {
    tenantId?: string
    keyword?: string
    active?: boolean
    page?: number
    pageSize?: number
  }) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const page = normalizePage(request.page)
    const pageSize = normalizePageSize(request.pageSize)
    const where: any = { tenantId }
    applyKeyword(where, request.keyword, 'attributeCode', 'attributeName')
    if (request.active !== undefined) where.active = request.active
    const [total, records] = await this.prisma.$transaction([
      this.prisma.attributeDefinition.count({ where }),
      this.prisma.attributeDefinition.findMany({
        include: { _count: { select: { options: true } } },
        where,
        orderBy: [{ attributeCode: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])
    return { attributeDefinitions: records.map(toAttributeDefinitionRecord), total, page, pageSize }
  }

  async listAttributeOptions(request: { tenantId?: string; attributeDefinitionId?: string; active?: boolean }) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const attributeDefinitionId = requireText(request.attributeDefinitionId, 'attribute_definition_id')
    await ensureExists(this.prisma.attributeDefinition, { tenantId, id: attributeDefinitionId }, 'attribute_definition')
    const records = await this.prisma.attributeOption.findMany({
      where: { tenantId, attributeDefinitionId, ...(request.active !== undefined ? { active: request.active } : {}) },
      orderBy: [{ optionCode: 'asc' }, { id: 'asc' }]
    })
    return { attributeOptions: records.map(toAttributeOptionRecord) }
  }

  async getItemModelAttributeRules(request: { tenantId?: string; itemModelId?: string }) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const itemModelId = requireText(request.itemModelId, 'item_model_id')
    await ensureExists(this.prisma.itemModel, { tenantId, id: itemModelId }, 'item_model')
    const records = await this.prisma.itemModelAttributeRule.findMany({
      where: { tenantId, itemModelId },
      orderBy: [{ attributeDefinitionId: 'asc' }]
    })
    return {
      rules: records.map((record) => ({
        itemModelId: record.itemModelId,
        attributeDefinitionId: record.attributeDefinitionId,
        required: record.required,
        allowedOptionIds: record.allowedOptionIds
      }))
    }
  }

  async getItem(request: { tenantId?: string; itemId?: string }) {
    const item = await findItem(this.prisma, requireText(request.tenantId, 'tenant_id'), requireText(request.itemId, 'item_id'))
    if (!item) throw notFound('item')
    return { item: toItemSummary(item) }
  }

  async batchGetItems(request: { tenantId?: string; itemIds?: string[] }) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const ids = request.itemIds ?? []
    const records = ids.length ? await findItems(this.prisma, tenantId, ids) : []
    const byId = new Map(records.map((record) => [record.id, toItemSummary(record)]))
    return {
      items: ids.map((id) => byId.get(id)).filter(Boolean) as ItemSummary[],
      missingItemIds: ids.filter((id) => !byId.has(id))
    }
  }

  async searchItems(request: {
    tenantId?: string
    keyword?: string
    itemModelId?: string
    itemType?: ItemType
    packagingSpecId?: string
    lockedAttributeOptionIds?: string[]
    capabilityFilters?: ItemCapabilityFilters
    active?: boolean
    categoryId?: string
    includeDescendants?: boolean
    page?: number
    pageSize?: number
  }) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const page = normalizePage(request.page)
    const pageSize = normalizePageSize(request.pageSize)
    const categoryIds = await resolveCategoryFilter(this.prisma, tenantId, request.categoryId, request.includeDescendants)
    const where: any = { tenantId }
    applyKeyword(where, request.keyword, 'itemCode', 'itemName')
    if (request.itemModelId) where.itemModelId = request.itemModelId
    if (request.itemType) where.itemType = toDbItemType(request.itemType)
    if (request.packagingSpecId) where.packagingSpecId = request.packagingSpecId
    if (request.lockedAttributeOptionIds?.length) where.lockedAttributeOptionIds = { hasEvery: request.lockedAttributeOptionIds }
    if (request.active !== undefined) where.active = request.active
    if (categoryIds) where.itemModel = { primaryCategoryId: { in: categoryIds } }
    applyCapabilityFilters(where, request.capabilityFilters)

    const [total, records] = await this.prisma.$transaction([
      this.prisma.item.count({ where }),
      this.prisma.item.findMany({
        where,
        include: itemInclude(),
        orderBy: [{ itemCode: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return { items: records.map(toItemSummary), total, page, pageSize }
  }

  async resolveItemVariant(request: {
    tenantId?: string
    itemModelId?: string
    lockedAttributeOptionIds?: string[]
    packagingSpecId?: string
  }) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const itemModelId = requireText(request.itemModelId, 'item_model_id')
    const variantKey = buildVariantKey(request.lockedAttributeOptionIds ?? [], request.packagingSpecId)
    const records = await this.prisma.item.findMany({ where: { tenantId, itemModelId, variantKey }, include: itemInclude() })
    if (records.length === 0) {
      return { resolutionStatus: VariantResolutionStatus.VARIANT_RESOLUTION_STATUS_NO_MATCH }
    }
    if (records.length > 1) throw failedPrecondition('item_variant_not_unique')
    return {
      resolutionStatus: VariantResolutionStatus.VARIANT_RESOLUTION_STATUS_MATCHED,
      item: toItemSummary(records[0])
    }
  }

  async listItemCategories(request: { tenantId?: string; parentCategoryId?: string; active?: boolean }) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const parentCategoryId = normalizeOptional(request.parentCategoryId)
    if (parentCategoryId) await ensureExists(this.prisma.itemCategory, { tenantId, id: parentCategoryId }, 'item_category')
    const records = await this.prisma.itemCategory.findMany({
      where: { tenantId, parentCategoryId: parentCategoryId ?? null, ...(request.active !== undefined ? { active: request.active } : {}) },
      include: { children: true },
      orderBy: [{ categoryCode: 'asc' }, { id: 'asc' }]
    })
    return { categories: records.map(toItemCategoryTreeNode) }
  }

  async listPackagingMethods(request: { tenantId?: string; keyword?: string; active?: boolean }) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const where: any = { tenantId }
    applyKeyword(where, request.keyword, 'methodCode', 'methodName', 'description')
    if (request.active !== undefined) where.active = request.active
    const records = await this.prisma.packagingMethod.findMany({ where, orderBy: [{ methodCode: 'asc' }, { id: 'asc' }] })
    return { packagingMethods: records.map(toPackagingMethodRecord) }
  }

  async getPackagingSpec(request: { tenantId?: string; packagingSpecId?: string }) {
    const record = await this.prisma.packagingSpec.findFirst({
      where: { tenantId: requireText(request.tenantId, 'tenant_id'), id: requireText(request.packagingSpecId, 'packaging_spec_id') }
    })
    if (!record) throw notFound('packaging_spec')
    return { packagingSpec: toPackagingSpecRecord(record) }
  }

  async searchPackagingSpecs(request: {
    tenantId?: string
    keyword?: string
    itemModelId?: string
    packagingMethodId?: string
    customerId?: string
    active?: boolean
    page?: number
    pageSize?: number
  }) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const page = normalizePage(request.page)
    const pageSize = normalizePageSize(request.pageSize)
    const where: any = { tenantId }
    applyKeyword(where, request.keyword, 'specCode', 'specName')
    if (request.itemModelId) where.itemModelId = request.itemModelId
    if (request.packagingMethodId) where.packagingMethodId = request.packagingMethodId
    if (request.customerId) where.customerId = request.customerId
    if (request.active !== undefined) where.active = request.active
    const [total, records] = await this.prisma.$transaction([
      this.prisma.packagingSpec.count({ where }),
      this.prisma.packagingSpec.findMany({
        where,
        orderBy: [{ specCode: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])
    return { packagingSpecs: records.map(toPackagingSpecRecord), total, page, pageSize }
  }

  async getBom(request: { tenantId?: string; bomId?: string }) {
    const bom = await findBom(this.prisma, requireText(request.tenantId, 'tenant_id'), requireText(request.bomId, 'bom_id'))
    if (!bom) throw notFound('bom')
    return { bom: toBomRecord(bom) }
  }

  async searchBoms(request: {
    tenantId?: string
    keyword?: string
    bomType?: BomType
    outputItemId?: string
    componentItemId?: string
    active?: boolean
    page?: number
    pageSize?: number
  }) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const page = normalizePage(request.page)
    const pageSize = normalizePageSize(request.pageSize)
    const where: any = { tenantId }
    applyKeyword(where, request.keyword, 'bomCode', 'bomName')
    if (request.bomType) where.bomType = toDbBomType(request.bomType)
    if (request.outputItemId) where.outputItemId = request.outputItemId
    if (request.componentItemId) where.lines = { some: { componentItemId: request.componentItemId } }
    if (request.active !== undefined) where.active = request.active
    const [total, records] = await this.prisma.$transaction([
      this.prisma.bom.count({ where }),
      this.prisma.bom.findMany({
        where,
        include: bomInclude(),
        orderBy: [{ bomCode: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])
    return { boms: records.map(toBomRecord), total, page, pageSize }
  }

  async getBomByOutputItem(request: { tenantId?: string; outputItemId?: string; bomType?: BomType }) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const outputItemId = requireText(request.outputItemId, 'output_item_id')
    const bomType = toDbBomType(request.bomType)
    const records = await this.prisma.bom.findMany({
      where: { tenantId, outputItemId, bomType, active: true },
      include: bomInclude()
    })
    if (records.length === 0) return { resolutionStatus: BomResolutionStatus.BOM_RESOLUTION_STATUS_NO_MATCH }
    if (records.length > 1) throw failedPrecondition('bom_not_unique')
    return { resolutionStatus: BomResolutionStatus.BOM_RESOLUTION_STATUS_MATCHED, bom: toBomRecord(records[0]) }
  }

  async listSupplierItemMappingsByItem(request: {
    tenantId?: string
    itemId?: string
    active?: boolean
    page?: number
    pageSize?: number
  }) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const itemId = requireText(request.itemId, 'item_id')
    await ensureExists(this.prisma.item, { tenantId, id: itemId }, 'item')
    const page = normalizePage(request.page)
    const pageSize = normalizePageSize(request.pageSize)
    const where: any = { tenantId, itemId }
    if (request.active !== undefined) where.active = request.active
    const [total, records] = await this.prisma.$transaction([
      this.prisma.supplierItemMapping.count({ where }),
      this.prisma.supplierItemMapping.findMany({
        where,
        include: { item: { include: itemInclude() } },
        orderBy: [{ supplierId: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])
    return { mappings: records.map(toSupplierItemMappingRecord), total, page, pageSize }
  }

  async resolveSupplierItemMapping(request: {
    tenantId?: string
    supplierId?: string
    supplierItemCode?: string
    supplierItemName?: string
  }) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const supplierId = requireText(request.supplierId, 'supplier_id')
    const codeKey = normalizeKey(request.supplierItemCode)
    const nameKey = normalizeKey(request.supplierItemName)
    if (!codeKey && !nameKey) throw invalidArgument('supplier_item_code_or_name_required')
    const mapping = await this.prisma.supplierItemMapping.findFirst({
      where: {
        tenantId,
        supplierId,
        active: true,
        OR: [codeKey ? { supplierItemCodeKey: codeKey } : undefined, nameKey ? { supplierItemNameKey: nameKey } : undefined].filter(Boolean)
      },
      include: { item: { include: itemInclude() } }
    })
    if (!mapping) {
      return { resolutionStatus: SupplierItemResolutionStatus.SUPPLIER_ITEM_RESOLUTION_STATUS_NO_MATCH }
    }
    return {
      resolutionStatus: SupplierItemResolutionStatus.SUPPLIER_ITEM_RESOLUTION_STATUS_MATCHED,
      mapping: toSupplierItemMappingRecord(mapping)
    }
  }
}

/** ItemMasterManagementV2Service implements Contract V2 commands and enforces item-master invariants before persistence. */
@Injectable()
export class ItemMasterManagementV2Service
{
  constructor(private readonly prisma: PrismaService) {}

  async createItemModel(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const record = await this.prisma.itemModel.create({
      data: {
        id: randomUUID(),
        tenantId,
        modelCode: requireText(request.modelCode, 'model_code'),
        modelName: requireText(request.modelName, 'model_name'),
        modelKind: toDbItemModelKind(request.modelKind),
        modelType: toDbItemModelType(request.modelType),
        ...toCapabilityData(request.capabilities),
        primaryCategoryId: normalizeOptional(request.primaryCategoryId)
      },
      include: { primaryCategory: true }
    }).catch(handleUnique)
    return { itemModelId: record.id, itemModel: toItemModelRecord(record) }
  }

  async updateItemModelBasics(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const itemModelId = requireText(request.itemModelId, 'item_model_id')
    await ensureExists(this.prisma.itemModel, { tenantId, id: itemModelId }, 'item_model')
    const record = await this.prisma.itemModel.update({
      where: { id: itemModelId },
      data: { modelCode: requireText(request.modelCode, 'model_code'), modelName: requireText(request.modelName, 'model_name') },
      include: { primaryCategory: true }
    }).catch(handleUnique)
    return { itemModel: toItemModelRecord(record) }
  }

  async setItemModelCapabilities(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const itemModelId = requireText(request.itemModelId, 'item_model_id')
    await ensureExists(this.prisma.itemModel, { tenantId, id: itemModelId }, 'item_model')
    const record = await this.prisma.itemModel.update({
      where: { id: itemModelId },
      data: toCapabilityData(request.capabilities),
      include: { primaryCategory: true }
    })
    return { itemModel: toItemModelRecord(record) }
  }

  async changeItemModelStatus(request: any) {
    const record = await this.updateModelStatus(request.tenantId, request.itemModelId, request.active)
    return { itemModel: record }
  }

  async setItemModelPrimaryCategory(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const itemModelId = requireText(request.itemModelId, 'item_model_id')
    const primaryCategoryId = normalizeOptional(request.primaryCategoryId)
    await ensureExists(this.prisma.itemModel, { tenantId, id: itemModelId }, 'item_model')
    if (primaryCategoryId) await ensureExists(this.prisma.itemCategory, { tenantId, id: primaryCategoryId }, 'item_category')
    const record = await this.prisma.itemModel.update({
      where: { id: itemModelId },
      data: { primaryCategoryId },
      include: { primaryCategory: true }
    })
    return { itemModel: toItemModelRecord(record) }
  }

  async createAttributeDefinition(request: any) {
    const record = await this.prisma.attributeDefinition.create({
      data: {
        id: randomUUID(),
        tenantId: requireText(request.tenantId, 'tenant_id'),
        attributeCode: requireText(request.attributeCode, 'attribute_code'),
        attributeName: requireText(request.attributeName, 'attribute_name')
      }
    }).catch(handleUnique)
    return { attributeDefinition: toAttributeDefinitionRecord(record) }
  }

  async updateAttributeDefinition(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const id = requireText(request.attributeDefinitionId, 'attribute_definition_id')
    await ensureExists(this.prisma.attributeDefinition, { tenantId, id }, 'attribute_definition')
    const record = await this.prisma.attributeDefinition.update({
      where: { id },
      data: {
        attributeCode: requireText(request.attributeCode, 'attribute_code'),
        attributeName: requireText(request.attributeName, 'attribute_name'),
        active: Boolean(request.active)
      }
    }).catch(handleUnique)
    return { attributeDefinition: toAttributeDefinitionRecord(record) }
  }

  async createAttributeOption(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const attributeDefinitionId = requireText(request.attributeDefinitionId, 'attribute_definition_id')
    await ensureExists(this.prisma.attributeDefinition, { tenantId, id: attributeDefinitionId }, 'attribute_definition')
    const record = await this.prisma.attributeOption.create({
      data: {
        id: randomUUID(),
        tenantId,
        attributeDefinitionId,
        optionCode: requireText(request.optionCode, 'option_code'),
        optionName: requireText(request.optionName, 'option_name'),
        description: normalizeOptional(request.description) ?? null
      }
    }).catch(handleUnique)
    return { attributeOption: toAttributeOptionRecord(record) }
  }

  async updateAttributeOption(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const id = requireText(request.attributeOptionId, 'attribute_option_id')
    await ensureExists(this.prisma.attributeOption, { tenantId, id }, 'attribute_option')
    const record = await this.prisma.attributeOption.update({
      where: { id },
      data: {
        optionCode: requireText(request.optionCode, 'option_code'),
        optionName: requireText(request.optionName, 'option_name'),
        description: normalizeOptional(request.description) ?? null,
        active: Boolean(request.active)
      }
    }).catch(handleUnique)
    return { attributeOption: toAttributeOptionRecord(record) }
  }

  async setItemModelAttributeRules(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const itemModelId = requireText(request.itemModelId, 'item_model_id')
    await ensureExists(this.prisma.itemModel, { tenantId, id: itemModelId }, 'item_model')
    await this.prisma.runInTransaction(async () => {
      await this.prisma.getExecutionClient().itemModelAttributeRule.deleteMany({ where: { tenantId, itemModelId } })
      for (const rule of request.rules ?? []) {
        const attributeDefinitionId = requireText(rule.attributeDefinitionId, 'attribute_definition_id')
        await ensureExists(this.prisma.getExecutionClient().attributeDefinition, { tenantId, id: attributeDefinitionId }, 'attribute_definition')
        await this.prisma.getExecutionClient().itemModelAttributeRule.create({
          data: {
            id: randomUUID(),
            tenantId,
            itemModelId,
            attributeDefinitionId,
            required: Boolean(rule.required),
            allowedOptionIds: rule.allowedOptionIds ?? []
          }
        })
      }
    })
    return new ItemMasterQueryV2Service(this.prisma).getItemModelAttributeRules({ tenantId, itemModelId })
  }

  async createItem(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const itemModelId = requireText(request.itemModelId, 'item_model_id')
    const itemModel = await this.prisma.itemModel.findFirst({ where: { tenantId, id: itemModelId }, include: { primaryCategory: true } })
    if (!itemModel) throw notFound('item_model')
    if (!itemModel.active) throw failedPrecondition('item_model_inactive')
    const lockedAttributeOptionIds = normalizedIds(request.lockedAttributeOptionIds ?? [])
    await validateAttributeRules(this.prisma, tenantId, itemModelId, lockedAttributeOptionIds)
    const itemType = toDbItemType(request.itemType)
    const packagingSpecId = normalizeOptional(request.packagingSpecId)
    if (itemType === 'PACKAGED_FINISHED_GOOD') {
      if (!packagingSpecId) throw invalidArgument('packaging_spec_id_required')
      const spec = await this.prisma.packagingSpec.findFirst({ where: { tenantId, id: packagingSpecId, itemModelId, active: true } })
      if (!spec) throw failedPrecondition('packaging_spec_not_active_for_model')
    } else if (packagingSpecId) {
      throw invalidArgument('standard_item_cannot_have_packaging_spec')
    }
    const capabilities = mergeCapabilities(request.capabilities, capabilitiesFromRecord(itemModel))
    enforcePackagedCapability(itemType, capabilities)
    const record = await this.prisma.item.create({
      data: {
        id: randomUUID(),
        tenantId,
        itemModelId,
        itemCode: requireText(request.itemCode, 'item_code'),
        itemName: requireText(request.itemName, 'item_name'),
        itemType,
        lockedAttributeOptionIds,
        variantKey: buildVariantKey(lockedAttributeOptionIds, packagingSpecId),
        packagingSpecId,
        ...toCapabilityData(capabilities)
      },
      include: itemInclude()
    }).catch(handleUnique)
    return { itemId: record.id, item: toItemSummary(record) }
  }

  async updateItemBasics(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const itemId = requireText(request.itemId, 'item_id')
    await ensureExists(this.prisma.item, { tenantId, id: itemId }, 'item')
    const record = await this.prisma.item.update({
      where: { id: itemId },
      data: { itemCode: requireText(request.itemCode, 'item_code'), itemName: requireText(request.itemName, 'item_name') },
      include: itemInclude()
    }).catch(handleUnique)
    return { item: toItemSummary(record) }
  }

  async setItemCapabilities(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const itemId = requireText(request.itemId, 'item_id')
    const item = await findItem(this.prisma, tenantId, itemId)
    if (!item) throw notFound('item')
    const capabilities = mergeCapabilities(request.capabilities, emptyCapabilities())
    enforcePackagedCapability(item.itemType, capabilities)
    const record = await this.prisma.item.update({
      where: { id: itemId },
      data: toCapabilityData(capabilities),
      include: itemInclude()
    })
    return { item: toItemSummary(record) }
  }

  async changeItemStatus(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const itemId = requireText(request.itemId, 'item_id')
    await ensureExists(this.prisma.item, { tenantId, id: itemId }, 'item')
    const record = await this.prisma.item.update({ where: { id: itemId }, data: { active: Boolean(request.active) }, include: itemInclude() })
    return { item: toItemSummary(record) }
  }

  async createItemCategory(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const parentCategoryId = normalizeOptional(request.parentCategoryId)
    if (parentCategoryId) await ensureExists(this.prisma.itemCategory, { tenantId, id: parentCategoryId }, 'item_category')
    const record = await this.prisma.itemCategory.create({
      data: {
        id: randomUUID(),
        tenantId,
        categoryCode: requireText(request.categoryCode, 'category_code'),
        categoryName: requireText(request.categoryName, 'category_name'),
        parentCategoryId
      },
      include: { children: true }
    }).catch(handleUnique)
    return { category: toItemCategoryTreeNode(record) }
  }

  async updateItemCategoryBasics(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const categoryId = requireText(request.categoryId, 'category_id')
    await ensureExists(this.prisma.itemCategory, { tenantId, id: categoryId }, 'item_category')
    const record = await this.prisma.itemCategory.update({
      where: { id: categoryId },
      data: { categoryCode: requireText(request.categoryCode, 'category_code'), categoryName: requireText(request.categoryName, 'category_name') },
      include: { children: true }
    }).catch(handleUnique)
    return { category: toItemCategoryTreeNode(record) }
  }

  async moveItemCategory(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const categoryId = requireText(request.categoryId, 'category_id')
    const parentCategoryId = normalizeOptional(request.parentCategoryId)
    await ensureExists(this.prisma.itemCategory, { tenantId, id: categoryId }, 'item_category')
    if (parentCategoryId) {
      await ensureExists(this.prisma.itemCategory, { tenantId, id: parentCategoryId }, 'item_category')
    }

    await ensureCategoryMoveIsAcyclic(this.prisma, tenantId, categoryId, parentCategoryId)

    const record = await this.prisma.itemCategory.update({
      where: { id: categoryId },
      data: { parentCategoryId: parentCategoryId ?? null },
      include: { children: true }
    })
    return { category: toItemCategoryTreeNode(record) }
  }

  async changeItemCategoryStatus(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const categoryId = requireText(request.categoryId, 'category_id')
    await ensureExists(this.prisma.itemCategory, { tenantId, id: categoryId }, 'item_category')
    const record = await this.prisma.itemCategory.update({
      where: { id: categoryId },
      data: { active: Boolean(request.active) },
      include: { children: true }
    })
    return { category: toItemCategoryTreeNode(record) }
  }

  async deleteItemCategory(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const categoryId = requireText(request.categoryId, 'category_id')
    await ensureExists(this.prisma.itemCategory, { tenantId, id: categoryId }, 'item_category')

    const childCount = await this.prisma.itemCategory.count({
      where: { tenantId, parentCategoryId: categoryId }
    })
    if (childCount > 0) throw failedPrecondition('item_category_has_children')

    const itemModelCount = await this.prisma.itemModel.count({
      where: { tenantId, primaryCategoryId: categoryId }
    })
    if (itemModelCount > 0) throw failedPrecondition('item_category_in_use')

    await this.prisma.itemCategory.delete({
      where: { id: categoryId }
    })
    return {}
  }

  async createPackagingMethod(request: any) {
    const record = await this.prisma.packagingMethod.create({
      data: {
        id: randomUUID(),
        tenantId: requireText(request.tenantId, 'tenant_id'),
        methodCode: requireText(request.methodCode, 'method_code'),
        methodName: requireText(request.methodName, 'method_name'),
        description: normalizeOptional(request.description) ?? null
      }
    }).catch(handleUnique)
    return { packagingMethod: toPackagingMethodRecord(record) }
  }

  async updatePackagingMethod(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const id = requireText(request.packagingMethodId, 'packaging_method_id')
    await ensureExists(this.prisma.packagingMethod, { tenantId, id }, 'packaging_method')
    const data: any = {
      methodCode: requireText(request.methodCode, 'method_code'),
      methodName: requireText(request.methodName, 'method_name')
    }
    if (Object.prototype.hasOwnProperty.call(request, 'description')) {
      data.description = normalizeOptional(request.description) ?? null
    }
    const record = await this.prisma.packagingMethod.update({
      where: { id },
      data
    }).catch(handleUnique)
    return { packagingMethod: toPackagingMethodRecord(record) }
  }

  async changePackagingMethodStatus(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const id = requireText(request.packagingMethodId, 'packaging_method_id')
    await ensureExists(this.prisma.packagingMethod, { tenantId, id }, 'packaging_method')
    const record = await this.prisma.packagingMethod.update({ where: { id }, data: { active: Boolean(request.active) } })
    return { packagingMethod: toPackagingMethodRecord(record) }
  }

  /** deletePackagingMethod hard-deletes only unused packaging method dictionary rows. */
  async deletePackagingMethod(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const id = requireText(request.packagingMethodId, 'packaging_method_id')
    await ensureExists(this.prisma.packagingMethod, { tenantId, id }, 'packaging_method')

    const specCount = await this.prisma.packagingSpec.count({
      where: { tenantId, packagingMethodId: id }
    })
    if (specCount > 0) throw failedPrecondition('packaging_method_in_use')

    await this.prisma.packagingMethod.delete({ where: { id } })
    return {}
  }

  async createPackagingSpec(request: any) {
    const data = await this.packagingSpecData(request)
    const record = await this.prisma.packagingSpec.create({ data: { id: randomUUID(), ...data } }).catch(handleUnique)
    return { packagingSpec: toPackagingSpecRecord(record) }
  }

  async updatePackagingSpec(request: any) {
    const id = requireText(request.packagingSpecId, 'packaging_spec_id')
    const data = await this.packagingSpecData(request)
    await ensureExists(this.prisma.packagingSpec, { tenantId: data.tenantId, id }, 'packaging_spec')
    const record = await this.prisma.packagingSpec.update({ where: { id }, data }).catch(handleUnique)
    return { packagingSpec: toPackagingSpecRecord(record) }
  }

  async changePackagingSpecStatus(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const id = requireText(request.packagingSpecId, 'packaging_spec_id')
    await ensureExists(this.prisma.packagingSpec, { tenantId, id }, 'packaging_spec')
    const record = await this.prisma.packagingSpec.update({ where: { id }, data: { active: Boolean(request.active) } })
    return { packagingSpec: toPackagingSpecRecord(record) }
  }

  async createBom(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const outputItemId = requireText(request.outputItemId, 'output_item_id')
    const bomType = toDbBomType(request.bomType)
    const lines = request.lines ?? []
    await validateBom(this.prisma, tenantId, bomType, outputItemId, lines)
    const record = await this.prisma.bom.create({
      data: {
        id: randomUUID(),
        tenantId,
        bomCode: requireText(request.bomCode, 'bom_code'),
        bomName: requireText(request.bomName, 'bom_name'),
        bomType,
        outputItemId,
        lines: { create: lines.map((line: BomLineInput, index: number) => bomLineCreate(tenantId, line, index)) }
      },
      include: bomInclude()
    }).catch(handleUnique)
    return { bomId: record.id, bom: toBomRecord(record) }
  }

  async updateBomBasics(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const id = requireText(request.bomId, 'bom_id')
    await ensureExists(this.prisma.bom, { tenantId, id }, 'bom')
    const record = await this.prisma.bom.update({
      where: { id },
      data: { bomCode: requireText(request.bomCode, 'bom_code'), bomName: requireText(request.bomName, 'bom_name') },
      include: bomInclude()
    }).catch(handleUnique)
    return { bom: toBomRecord(record) }
  }

  async replaceBomLines(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const id = requireText(request.bomId, 'bom_id')
    const bom = await this.prisma.bom.findFirst({ where: { tenantId, id } })
    if (!bom) throw notFound('bom')
    const lines = request.lines ?? []
    await validateBom(this.prisma, tenantId, bom.bomType, bom.outputItemId, lines, id)
    const record = await this.prisma.runInTransaction(async () => {
      await this.prisma.getExecutionClient().bomLine.deleteMany({ where: { tenantId, bomId: id } })
      return this.prisma.getExecutionClient().bom.update({
        where: { id },
        data: { lines: { create: lines.map((line: BomLineInput, index: number) => bomLineCreate(tenantId, line, index)) } },
        include: bomInclude()
      })
    })
    return { bom: toBomRecord(record) }
  }

  async changeBomStatus(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const id = requireText(request.bomId, 'bom_id')
    await ensureExists(this.prisma.bom, { tenantId, id }, 'bom')
    const record = await this.prisma.bom.update({ where: { id }, data: { active: Boolean(request.active) }, include: bomInclude() })
    return { bom: toBomRecord(record) }
  }

  async upsertSupplierItemMapping(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const supplierId = requireText(request.supplierId, 'supplier_id')
    const itemId = requireText(request.itemId, 'item_id')
    const supplierItemCode = normalizeOptional(request.supplierItemCode)
    const supplierItemName = normalizeOptional(request.supplierItemName)
    const supplierItemCodeKey = normalizeKey(supplierItemCode)
    const supplierItemNameKey = normalizeKey(supplierItemName)
    if (!supplierItemCodeKey && !supplierItemNameKey) throw invalidArgument('supplier_item_code_or_name_required')
    const item = await findItem(this.prisma, tenantId, itemId)
    if (!item) throw notFound('item')
    if (!item.active) throw failedPrecondition('item_inactive')
    const existing = await this.prisma.supplierItemMapping.findFirst({
      where: {
        tenantId,
        supplierId,
        OR: [
          supplierItemCodeKey ? { supplierItemCodeKey } : undefined,
          supplierItemNameKey ? { supplierItemNameKey } : undefined
        ].filter(Boolean)
      }
    })
    const data = {
      supplierItemCode,
      supplierItemName,
      supplierItemCodeKey,
      supplierItemNameKey,
      itemId,
      active: request.active ?? true
    }
    const record = existing
      ? await this.prisma.supplierItemMapping.update({ where: { id: existing.id }, data, include: { item: { include: itemInclude() } } })
      : await this.prisma.supplierItemMapping.create({
          data: { id: randomUUID(), tenantId, supplierId, ...data },
          include: { item: { include: itemInclude() } }
        })
    return { mapping: toSupplierItemMappingRecord(record) }
  }

  private async updateModelStatus(tenantIdInput: string | undefined, itemModelIdInput: string | undefined, active: boolean | undefined) {
    const tenantId = requireText(tenantIdInput, 'tenant_id')
    const itemModelId = requireText(itemModelIdInput, 'item_model_id')
    await ensureExists(this.prisma.itemModel, { tenantId, id: itemModelId }, 'item_model')
    const record = await this.prisma.itemModel.update({
      where: { id: itemModelId },
      data: { active: Boolean(active) },
      include: { primaryCategory: true }
    })
    return toItemModelRecord(record)
  }

  private async packagingSpecData(request: any) {
    const tenantId = requireText(request.tenantId, 'tenant_id')
    const itemModelId = requireText(request.itemModelId, 'item_model_id')
    const packagingMethodId = requireText(request.packagingMethodId, 'packaging_method_id')
    await ensureExists(this.prisma.itemModel, { tenantId, id: itemModelId }, 'item_model')
    await ensureExists(this.prisma.packagingMethod, { tenantId, id: packagingMethodId }, 'packaging_method')
    return {
      tenantId,
      itemModelId,
      packagingMethodId,
      customerId: normalizeOptional(request.customerId),
      specCode: requireText(request.specCode, 'spec_code'),
      specName: requireText(request.specName, 'spec_name'),
      grossWeight: normalizeOptional(request.grossWeight),
      volume: normalizeOptional(request.volume),
      outerLength: normalizeOptional(request.outerLength),
      outerWidth: normalizeOptional(request.outerWidth),
      outerHeight: normalizeOptional(request.outerHeight),
      workInstruction: normalizeOptional(request.workInstruction),
      version: normalizeOptional(request.version),
      effectiveFrom: parseOptionalDate(request.effectiveFrom),
      effectiveTo: parseOptionalDate(request.effectiveTo)
    }
  }
}

function itemInclude(): any {
  return { itemModel: { include: { primaryCategory: true } } }
}

function bomInclude(): any {
  return { lines: { include: { componentItem: { include: itemInclude() } }, orderBy: { sortOrder: 'asc' } } }
}

function applyKeyword(where: any, keyword: string | undefined, ...fields: string[]): void {
  const value = normalizeOptional(keyword)
  if (!value) return
  where.OR = fields.map((field) => ({ [field]: { contains: value, mode: 'insensitive' } }))
}

function applyCapabilityFilters(where: any, filters?: ItemCapabilityFilters): void {
  if (!filters) return
  for (const key of ['sellable', 'purchasable', 'stockable', 'manufacturable', 'assemblable', 'transformable', 'packable', 'packaged']) {
    const value = (filters as any)[key]
    if (value !== undefined) where[key] = value
  }
}

async function resolveCategoryFilter(prisma: PrismaService, tenantId: string, categoryId?: string, includeDescendants?: boolean): Promise<string[] | undefined> {
  const id = normalizeOptional(categoryId)
  if (!id) {
    if (includeDescendants) throw invalidArgument('include_descendants_requires_category_id')
    return undefined
  }
  await ensureExists(prisma.itemCategory, { tenantId, id }, 'item_category')
  if (!includeDescendants) return [id]
  const all = await prisma.itemCategory.findMany({ where: { tenantId }, select: { id: true, parentCategoryId: true } })
  const children = new Map<string, string[]>()
  for (const category of all) {
    if (!category.parentCategoryId) continue
    children.set(category.parentCategoryId, [...(children.get(category.parentCategoryId) ?? []), category.id])
  }
  const result = [id]
  for (let index = 0; index < result.length; index += 1) {
    result.push(...(children.get(result[index]) ?? []))
  }
  return result
}

async function ensureCategoryMoveIsAcyclic(
  prisma: PrismaService,
  tenantId: string,
  categoryId: string,
  parentCategoryId?: string
): Promise<void> {
  if (!parentCategoryId) return
  if (parentCategoryId === categoryId) throw failedPrecondition('item_category_parent_cycle')

  const all = await prisma.itemCategory.findMany({ where: { tenantId }, select: { id: true, parentCategoryId: true } })
  const children = new Map<string, string[]>()
  for (const category of all) {
    if (!category.parentCategoryId) continue
    children.set(category.parentCategoryId, [...(children.get(category.parentCategoryId) ?? []), category.id])
  }

  const descendants = [...(children.get(categoryId) ?? [])]
  for (let index = 0; index < descendants.length; index += 1) {
    const descendantId = descendants[index]
    if (descendantId === parentCategoryId) throw failedPrecondition('item_category_parent_cycle')
    descendants.push(...(children.get(descendantId) ?? []))
  }
}

async function findItem(prisma: PrismaService, tenantId: string, itemId: string): Promise<any | null> {
  return prisma.item.findFirst({ where: { tenantId, id: itemId }, include: itemInclude() })
}

async function findItems(prisma: PrismaService, tenantId: string, itemIds: string[]): Promise<any[]> {
  return prisma.item.findMany({ where: { tenantId, id: { in: itemIds } }, include: itemInclude() })
}

async function findBom(prisma: PrismaService, tenantId: string, bomId: string): Promise<any | null> {
  return prisma.bom.findFirst({ where: { tenantId, id: bomId }, include: bomInclude() })
}

async function ensureExists(model: any, where: Record<string, unknown>, resource: string): Promise<void> {
  const found = await model.findFirst({ where })
  if (!found) throw notFound(resource)
}

async function validateAttributeRules(prisma: PrismaService, tenantId: string, itemModelId: string, optionIds: string[]): Promise<void> {
  const rules = await prisma.itemModelAttributeRule.findMany({ where: { tenantId, itemModelId } })
  const allowed = new Set(rules.flatMap((rule) => rule.allowedOptionIds))
  for (const optionId of optionIds) {
    if (!allowed.has(optionId)) throw failedPrecondition('attribute_option_not_allowed')
  }
  for (const rule of rules.filter((candidate) => candidate.required)) {
    if (!rule.allowedOptionIds.some((optionId) => optionIds.includes(optionId))) {
      throw failedPrecondition('required_attribute_missing')
    }
  }
}

async function validateBom(prisma: PrismaService, tenantId: string, bomType: string, outputItemId: string, lines: BomLineInput[], existingBomId?: string): Promise<void> {
  const outputItem = await findItem(prisma, tenantId, outputItemId)
  if (!outputItem || !outputItem.active) throw failedPrecondition('output_item_must_be_active')
  if (bomType === 'COMPOSITION' && !outputItem.assemblable) throw failedPrecondition('output_item_not_assemblable')
  if (bomType === 'TRANSFORMATION' && !outputItem.transformable) throw failedPrecondition('output_item_not_transformable')
  if (bomType === 'PACKAGING' && !outputItem.packaged) throw failedPrecondition('output_item_not_packaged')

  const componentIds = normalizedIds(lines.map((line) => line.componentItemId ?? ''))
  const components = componentIds.length ? await findItems(prisma, tenantId, componentIds) : []
  const componentsById = new Map(components.map((component) => [component.id, component]))
  for (const componentId of componentIds) {
    const component = componentsById.get(componentId)
    if (!component || !component.active) throw failedPrecondition('component_item_must_be_active')
  }
  if (bomType === 'PACKAGING') {
    const hasPrimary = lines.some((line) => {
      const component = componentsById.get(line.componentItemId ?? '')
      return line.lineRole === BomLineRole.BOM_LINE_ROLE_PRIMARY_INPUT && component?.packable
    })
    if (!hasPrimary) throw failedPrecondition('packaging_bom_requires_packable_primary_input')
  }
  await ensureNoBomCycle(prisma, tenantId, outputItemId, componentIds, existingBomId)
}

async function ensureNoBomCycle(prisma: PrismaService, tenantId: string, outputItemId: string, componentIds: string[], existingBomId?: string): Promise<void> {
  const boms = await prisma.bom.findMany({
    where: { tenantId, active: true, ...(existingBomId ? { id: { not: existingBomId } } : {}) },
    include: { lines: true }
  })
  const adjacency = new Map<string, string[]>()
  for (const bom of boms) adjacency.set(bom.outputItemId, bom.lines.map((line) => line.componentItemId))
  adjacency.set(outputItemId, componentIds)
  for (const componentId of componentIds) {
    if (hasPath(adjacency, componentId, outputItemId, new Set())) throw failedPrecondition('bom_cycle_detected')
  }
}

function hasPath(adjacency: Map<string, string[]>, current: string, target: string, visited: Set<string>): boolean {
  if (current === target) return true
  if (visited.has(current)) return false
  visited.add(current)
  return (adjacency.get(current) ?? []).some((next) => hasPath(adjacency, next, target, visited))
}

function bomLineCreate(tenantId: string, line: BomLineInput, index: number): any {
  return {
    id: randomUUID(),
    tenantId,
    componentItemId: requireText(line.componentItemId, 'component_item_id'),
    lineRole: toDbBomLineRole(line.lineRole),
    quantity: requireText(line.quantity, 'quantity'),
    uomCode: requireText(line.uomCode, 'uom_code'),
    lineNote: normalizeOptional(line.lineNote),
    sortOrder: index
  }
}

function toItemModelRecord(record: any): ItemModelRecord {
  return {
    itemModelId: record.id,
    modelCode: record.modelCode,
    modelName: record.modelName,
    modelKind: fromDbItemModelKind(record.modelKind),
    modelType: fromDbItemModelType(record.modelType),
    active: record.active,
    capabilities: capabilitiesFromRecord(record),
    primaryCategorySummary: record.primaryCategory ? toCategorySummary(record.primaryCategory) : undefined,
    createdAt: record.createdAt?.toISOString?.() ?? '',
    updatedAt: record.updatedAt?.toISOString?.() ?? ''
  }
}

function toItemSummary(record: any): ItemSummary {
  return {
    itemId: record.id,
    itemModelId: record.itemModelId,
    itemCode: record.itemCode,
    itemName: record.itemName,
    itemType: fromDbItemType(record.itemType),
    lockedAttributeOptionIds: record.lockedAttributeOptionIds ?? [],
    packagingSpecId: record.packagingSpecId ?? '',
    active: record.active,
    capabilities: capabilitiesFromRecord(record),
    itemModelSummary: record.itemModel ? toItemModelSummary(record.itemModel) : undefined,
    primaryCategorySummary: record.itemModel?.primaryCategory ? toCategorySummary(record.itemModel.primaryCategory) : undefined,
    createdAt: record.createdAt?.toISOString?.() ?? '',
    updatedAt: record.updatedAt?.toISOString?.() ?? ''
  }
}

function toItemModelSummary(record: any) {
  return {
    itemModelId: record.id,
    modelCode: record.modelCode,
    modelName: record.modelName,
    modelKind: fromDbItemModelKind(record.modelKind),
    modelType: fromDbItemModelType(record.modelType),
    active: record.active
  }
}

function toCategorySummary(record: any): ItemCategoryTreeNode | ItemCategoryTreeNode {
  return { categoryId: record.id, categoryCode: record.categoryCode, categoryName: record.categoryName, active: record.active }
}

function toItemCategoryTreeNode(record: any): ItemCategoryTreeNode {
  return {
    categoryId: record.id,
    categoryCode: record.categoryCode,
    categoryName: record.categoryName,
    parentCategoryId: record.parentCategoryId ?? '',
    active: record.active,
    hasChildren: (record.children ?? []).length > 0
  }
}

function toAttributeDefinitionRecord(record: any): AttributeDefinitionRecord {
  return {
    attributeDefinitionId: record.id,
    attributeCode: record.attributeCode,
    attributeName: record.attributeName,
    active: record.active,
    optionCount: record._count?.options ?? 0
  }
}

function toAttributeOptionRecord(record: any): AttributeOptionRecord {
  return {
    attributeOptionId: record.id,
    attributeDefinitionId: record.attributeDefinitionId,
    optionCode: record.optionCode,
    optionName: record.optionName,
    active: record.active,
    description: record.description ?? ''
  }
}

function toPackagingMethodRecord(record: any): PackagingMethodRecord {
  return {
    packagingMethodId: record.id,
    methodCode: record.methodCode,
    methodName: record.methodName,
    active: record.active,
    description: record.description ?? ''
  }
}

function toPackagingSpecRecord(record: any): PackagingSpecRecord {
  return {
    packagingSpecId: record.id,
    itemModelId: record.itemModelId,
    packagingMethodId: record.packagingMethodId,
    customerId: record.customerId ?? '',
    specCode: record.specCode,
    specName: record.specName,
    grossWeight: record.grossWeight ?? '',
    volume: record.volume ?? '',
    outerLength: record.outerLength ?? '',
    outerWidth: record.outerWidth ?? '',
    outerHeight: record.outerHeight ?? '',
    workInstruction: record.workInstruction ?? '',
    version: record.version ?? '',
    effectiveFrom: record.effectiveFrom?.toISOString?.() ?? '',
    effectiveTo: record.effectiveTo?.toISOString?.() ?? '',
    active: record.active
  }
}

function toBomRecord(record: any): BomRecord {
  return {
    bomId: record.id,
    bomCode: record.bomCode,
    bomName: record.bomName,
    bomType: fromDbBomType(record.bomType),
    outputItemId: record.outputItemId,
    active: record.active,
    lines: (record.lines ?? []).map(toBomLineRecord),
    createdAt: record.createdAt?.toISOString?.() ?? '',
    updatedAt: record.updatedAt?.toISOString?.() ?? ''
  }
}

function toBomLineRecord(record: any): BomLineRecord {
  return {
    bomLineId: record.id,
    componentItemId: record.componentItemId,
    lineRole: fromDbBomLineRole(record.lineRole),
    quantity: record.quantity,
    uomCode: record.uomCode,
    lineNote: record.lineNote ?? '',
    componentItem: record.componentItem ? toItemSummary(record.componentItem) : undefined
  }
}

function toSupplierItemMappingRecord(record: any): SupplierItemMappingRecord {
  return {
    supplierItemMappingId: record.id,
    supplierId: record.supplierId,
    supplierItemCode: record.supplierItemCode ?? '',
    supplierItemName: record.supplierItemName ?? '',
    itemId: record.itemId,
    itemSummary: record.item ? toItemSummary(record.item) : undefined,
    active: record.active
  }
}

function capabilitiesFromRecord(record: any): ItemCapabilities {
  return {
    sellable: record.sellable,
    purchasable: record.purchasable,
    stockable: record.stockable,
    manufacturable: record.manufacturable,
    assemblable: record.assemblable,
    transformable: record.transformable,
    packable: record.packable,
    packaged: record.packaged
  }
}

function emptyCapabilities(): ItemCapabilities {
  return {
    sellable: false,
    purchasable: false,
    stockable: false,
    manufacturable: false,
    assemblable: false,
    transformable: false,
    packable: false,
    packaged: false
  }
}

function mergeCapabilities(input: ItemCapabilities | undefined, fallback: ItemCapabilities): ItemCapabilities {
  return {
    sellable: input?.sellable ?? fallback.sellable ?? false,
    purchasable: input?.purchasable ?? fallback.purchasable ?? false,
    stockable: input?.stockable ?? fallback.stockable ?? false,
    manufacturable: input?.manufacturable ?? fallback.manufacturable ?? false,
    assemblable: input?.assemblable ?? fallback.assemblable ?? false,
    transformable: input?.transformable ?? fallback.transformable ?? false,
    packable: input?.packable ?? fallback.packable ?? false,
    packaged: input?.packaged ?? fallback.packaged ?? false
  }
}

function toCapabilityData(capabilities?: ItemCapabilities): Record<string, boolean> {
  const value = mergeCapabilities(capabilities, emptyCapabilities())
  return {
    sellable: Boolean(value.sellable),
    purchasable: Boolean(value.purchasable),
    stockable: Boolean(value.stockable),
    manufacturable: Boolean(value.manufacturable),
    assemblable: Boolean(value.assemblable),
    transformable: Boolean(value.transformable),
    packable: Boolean(value.packable),
    packaged: Boolean(value.packaged)
  }
}

function enforcePackagedCapability(itemType: string, capabilities: ItemCapabilities): void {
  if (itemType === 'PACKAGED_FINISHED_GOOD' && !capabilities.packaged) throw failedPrecondition('packaged_item_requires_packaged_capability')
  if (itemType !== 'PACKAGED_FINISHED_GOOD' && capabilities.packaged) throw failedPrecondition('only_packaged_item_can_have_packaged_capability')
}

function buildVariantKey(optionIds: string[], packagingSpecId?: string): string {
  return `attrs:${normalizedIds(optionIds).join(',')}|pkg:${normalizeOptional(packagingSpecId) ?? ''}`
}

function normalizedIds(ids: string[]): string[] {
  return [...new Set(ids.map((id) => normalizeOptional(id)).filter(Boolean) as string[])].sort()
}

function normalizeOptional(value: string | undefined | null): string | undefined {
  const normalized = typeof value === 'string' ? value.trim() : ''
  return normalized.length > 0 ? normalized : undefined
}

function normalizeKey(value: string | undefined | null): string | undefined {
  return normalizeOptional(value)?.toLocaleLowerCase()
}

function parseOptionalDate(value: string | undefined): Date | undefined {
  const normalized = normalizeOptional(value)
  return normalized ? new Date(normalized) : undefined
}

function requireText(value: string | undefined | null, field: string): string {
  const normalized = normalizeOptional(value)
  if (!normalized) throw invalidArgument(field)
  return normalized
}

function normalizePage(page: number | undefined): number {
  return page && page > 0 ? page : DEFAULT_PAGE
}

function normalizePageSize(pageSize: number | undefined): number {
  return pageSize && pageSize > 0 ? Math.min(pageSize, 200) : DEFAULT_PAGE_SIZE
}

function toDbItemModelKind(value?: ItemModelKind): any {
  switch (value) {
    case ItemModelKind.ITEM_MODEL_KIND_PHYSICAL:
      return 'PHYSICAL'
    case ItemModelKind.ITEM_MODEL_KIND_SERVICE:
      return 'SERVICE'
    case ItemModelKind.ITEM_MODEL_KIND_DIGITAL:
      return 'DIGITAL'
    case ItemModelKind.ITEM_MODEL_KIND_VIRTUAL:
      return 'VIRTUAL'
    default:
      throw invalidArgument('model_kind')
  }
}

function fromDbItemModelKind(value: string): ItemModelKind {
  return ItemModelKind[`ITEM_MODEL_KIND_${value}` as keyof typeof ItemModelKind] as ItemModelKind
}

function toDbItemModelType(value?: ItemModelType): any {
  const key = ItemModelType[value ?? 0]?.replace('ITEM_MODEL_TYPE_', '')
  if (!key || key === 'UNSPECIFIED') throw invalidArgument('model_type')
  return key
}

function fromDbItemModelType(value: string): ItemModelType {
  return ItemModelType[`ITEM_MODEL_TYPE_${value}` as keyof typeof ItemModelType] as ItemModelType
}

function toDbItemType(value?: ItemType): any {
  switch (value) {
    case ItemType.ITEM_TYPE_STANDARD:
      return 'STANDARD'
    case ItemType.ITEM_TYPE_PACKAGED_FINISHED_GOOD:
      return 'PACKAGED_FINISHED_GOOD'
    default:
      throw invalidArgument('item_type')
  }
}

function fromDbItemType(value: string): ItemType {
  return ItemType[`ITEM_TYPE_${value}` as keyof typeof ItemType] as ItemType
}

function toDbBomType(value?: BomType): any {
  switch (value) {
    case BomType.BOM_TYPE_COMPOSITION:
      return 'COMPOSITION'
    case BomType.BOM_TYPE_TRANSFORMATION:
      return 'TRANSFORMATION'
    case BomType.BOM_TYPE_PACKAGING:
      return 'PACKAGING'
    default:
      throw invalidArgument('bom_type')
  }
}

function fromDbBomType(value: string): BomType {
  return BomType[`BOM_TYPE_${value}` as keyof typeof BomType] as BomType
}

function toDbBomLineRole(value?: BomLineRole): any {
  switch (value) {
    case BomLineRole.BOM_LINE_ROLE_PRIMARY_INPUT:
      return 'PRIMARY_INPUT'
    case BomLineRole.BOM_LINE_ROLE_COMPONENT:
      return 'COMPONENT'
    case BomLineRole.BOM_LINE_ROLE_PACKAGING_MATERIAL:
      return 'PACKAGING_MATERIAL'
    default:
      throw invalidArgument('line_role')
  }
}

function fromDbBomLineRole(value: string): BomLineRole {
  return BomLineRole[`BOM_LINE_ROLE_${value}` as keyof typeof BomLineRole] as BomLineRole
}

function invalidArgument(field: string): never {
  throw ExceptionFactory.domain(ITEM_MASTER_INVALID_ARGUMENT, { field })
}

function notFound(resource: string): never {
  throw ExceptionFactory.domain(ITEM_MASTER_NOT_FOUND, { resource })
}

function failedPrecondition(reason: string): never {
  throw ExceptionFactory.domain(ITEM_MASTER_FAILED_PRECONDITION, { reason })
}

function handleUnique(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('Unique constraint')) {
    throw ExceptionFactory.domain(ITEM_MASTER_ALREADY_EXISTS, { reason: 'unique_constraint' })
  }
  throw error
}
