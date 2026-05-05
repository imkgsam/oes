import {
  ItemRefRecord,
  ManufacturingMasterDataRefRecord,
  MesCommandContext,
  MesQueryContext,
  PageResult
} from './mes-mold-records'

/** ManufacturingSpecStatus captures the phase 1 lifecycle for MES-owned manufacturing specs. */
export enum ManufacturingSpecStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  RETIRED = 'RETIRED'
}

/** RouteIntentRefRecord stores a future route reference intent without freezing route ownership in this slice. */
export interface RouteIntentRefRecord {
  routeRefId?: string | null
  routeCodeSnapshot?: string | null
  displayNameSnapshot?: string | null
}

/** ManufacturingAttributeRecord captures one key/value manufacturing promise used by shop-floor execution. */
export interface ManufacturingAttributeRecord {
  attributeKey: string
  attributeValue: string
  displayNameSnapshot?: string | null
  valueDisplaySnapshot?: string | null
}

/** ManufacturingSpecRecord stores the MES-owned manufacturing specification truth and display snapshots. */
export interface ManufacturingSpecRecord {
  manufacturingSpecId: string
  tenantId: string
  orgId?: string | null
  specCode: string
  name: string
  revisionCode?: string | null
  supersedesSpecId?: string | null
  productFamilyRef: ManufacturingMasterDataRefRecord
  itemRef: ItemRefRecord
  manufacturingAttributes: ManufacturingAttributeRecord[]
  routeIntentRef?: RouteIntentRefRecord | null
  status: ManufacturingSpecStatus
  effectiveFrom?: string | null
  effectiveTo?: string | null
  retiredAt?: string | null
  replacementSpecId?: string | null
  createdAt: string
  updatedAt: string
  version: number
}

/** ManufacturingSpecSummaryRecord exposes a compact ManufacturingSpec row for selectors and reference resolution. */
export interface ManufacturingSpecSummaryRecord {
  manufacturingSpecId: string
  specCode: string
  name: string
  revisionCode?: string | null
  productFamilyRef: ManufacturingMasterDataRefRecord
  itemRef: ItemRefRecord
  status: ManufacturingSpecStatus
}

/** ManufacturingSpecUnavailableReasonCode names why a requested spec reference cannot be used by a mold. */
export type ManufacturingSpecUnavailableReasonCode =
  | 'NOT_FOUND'
  | 'RETIRED'
  | 'NOT_ACTIVE'
  | 'NOT_VISIBLE'
  | 'NOT_MANUFACTURABLE_ITEM'
  | 'NOT_PHYSICAL_ITEM'

/** ManufacturingSpecUnavailableRefRecord records partial reference-resolution failures without failing the whole query. */
export interface ManufacturingSpecUnavailableRefRecord {
  refType: 'MOLD_DESIGN' | 'MANUFACTURING_SPEC' | 'ITEM' | 'PRODUCT_FAMILY'
  refId: string
  reasonCode: ManufacturingSpecUnavailableReasonCode
}

/** ManufacturingSpecResolveResult collects active resolved specs and unavailable refs for mold design usage. */
export interface ManufacturingSpecResolveResult {
  resolvedSpecs: ManufacturingSpecSummaryRecord[]
  unavailableRefs: ManufacturingSpecUnavailableRefRecord[]
}

/** ManufacturingSpecAttributeFilterRecord filters specs by one key/value manufacturing attribute pair. */
export interface ManufacturingSpecAttributeFilterRecord {
  attributeKey: string
  attributeValue: string
}

/** ManufacturingSpecPageResult aliases the shared page envelope for ManufacturingSpec records. */
export type ManufacturingSpecPageResult = PageResult<ManufacturingSpecRecord>

/** ManufacturingSpecSummaryPageResult aliases the shared page envelope for ManufacturingSpec summaries. */
export type ManufacturingSpecSummaryPageResult = PageResult<ManufacturingSpecSummaryRecord>

/** ManufacturingSpecCommandContext reuses the MES command context for ManufacturingSpec write operations. */
export type ManufacturingSpecCommandContext = MesCommandContext

/** ManufacturingSpecQueryContext reuses the MES query context for ManufacturingSpec read operations. */
export type ManufacturingSpecQueryContext = MesQueryContext
