import {
  ProductionSpecRecord,
  ProductionSpecResolveResult,
  ProductionSpecStatus,
  ProductionSpecSummaryPageResult
} from '../models/production-spec-records'
import { MesAuditEnvelopeRecord, MesCommandIdempotencyRecord, MesOutboxEventRecord } from '../models/mes-mold-records'

/** SearchProductionSpecsInput captures the contract filter set for production spec directories. */
export interface SearchProductionSpecsInput {
  tenantId: string
  orgId?: string | null
  status?: ProductionSpecStatus
  itemId?: string
  keyword?: string
  includeRetired?: boolean
  page: number
  pageSize: number
}

/** ResolveProductionSpecsForMoldInput captures explicit and mold-design-based spec resolution inputs. */
export interface ResolveProductionSpecsForMoldInput {
  tenantId: string
  orgId?: string | null
  productionSpecIds?: string[]
  moldDesignId?: string
}

/** ProductionSpecRepository defines persistence for production specs, audit, outbox, and idempotency. */
export interface ProductionSpecRepository {
  runInTransaction<T>(callback: () => Promise<T>): Promise<T>

  saveProductionSpec(record: ProductionSpecRecord): Promise<ProductionSpecRecord>
  findProductionSpecById(tenantId: string, productionSpecId: string): Promise<ProductionSpecRecord | null>
  findProductionSpecByCode(
    tenantId: string,
    orgId: string | null | undefined,
    specCode: string
  ): Promise<ProductionSpecRecord | null>
  searchProductionSpecs(input: SearchProductionSpecsInput): Promise<ProductionSpecSummaryPageResult>
  listProductionSpecsByIds(tenantId: string, productionSpecIds: string[]): Promise<ProductionSpecRecord[]>
  resolveProductionSpecsForMold(input: ResolveProductionSpecsForMoldInput): Promise<ProductionSpecResolveResult>

  appendAuditEnvelope(record: MesAuditEnvelopeRecord): Promise<MesAuditEnvelopeRecord>
  appendOutboxEvent(record: MesOutboxEventRecord): Promise<MesOutboxEventRecord>

  saveCommandIdempotencyRecord(record: MesCommandIdempotencyRecord): Promise<MesCommandIdempotencyRecord>
  findCommandIdempotencyRecord(tenantId: string, commandId: string): Promise<MesCommandIdempotencyRecord | null>
}
