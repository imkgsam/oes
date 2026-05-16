import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common'
import {
  MoldDesignOutputKind,
  MoldDesignStatus,
  MoldFunctionRole,
  MoldOutputStructureType,
  MasterMoldStatus,
  MoldWarningLevel,
  ProductionMoldStatus,
  ProductionSpecStatus,
  ToolingType
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

  /** listProductionSpecs returns the ProductionSpec selector needed by mold design setup. */
  async listProductionSpecs(tenantId: string, query: any, source: DownstreamRequestSource) {
    return this.mesQueryAdapter.listProductionSpecs(
      {
        includeRetired: query.includeRetired,
        itemId: normalize(query.itemId),
        keyword: normalize(query.keyword),
        orgId: this.resolveOrgId(query.orgId, source),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        status: toEnum(ProductionSpecStatus, 'PRODUCTION_SPEC_STATUS_', query.status),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
  }

  /** getProductionSpec returns one ProductionSpec detail snapshot. */
  async getProductionSpec(tenantId: string, productionSpecId: string, source: DownstreamRequestSource) {
    const result = await this.mesQueryAdapter.getProductionSpec(
      {
        orgId: this.resolveOrgId(undefined, source),
        productionSpecId: requireNonBlank(productionSpecId, 'productionSpecId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
    return result.productionSpec
  }

  /** createProductionSpec forwards one ProductionSpec creation command. */
  async createProductionSpec(tenantId: string, input: any, source: DownstreamRequestSource) {
    const result = await this.mesManagementAdapter.createProductionSpec(
      this.withCommandEnvelope(tenantId, input, source),
      source
    )
    return result.productionSpec
  }

  /** activateProductionSpec forwards one ProductionSpec activation command. */
  async activateProductionSpec(tenantId: string, productionSpecId: string, input: any, source: DownstreamRequestSource) {
    const result = await this.mesManagementAdapter.activateProductionSpec(
      {
        ...this.withCommandEnvelope(tenantId, input, source),
        productionSpecId: requireNonBlank(productionSpecId, 'productionSpecId')
      },
      source
    )
    return result.productionSpec
  }

  /** updateProductionSpec forwards one ProductionSpec update command. */
  async updateProductionSpec(tenantId: string, productionSpecId: string, input: any, source: DownstreamRequestSource) {
    const result = await this.mesManagementAdapter.updateProductionSpec(
      {
        ...this.withCommandEnvelope(tenantId, input, source),
        productionSpecId: requireNonBlank(productionSpecId, 'productionSpecId')
      },
      source
    )
    return result.productionSpec
  }

  /** retireProductionSpec forwards one ProductionSpec retirement command. */
  async retireProductionSpec(tenantId: string, productionSpecId: string, input: any, source: DownstreamRequestSource) {
    const result = await this.mesManagementAdapter.retireProductionSpec(
      {
        ...this.withCommandEnvelope(tenantId, input, source),
        productionSpecId: requireNonBlank(productionSpecId, 'productionSpecId')
      },
      source
    )
    return result.productionSpec
  }

  /** listMoldDesigns returns the MoldDesign directory for mold setup. */
  async listMoldDesigns(tenantId: string, query: any, source: DownstreamRequestSource) {
    return this.mesQueryAdapter.listMoldDesigns(
      {
        itemModelId: normalize(query.itemModelId),
        keyword: normalize(query.keyword),
        orgId: this.resolveOrgId(query.orgId, source),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        productionSpecId: normalize(query.productionSpecId),
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
        ...this.withCommandEnvelope(tenantId, input, source),
        functionRole: toEnum(MoldFunctionRole, 'MOLD_FUNCTION_ROLE_', input.functionRole),
        outputStructureType: toEnum(MoldOutputStructureType, 'MOLD_OUTPUT_STRUCTURE_TYPE_', input.outputStructureType),
        outputs: (input.outputs ?? []).map((output: any) => ({
          ...output,
          outputKind: toEnum(MoldDesignOutputKind, 'MOLD_DESIGN_OUTPUT_KIND_', output.outputKind),
          options: (output.options ?? []).map((option: any) => ({ ...option }))
        }))
      },
      source
    )
    return result.moldDesign
  }

  /** registerMasterMold forwards one MasterMold registration command. */
  async registerMasterMold(tenantId: string, input: any, source: DownstreamRequestSource) {
    const result = await this.mesManagementAdapter.registerMasterMold(
      this.withCommandEnvelope(tenantId, input, source),
      source
    )
    return result.masterMold
  }

  /** listMasterMolds returns the MasterMold result-object directory. */
  async listMasterMolds(tenantId: string, query: any, source: DownstreamRequestSource) {
    return this.mesQueryAdapter.listMasterMolds(
      {
        carrierResourceId: normalize(query.carrierResourceId),
        keyword: normalize(query.keyword),
        moldDesignId: normalize(query.moldDesignId),
        orgId: this.resolveOrgId(query.orgId, source),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        status: toEnum(MasterMoldStatus, 'MASTER_MOLD_STATUS_', query.status),
        storageResourceId: normalize(query.storageResourceId),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
  }

  /** getMasterMold returns one MasterMold result-object snapshot. */
  async getMasterMold(tenantId: string, masterMoldId: string, source: DownstreamRequestSource) {
    const result = await this.mesQueryAdapter.getMasterMold(
      {
        masterMoldId: requireNonBlank(masterMoldId, 'masterMoldId'),
        orgId: this.resolveOrgId(undefined, source),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
    return result.masterMold
  }

  /** registerProductionMold forwards one ProductionMold registration command. */
  async registerProductionMold(tenantId: string, input: any, source: DownstreamRequestSource) {
    const result = await this.mesManagementAdapter.registerProductionMold(
      this.withCommandEnvelope(tenantId, input, source),
      source
    )
    return result.productionMold
  }

  /** acceptProductionMold forwards one ProductionMold acceptance command. */
  async acceptProductionMold(tenantId: string, productionMoldId: string, input: any, source: DownstreamRequestSource) {
    const result = await this.mesManagementAdapter.acceptProductionMold(
      {
        ...this.withCommandEnvelope(tenantId, input, source),
        productionMoldId: requireNonBlank(productionMoldId, 'productionMoldId')
      },
      source
    )
    return result.productionMold
  }

  /** getProductionMold returns one ProductionMold detail snapshot. */
  async getProductionMold(tenantId: string, productionMoldId: string, source: DownstreamRequestSource) {
    const result = await this.mesQueryAdapter.getProductionMold(
      {
        orgId: this.resolveOrgId(undefined, source),
        productionMoldId: requireNonBlank(productionMoldId, 'productionMoldId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
    return result.productionMold
  }

  /** listProductionMolds returns the tenant-wide ProductionMold directory for the workspace. */
  async listProductionMolds(tenantId: string, query: any, source: DownstreamRequestSource) {
    return this.mesQueryAdapter.listProductionMolds(
      {
        carrierResourceId: normalize(query.carrierResourceId),
        moldDesignId: normalize(query.moldDesignId),
        orgId: this.resolveOrgId(query.orgId, source),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        status: toEnum(ProductionMoldStatus, 'PRODUCTION_MOLD_STATUS_', query.status),
        storageResourceId: normalize(query.storageResourceId),
        tenantId: this.resolveTenantId(tenantId, source),
        warningLevel: toEnum(MoldWarningLevel, 'MOLD_WARNING_LEVEL_', query.warningLevel)
      },
      source
    )
  }

  /** listProductionMoldsByDesign returns ProductionMolds under one MoldDesign. */
  async listProductionMoldsByDesign(tenantId: string, moldDesignId: string, query: any, source: DownstreamRequestSource) {
    return this.mesQueryAdapter.listProductionMoldsByDesign(
      {
        moldDesignId: requireNonBlank(moldDesignId, 'moldDesignId'),
        orgId: this.resolveOrgId(query.orgId, source),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        status: toEnum(ProductionMoldStatus, 'PRODUCTION_MOLD_STATUS_', query.status),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )
  }

  /** moveTooling forwards one current placement change for a tooling object. */
  async moveTooling(tenantId: string, toolingId: string, input: any, source: DownstreamRequestSource) {
    const result = await this.mesManagementAdapter.moveTooling(
      {
        ...this.withCommandEnvelope(tenantId, input, source),
        toolingId: requireNonBlank(toolingId, 'toolingId'),
        toolingType: toEnum(ToolingType, 'TOOLING_TYPE_', input.toolingType ?? 'MOLD')
      },
      source
    )
    return result.placement
  }

  /** getToolingCurrentPlacement returns one current placement projection for a tooling object. */
  async getToolingCurrentPlacement(tenantId: string, toolingId: string, query: any, source: DownstreamRequestSource) {
    const result = await this.mesQueryAdapter.getToolingCurrentPlacement(
      {
        orgId: this.resolveOrgId(query.orgId, source),
        tenantId: this.resolveTenantId(tenantId, source),
        toolingId: requireNonBlank(toolingId, 'toolingId'),
        toolingType: toEnum(ToolingType, 'TOOLING_TYPE_', query.toolingType ?? 'MOLD')
      },
      source
    )
    return result.placement
  }

  /** installTooling forwards one tooling installation command. */
  async installTooling(tenantId: string, toolingId: string, input: any, source: DownstreamRequestSource) {
    const result = await this.mesManagementAdapter.installTooling(
      {
        ...this.withCommandEnvelope(tenantId, input, source),
        toolingId: requireNonBlank(toolingId, 'toolingId'),
        toolingType: toEnum(ToolingType, 'TOOLING_TYPE_', input.toolingType ?? 'MOLD')
      },
      source
    )
    return result.toolingInstallation
  }

  /** unmountTooling forwards one tooling unmount command. */
  async unmountTooling(tenantId: string, toolingInstallationId: string, input: any, source: DownstreamRequestSource) {
    const result = await this.mesManagementAdapter.unmountTooling(
      {
        ...this.withCommandEnvelope(tenantId, input, source),
        toolingInstallationId: requireNonBlank(toolingInstallationId, 'toolingInstallationId')
      },
      source
    )
    return result.toolingInstallation
  }

  /** markProductionMoldForScrap forwards the first step of the production mold scrap lifecycle. */
  async markProductionMoldForScrap(tenantId: string, productionMoldId: string, input: any, source: DownstreamRequestSource) {
    const result = await this.mesManagementAdapter.markProductionMoldForScrap(
      {
        ...this.withCommandEnvelope(tenantId, input, source),
        productionMoldId: requireNonBlank(productionMoldId, 'productionMoldId')
      },
      source
    )
    return result.productionMold
  }

  /** listCurrentMoldsByWorkCenter returns the web visualization data for one production line. */
  async listCurrentMoldsByWorkCenter(tenantId: string, workCenterId: string, query: any, source: DownstreamRequestSource) {
    return this.mesQueryAdapter.listCurrentMoldsByWorkCenter(
      {
        orgId: this.resolveOrgId(query.orgId, source),
        tenantId: this.resolveTenantId(tenantId, source),
        workCenterId: requireNonBlank(workCenterId, 'workCenterId'),
        workUnitId: normalize(query.workUnitId)
      },
      source
    )
  }

  /** listMoldLifeCounters returns independent MoldLifeCounter rows. */
  async listMoldLifeCounters(tenantId: string, query: any, source: DownstreamRequestSource) {
    return this.mesQueryAdapter.listMoldLifeCounters(
      {
        orgId: this.resolveOrgId(query.orgId, source),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        productionMoldId: normalize(query.productionMoldId),
        tenantId: this.resolveTenantId(tenantId, source),
        warningLevel: toEnum(MoldWarningLevel, 'MOLD_WARNING_LEVEL_', query.warningLevel)
      },
      source
    )
  }

  /** getMoldUsageHistory returns flattened mold facts for one ProductionMold. */
  async getMoldUsageHistory(tenantId: string, productionMoldId: string, query: any, source: DownstreamRequestSource) {
    return this.mesQueryAdapter.getMoldUsageHistory(
      {
        from: normalize(query.from),
        orgId: this.resolveOrgId(query.orgId, source),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        productionMoldId: requireNonBlank(productionMoldId, 'productionMoldId'),
        tenantId: this.resolveTenantId(tenantId, source),
        to: normalize(query.to)
      },
      source
    )
  }

  /** printDailyMoldChecklist builds the web checklist view from current mold installations. */
  async printDailyMoldChecklist(tenantId: string, query: any, source: DownstreamRequestSource) {
    const checklistDate = requireNonBlank(query.checklistDate, 'checklistDate')
    const workCenterId = requireNonBlank(query.workCenterId, 'workCenterId')
    const current = await this.mesQueryAdapter.listCurrentMoldsByWorkCenter(
      {
        orgId: this.resolveOrgId(query.orgId, source),
        tenantId: this.resolveTenantId(tenantId, source),
        workCenterId,
        workUnitId: normalize(query.workUnitId)
      },
      source
    )
    return {
      checklistDate,
      items: (current.items ?? []).map((item: any) => ({
        productionMold: item.productionMold,
        toolingInstallation: item.toolingInstallation,
        usageAllowed: item.usageAllowed,
        usageDisabledReason: item.usageDisabledReason
      })),
      workCenterId
    }
  }

  /** recordDailyMoldUsageBatch forwards one web checklist submission as a single MES usage batch command. */
  async recordDailyMoldUsageBatch(tenantId: string, checklistDate: string, input: any, source: DownstreamRequestSource) {
    const batchCommandId = requireNonBlank(input.batchCommandId, 'batchCommandId')
    const resolvedTenantId = this.resolveTenantId(tenantId, source)
    const orgId = this.resolveOrgId(input.orgId, source)
    const response = await this.mesManagementAdapter.recordMoldUsageBatch(
      {
        auditReason: normalize(input.reason) ?? 'daily mold usage checklist',
        captureSource: normalize(input.captureSource) ?? 'WEB_CHECKLIST',
        commandId: batchCommandId,
        lifeUnit: normalize(input.lifeUnit) ?? 'CASTING_CYCLE',
        lines: (input.items ?? []).map((item: any) => ({
          isSubmitted: !!item.checked,
          moldDesignOutputId: normalize(item.moldDesignOutputId),
          moldDesignOutputOptionId: normalize(item.moldDesignOutputOptionId),
          productionMoldId: normalize(item.productionMoldId) ?? '',
          productionSpecRef: item.productionSpecRef,
          productionUnitRef: item.productionUnitRef,
          toolingInstallationId: normalize(item.toolingInstallationId) ?? '',
          traceSubjectRef: item.traceSubjectRef,
          usageQuantity: normalize(item.usageQuantity) ?? ''
        })),
        orgId,
        tenantId: resolvedTenantId,
        usedAt: normalize(input.usedAt) ?? requireNonBlank(checklistDate, 'checklistDate'),
        workCenterRef: input.workCenterRef,
        workUnitRef: input.workUnitRef
      },
      source
    )

    return {
      acceptedItems: (response.moldUsageRecords ?? []).map((record: any) => ({
        moldLifeCounter: (response.moldLifeCounters ?? []).find(
          (counter: any) => counter.productionMoldId === record.productionMoldId
        ),
        productionMoldId: record.productionMoldId,
        usageRecordId: record.moldUsageRecordId
      })),
      checklistDate: requireNonBlank(checklistDate, 'checklistDate'),
      skippedItems: (input.items ?? [])
        .filter((item: any) => !item.checked)
        .map((item: any) => ({ productionMoldId: normalize(item.productionMoldId), reason: 'unchecked' })),
      workCenterRef: input.workCenterRef
    }
  }

  /** withCommandEnvelope adds tenant, org, command id, and audit reason fields before a management adapter call. */
  private withCommandEnvelope(tenantId: string, input: any, source: DownstreamRequestSource) {
    return {
      ...input,
      auditReason: normalize(input.reason),
      commandId: normalize(input.commandId) ?? normalize(source.requestId),
      orgId: this.resolveOrgId(input.orgId, source),
      tenantId: this.resolveTenantId(tenantId, source)
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
