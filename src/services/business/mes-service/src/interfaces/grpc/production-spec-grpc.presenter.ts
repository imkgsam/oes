import {
  ActivateProductionSpecResponse,
  CreateProductionSpecResponse,
  GetProductionSpecResponse,
  ItemRef,
  ListProductionSpecsResponse,
  ProductionSpec,
  ProductionSpecStatus as ProtoProductionSpecStatus,
  ProductionSpecSummary,
  ResolveProductionSpecsForMoldResponse,
  RetireProductionSpecResponse,
  UnavailableProductionSpecRef,
  UpdateProductionSpecResponse
} from '@oes/common/generated/mes_service'
import {
  ProductionSpecRecord,
  ProductionSpecResolveResult,
  ProductionSpecStatus,
  ProductionSpecSummaryPageResult,
  ProductionSpecSummaryRecord,
  UnavailableProductionSpecRefRecord
} from '../../domain/models/production-spec-records'
import { ItemRefRecord } from '../../domain/models/mes-mold-records'

/** ProductionSpecGrpcPresenter translates ProductionSpec application records into generated gRPC responses. */
export class ProductionSpecGrpcPresenter {
  /** toCreateProductionSpecResponse presents one newly created ProductionSpec. */
  static toCreateProductionSpecResponse(record: ProductionSpecRecord): CreateProductionSpecResponse {
    return { productionSpec: this.toProductionSpec(record) }
  }

  /** toUpdateProductionSpecResponse presents one updated ProductionSpec. */
  static toUpdateProductionSpecResponse(record: ProductionSpecRecord): UpdateProductionSpecResponse {
    return { productionSpec: this.toProductionSpec(record) }
  }

  /** toActivateProductionSpecResponse presents one activated ProductionSpec. */
  static toActivateProductionSpecResponse(record: ProductionSpecRecord): ActivateProductionSpecResponse {
    return { productionSpec: this.toProductionSpec(record) }
  }

  /** toRetireProductionSpecResponse presents one retired ProductionSpec. */
  static toRetireProductionSpecResponse(record: ProductionSpecRecord): RetireProductionSpecResponse {
    return { productionSpec: this.toProductionSpec(record) }
  }

  /** toGetProductionSpecResponse presents one ProductionSpec query result. */
  static toGetProductionSpecResponse(record: ProductionSpecRecord): GetProductionSpecResponse {
    return { productionSpec: this.toProductionSpec(record) }
  }

  /** toListProductionSpecsResponse presents one page of ProductionSpec summaries. */
  static toListProductionSpecsResponse(input: ProductionSpecSummaryPageResult): ListProductionSpecsResponse {
    return {
      productionSpecs: input.productionSpecs.map((record) => this.toProductionSpecSummary(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toResolveProductionSpecsForMoldResponse presents resolved and unavailable ProductionSpec refs. */
  static toResolveProductionSpecsForMoldResponse(
    input: ProductionSpecResolveResult
  ): ResolveProductionSpecsForMoldResponse {
    return {
      resolvedSpecs: input.resolvedSpecs.map((record) => this.toProductionSpecSummary(record)),
      unavailableRefs: input.unavailableRefs.map((record) => this.toUnavailableProductionSpecRef(record))
    }
  }

  /** toProductionSpec converts one full ProductionSpec record into generated shape. */
  static toProductionSpec(record: ProductionSpecRecord): ProductionSpec {
    return {
      productionSpecId: record.productionSpecId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      specCode: record.specCode,
      name: record.name,
      revisionCode: record.revisionCode ?? undefined,
      supersedesProductionSpecId: record.supersedesProductionSpecId ?? undefined,
      itemRef: this.toItemRef(record.itemRef),
      status: toProtoProductionSpecStatus(record.status),
      effectiveFrom: record.effectiveFrom ?? undefined,
      effectiveTo: record.effectiveTo ?? undefined,
      retiredAt: record.retiredAt ?? undefined,
      replacementProductionSpecId: record.replacementProductionSpecId ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      version: record.version
    }
  }

  /** toProductionSpecSummary converts one summary record into generated shape. */
  static toProductionSpecSummary(record: ProductionSpecSummaryRecord): ProductionSpecSummary {
    return {
      productionSpecId: record.productionSpecId,
      specCode: record.specCode,
      name: record.name,
      revisionCode: record.revisionCode ?? undefined,
      itemRef: this.toItemRef(record.itemRef),
      status: toProtoProductionSpecStatus(record.status)
    }
  }

  /** toItemRef converts an MES item ref snapshot into generated shape. */
  static toItemRef(record: ItemRefRecord): ItemRef {
    return {
      itemId: record.itemId,
      itemCodeSnapshot: record.itemCodeSnapshot ?? undefined,
      itemNameSnapshot: record.itemNameSnapshot ?? undefined
    }
  }

  /** toUnavailableProductionSpecRef converts one unavailable-ref record into generated shape. */
  static toUnavailableProductionSpecRef(
    record: UnavailableProductionSpecRefRecord
  ): UnavailableProductionSpecRef {
    return {
      refId: record.refId,
      reasonCode: record.reasonCode
    }
  }
}

/** toDomainProductionSpecStatus maps generated status values into application status filters. */
export function toDomainProductionSpecStatus(
  value?: ProtoProductionSpecStatus
): ProductionSpecStatus | undefined {
  switch (value) {
    case ProtoProductionSpecStatus.PRODUCTION_SPEC_STATUS_DRAFT:
      return ProductionSpecStatus.DRAFT
    case ProtoProductionSpecStatus.PRODUCTION_SPEC_STATUS_ACTIVE:
      return ProductionSpecStatus.ACTIVE
    case ProtoProductionSpecStatus.PRODUCTION_SPEC_STATUS_RETIRED:
      return ProductionSpecStatus.RETIRED
    default:
      return undefined
  }
}

/** toProtoProductionSpecStatus maps application status values into generated enum values. */
function toProtoProductionSpecStatus(value: ProductionSpecStatus): ProtoProductionSpecStatus {
  switch (value) {
    case ProductionSpecStatus.ACTIVE:
      return ProtoProductionSpecStatus.PRODUCTION_SPEC_STATUS_ACTIVE
    case ProductionSpecStatus.RETIRED:
      return ProtoProductionSpecStatus.PRODUCTION_SPEC_STATUS_RETIRED
    default:
      return ProtoProductionSpecStatus.PRODUCTION_SPEC_STATUS_DRAFT
  }
}

/** toDomainItemRef converts generated item refs into MES item snapshot records. */
export function toDomainItemRef(value: ItemRef | undefined): ItemRefRecord | undefined {
  if (!value?.itemId) {
    return undefined
  }
  return {
    itemId: value.itemId,
    itemCodeSnapshot: value.itemCodeSnapshot,
    itemNameSnapshot: value.itemNameSnapshot
  }
}
