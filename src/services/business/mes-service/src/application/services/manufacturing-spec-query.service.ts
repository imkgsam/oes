import { Inject, Injectable } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { MES_INVALID_ARGUMENT } from '../../common/errors/mes.errors'
import { TOKENS } from '../../common/constants/tokens'
import {
  ManufacturingSpecAttributeFilterRecord,
  ManufacturingSpecQueryContext,
  ManufacturingSpecRecord,
  ManufacturingSpecResolveResult,
  ManufacturingSpecStatus,
  ManufacturingSpecSummaryPageResult,
  ManufacturingSpecSummaryRecord,
  ManufacturingSpecUnavailableRefRecord
} from '../../domain/models/manufacturing-spec-records'
import { ManufacturingSpecRepository } from '../../domain/repositories/manufacturing-spec.repository'
import {
  assertExists,
  assertRequiredString,
  normalizePageInput,
  normalizeOptionalString
} from '../support/mes-assertions'

export interface GetManufacturingSpecInput extends ManufacturingSpecQueryContext {
  manufacturingSpecId: string
}

export interface ListManufacturingSpecsInput extends ManufacturingSpecQueryContext {
  keyword?: string
  productFamilyRefId?: string
  itemId?: string
  attributeFilters?: ManufacturingSpecAttributeFilterRecord[]
  status?: ManufacturingSpecStatus
  includeRetired?: boolean
  page?: number
  pageSize?: number
}

export interface ResolveManufacturingSpecsForMoldInput extends ManufacturingSpecQueryContext {
  moldDesignId?: string
  productFamilyRefId?: string
  itemId?: string
  manufacturingSpecIds?: string[]
  includeRetired?: boolean
}

/** ManufacturingSpecQueryService owns read-side spec lookup and mold-reference resolution rules. */
@Injectable()
export class ManufacturingSpecQueryService {
  constructor(
    @Inject(TOKENS.MANUFACTURING_SPEC_REPOSITORY)
    private readonly repository: ManufacturingSpecRepository
  ) {}

  /** getManufacturingSpec returns one visible ManufacturingSpec record or NOT_FOUND. */
  async getManufacturingSpec(input: GetManufacturingSpecInput): Promise<ManufacturingSpecRecord> {
    this.assertQueryContext(input)
    assertRequiredString(input.manufacturingSpecId, 'manufacturingSpecId')
    return assertVisibleManufacturingSpec(
      assertExists(
        await this.repository.findManufacturingSpecById(input.tenantId, input.manufacturingSpecId),
        'ManufacturingSpec',
        input.manufacturingSpecId
      ),
      input.orgId
    )
  }

  /** listManufacturingSpecs returns a filtered page of compact ManufacturingSpec summaries. */
  async listManufacturingSpecs(input: ListManufacturingSpecsInput): Promise<ManufacturingSpecSummaryPageResult> {
    this.assertQueryContext(input)
    const pageInput = normalizePageInput(input.page, input.pageSize)
    const page = await this.repository.searchManufacturingSpecs({
      tenantId: input.tenantId,
      orgId: input.orgId,
      keyword: normalizeOptionalString(input.keyword),
      productFamilyRefId: normalizeOptionalString(input.productFamilyRefId),
      itemId: normalizeOptionalString(input.itemId),
      attributeFilters: (input.attributeFilters ?? []).map(normalizeAttributeFilter),
      status: input.status,
      includeRetired: input.includeRetired ?? false,
      page: pageInput.page,
      pageSize: pageInput.pageSize
    })
    return {
      ...page,
      items: page.items.map(toSummary)
    }
  }

  /** resolveManufacturingSpecsForMold resolves active spec summaries and unavailable refs for mold design usage. */
  async resolveManufacturingSpecsForMold(
    input: ResolveManufacturingSpecsForMoldInput
  ): Promise<ManufacturingSpecResolveResult> {
    this.assertQueryContext(input)
    const requestedIds = new Set((input.manufacturingSpecIds ?? []).map((value) => value.trim()).filter(Boolean))
    const moldDesignId = normalizeOptionalString(input.moldDesignId)
    const productFamilyRefId = normalizeOptionalString(input.productFamilyRefId)
    const itemId = normalizeOptionalString(input.itemId)
    assertResolveInput(!!moldDesignId || requestedIds.size > 0 || !!productFamilyRefId || !!itemId)

    if (moldDesignId) {
      const moldDesign = assertExists(
        await this.repository.findMoldDesignById(input.tenantId, moldDesignId),
        'MoldDesign',
        moldDesignId
      )
      for (const ref of moldDesign.manufacturingSpecRefs) {
        if (ref.refId.trim()) {
          requestedIds.add(ref.refId.trim())
        }
      }
    }

    let records: ManufacturingSpecRecord[]
    if (requestedIds.size > 0) {
      records = await this.repository.listManufacturingSpecsByIds(input.tenantId, Array.from(requestedIds))
    } else {
      const page = await this.repository.searchManufacturingSpecs({
        tenantId: input.tenantId,
        orgId: input.orgId,
        productFamilyRefId,
        itemId,
        includeRetired: input.includeRetired ?? false,
        page: 1,
        pageSize: 100
      })
      records = page.items
    }

    const recordsById = new Map(records.map((record) => [record.manufacturingSpecId, record]))
    const resolvedSpecs: ManufacturingSpecSummaryRecord[] = []
    const unavailableRefs: ManufacturingSpecUnavailableRefRecord[] = []

    const candidates = requestedIds.size > 0 ? Array.from(requestedIds) : records.map((record) => record.manufacturingSpecId)
    for (const manufacturingSpecId of candidates) {
      const record = recordsById.get(manufacturingSpecId)
      if (!record) {
        unavailableRefs.push({ refType: 'MANUFACTURING_SPEC', refId: manufacturingSpecId, reasonCode: 'NOT_FOUND' })
        continue
      }
      const unavailableReason = resolveUnavailableReason(record, input)
      if (unavailableReason) {
        unavailableRefs.push({
          refType: 'MANUFACTURING_SPEC',
          refId: manufacturingSpecId,
          reasonCode: unavailableReason
        })
        continue
      }
      resolvedSpecs.push(toSummary(record))
    }

    if (requestedIds.size === 0) {
      return {
        resolvedSpecs: records.filter((record) => !resolveUnavailableReason(record, input)).map(toSummary),
        unavailableRefs: []
      }
    }

    return { resolvedSpecs, unavailableRefs }
  }

  /** assertQueryContext keeps direct service calls aligned with the gRPC query context baseline. */
  private assertQueryContext(input: ManufacturingSpecQueryContext): void {
    assertRequiredString(input.tenantId, 'tenantId')
    assertRequiredString(input.operatorContext?.operatorId, 'operatorContext.operatorId')
    assertRequiredString(input.traceContext?.traceId, 'traceContext.traceId')
  }
}

/** assertResolveInput maps missing resolve inputs to the frozen INVALID_ARGUMENT contract. */
function assertResolveInput(condition: unknown): void {
  if (!condition) {
    throw ExceptionFactory.application(MES_INVALID_ARGUMENT, {
      reason: 'at least one manufacturing spec resolution input is required'
    })
  }
}

/** normalizeAttributeFilter validates one key/value filter pair. */
function normalizeAttributeFilter(filter: ManufacturingSpecAttributeFilterRecord): ManufacturingSpecAttributeFilterRecord {
  assertRequiredString(filter.attributeKey, 'attributeFilters.attributeKey')
  assertRequiredString(filter.attributeValue, 'attributeFilters.attributeValue')
  return {
    attributeKey: filter.attributeKey.trim(),
    attributeValue: filter.attributeValue.trim()
  }
}

/** resolveUnavailableReason classifies why a ManufacturingSpec cannot be used for a new mold reference. */
function resolveUnavailableReason(
  record: ManufacturingSpecRecord,
  input: ResolveManufacturingSpecsForMoldInput
): ManufacturingSpecUnavailableRefRecord['reasonCode'] | null {
  if (input.orgId && (record.orgId ?? null) !== input.orgId) {
    return 'NOT_VISIBLE'
  }
  if (!input.includeRetired && record.status === ManufacturingSpecStatus.RETIRED) {
    return 'RETIRED'
  }
  if (record.status !== ManufacturingSpecStatus.ACTIVE && !(input.includeRetired && record.status === ManufacturingSpecStatus.RETIRED)) {
    return 'NOT_ACTIVE'
  }
  if (input.productFamilyRefId && record.productFamilyRef.refId !== input.productFamilyRefId) {
    return 'NOT_VISIBLE'
  }
  if (input.itemId && record.itemRef.itemId !== input.itemId) {
    return 'NOT_VISIBLE'
  }
  return null
}

/** assertVisibleManufacturingSpec hides cross-org ManufacturingSpec records behind NOT_FOUND semantics. */
function assertVisibleManufacturingSpec(
  record: ManufacturingSpecRecord,
  orgId: string | null | undefined
): ManufacturingSpecRecord {
  return assertExists(
    (record.orgId ?? null) === (orgId ?? null) ? record : null,
    'ManufacturingSpec',
    record.manufacturingSpecId
  )
}

/** toSummary converts a full ManufacturingSpec record into its compact selector shape. */
function toSummary(record: ManufacturingSpecRecord): ManufacturingSpecSummaryRecord {
  return {
    manufacturingSpecId: record.manufacturingSpecId,
    specCode: record.specCode,
    name: record.name,
    revisionCode: record.revisionCode,
    productFamilyRef: record.productFamilyRef,
    itemRef: record.itemRef,
    status: record.status
  }
}
