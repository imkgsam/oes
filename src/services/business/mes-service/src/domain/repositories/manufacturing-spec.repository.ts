import {
  ManufacturingSpecAttributeFilterRecord,
  ManufacturingSpecPageResult,
  ManufacturingSpecRecord,
  ManufacturingSpecStatus
} from '../models/manufacturing-spec-records'
import {
  MesAuditEnvelopeRecord,
  MesCommandIdempotencyRecord,
  MesOutboxEventRecord,
  MoldDesignRecord
} from '../models/mes-mold-records'

/** SearchManufacturingSpecsInput captures the phase 1 filter set for ManufacturingSpec directories. */
export interface SearchManufacturingSpecsInput {
  tenantId: string
  orgId?: string | null
  keyword?: string
  productFamilyRefId?: string
  itemId?: string
  attributeFilters?: ManufacturingSpecAttributeFilterRecord[]
  status?: ManufacturingSpecStatus
  includeRetired?: boolean
  page: number
  pageSize: number
}

/** ManufacturingSpecRepository defines the persistence port for specs, mold reference lookup, audit, outbox, and idempotency. */
export interface ManufacturingSpecRepository {
  runInTransaction<T>(callback: () => Promise<T>): Promise<T>

  saveManufacturingSpec(record: ManufacturingSpecRecord): Promise<ManufacturingSpecRecord>
  findManufacturingSpecById(tenantId: string, manufacturingSpecId: string): Promise<ManufacturingSpecRecord | null>
  findManufacturingSpecByCode(
    tenantId: string,
    orgId: string | null | undefined,
    specCode: string
  ): Promise<ManufacturingSpecRecord | null>
  searchManufacturingSpecs(input: SearchManufacturingSpecsInput): Promise<ManufacturingSpecPageResult>
  listManufacturingSpecsByIds(tenantId: string, manufacturingSpecIds: string[]): Promise<ManufacturingSpecRecord[]>

  findMoldDesignById(tenantId: string, moldDesignId: string): Promise<MoldDesignRecord | null>

  appendAuditEnvelope(record: MesAuditEnvelopeRecord): Promise<MesAuditEnvelopeRecord>
  appendOutboxEvent(record: MesOutboxEventRecord): Promise<MesOutboxEventRecord>

  saveCommandIdempotencyRecord(record: MesCommandIdempotencyRecord): Promise<MesCommandIdempotencyRecord>
  findCommandIdempotencyRecord(tenantId: string, commandId: string): Promise<MesCommandIdempotencyRecord | null>
}
