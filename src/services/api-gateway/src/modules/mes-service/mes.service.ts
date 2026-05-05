import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common'
import {
  ManufacturingSpecStatus,
  MoldDesignOutputKind,
  MoldDesignStatus,
  MoldFunctionRole,
  MoldOutputStructureType,
  MoldResourceType,
  MoldUsageMode,
  MoldWarningLevel,
  ProductionMoldInstanceStatus
} from '@oes/common/generated/mes_service'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { MesManagementGrpcAdapter } from './adapters/mes-management-grpc.adapter'
import { MesQueryGrpcAdapter } from './adapters/mes-query-grpc.adapter'

type EnumLike = Record<string, number | string>

@Injectable()
// Builds the tenant-scoped MES mold-management BFF model without adding MES business rules to api-gateway.
export class MesService {
  constructor(
    private readonly mesQueryAdapter: MesQueryGrpcAdapter,
    private readonly mesManagementAdapter: MesManagementGrpcAdapter
  ) {}

  /** listManufacturingSpecs returns the ManufacturingSpec directory needed by mold design setup. */
  async listManufacturingSpecs(tenantId: string, query: any, source: DownstreamRequestSource) {
    return this.mesQueryAdapter.listManufacturingSpecs(
      {
        attributeFilters: query.attributeFilters ?? [],
        includeRetired: query.includeRetired,
        itemId: normalize(query.itemId),
        keyword: normalize(query.keyword),
        orgId: this.resolveOrgId(query.orgId, source),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        productFamilyRefId: normalize(query.productFamilyRefId),
        status: toEnum(ManufacturingSpecStatus, 'MANUFACTURING_SPEC_STATUS_', query.status),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
  }

  /** getManufacturingSpec returns one ManufacturingSpec detail snapshot. */
  async getManufacturingSpec(tenantId: string, manufacturingSpecId: string, source: DownstreamRequestSource) {
    const result = await this.mesQueryAdapter.getManufacturingSpec(
      {
        manufacturingSpecId: requireNonBlank(manufacturingSpecId, 'manufacturingSpecId'),
        orgId: this.resolveOrgId(undefined, source),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
    return result.manufacturingSpec
  }

  /** createManufacturingSpec forwards one ManufacturingSpec creation command. */
  async createManufacturingSpec(tenantId: string, input: any, source: DownstreamRequestSource) {
    const result = await this.mesManagementAdapter.createManufacturingSpec(
      {
        ...input,
        commandId: normalize(input.commandId) ?? normalize(source.requestId),
        orgId: this.resolveOrgId(input.orgId, source),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
    return result.manufacturingSpec
  }

  /** activateManufacturingSpec forwards one ManufacturingSpec activation command. */
  async activateManufacturingSpec(
    tenantId: string,
    manufacturingSpecId: string,
    input: any,
    source: DownstreamRequestSource
  ) {
    const result = await this.mesManagementAdapter.activateManufacturingSpec(
      {
        ...input,
        commandId: normalize(input.commandId) ?? normalize(source.requestId),
        manufacturingSpecId: requireNonBlank(manufacturingSpecId, 'manufacturingSpecId'),
        orgId: this.resolveOrgId(input.orgId, source),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
    return result.manufacturingSpec
  }

  /** updateManufacturingSpec forwards one ManufacturingSpec update command. */
  async updateManufacturingSpec(
    tenantId: string,
    manufacturingSpecId: string,
    input: any,
    source: DownstreamRequestSource
  ) {
    const result = await this.mesManagementAdapter.updateManufacturingSpec(
      {
        ...input,
        commandId: normalize(input.commandId) ?? normalize(source.requestId),
        manufacturingSpecId: requireNonBlank(manufacturingSpecId, 'manufacturingSpecId'),
        orgId: this.resolveOrgId(input.orgId, source),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
    return result.manufacturingSpec
  }

  /** retireManufacturingSpec forwards one ManufacturingSpec retirement command. */
  async retireManufacturingSpec(
    tenantId: string,
    manufacturingSpecId: string,
    input: any,
    source: DownstreamRequestSource
  ) {
    const result = await this.mesManagementAdapter.retireManufacturingSpec(
      {
        ...input,
        commandId: normalize(input.commandId) ?? normalize(source.requestId),
        manufacturingSpecId: requireNonBlank(manufacturingSpecId, 'manufacturingSpecId'),
        orgId: this.resolveOrgId(input.orgId, source),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
    return result.manufacturingSpec
  }

  /** createWorkCenter forwards one production-unit creation command for the mold workspace. */
  async createWorkCenter(tenantId: string, input: any, source: DownstreamRequestSource) {
    const result = await this.mesManagementAdapter.createWorkCenter(
      {
        ...input,
        commandId: normalize(input.commandId) ?? normalize(source.requestId),
        orgId: this.resolveOrgId(input.orgId, source),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
    return result.workCenterSummary
  }

  /** deactivateWorkCenter forwards one production-unit deactivation command after MES checks occupancy. */
  async deactivateWorkCenter(
    tenantId: string,
    workCenterId: string,
    input: any,
    source: DownstreamRequestSource
  ) {
    const result = await this.mesManagementAdapter.deactivateWorkCenter(
      {
        ...input,
        commandId: normalize(input.commandId) ?? normalize(source.requestId),
        orgId: this.resolveOrgId(input.orgId, source),
        tenantId: this.resolveTenantId(tenantId, source),
        workCenterId: requireNonBlank(workCenterId, 'workCenterId')
      },
      source
    )
    return result.workCenterSummary
  }

  /** listWorkCenters returns production units shown in the mold-management workspace. */
  async listWorkCenters(tenantId: string, query: any, source: DownstreamRequestSource) {
    return this.mesQueryAdapter.listWorkCenters(
      {
        keyword: normalize(query.keyword),
        orgId: this.resolveOrgId(query.orgId, source),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        parentWorkCenterId: normalize(query.parentWorkCenterId),
        status: normalize(query.status),
        tenantId: this.resolveTenantId(tenantId, source),
        workCenterType: normalize(query.workCenterType)
      },
      source
    )
  }

  /** listMoldDesigns returns the MoldDesign directory for mold instance setup. */
  async listMoldDesigns(tenantId: string, query: any, source: DownstreamRequestSource) {
    return this.mesQueryAdapter.listMoldDesigns(
      {
        functionRole: toEnum(MoldFunctionRole, 'MOLD_FUNCTION_ROLE_', query.functionRole),
        itemId: normalize(query.itemId),
        keyword: normalize(query.keyword),
        manufacturingSpecRefId: normalize(query.manufacturingSpecRefId),
        materialType: normalize(query.materialType),
        orgId: this.resolveOrgId(query.orgId, source),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        productFamilyRefId: normalize(query.productFamilyRefId),
        productionMethodTag: normalize(query.productionMethodTag),
        status: toEnum(MoldDesignStatus, 'MOLD_DESIGN_STATUS_', query.status),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
  }

  /** getMoldDesign returns one MoldDesign detail snapshot. */
  async getMoldDesign(tenantId: string, moldDesignId: string, source: DownstreamRequestSource) {
    const result = await this.mesQueryAdapter.getMoldDesign(
      {
        moldDesignId: requireNonBlank(moldDesignId, 'moldDesignId'),
        orgId: this.resolveOrgId(undefined, source),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
    return result.moldDesign
  }

  /** registerMoldDesign forwards one MoldDesign registration command while only normalizing enum inputs. */
  async registerMoldDesign(tenantId: string, input: any, source: DownstreamRequestSource) {
    const result = await this.mesManagementAdapter.registerMoldDesign(
      {
        ...input,
        commandId: normalize(input.commandId) ?? normalize(source.requestId),
        functionRole: toEnum(MoldFunctionRole, 'MOLD_FUNCTION_ROLE_', input.functionRole),
        orgId: this.resolveOrgId(input.orgId, source),
        outputStructureType: toEnum(
          MoldOutputStructureType,
          'MOLD_OUTPUT_STRUCTURE_TYPE_',
          input.outputStructureType
        ),
        outputs: (input.outputs ?? []).map((output: any) => ({
          ...output,
          outputKind: toEnum(MoldDesignOutputKind, 'MOLD_DESIGN_OUTPUT_KIND_', output.outputKind)
        })),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
    return result.moldDesign
  }

  /** registerProductionMoldInstance forwards one production mold instance registration command. */
  async registerProductionMoldInstance(tenantId: string, input: any, source: DownstreamRequestSource) {
    const result = await this.mesManagementAdapter.registerProductionMoldInstance(
      {
        ...input,
        commandId: normalize(input.commandId) ?? normalize(source.requestId),
        initialStatus: toEnum(
          ProductionMoldInstanceStatus,
          'PRODUCTION_MOLD_INSTANCE_STATUS_',
          input.initialStatus
        ),
        orgId: this.resolveOrgId(input.orgId, source),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
    return result.productionMoldInstance
  }

  /** getProductionMoldInstance returns one production mold detail snapshot. */
  async getProductionMoldInstance(
    tenantId: string,
    productionMoldInstanceId: string,
    source: DownstreamRequestSource
  ) {
    const result = await this.mesQueryAdapter.getProductionMoldInstance(
      {
        orgId: this.resolveOrgId(undefined, source),
        productionMoldInstanceId: requireNonBlank(productionMoldInstanceId, 'productionMoldInstanceId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
    return result.productionMoldInstance
  }

  /** listProductionMoldInstances returns the tenant-wide production mold directory for the workspace. */
  async listProductionMoldInstances(tenantId: string, query: any, source: DownstreamRequestSource) {
    return this.mesQueryAdapter.listProductionMoldInstances(
      {
        moldDesignId: normalize(query.moldDesignId),
        orgId: this.resolveOrgId(query.orgId, source),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        status: toEnum(
          ProductionMoldInstanceStatus,
          'PRODUCTION_MOLD_INSTANCE_STATUS_',
          query.status
        ),
        supplierId: normalize(query.supplierId),
        tenantId: this.resolveTenantId(tenantId, source),
        warningLevel: toEnum(MoldWarningLevel, 'MOLD_WARNING_LEVEL_', query.warningLevel)
      },
      source
    )
  }

  /** listProductionMoldInstancesByDesign returns production mold instances under one MoldDesign. */
  async listProductionMoldInstancesByDesign(
    tenantId: string,
    moldDesignId: string,
    query: any,
    source: DownstreamRequestSource
  ) {
    return this.mesQueryAdapter.listMoldInstancesByDesign(
      {
        moldDesignId: requireNonBlank(moldDesignId, 'moldDesignId'),
        orgId: this.resolveOrgId(query.orgId, source),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        status: toEnum(
          ProductionMoldInstanceStatus,
          'PRODUCTION_MOLD_INSTANCE_STATUS_',
          query.status
        ),
        supplierId: normalize(query.supplierId),
        tenantId: this.resolveTenantId(tenantId, source),
        warningLevel: toEnum(MoldWarningLevel, 'MOLD_WARNING_LEVEL_', query.warningLevel)
      },
      source
    )
  }

  /** moveProductionMoldInstance forwards one production mold instance location transfer command. */
  async moveProductionMoldInstance(
    tenantId: string,
    productionMoldInstanceId: string,
    input: any,
    source: DownstreamRequestSource
  ) {
    const result = await this.mesManagementAdapter.moveMold(
      {
        ...input,
        commandId: normalize(input.commandId) ?? normalize(source.requestId),
        moldResourceId: requireNonBlank(productionMoldInstanceId, 'productionMoldInstanceId'),
        moldResourceType: MoldResourceType.MOLD_RESOURCE_TYPE_PRODUCTION_MOLD_INSTANCE,
        orgId: this.resolveOrgId(input.orgId, source),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
    return result.moldCurrentLocation
  }

  /** installProductionMoldInstance forwards one production mold installation command. */
  async installProductionMoldInstance(
    tenantId: string,
    productionMoldInstanceId: string,
    input: any,
    source: DownstreamRequestSource
  ) {
    const result = await this.mesManagementAdapter.installMold(
      {
        ...input,
        commandId: normalize(input.commandId) ?? normalize(source.requestId),
        orgId: this.resolveOrgId(input.orgId, source),
        productionMoldInstanceId: requireNonBlank(productionMoldInstanceId, 'productionMoldInstanceId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
    return result.productionMoldInstance
  }

  /** unmountProductionMoldInstance forwards one production mold unmount command. */
  async unmountProductionMoldInstance(
    tenantId: string,
    productionMoldInstanceId: string,
    input: any,
    source: DownstreamRequestSource
  ) {
    const result = await this.mesManagementAdapter.unmountMold(
      {
        ...input,
        commandId: normalize(input.commandId) ?? normalize(source.requestId),
        nextStatus: toEnum(
          ProductionMoldInstanceStatus,
          'PRODUCTION_MOLD_INSTANCE_STATUS_',
          input.nextStatus
        ),
        orgId: this.resolveOrgId(input.orgId, source),
        productionMoldInstanceId: requireNonBlank(productionMoldInstanceId, 'productionMoldInstanceId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
    return result.productionMoldInstance
  }

  /** scrapProductionMoldInstance forwards one terminal production mold scrap command. */
  async scrapProductionMoldInstance(
    tenantId: string,
    productionMoldInstanceId: string,
    input: any,
    source: DownstreamRequestSource
  ) {
    const result = await this.mesManagementAdapter.scrapMold(
      {
        ...input,
        commandId: normalize(input.commandId) ?? normalize(source.requestId),
        moldResourceId: requireNonBlank(productionMoldInstanceId, 'productionMoldInstanceId'),
        moldResourceType: MoldResourceType.MOLD_RESOURCE_TYPE_PRODUCTION_MOLD_INSTANCE,
        orgId: this.resolveOrgId(input.orgId, source),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
    return result.moldResource
  }

  /** listCurrentMoldsByWorkCenter returns the web visualization data for one production line. */
  async listCurrentMoldsByWorkCenter(
    tenantId: string,
    workCenterId: string,
    query: any,
    source: DownstreamRequestSource
  ) {
    return this.mesQueryAdapter.listCurrentMoldsByWorkCenter(
      {
        includeChildWorkCenters: query.includeChildWorkCenters,
        orgId: this.resolveOrgId(query.orgId, source),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        tenantId: this.resolveTenantId(tenantId, source),
        warningLevel: toEnum(MoldWarningLevel, 'MOLD_WARNING_LEVEL_', query.warningLevel),
        workCenterId: requireNonBlank(workCenterId, 'workCenterId')
      },
      source
    )
  }

  /** printDailyMoldChecklist returns the daily web checklist for manual casting usage capture. */
  async printDailyMoldChecklist(tenantId: string, query: any, source: DownstreamRequestSource) {
    const result = await this.mesQueryAdapter.printDailyMoldChecklist(
      {
        checklistDate: normalize(query.checklistDate),
        includeChildWorkCenters: query.includeChildWorkCenters,
        includeRecentUsage: query.includeRecentUsage,
        includeWarnings: query.includeWarnings,
        orgId: this.resolveOrgId(query.orgId, source),
        tenantId: this.resolveTenantId(tenantId, source),
        workCenterIds: normalizeArray(query.workCenterIds)
      },
      source
    )
    return result.checklist
  }

  /** recordDailyMoldUsageBatch turns checked web checklist rows into idempotent MES MoldUsageEvent commands. */
  async recordDailyMoldUsageBatch(
    tenantId: string,
    checklistDate: string,
    input: any,
    source: DownstreamRequestSource
  ) {
    const batchCommandId = requireNonBlank(input.batchCommandId, 'batchCommandId')
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    const orgId = this.resolveOrgId(input.orgId, source)
    const acceptedItems: any[] = []
    const skippedItems: any[] = []

    for (const item of input.items ?? []) {
      const productionMoldInstanceId = requireNonBlank(
        item.productionMoldInstanceId,
        'productionMoldInstanceId'
      )
      if (!item.checked) {
        skippedItems.push({ productionMoldInstanceId, reason: 'unchecked' })
        continue
      }

      const moldInstallationId = requireNonBlank(item.moldInstallationId, 'moldInstallationId')
      const response = await this.mesManagementAdapter.recordMoldUsage(
        {
          captureSource: normalize(item.captureSource) ?? 'WEB_CHECKLIST',
          commandId: `${batchCommandId}:${productionMoldInstanceId}:${moldInstallationId}`,
          lifeDelta: normalize(item.lifeDelta) ?? '1',
          lifeUnit: normalize(item.lifeUnit) ?? 'USE',
          manufacturingSpecRef: item.manufacturingSpecRef,
          moldDesignOutputId: normalize(item.moldDesignOutputId),
          moldDesignOutputOptionId: normalize(item.moldDesignOutputOptionId),
          moldInstallationId,
          orgId,
          productFamilyRef: item.productFamilyRef,
          productionMoldInstanceId,
          reason: normalize(item.reason) ?? normalize(input.reason) ?? 'daily mold usage checklist',
          resourcePositionId: requireNonBlank(item.resourcePositionId, 'resourcePositionId'),
          tenantId: resolvedTenantId,
          usageMode: MoldUsageMode.MOLD_USAGE_MODE_MANUAL_CHECKLIST,
          usageQuantity: normalize(item.usageQuantity) ?? '1',
          usedAt: normalize(input.usedAt) ?? requireNonBlank(checklistDate, 'checklistDate'),
          workCenterId: requireNonBlank(item.workCenterId ?? input.workCenterId, 'workCenterId')
        },
        source
      )

      acceptedItems.push({
        moldLifeCounter: response.moldLifeCounter,
        productionMoldInstanceId,
        usageEventId: response.usageEvent?.moldUsageEventId
      })
    }

    return {
      acceptedItems,
      checklistDate: requireNonBlank(checklistDate, 'checklistDate'),
      skippedItems,
      workCenterId: input.workCenterId
    }
  }

  /** resolveTenantId ensures tenant-scoped users cannot proxy MES calls into another tenant. */
  private resolveTenantId(tenantId: string, source: DownstreamRequestSource): string {
    const requestedTenantId = requireNonBlank(tenantId, 'tenantId')
    const userTenantId = normalize(source.user?.tenantId) ?? normalize(source.user?.tid)
    if (source.user?.scopeLevel === 'TENANT' && userTenantId && userTenantId !== requestedTenantId) {
      throw new ForbiddenException('tenant-scoped operator cannot access another tenant MES workspace')
    }
    return requestedTenantId
  }

  /** resolveOrgId prefers an explicit request org and otherwise follows the authenticated operator context. */
  private resolveOrgId(orgId: string | undefined, source: DownstreamRequestSource): string | undefined {
    return normalize(orgId) ?? normalize(source.user?.orgId)
  }
}

/** requireNonBlank validates one required gateway path or command field before proxying it downstream. */
function requireNonBlank(value: string | undefined, fieldName: string): string {
  const normalized = normalize(value)
  if (!normalized) {
    throw new BadRequestException(`${fieldName} is required`)
  }
  return normalized
}

/** normalize trims one optional string and turns blank values into undefined. */
function normalize(value?: string): string | undefined {
  const normalized = typeof value === 'string' ? value.trim() : undefined
  return normalized ? normalized : undefined
}

/** normalizeArray accepts either repeated query params or a comma-separated list. */
function normalizeArray(value?: string | string[]): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean)
  }
  return normalize(value)
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean) ?? []
}

/** clampPage normalizes BFF page inputs to the service contract's 1-based pagination. */
function clampPage(page: unknown): number {
  const parsed = Number(page ?? 1)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
}

/** clampPageSize normalizes BFF page-size inputs while keeping query cost bounded. */
function clampPageSize(pageSize: unknown): number {
  const parsed = Number(pageSize ?? 20)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 20
  }
  return Math.min(Math.floor(parsed), 100)
}

/** toEnum maps friendly BFF enum strings into generated numeric protobuf enum values. */
function toEnum<TEnum extends EnumLike>(enumType: TEnum, prefix: string, value: unknown): number {
  if (typeof value === 'number') {
    return value
  }

  const normalized = normalize(typeof value === 'string' ? value : undefined)
  if (!normalized) {
    return 0
  }

  const upper = normalized.toUpperCase()
  const fullKey = upper.startsWith(prefix) ? upper : `${prefix}${upper}`
  const resolved = enumType[fullKey] ?? enumType[upper]
  return typeof resolved === 'number' ? resolved : 0
}

/** toMoldResourceType maps optional mold resource type inputs for future controller methods. */
export function toMoldResourceType(value: unknown): number {
  return toEnum(MoldResourceType, 'MOLD_RESOURCE_TYPE_', value)
}
