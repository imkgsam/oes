import { Inject, Injectable } from '@nestjs/common'
import { TOKENS } from '../../common/constants/tokens'
import {
  MasterMoldRecord,
  MasterMoldStatus,
  MesQueryContext,
  MoldDesignRecord,
  MoldDesignStatus,
  MoldLifeCounterRecord,
  MoldUsageHistoryEntryRecord,
  MoldWarningLevel,
  ProductionMoldRecord,
  ProductionMoldStatus,
  ToolingPlacementSummaryRecord,
  ToolingPlacementType,
  ToolingType
} from '../../domain/models/mes-mold-records'
import {
  ListCurrentMoldsByWorkCenterResult,
  MasterMoldSummaryPageResult,
  ListProductionMoldsByDesignResult,
  MesMoldRepository,
  MoldDesignSummaryPageResult,
  MoldLifeCounterPageResult,
  MoldUsageHistoryResult,
  ProductionMoldSummaryPageResult
} from '../../domain/repositories/mes-mold.repository'
import {
  assertDateRange,
  assertExists,
  assertQueryContext,
  assertRequiredString,
  normalizeOptionalString,
  normalizePageInput,
  resolveContextOrgId
} from '../support/mes-assertions'

export interface GetMoldDesignInput extends MesQueryContext {
  moldDesignId: string
}

export interface ListMoldDesignsInput extends MesQueryContext {
  keyword?: string
  status?: MoldDesignStatus
  productionSpecId?: string
  itemModelId?: string
  page?: number
  pageSize?: number
}

export interface GetProductionMoldInput extends MesQueryContext {
  productionMoldId: string
}

export interface GetMasterMoldInput extends MesQueryContext {
  masterMoldId: string
}

export interface ListMasterMoldsInput extends MesQueryContext {
  keyword?: string
  moldDesignId?: string
  status?: MasterMoldStatus
  storageResourceId?: string
  carrierResourceId?: string
  page?: number
  pageSize?: number
}

export interface ListProductionMoldsInput extends MesQueryContext {
  moldDesignId?: string
  status?: ProductionMoldStatus
  storageResourceId?: string
  carrierResourceId?: string
  warningLevel?: MoldWarningLevel
  page?: number
  pageSize?: number
}

export interface ListProductionMoldsByDesignInput extends MesQueryContext {
  moldDesignId: string
  status?: ProductionMoldStatus
  page?: number
  pageSize?: number
}

export interface GetToolingCurrentPlacementInput extends MesQueryContext {
  toolingType: ToolingType
  toolingId: string
}

export interface GetMoldUsageHistoryInput extends MesQueryContext {
  productionMoldId: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export interface ListCurrentMoldsByWorkCenterInput extends MesQueryContext {
  workCenterId: string
  workUnitId?: string
}

export interface ListMoldLifeCountersInput extends MesQueryContext {
  productionMoldId?: string
  warningLevel?: MoldWarningLevel
  page?: number
  pageSize?: number
}

/** MesMoldQueryService exposes the current Mold / Tooling read surface without mutating MES truth. */
@Injectable()
export class MesMoldQueryService {
  constructor(
    @Inject(TOKENS.MES_MOLD_REPOSITORY)
    private readonly repository: MesMoldRepository
  ) {}

  /** getMoldDesign returns one visible mold design or NOT_FOUND. */
  async getMoldDesign(input: GetMoldDesignInput): Promise<MoldDesignRecord> {
    assertQueryContext(input)
    assertRequiredString(input.moldDesignId, 'moldDesignId')
    return assertVisibleByOrg(
      assertExists(await this.repository.findMoldDesignById(input.tenantId, input.moldDesignId), 'MoldDesign', input.moldDesignId),
      resolveContextOrgId(input),
      input.moldDesignId,
      'MoldDesign'
    )
  }

  /** listMoldDesigns returns contract-shaped mold design summary pages. */
  async listMoldDesigns(input: ListMoldDesignsInput): Promise<MoldDesignSummaryPageResult> {
    assertQueryContext(input)
    const page = normalizePageInput(input.page, input.pageSize)
    return this.repository.searchMoldDesigns({
      tenantId: input.tenantId,
      orgId: resolveContextOrgId(input),
      keyword: normalizeOptionalString(input.keyword),
      status: input.status,
      productionSpecId: normalizeOptionalString(input.productionSpecId),
      itemModelId: normalizeOptionalString(input.itemModelId),
      page: page.page,
      pageSize: page.pageSize
    })
  }

  /** getMasterMold returns one visible master mold or NOT_FOUND. */
  async getMasterMold(input: GetMasterMoldInput): Promise<MasterMoldRecord> {
    assertQueryContext(input)
    assertRequiredString(input.masterMoldId, 'masterMoldId')
    return assertVisibleByOrg(
      assertExists(await this.repository.findMasterMoldById(input.tenantId, input.masterMoldId), 'MasterMold', input.masterMoldId),
      resolveContextOrgId(input),
      input.masterMoldId,
      'MasterMold'
    )
  }

  /** listMasterMolds returns contract-shaped master mold summary pages. */
  async listMasterMolds(input: ListMasterMoldsInput): Promise<MasterMoldSummaryPageResult> {
    assertQueryContext(input)
    const page = normalizePageInput(input.page, input.pageSize)
    return this.repository.searchMasterMolds({
      tenantId: input.tenantId,
      orgId: resolveContextOrgId(input),
      keyword: normalizeOptionalString(input.keyword),
      moldDesignId: normalizeOptionalString(input.moldDesignId),
      status: input.status,
      storageResourceId: normalizeOptionalString(input.storageResourceId),
      carrierResourceId: normalizeOptionalString(input.carrierResourceId),
      page: page.page,
      pageSize: page.pageSize
    })
  }

  /** getProductionMold returns one visible production mold or NOT_FOUND. */
  async getProductionMold(input: GetProductionMoldInput): Promise<ProductionMoldRecord> {
    assertQueryContext(input)
    assertRequiredString(input.productionMoldId, 'productionMoldId')
    return assertVisibleByOrg(
      assertExists(
        await this.repository.findProductionMoldById(input.tenantId, input.productionMoldId),
        'ProductionMold',
        input.productionMoldId
      ),
      resolveContextOrgId(input),
      input.productionMoldId,
      'ProductionMold'
    )
  }

  /** listProductionMolds returns contract-shaped production mold summary pages. */
  async listProductionMolds(input: ListProductionMoldsInput): Promise<ProductionMoldSummaryPageResult> {
    assertQueryContext(input)
    const page = normalizePageInput(input.page, input.pageSize)
    return this.repository.searchProductionMolds({
      tenantId: input.tenantId,
      orgId: resolveContextOrgId(input),
      moldDesignId: normalizeOptionalString(input.moldDesignId),
      status: input.status,
      storageResourceId: normalizeOptionalString(input.storageResourceId),
      carrierResourceId: normalizeOptionalString(input.carrierResourceId),
      warningLevel: input.warningLevel,
      page: page.page,
      pageSize: page.pageSize
    })
  }

  /** listProductionMoldsByDesign returns production molds grouped under one design summary. */
  async listProductionMoldsByDesign(input: ListProductionMoldsByDesignInput): Promise<ListProductionMoldsByDesignResult> {
    assertQueryContext(input)
    assertRequiredString(input.moldDesignId, 'moldDesignId')
    const page = normalizePageInput(input.page, input.pageSize)
    return this.repository.listProductionMoldsByDesign({
      tenantId: input.tenantId,
      orgId: resolveContextOrgId(input),
      moldDesignId: input.moldDesignId,
      status: input.status,
      page: page.page,
      pageSize: page.pageSize
    })
  }

  /** getToolingCurrentPlacement returns the current storage, carrier, work center, or work unit placement. */
  async getToolingCurrentPlacement(input: GetToolingCurrentPlacementInput): Promise<{ placement: ToolingPlacementSummaryRecord }> {
    assertQueryContext(input)
    assertRequiredString(input.toolingId, 'toolingId')
    const orgId = resolveContextOrgId(input)
    const productionMold = await this.repository.findProductionMoldById(input.tenantId, input.toolingId)
    if (productionMold) {
      assertVisibleByOrg(productionMold, orgId, input.toolingId, 'ProductionMold')
      return {
        placement: assertExists(
          await this.repository.getToolingCurrentPlacement(input.tenantId, input.toolingType, input.toolingId),
          'ToolingPlacement',
          input.toolingId
        )
      }
    }
    const masterMold = assertVisibleByOrg(
      assertExists(await this.repository.findMasterMoldById(input.tenantId, input.toolingId), 'MasterMold', input.toolingId),
      orgId,
      input.toolingId,
      'MasterMold'
    )
    return { placement: toStorageCarrierPlacement(masterMold) }
  }

  /** getMoldUsageHistory returns contract-shaped chronological mold history entries. */
  async getMoldUsageHistory(input: GetMoldUsageHistoryInput): Promise<MoldUsageHistoryResult> {
    assertQueryContext(input)
    assertRequiredString(input.productionMoldId, 'productionMoldId')
    assertDateRange(input.from, input.to, 'usageHistory')
    const page = normalizePageInput(input.page, input.pageSize)
    return this.repository.getMoldUsageHistory({
      tenantId: input.tenantId,
      orgId: resolveContextOrgId(input),
      productionMoldId: input.productionMoldId,
      from: normalizeOptionalString(input.from),
      to: normalizeOptionalString(input.to),
      page: page.page,
      pageSize: page.pageSize
    })
  }

  /** listCurrentMoldsByWorkCenter returns active mold installation rows for one work center. */
  async listCurrentMoldsByWorkCenter(input: ListCurrentMoldsByWorkCenterInput): Promise<ListCurrentMoldsByWorkCenterResult> {
    assertQueryContext(input)
    assertRequiredString(input.workCenterId, 'workCenterId')
    return this.repository.listCurrentMoldsByWorkCenter({
      tenantId: input.tenantId,
      orgId: resolveContextOrgId(input),
      workCenterId: input.workCenterId,
      workUnitId: normalizeOptionalString(input.workUnitId)
    })
  }

  /** listMoldLifeCounters returns contract-shaped mold life counter pages. */
  async listMoldLifeCounters(input: ListMoldLifeCountersInput): Promise<MoldLifeCounterPageResult> {
    assertQueryContext(input)
    const page = normalizePageInput(input.page, input.pageSize)
    return this.repository.listMoldLifeCounters({
      tenantId: input.tenantId,
      orgId: resolveContextOrgId(input),
      productionMoldId: normalizeOptionalString(input.productionMoldId),
      warningLevel: input.warningLevel,
      page: page.page,
      pageSize: page.pageSize
    })
  }

}

/** assertVisibleByOrg hides cross-org records behind NOT_FOUND semantics. */
function assertVisibleByOrg<T extends { orgId?: string | null }>(
  record: T,
  orgId: string | null,
  identifier: string,
  resource: string
): T {
  return assertExists((record.orgId ?? null) === orgId ? record : null, resource, identifier)
}

/** toStorageCarrierPlacement converts a master mold placement projection into the current placement summary. */
function toStorageCarrierPlacement(record: MasterMoldRecord): ToolingPlacementSummaryRecord {
  if (record.currentCarrierResourceRef) {
    return {
      placementType: ToolingPlacementType.CARRIER_RESOURCE,
      carrierResourceRef: record.currentCarrierResourceRef
    }
  }
  return {
    placementType: ToolingPlacementType.STORAGE_RESOURCE,
    storageResourceRef: record.currentStorageResourceRef ?? null
  }
}
