import { requestClient } from '#/api/request'

export namespace MesApi {
  export type ProductionMoldStatus =
    | 'AVAILABLE'
    | 'DISABLED'
    | 'INSTALLED'
    | 'MAINTENANCE'
    | 'PREPARING'
    | 'RECEIVED'
    | 'SCRAP_PENDING'
    | 'SCRAPPED'
  export type WorkCenterStatus = 'ACTIVE' | 'INACTIVE'

  export interface ProductionSpecRef {
    displayNameSnapshot?: string
    productionSpecId: string
    specCodeSnapshot?: string
  }

  export interface ItemRef {
    itemCodeSnapshot?: string
    itemId: string
    itemNameSnapshot?: string
  }

  export interface ItemModelRef {
    itemModelId: string
    modelCodeSnapshot?: string
    modelNameSnapshot?: string
  }

  export interface StorageResourceRef {
    displayNameSnapshot?: string
    resourceCodeSnapshot?: string
    storageResourceId: string
  }

  export interface MoldDesignSummary {
    designCode: string
    moldDesignId: string
    name: string
    primaryItemModelRef?: ItemModelRef
    revisionCode?: string
  }

  export interface MoldDesignOutputOption {
    isDefault?: boolean
    label: string
    productionSpecRef: ProductionSpecRef
    moldDesignOutputId?: string
    moldDesignOutputOptionId?: string
    optionCode: string
    quantityPerUse?: string
  }

  export interface MoldDesignOutput {
    assemblyHint?: string
    componentRole?: string
    isPrimaryOutput?: boolean
    productionSpecRef?: ProductionSpecRef
    itemModelRef?: ItemModelRef
    moldDesignOutputId: string
    optionCode?: string
    options?: MoldDesignOutputOption[]
    outputCode: string
    outputKind?: string | number
    quantityPerUse: string
    sequenceNo: number
  }

  export interface ProductionSpecSummary {
    itemRef?: ItemRef
    productionSpecId: string
    name: string
    revisionCode?: string
    specCode: string
    status: string | number
  }

  export interface ListProductionSpecsQuery {
    includeRetired?: boolean
    itemId?: string
    keyword?: string
    page?: number
    pageSize?: number
    status?: string
  }

  export interface ListProductionSpecsResult {
    productionSpecs: ProductionSpecSummary[]
    page: number
    pageSize: number
    total: number
  }

  export interface MoldDesign extends MoldDesignSummary {
    createdAt?: string
    defaultLifeLimit?: string
    defaultLifeUnit?: string
    functionRole?: string | number
    primaryItemModelRef?: ItemModelRef
    productionSpecRefs?: ProductionSpecRef[]
    materialType?: string
    outputStructureType?: string | number
    outputs?: MoldDesignOutput[]
    productionMethodTags?: string[]
    status?: string | number
    supersedesMoldDesignId?: string
    updatedAt?: string
  }

  export interface ListMoldDesignsQuery {
    itemModelId?: string
    keyword?: string
    page?: number
    pageSize?: number
    productionSpecId?: string
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
    primaryItemModelRef: ItemModelRef
    productionSpecRefs?: ProductionSpecRef[]
    materialType: string
    name: string
    outputStructureType: string
    outputs: Array<{
      assemblyHint?: string
      componentRole?: string
      isPrimaryOutput: boolean
      itemModelRef?: ItemModelRef
      productionSpecRef?: ProductionSpecRef
      optionCode?: string
      options?: MoldDesignOutputOption[]
      outputCode: string
      outputKind: string
      quantityPerUse: string
      sequenceNo: number
    }>
    productionMethodTags?: string[]
    reason?: string
    revisionCode?: string
    supersedesMoldDesignId?: string
  }

  export interface MasterMold {
    currentCarrierResourceRef?: CarrierResourceRef
    currentPlacementSummary?: ToolingPlacementSummary
    currentStatus: string | number
    currentStorageResourceRef?: StorageResourceRef
    masterMoldCode: string
    masterMoldId: string
    moldDesignId?: string
    moldDesignSummary?: MoldDesignSummary
  }

  export interface ListMasterMoldsQuery {
    carrierResourceId?: string
    keyword?: string
    moldDesignId?: string
    page?: number
    pageSize?: number
    status?: string
    storageResourceId?: string
  }

  export interface ListMasterMoldsResult {
    masterMolds: MasterMold[]
    page: number
    pageSize: number
    total: number
  }

  export interface RegisterMasterMoldPayload {
    commandId?: string
    initialCarrierResourceRef?: CarrierResourceRef
    initialStorageResourceRef?: StorageResourceRef
    masterMoldCode: string
    moldDesignId: string
    reason?: string
    receivedAt?: string
  }

  export interface ProductionMold {
    currentInstallationSummary?: {
      installedAt?: string
      moldDetail?: MoldInstallationDetail
      status?: string | number
      toolingInstallationId: string
      workCenterRef?: WorkCenterRef
      workUnitRef?: WorkUnitRef
    }
    currentCarrierResourceRef?: CarrierResourceRef
    currentStorageResourceRef?: StorageResourceRef
    currentStatus: ProductionMoldStatus | string | number
    createdAt?: string
    lifeCounterSummary?: {
      lifeUnit?: string
      limitValue?: string
      remainingValue?: string
      usedValue?: string
      warningLevel?: string | number
      warningThresholdValue?: string
    }
    currentPlacementSummary?: ToolingPlacementSummary
    moldCode: string
    moldDesignId?: string
    moldDesignSummary?: MoldDesignSummary
    productionMoldId: string
    supplierRef?: unknown
    updatedAt?: string
  }

  export interface ListProductionMoldsQuery {
    moldDesignId?: string
    page?: number
    pageSize?: number
    status?: ProductionMoldStatus | string
    carrierResourceId?: string
    storageResourceId?: string
    warningLevel?: string
  }

  export interface ListProductionMoldsResult {
    productionMolds: ProductionMold[]
    page: number
    pageSize: number
    total: number
  }

  export interface ListProductionMoldsByDesignResult extends ListProductionMoldsResult {
    moldDesignSummary?: MoldDesignSummary
  }

  export interface SupplierRef {
    supplierCodeSnapshot?: string
    supplierDisplayNameSnapshot?: string
    supplierId?: string
  }

  export interface PurchaseRef {
    purchaseNoSnapshot?: string
    purchaseSourceId?: string
    purchaseSourceType?: string | number
  }

  export interface RegisterProductionMoldPayload {
    initialCarrierResourceRef?: CarrierResourceRef
    initialStorageResourceRef?: StorageResourceRef
    moldDesignId: string
    moldCode: string
    purchaseRef?: PurchaseRef
    reason?: string
    receivedAt?: string
    sourceMasterMoldId?: string
    supplierRef?: SupplierRef
  }

  export interface CurrentMoldsResult {
    items: Array<{
      productionMold: ProductionMold
      toolingInstallation: ToolingInstallation
      usageAllowed?: boolean
      usageDisabledReason?: string
    }>
  }

  export interface DailyMoldUsageBatchPayload {
    batchCommandId: string
    items: Array<{
      checked?: boolean
      lifeUnit?: string
      moldDesignOutputId?: string
      moldDesignOutputOptionId?: string
      toolingInstallationId: string
      productionMoldId: string
      usageQuantity?: string
      workCenterRef?: WorkCenterRef
      workUnitRef?: WorkUnitRef
    }>
    reason?: string
    usedAt?: string
    workCenterRef: WorkCenterRef
  }

  export interface WorkCenterRef {
    displayNameSnapshot?: string
    workCenterCodeSnapshot?: string
    workCenterId: string
  }

  export interface WorkUnitRef {
    displayNameSnapshot?: string
    workUnitCodeSnapshot?: string
    workUnitId: string
  }

  export interface CarrierResourceRef {
    carrierResourceId: string
    displayNameSnapshot?: string
    resourceCodeSnapshot?: string
  }

  export interface MoldInstallationDetail {
    cavityMapping?: string
    cavityPosition?: string
    moldPosition?: string
    setupParameters?: string
    toolingInstallationId?: string
  }

  export interface ToolingInstallation {
    installedAt?: string
    moldDetail?: MoldInstallationDetail
    status?: string | number
    toolingId: string
    toolingInstallationId: string
    toolingType?: string | number
    unmountedAt?: string
    workCenterRef?: WorkCenterRef
    workUnitRef?: WorkUnitRef
  }

  export interface ToolingPlacementSummary {
    carrierResourceRef?: CarrierResourceRef
    moldInstallationDetail?: MoldInstallationDetail
    placementType?: string | number
    storageResourceRef?: StorageResourceRef
    toolingInstallationId?: string
    workCenterRef?: WorkCenterRef
    workUnitRef?: WorkUnitRef
  }

  export interface MoldUsageHistoryEntry {
    auditRef?: unknown
    entryType: string | number
    happenedAt?: string
    productionMoldId: string
    summary?: string
  }

  export interface MoldUsageHistoryResult {
    entries: MoldUsageHistoryEntry[]
    total: number
  }

  export interface ListMoldLifeCountersQuery {
    page?: number
    pageSize?: number
    productionMoldId?: string
    warningLevel?: string
  }

  export interface MoldLifeCounter {
    lastAdjustedAt?: string
    lastUsageRecordId?: string
    lifeUnit: string
    limitValue?: string
    moldLifeCounterId: string
    productionMoldId: string
    usedValue: string
    warningThresholdValue?: string
  }

  export interface ListMoldLifeCountersResult {
    counters: MoldLifeCounter[]
    total: number
  }

  export interface MoveProductionMoldPayload {
    reason?: string
    toCarrierResourceRef?: CarrierResourceRef
    toStorageResourceRef?: StorageResourceRef
  }
}

/** listProductionSpecsApi loads ACTIVE production specs used by MoldDesign output binding. */
export async function listProductionSpecsApi(
  tenantId: string,
  params: MesApi.ListProductionSpecsQuery
) {
  return requestClient.get<MesApi.ListProductionSpecsResult>(
    `/mes/tenants/${tenantId}/production-specs`,
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

/** listMasterMoldsApi loads first-slice MasterMold result objects. */
export async function listMasterMoldsApi(tenantId: string, params: MesApi.ListMasterMoldsQuery) {
  return requestClient.get<MesApi.ListMasterMoldsResult>(`/mes/tenants/${tenantId}/master-molds`, {
    params
  })
}

/** getMasterMoldApi loads one MasterMold result object. */
export async function getMasterMoldApi(tenantId: string, masterMoldId: string) {
  return requestClient.get<MesApi.MasterMold>(`/mes/tenants/${tenantId}/master-molds/${masterMoldId}`)
}

/** registerMasterMoldApi registers one completed master mold result object. */
export async function registerMasterMoldApi(
  tenantId: string,
  payload: MesApi.RegisterMasterMoldPayload
) {
  return requestClient.post<MesApi.MasterMold>(`/mes/tenants/${tenantId}/master-molds`, payload)
}

/** listProductionMoldsApi loads the tenant-wide production mold directory. */
export async function listProductionMoldsApi(
  tenantId: string,
  params: MesApi.ListProductionMoldsQuery
) {
  return requestClient.get<MesApi.ListProductionMoldsResult>(
    `/mes/tenants/${tenantId}/production-molds`,
    { params }
  )
}

/** listProductionMoldsByDesignApi loads production molds that belong to one mold design. */
export async function listProductionMoldsByDesignApi(
  tenantId: string,
  moldDesignId: string,
  params: Omit<MesApi.ListProductionMoldsQuery, 'moldDesignId'>
) {
  return requestClient.get<MesApi.ListProductionMoldsByDesignResult>(
    `/mes/tenants/${tenantId}/mold-designs/${moldDesignId}/production-molds`,
    { params }
  )
}

/** getProductionMoldApi loads one production mold detail snapshot. */
export async function getProductionMoldApi(tenantId: string, productionMoldId: string) {
  return requestClient.get<MesApi.ProductionMold>(
    `/mes/tenants/${tenantId}/production-molds/${productionMoldId}`
  )
}

/** registerProductionMoldApi registers one production mold. */
export async function registerProductionMoldApi(
  tenantId: string,
  payload: MesApi.RegisterProductionMoldPayload
) {
  return requestClient.post<MesApi.ProductionMold>(
    `/mes/tenants/${tenantId}/production-molds`,
    payload
  )
}

/** acceptProductionMoldApi accepts one received production mold into AVAILABLE status. */
export async function acceptProductionMoldApi(
  tenantId: string,
  productionMoldId: string,
  payload: { acceptedAt?: string; reason?: string }
) {
  return requestClient.post<MesApi.ProductionMold>(
    `/mes/tenants/${tenantId}/production-molds/${productionMoldId}/accept`,
    payload
  )
}

/** getToolingCurrentPlacementApi reads the current storage, carrier, work-center, or work-unit placement for tooling. */
export async function getToolingCurrentPlacementApi(tenantId: string, toolingId: string) {
  return requestClient.get<{ placement?: MesApi.ToolingPlacementSummary }>(
    `/mes/tenants/${tenantId}/tooling/${toolingId}/current-placement`,
    { params: { toolingType: 'MOLD' } }
  )
}

/** getMoldUsageHistoryApi loads flattened lifecycle and usage facts for one production mold. */
export async function getMoldUsageHistoryApi(
  tenantId: string,
  productionMoldId: string,
  params: { from?: string; page?: number; pageSize?: number; to?: string }
) {
  return requestClient.get<MesApi.MoldUsageHistoryResult>(
    `/mes/tenants/${tenantId}/production-molds/${productionMoldId}/usage-history`,
    { params }
  )
}

/** listMoldLifeCountersApi loads independent mold life counters for warnings and detail panels. */
export async function listMoldLifeCountersApi(
  tenantId: string,
  params: MesApi.ListMoldLifeCountersQuery
) {
  return requestClient.get<MesApi.ListMoldLifeCountersResult>(
    `/mes/tenants/${tenantId}/mold-life-counters`,
    { params }
  )
}

/** moveProductionMoldApi moves one mold tooling object between storage and carrier references. */
export async function moveProductionMoldApi(
  tenantId: string,
  productionMoldId: string,
  payload: MesApi.MoveProductionMoldPayload
) {
  return requestClient.post<MesApi.ToolingPlacementSummary>(
    `/mes/tenants/${tenantId}/tooling/${productionMoldId}/move`,
    payload
  )
}

/** installProductionMoldApi installs one production mold as Tooling(type=MOLD). */
export async function installProductionMoldApi(
  tenantId: string,
  productionMoldId: string,
  payload: {
    cavityPosition?: string
    moldPosition?: string
    reason?: string
    setupParameters?: string
    workCenterRef: MesApi.WorkCenterRef
    workUnitRef?: MesApi.WorkUnitRef
  }
) {
  return requestClient.post<{ toolingInstallation: MesApi.ToolingInstallation }>(
    `/mes/tenants/${tenantId}/tooling/${productionMoldId}/install`,
    payload
  )
}

/** unmountProductionMoldApi unmounts one production mold tooling installation. */
export async function unmountProductionMoldApi(
  tenantId: string,
  toolingInstallationId: string,
  payload: { reason?: string }
) {
  return requestClient.post<{ toolingInstallation: MesApi.ToolingInstallation }>(
    `/mes/tenants/${tenantId}/tooling-installations/${toolingInstallationId}/unmount`,
    payload
  )
}

/** markProductionMoldForScrapApi marks one production mold as pending scrap or terminal scrap. */
export async function markProductionMoldForScrapApi(
  tenantId: string,
  productionMoldId: string,
  payload: { markedAt?: string; reason?: string }
) {
  return requestClient.post(
    `/mes/tenants/${tenantId}/production-molds/${productionMoldId}/mark-for-scrap`,
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
