import { Inject, Injectable } from '@nestjs/common'
import { TOKENS } from '../../common/constants/tokens'
import {
  ProductionSpecQueryContext,
  ProductionSpecRecord,
  ProductionSpecResolveResult,
  ProductionSpecStatus,
  ProductionSpecSummaryPageResult
} from '../../domain/models/production-spec-records'
import { ProductionSpecRepository } from '../../domain/repositories/production-spec.repository'
import {
  assertExists,
  assertInvalidArgument,
  assertQueryContext,
  assertRequiredString,
  normalizeOptionalString,
  normalizePageInput,
  resolveContextOrgId
} from '../support/mes-assertions'

export interface GetProductionSpecInput extends ProductionSpecQueryContext {
  productionSpecId: string
}

export interface ListProductionSpecsInput extends ProductionSpecQueryContext {
  status?: ProductionSpecStatus
  itemId?: string
  keyword?: string
  includeRetired?: boolean
  page?: number
  pageSize?: number
}

export interface ResolveProductionSpecsForMoldInput extends ProductionSpecQueryContext {
  productionSpecIds?: string[]
  moldDesignId?: string
}

/** ProductionSpecQueryService owns read-side spec lookup and mold-reference resolution rules. */
@Injectable()
export class ProductionSpecQueryService {
  constructor(
    @Inject(TOKENS.PRODUCTION_SPEC_REPOSITORY)
    private readonly repository: ProductionSpecRepository
  ) {}

  /** getProductionSpec returns one visible ProductionSpec record or NOT_FOUND. */
  async getProductionSpec(input: GetProductionSpecInput): Promise<ProductionSpecRecord> {
    assertQueryContext(input)
    const orgId = resolveContextOrgId(input)
    assertRequiredString(input.productionSpecId, 'productionSpecId')
    return assertVisibleProductionSpec(
      assertExists(
        await this.repository.findProductionSpecById(input.tenantId, input.productionSpecId),
        'ProductionSpec',
        input.productionSpecId
      ),
      orgId
    )
  }

  /** listProductionSpecs returns a filtered page of compact ProductionSpec summaries. */
  async listProductionSpecs(input: ListProductionSpecsInput): Promise<ProductionSpecSummaryPageResult> {
    assertQueryContext(input)
    const orgId = resolveContextOrgId(input)
    const page = normalizePageInput(input.page, input.pageSize)
    return this.repository.searchProductionSpecs({
      tenantId: input.tenantId,
      orgId,
      status: input.status,
      itemId: normalizeOptionalString(input.itemId),
      keyword: normalizeOptionalString(input.keyword)?.toUpperCase(),
      includeRetired: input.includeRetired ?? false,
      page: page.page,
      pageSize: page.pageSize
    })
  }

  /** resolveProductionSpecsForMold resolves active spec summaries and unavailable refs for mold design usage. */
  async resolveProductionSpecsForMold(input: ResolveProductionSpecsForMoldInput): Promise<ProductionSpecResolveResult> {
    assertQueryContext(input)
    const orgId = resolveContextOrgId(input)
    const productionSpecIds = Array.from(new Set((input.productionSpecIds ?? []).map((value) => value.trim()).filter(Boolean)))
    const moldDesignId = normalizeOptionalString(input.moldDesignId)
    assertInvalidArgument(productionSpecIds.length > 0 || !!moldDesignId, 'at least one production spec resolution input is required')
    return this.repository.resolveProductionSpecsForMold({
      tenantId: input.tenantId,
      orgId,
      productionSpecIds,
      moldDesignId
    })
  }
}

/** assertVisibleProductionSpec hides cross-org ProductionSpec records behind NOT_FOUND semantics. */
function assertVisibleProductionSpec(record: ProductionSpecRecord, orgId: string | null | undefined): ProductionSpecRecord {
  return assertExists(
    (record.orgId ?? null) === (orgId ?? null) ? record : null,
    'ProductionSpec',
    record.productionSpecId
  )
}
