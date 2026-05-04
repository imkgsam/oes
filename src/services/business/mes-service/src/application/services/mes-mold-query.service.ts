import { Inject, Injectable } from '@nestjs/common'
import { TOKENS } from '../../common/constants/tokens'
import {
  CurrentInstalledMoldView,
  DailyMoldChecklistRecord,
  MoldCurrentLocationView,
  MoldDesignRecord,
  MoldLifeWarningView,
  MoldResourceType,
  MoldUsageHistoryEntryRecord,
  MoldUsageHistoryEntryType,
  MoldWarningLevel,
  MoldWarningStatus,
  MoldWarningType,
  PageResult,
  ProductionMoldInstanceStatus,
  ProductionMoldInstanceView
} from '../../domain/models/mes-mold-records'
import { MesMoldRepository } from '../../domain/repositories/mes-mold.repository'
import {
  assertDateRange,
  assertExists,
  assertRequiredString,
  normalizePageInput
} from '../support/mes-assertions'
import { MesMoldReadModel, toWorkCenterSummary } from './mes-mold-read-model'

export interface GetMoldDesignInput {
  tenantId: string
  orgId?: string | null
  moldDesignId: string
}

export interface ListMoldDesignsInput {
  tenantId: string
  orgId?: string | null
  keyword?: string
  productFamilyRefId?: string
  manufacturingSpecRefId?: string
  itemId?: string
  materialType?: string
  functionRole?: string
  productionMethodTag?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface GetProductionMoldInstanceInput {
  tenantId: string
  orgId?: string | null
  productionMoldInstanceId: string
}

export interface ListMoldInstancesByDesignInput {
  tenantId: string
  orgId?: string | null
  moldDesignId: string
  status?: ProductionMoldInstanceStatus
  warningLevel?: MoldWarningLevel
  supplierId?: string
  page?: number
  pageSize?: number
}

export interface GetMoldCurrentLocationInput {
  tenantId: string
  orgId?: string | null
  moldResourceType: MoldResourceType
  moldResourceId: string
}

export interface GetMoldUsageHistoryInput {
  tenantId: string
  orgId?: string | null
  productionMoldInstanceId: string
  entryTypes?: MoldUsageHistoryEntryType[]
  occurredFrom?: string
  occurredTo?: string
  page?: number
  pageSize?: number
}

export interface ListCurrentMoldsByWorkCenterInput {
  tenantId: string
  orgId?: string | null
  workCenterId: string
  includeChildWorkCenters?: boolean
  warningLevel?: MoldWarningLevel
  page?: number
  pageSize?: number
}

export interface ListMoldLifeWarningsInput {
  tenantId: string
  orgId?: string | null
  status?: MoldWarningStatus
  warningType?: MoldWarningType
  warningLevel?: MoldWarningLevel
  workCenterId?: string
  moldDesignId?: string
  raisedFrom?: string
  raisedTo?: string
  page?: number
  pageSize?: number
}

export interface PrintDailyMoldChecklistInput {
  tenantId: string
  orgId?: string | null
  workCenterIds: string[]
  checklistDate: string
  includeChildWorkCenters?: boolean
  includeWarnings?: boolean
  includeRecentUsage?: boolean
  operatorId: string
}

/** MesMoldQueryService serves the frozen read-only mold query surface without mutating MES truth. */
@Injectable()
export class MesMoldQueryService {
  private readonly readModel: MesMoldReadModel

  constructor(
    @Inject(TOKENS.MES_MOLD_REPOSITORY)
    private readonly repository: MesMoldRepository
  ) {
    this.readModel = new MesMoldReadModel(repository)
  }

  /** getMoldDesign returns one mold design by id or NOT_FOUND when it is not visible. */
  async getMoldDesign(input: GetMoldDesignInput): Promise<MoldDesignRecord> {
    assertRequiredString(input.tenantId, 'tenantId')
    assertRequiredString(input.moldDesignId, 'moldDesignId')
    return assertExists(
      await this.repository.findMoldDesignById(input.tenantId, input.moldDesignId),
      'MoldDesign',
      input.moldDesignId
    )
  }

  /** listMoldDesigns returns one filtered design page and treats empty result sets as normal responses. */
  async listMoldDesigns(input: ListMoldDesignsInput): Promise<PageResult<MoldDesignRecord>> {
    assertRequiredString(input.tenantId, 'tenantId')
    const page = normalizePageInput(input.page, input.pageSize)
    return this.repository.searchMoldDesigns({
      tenantId: input.tenantId,
      orgId: input.orgId ?? null,
      keyword: input.keyword,
      productFamilyRefId: input.productFamilyRefId,
      manufacturingSpecRefId: input.manufacturingSpecRefId,
      itemId: input.itemId,
      materialType: input.materialType,
      functionRole: input.functionRole,
      productionMethodTag: input.productionMethodTag,
      status: input.status,
      ...page
    })
  }

  /** getProductionMoldInstance returns the current production mold projection with installation and life summaries. */
  async getProductionMoldInstance(input: GetProductionMoldInstanceInput): Promise<ProductionMoldInstanceView> {
    assertRequiredString(input.tenantId, 'tenantId')
    assertRequiredString(input.productionMoldInstanceId, 'productionMoldInstanceId')
    const instance = assertExists(
      await this.repository.findProductionMoldInstanceById(input.tenantId, input.productionMoldInstanceId),
      'ProductionMoldInstance',
      input.productionMoldInstanceId
    )
    return this.readModel.buildProductionMoldInstanceView(instance)
  }

  /** listMoldInstancesByDesign returns production mold instances for one design after confirming the design exists. */
  async listMoldInstancesByDesign(input: ListMoldInstancesByDesignInput): Promise<
    PageResult<ProductionMoldInstanceView> & {
      moldDesignSummary: Awaited<ReturnType<MesMoldReadModel['buildProductionMoldInstanceView']>>['moldDesignSummary']
    }
  > {
    assertRequiredString(input.tenantId, 'tenantId')
    assertRequiredString(input.moldDesignId, 'moldDesignId')
    const design = assertExists(
      await this.repository.findMoldDesignById(input.tenantId, input.moldDesignId),
      'MoldDesign',
      input.moldDesignId
    )
    const page = normalizePageInput(input.page, input.pageSize)
    const records = await this.repository.searchProductionMoldInstances({
      tenantId: input.tenantId,
      orgId: input.orgId ?? null,
      moldDesignId: input.moldDesignId,
      status: input.status,
      warningLevel: input.warningLevel,
      supplierId: input.supplierId,
      ...page
    })
    return {
      items: await Promise.all(records.items.map((record) => this.readModel.buildProductionMoldInstanceView(record))),
      total: records.total,
      page: records.page,
      pageSize: records.pageSize,
      moldDesignSummary: {
        moldDesignId: design.moldDesignId,
        designCode: design.designCode,
        name: design.name,
        revisionCode: design.revisionCode ?? null,
        productFamilyRef: design.productFamilyRef
      }
    }
  }

  /** getMoldCurrentLocation returns the current MES physical location for master or production mold resources. */
  async getMoldCurrentLocation(input: GetMoldCurrentLocationInput): Promise<MoldCurrentLocationView> {
    assertRequiredString(input.tenantId, 'tenantId')
    assertRequiredString(input.moldResourceId, 'moldResourceId')
    return this.readModel.buildCurrentLocation({
      tenantId: input.tenantId,
      moldResourceType: input.moldResourceType,
      moldResourceId: input.moldResourceId
    })
  }

  /** getMoldUsageHistory returns a chronological page from append-only movement, installation, usage, and warning facts. */
  async getMoldUsageHistory(input: GetMoldUsageHistoryInput): Promise<
    PageResult<MoldUsageHistoryEntryRecord> & {
      productionMoldInstanceSummary: ProductionMoldInstanceView
    }
  > {
    assertRequiredString(input.tenantId, 'tenantId')
    assertRequiredString(input.productionMoldInstanceId, 'productionMoldInstanceId')
    assertDateRange(input.occurredFrom, input.occurredTo, 'occurredAt')
    const productionMoldInstanceSummary = await this.getProductionMoldInstance(input)
    const page = await this.readModel.buildUsageHistory(input)
    return {
      ...page,
      productionMoldInstanceSummary
    }
  }

  /** listCurrentMoldsByWorkCenter reads active installation facts without treating WorkCenter as MesLocation. */
  async listCurrentMoldsByWorkCenter(
    input: ListCurrentMoldsByWorkCenterInput
  ): Promise<PageResult<CurrentInstalledMoldView> & { workCenterSummary: ReturnType<typeof toWorkCenterSummary> }> {
    assertRequiredString(input.tenantId, 'tenantId')
    assertRequiredString(input.workCenterId, 'workCenterId')
    const workCenter = assertExists(
      await this.repository.findWorkCenterById(input.tenantId, input.workCenterId),
      'WorkCenter',
      input.workCenterId
    )
    const page = normalizePageInput(input.page, input.pageSize)
    const activeInstallations = await this.repository.listActiveInstallationsByWorkCenter(
      input.tenantId,
      input.workCenterId
    )
    const records = (
      await Promise.all(activeInstallations.map((installation) => this.readModel.buildCurrentInstalledMold(installation)))
    ).filter((record) => !input.warningLevel || record.warningSummary?.warningLevel === input.warningLevel)
    const paged = {
      items: records.slice((page.page - 1) * page.pageSize, page.page * page.pageSize),
      total: records.length,
      page: page.page,
      pageSize: page.pageSize
    }
    return {
      ...paged,
      workCenterSummary: toWorkCenterSummary(workCenter)
    }
  }

  /** listMoldLifeWarnings returns warning rows and treats empty pages as normal query responses. */
  async listMoldLifeWarnings(input: ListMoldLifeWarningsInput): Promise<PageResult<MoldLifeWarningView>> {
    assertRequiredString(input.tenantId, 'tenantId')
    assertDateRange(input.raisedFrom, input.raisedTo, 'raisedAt')
    const page = normalizePageInput(input.page, input.pageSize)
    const records = await this.repository.searchMoldWarnings({
      tenantId: input.tenantId,
      orgId: input.orgId ?? null,
      status: input.status,
      warningType: input.warningType,
      warningLevel: input.warningLevel,
      workCenterId: input.workCenterId,
      moldDesignId: input.moldDesignId,
      raisedFrom: input.raisedFrom,
      raisedTo: input.raisedTo,
      ...page
    })
    return {
      items: await Promise.all(records.items.map((record) => this.readModel.buildWarningView(record))),
      total: records.total,
      page: records.page,
      pageSize: records.pageSize
    }
  }

  /** printDailyMoldChecklist builds the printable checklist read model without creating a paper-list fact. */
  async printDailyMoldChecklist(input: PrintDailyMoldChecklistInput): Promise<DailyMoldChecklistRecord> {
    assertRequiredString(input.tenantId, 'tenantId')
    if (!input.workCenterIds.length) {
      assertRequiredString('', 'workCenterIds')
    }
    assertRequiredString(input.checklistDate, 'checklistDate')
    return this.readModel.buildDailyChecklist({
      tenantId: input.tenantId,
      workCenterIds: input.workCenterIds,
      checklistDate: input.checklistDate,
      includeWarnings: input.includeWarnings,
      includeRecentUsage: input.includeRecentUsage,
      generatedBy: input.operatorId
    })
  }
}
