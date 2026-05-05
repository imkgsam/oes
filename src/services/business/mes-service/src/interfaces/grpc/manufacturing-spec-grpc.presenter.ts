import {
  ActivateManufacturingSpecResponse,
  CreateManufacturingSpecResponse,
  GetManufacturingSpecResponse,
  ItemRef,
  ListManufacturingSpecsResponse,
  ManufacturingAttribute,
  ManufacturingMasterDataRef,
  ManufacturingMasterDataRefType as ProtoManufacturingMasterDataRefType,
  ManufacturingSpec,
  ManufacturingSpecStatus as ProtoManufacturingSpecStatus,
  ManufacturingSpecSummary,
  ResolveManufacturingSpecsForMoldResponse,
  RetireManufacturingSpecResponse,
  RouteIntentRef,
  UnavailableManufacturingSpecRef,
  UpdateManufacturingSpecResponse
} from '@oes/common/generated/mes_service'
import {
  ManufacturingAttributeRecord,
  ManufacturingSpecRecord,
  ManufacturingSpecResolveResult,
  ManufacturingSpecStatus,
  ManufacturingSpecSummaryPageResult,
  ManufacturingSpecSummaryRecord,
  ManufacturingSpecUnavailableRefRecord,
  RouteIntentRefRecord
} from '../../domain/models/manufacturing-spec-records'
import { ItemRefRecord, ManufacturingMasterDataRefRecord } from '../../domain/models/mes-mold-records'

/** ManufacturingSpecGrpcPresenter translates ManufacturingSpec records into the generated gRPC response surface. */
export class ManufacturingSpecGrpcPresenter {
  /** toCreateManufacturingSpecResponse presents one newly created ManufacturingSpec. */
  static toCreateManufacturingSpecResponse(record: ManufacturingSpecRecord): CreateManufacturingSpecResponse {
    return { manufacturingSpec: this.toManufacturingSpec(record) }
  }

  /** toUpdateManufacturingSpecResponse presents one updated ManufacturingSpec. */
  static toUpdateManufacturingSpecResponse(record: ManufacturingSpecRecord): UpdateManufacturingSpecResponse {
    return { manufacturingSpec: this.toManufacturingSpec(record) }
  }

  /** toActivateManufacturingSpecResponse presents one activated ManufacturingSpec. */
  static toActivateManufacturingSpecResponse(record: ManufacturingSpecRecord): ActivateManufacturingSpecResponse {
    return { manufacturingSpec: this.toManufacturingSpec(record) }
  }

  /** toRetireManufacturingSpecResponse presents one retired ManufacturingSpec and optional replacement summary. */
  static toRetireManufacturingSpecResponse(input: {
    manufacturingSpec: ManufacturingSpecRecord
    replacementSpecSummary: ManufacturingSpecSummaryRecord | null
  }): RetireManufacturingSpecResponse {
    return {
      manufacturingSpec: this.toManufacturingSpec(input.manufacturingSpec),
      replacementSpecSummary: input.replacementSpecSummary
        ? this.toManufacturingSpecSummary(input.replacementSpecSummary)
        : undefined
    }
  }

  /** toGetManufacturingSpecResponse presents one ManufacturingSpec query result. */
  static toGetManufacturingSpecResponse(record: ManufacturingSpecRecord): GetManufacturingSpecResponse {
    return { manufacturingSpec: this.toManufacturingSpec(record) }
  }

  /** toListManufacturingSpecsResponse presents one page of ManufacturingSpec summaries. */
  static toListManufacturingSpecsResponse(input: ManufacturingSpecSummaryPageResult): ListManufacturingSpecsResponse {
    return {
      manufacturingSpecs: input.items.map((record) => this.toManufacturingSpecSummary(record)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  /** toResolveManufacturingSpecsForMoldResponse presents resolved and unavailable ManufacturingSpec refs. */
  static toResolveManufacturingSpecsForMoldResponse(
    input: ManufacturingSpecResolveResult
  ): ResolveManufacturingSpecsForMoldResponse {
    return {
      resolvedSpecs: input.resolvedSpecs.map((record) => this.toManufacturingSpecSummary(record)),
      unavailableRefs: input.unavailableRefs.map((record) => this.toUnavailableManufacturingSpecRef(record))
    }
  }

  /** toManufacturingSpec converts one full ManufacturingSpec record into generated shape. */
  static toManufacturingSpec(record: ManufacturingSpecRecord): ManufacturingSpec {
    return {
      manufacturingSpecId: record.manufacturingSpecId,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      specCode: record.specCode,
      name: record.name,
      revisionCode: record.revisionCode ?? undefined,
      supersedesSpecId: record.supersedesSpecId ?? undefined,
      productFamilyRef: this.toManufacturingMasterDataRef(record.productFamilyRef),
      itemRef: this.toItemRef(record.itemRef),
      manufacturingAttributes: record.manufacturingAttributes.map((attribute) =>
        this.toManufacturingAttribute(attribute)
      ),
      routeIntentRef: record.routeIntentRef ? this.toRouteIntentRef(record.routeIntentRef) : undefined,
      status: toProtoManufacturingSpecStatus(record.status),
      effectiveFrom: record.effectiveFrom ?? undefined,
      effectiveTo: record.effectiveTo ?? undefined,
      retiredAt: record.retiredAt ?? undefined,
      replacementSpecId: record.replacementSpecId ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      version: record.version
    }
  }

  /** toManufacturingSpecSummary converts one summary record into generated shape. */
  static toManufacturingSpecSummary(record: ManufacturingSpecSummaryRecord): ManufacturingSpecSummary {
    return {
      manufacturingSpecId: record.manufacturingSpecId,
      specCode: record.specCode,
      name: record.name,
      revisionCode: record.revisionCode ?? undefined,
      productFamilyRef: this.toManufacturingMasterDataRef(record.productFamilyRef),
      itemRef: this.toItemRef(record.itemRef),
      status: toProtoManufacturingSpecStatus(record.status)
    }
  }

  /** toManufacturingAttribute converts one manufacturing attribute row into generated shape. */
  static toManufacturingAttribute(record: ManufacturingAttributeRecord): ManufacturingAttribute {
    return {
      attributeKey: record.attributeKey,
      attributeValue: record.attributeValue,
      displayNameSnapshot: record.displayNameSnapshot ?? undefined,
      valueDisplaySnapshot: record.valueDisplaySnapshot ?? undefined
    }
  }

  /** toRouteIntentRef converts an optional future-route intent into generated shape. */
  static toRouteIntentRef(record: RouteIntentRefRecord): RouteIntentRef {
    return {
      routeRefId: record.routeRefId ?? undefined,
      routeCodeSnapshot: record.routeCodeSnapshot ?? undefined,
      displayNameSnapshot: record.displayNameSnapshot ?? undefined
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

  /** toManufacturingMasterDataRef converts an opaque master-data ref into generated shape. */
  static toManufacturingMasterDataRef(record: ManufacturingMasterDataRefRecord): ManufacturingMasterDataRef {
    return {
      refType:
        record.refType === 'MANUFACTURING_SPEC'
          ? ProtoManufacturingMasterDataRefType.MANUFACTURING_MASTER_DATA_REF_TYPE_MANUFACTURING_SPEC
          : ProtoManufacturingMasterDataRefType.MANUFACTURING_MASTER_DATA_REF_TYPE_PRODUCT_FAMILY,
      refId: record.refId,
      refCodeSnapshot: record.refCodeSnapshot ?? undefined,
      displayNameSnapshot: record.displayNameSnapshot ?? undefined
    }
  }

  /** toUnavailableManufacturingSpecRef converts one unavailable-ref record into generated shape. */
  static toUnavailableManufacturingSpecRef(
    record: ManufacturingSpecUnavailableRefRecord
  ): UnavailableManufacturingSpecRef {
    return {
      refType: record.refType,
      refId: record.refId,
      reasonCode: record.reasonCode
    }
  }
}

/** toDomainManufacturingSpecStatus maps generated status values into application status filters. */
export function toDomainManufacturingSpecStatus(
  value?: ProtoManufacturingSpecStatus
): ManufacturingSpecStatus | undefined {
  switch (value) {
    case ProtoManufacturingSpecStatus.MANUFACTURING_SPEC_STATUS_DRAFT:
      return ManufacturingSpecStatus.DRAFT
    case ProtoManufacturingSpecStatus.MANUFACTURING_SPEC_STATUS_ACTIVE:
      return ManufacturingSpecStatus.ACTIVE
    case ProtoManufacturingSpecStatus.MANUFACTURING_SPEC_STATUS_RETIRED:
      return ManufacturingSpecStatus.RETIRED
    default:
      return undefined
  }
}

/** toProtoManufacturingSpecStatus maps application status values into generated enum values. */
function toProtoManufacturingSpecStatus(value: ManufacturingSpecStatus): ProtoManufacturingSpecStatus {
  switch (value) {
    case ManufacturingSpecStatus.ACTIVE:
      return ProtoManufacturingSpecStatus.MANUFACTURING_SPEC_STATUS_ACTIVE
    case ManufacturingSpecStatus.RETIRED:
      return ProtoManufacturingSpecStatus.MANUFACTURING_SPEC_STATUS_RETIRED
    default:
      return ProtoManufacturingSpecStatus.MANUFACTURING_SPEC_STATUS_DRAFT
  }
}

/** toDomainProductFamilyRef converts generated product-family refs into MES opaque ref records. */
export function toDomainProductFamilyRef(
  value: ManufacturingMasterDataRef | undefined
): ManufacturingMasterDataRefRecord | undefined {
  if (!value?.refId) {
    return undefined
  }
  return {
    refType: 'PRODUCT_FAMILY',
    refId: value.refId,
    refCodeSnapshot: value.refCodeSnapshot,
    displayNameSnapshot: value.displayNameSnapshot
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

/** toDomainManufacturingAttributes converts generated attributes into application records. */
export function toDomainManufacturingAttributes(values?: ManufacturingAttribute[]): ManufacturingAttributeRecord[] {
  return (values ?? []).map((value) => ({
    attributeKey: value.attributeKey ?? '',
    attributeValue: value.attributeValue ?? '',
    displayNameSnapshot: value.displayNameSnapshot,
    valueDisplaySnapshot: value.valueDisplaySnapshot
  }))
}

/** toDomainRouteIntentRef converts generated route intent refs into application records. */
export function toDomainRouteIntentRef(value?: RouteIntentRef): RouteIntentRefRecord | undefined {
  if (!value?.routeRefId && !value?.routeCodeSnapshot && !value?.displayNameSnapshot) {
    return undefined
  }
  return {
    routeRefId: value.routeRefId,
    routeCodeSnapshot: value.routeCodeSnapshot,
    displayNameSnapshot: value.displayNameSnapshot
  }
}
