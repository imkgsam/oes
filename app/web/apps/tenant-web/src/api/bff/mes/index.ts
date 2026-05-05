import { requestClient } from '#/api/request'

export namespace MesApi {
  export type ProductionMoldInstanceStatus =
    | 'DISABLED'
    | 'INSTALLED'
    | 'PENDING_DRYING'
    | 'PENDING_INSTALLATION'
    | 'PENDING_REPAIR'
    | 'RECEIVED'
    | 'SCRAPPED'
    | 'UNDER_REPAIR'
  export type WorkCenterStatus = 'ACTIVE' | 'INACTIVE'

  export interface ManufacturingMasterDataRef {
    displayNameSnapshot?: string
    refCodeSnapshot?: string
    refId: string
    refType?: string | number
  }

  export interface ItemRef {
    itemCodeSnapshot?: string
    itemId: string
    itemNameSnapshot?: string
  }

  export interface WorkCenterSummary {
    capacityProfileId?: string
    name: string
    parentWorkCenterId?: string
    relatedMesLocationId?: string
    status: WorkCenterStatus | string
    workCenterCode: string
    workCenterId: string
    workCenterType: string
  }

  export interface ListWorkCentersQuery {
    keyword?: string
    page?: number
    pageSize?: number
    parentWorkCenterId?: string
    status?: WorkCenterStatus | string
    workCenterType?: string
  }

  export interface ListWorkCentersResult {
    page: number
    pageSize: number
    total: number
    workCenters: WorkCenterSummary[]
  }

  export interface CreateWorkCenterPayload {
    name: string
    reason?: string
    workCenterCode: string
    workCenterType: string
  }

  export interface MoldDesignSummary {
    designCode: string
    moldDesignId: string
    name: string
    productFamilyRef?: ManufacturingMasterDataRef
    revisionCode?: string
  }

  export interface MoldDesignOutputOption {
    isDefault?: boolean
    label: string
    manufacturingSpecRef: ManufacturingMasterDataRef
    moldDesignOutputId?: string
    moldDesignOutputOptionId?: string
    optionCode: string
    productFamilyRef?: ManufacturingMasterDataRef
    quantityPerUse?: string
  }

  export interface MoldDesignOutput {
    assemblyHint?: string
    componentRole?: string
    isPrimaryOutput?: boolean
    manufacturingSpecRef?: ManufacturingMasterDataRef
    moldDesignOutputId: string
    optionCode?: string
    options?: MoldDesignOutputOption[]
    outputCode: string
    outputKind?: string | number
    quantityPerUse: string
    sequenceNo: number
  }

  export interface ManufacturingSpecSummary {
    itemRef?: ItemRef
    manufacturingSpecId: string
    name: string
    productFamilyRef?: ManufacturingMasterDataRef
    revisionCode?: string
    specCode: string
    status: string | number
  }

  export interface ListManufacturingSpecsQuery {
    includeRetired?: boolean
    itemId?: string
    keyword?: string
    page?: number
    pageSize?: number
    productFamilyRefId?: string
    status?: string
  }

  export interface ListManufacturingSpecsResult {
    manufacturingSpecs: ManufacturingSpecSummary[]
    page: number
    pageSize: number
    total: number
  }

  export interface MoldDesign extends MoldDesignSummary {
    defaultLifeLimit?: string
    defaultLifeUnit?: string
    functionRole?: string | number
    itemRef?: ItemRef
    materialType?: string
    outputs?: MoldDesignOutput[]
    productionMethodTags?: string[]
    status?: string | number
  }

  export interface ListMoldDesignsQuery {
    itemId?: string
    keyword?: string
    page?: number
    pageSize?: number
    productionMethodTag?: string
    status?: string
  }

  export interface ListMoldDesignsResult {
    moldDesigns: MoldDesign[]
    page: number
    pageSize: number
    total: number
  }

  export interface RegisterMoldDesignPayload {
    defaultLifeLimit?: string
    defaultLifeUnit?: string
    designCode: string
    functionRole: string
    itemRef?: ItemRef
    manufacturingSpecRefs?: ManufacturingMasterDataRef[]
    materialType: string
    name: string
    outputStructureType: string
    outputs: Array<{
      assemblyHint?: string
      componentRole?: string
      isPrimaryOutput: boolean
      manufacturingSpecRef?: ManufacturingMasterDataRef
      optionCode?: string
      options?: MoldDesignOutputOption[]
      outputCode: string
      outputKind: string
      productFamilyRef?: ManufacturingMasterDataRef
      quantityPerUse: string
      sequenceNo: number
    }>
    productFamilyRef: ManufacturingMasterDataRef
    productionMethodTags?: string[]
    reason?: string
    revisionCode?: string
  }

  export interface ProductionMoldInstance {
    currentInstallationSummary?: {
      installedAt?: string
      moldInstallationId: string
      positionCode?: string
      resourcePositionId?: string
      workCenterCode?: string
      workCenterId?: string
      workCenterName?: string
    }
    currentStatus: ProductionMoldInstanceStatus | string | number
    lifeSummary?: {
      lifeUnit?: string
      limitValue?: string
      remainingValue?: string
      usedValue?: string
      warningLevel?: string | number
      warningThresholdValue?: string
    }
    moldDesignSummary: MoldDesignSummary
    moldInstanceCode: string
    productionMoldInstanceId: string
    supplierRef?: unknown
    warningSummary?: unknown
  }

  export interface ListProductionMoldInstancesQuery {
    moldDesignId?: string
    page?: number
    pageSize?: number
    status?: ProductionMoldInstanceStatus | string
    warningLevel?: string
  }

  export interface ListProductionMoldInstancesResult {
    instances: ProductionMoldInstance[]
    page: number
    pageSize: number
    total: number
  }

  export interface RegisterProductionMoldInstancePayload {
    initialStatus?: ProductionMoldInstanceStatus | string
    lifeLimitValue?: string
    lifeUnit?: string
    moldDesignId: string
    moldInstanceCode: string
    reason?: string
    warningThresholdValue?: string
  }

  export interface CurrentMoldsResult {
    installedMolds: Array<{
      moldInstallation?: unknown
      productionMoldInstance: ProductionMoldInstance
      resourcePositionSummary?: unknown
    }>
    page: number
    pageSize: number
    total: number
    workCenterSummary?: WorkCenterSummary
  }

  export interface DailyMoldUsageBatchPayload {
    batchCommandId: string
    items: Array<{
      checked?: boolean
      lifeDelta?: string
      lifeUnit?: string
      moldDesignOutputId?: string
      moldDesignOutputOptionId?: string
      moldInstallationId: string
      productionMoldInstanceId: string
      resourcePositionId?: string
      usageQuantity?: string
      workCenterId?: string
    }>
    reason?: string
    usedAt?: string
    workCenterId: string
  }
}

/** listWorkCentersApi loads mold-management production units for the active tenant. */
export async function listWorkCentersApi(tenantId: string, params: MesApi.ListWorkCentersQuery) {
  return requestClient.get<MesApi.ListWorkCentersResult>(`/mes/tenants/${tenantId}/work-centers`, {
    params
  })
}

/** createWorkCenterApi creates one mold-management production unit. */
export async function createWorkCenterApi(tenantId: string, payload: MesApi.CreateWorkCenterPayload) {
  return requestClient.post<MesApi.WorkCenterSummary>(`/mes/tenants/${tenantId}/work-centers`, payload)
}

/** deactivateWorkCenterApi deactivates one production unit after backend occupancy checks. */
export async function deactivateWorkCenterApi(tenantId: string, workCenterId: string, payload: { reason?: string }) {
  return requestClient.post<MesApi.WorkCenterSummary>(
    `/mes/tenants/${tenantId}/work-centers/${workCenterId}/deactivate`,
    payload
  )
}

/** listManufacturingSpecsApi loads ACTIVE manufacturing specs used by MoldDesign output binding. */
export async function listManufacturingSpecsApi(
  tenantId: string,
  params: MesApi.ListManufacturingSpecsQuery
) {
  return requestClient.get<MesApi.ListManufacturingSpecsResult>(
    `/mes/tenants/${tenantId}/manufacturing-specs`,
    { params }
  )
}

/** listMoldDesignsApi loads mold design master data for the workspace. */
export async function listMoldDesignsApi(tenantId: string, params: MesApi.ListMoldDesignsQuery) {
  return requestClient.get<MesApi.ListMoldDesignsResult>(`/mes/tenants/${tenantId}/mold-designs`, {
    params
  })
}

/** getMoldDesignApi loads one mold design detail including casting outputs and options. */
export async function getMoldDesignApi(tenantId: string, moldDesignId: string) {
  return requestClient.get<MesApi.MoldDesign>(`/mes/tenants/${tenantId}/mold-designs/${moldDesignId}`)
}

/** registerMoldDesignApi registers one mold design with its phase 1 output structure. */
export async function registerMoldDesignApi(
  tenantId: string,
  payload: MesApi.RegisterMoldDesignPayload
) {
  return requestClient.post<MesApi.MoldDesign>(`/mes/tenants/${tenantId}/mold-designs`, payload)
}

/** listProductionMoldInstancesApi loads the tenant-wide production mold directory. */
export async function listProductionMoldInstancesApi(
  tenantId: string,
  params: MesApi.ListProductionMoldInstancesQuery
) {
  return requestClient.get<MesApi.ListProductionMoldInstancesResult>(
    `/mes/tenants/${tenantId}/mold-instances`,
    { params }
  )
}

/** getProductionMoldInstanceApi loads one production mold detail snapshot. */
export async function getProductionMoldInstanceApi(tenantId: string, productionMoldInstanceId: string) {
  return requestClient.get<MesApi.ProductionMoldInstance>(
    `/mes/tenants/${tenantId}/mold-instances/${productionMoldInstanceId}`
  )
}

/** registerProductionMoldInstanceApi registers one production mold instance. */
export async function registerProductionMoldInstanceApi(
  tenantId: string,
  payload: MesApi.RegisterProductionMoldInstancePayload
) {
  return requestClient.post<MesApi.ProductionMoldInstance>(
    `/mes/tenants/${tenantId}/mold-instances`,
    payload
  )
}

/** installProductionMoldInstanceApi installs one mold and lets MES auto-create or reuse a mold position. */
export async function installProductionMoldInstanceApi(
  tenantId: string,
  productionMoldInstanceId: string,
  payload: { reason?: string; resourcePositionId?: string; workCenterId: string }
) {
  return requestClient.post<MesApi.ProductionMoldInstance>(
    `/mes/tenants/${tenantId}/mold-instances/${productionMoldInstanceId}/install`,
    payload
  )
}

/** unmountProductionMoldInstanceApi unmounts one production mold from its current line. */
export async function unmountProductionMoldInstanceApi(
  tenantId: string,
  productionMoldInstanceId: string,
  payload: { moldInstallationId: string; nextStatus?: string; reason?: string }
) {
  return requestClient.post<MesApi.ProductionMoldInstance>(
    `/mes/tenants/${tenantId}/mold-instances/${productionMoldInstanceId}/unmount`,
    payload
  )
}

/** scrapProductionMoldInstanceApi scraps one production mold instance. */
export async function scrapProductionMoldInstanceApi(
  tenantId: string,
  productionMoldInstanceId: string,
  payload: { closeCurrentInstallation?: boolean; scrapReason: string }
) {
  return requestClient.post(
    `/mes/tenants/${tenantId}/mold-instances/${productionMoldInstanceId}/scrap`,
    payload
  )
}

/** listCurrentMoldsByWorkCenterApi loads the current mold visualization for one production unit. */
export async function listCurrentMoldsByWorkCenterApi(tenantId: string, workCenterId: string) {
  return requestClient.get<MesApi.CurrentMoldsResult>(
    `/mes/tenants/${tenantId}/work-centers/${workCenterId}/current-molds`,
    { params: { page: 1, pageSize: 100 } }
  )
}

/** recordDailyMoldUsageBatchApi records checked mold usage rows from the web checklist. */
export async function recordDailyMoldUsageBatchApi(
  tenantId: string,
  checklistDate: string,
  payload: MesApi.DailyMoldUsageBatchPayload
) {
  return requestClient.post(
    `/mes/tenants/${tenantId}/daily-mold-checklists/${checklistDate}/usage-batch`,
    payload
  )
}
