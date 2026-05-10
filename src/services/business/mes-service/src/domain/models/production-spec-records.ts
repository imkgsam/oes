import { ItemRefRecord, MesCommandContext, MesQueryContext } from './mes-mold-records'

/** ProductionSpecStatus captures the lifecycle for MES-owned target production specs. */
export enum ProductionSpecStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  RETIRED = 'RETIRED'
}

/** ProductionSpecRecord stores the MES-owned target production spec truth and display snapshots. */
export interface ProductionSpecRecord {
  productionSpecId: string
  tenantId: string
  orgId?: string | null
  specCode: string
  name: string
  revisionCode?: string | null
  supersedesProductionSpecId?: string | null
  itemRef: ItemRefRecord
  status: ProductionSpecStatus
  effectiveFrom?: string | null
  effectiveTo?: string | null
  retiredAt?: string | null
  replacementProductionSpecId?: string | null
  createdAt: string
  updatedAt: string
  version: number
}

/** ProductionSpecSummaryRecord exposes a compact spec row for selectors and reference resolution. */
export interface ProductionSpecSummaryRecord {
  productionSpecId: string
  specCode: string
  name: string
  revisionCode?: string | null
  itemRef: ItemRefRecord
  status: ProductionSpecStatus
}

/** UnavailableProductionSpecReasonCode names why a requested production spec cannot be used. */
export type UnavailableProductionSpecReasonCode =
  | 'NOT_FOUND'
  | 'RETIRED'
  | 'NOT_ACTIVE'
  | 'NOT_VISIBLE'
  | 'ITEM_NOT_MANUFACTURABLE'
  | 'ITEM_NOT_PHYSICAL'

/** UnavailableProductionSpecRefRecord records partial reference-resolution failures. */
export interface UnavailableProductionSpecRefRecord {
  refId: string
  reasonCode: UnavailableProductionSpecReasonCode
}

/** ProductionSpecResolveResult collects usable specs and unavailable refs for mold design usage. */
export interface ProductionSpecResolveResult {
  resolvedSpecs: ProductionSpecSummaryRecord[]
  unavailableRefs: UnavailableProductionSpecRefRecord[]
}

/** ProductionSpecSummaryPageResult mirrors the ListProductionSpecs contract response shape. */
export interface ProductionSpecSummaryPageResult {
  productionSpecs: ProductionSpecSummaryRecord[]
  total: number
  page: number
  pageSize: number
}

/** ProductionSpecCommandContext reuses the MES command envelope for production spec writes. */
export type ProductionSpecCommandContext = MesCommandContext

/** ProductionSpecQueryContext reuses the MES query envelope for production spec reads. */
export type ProductionSpecQueryContext = MesQueryContext
