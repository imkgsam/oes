import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import {
  GetSupplierResponse,
  ListSupplierOfferingsByItemResponse,
  ListSupplierOfferingsBySupplierResponse,
  SearchSuppliersResponse,
  SupplierOfferingStatus as GrpcSupplierOfferingStatus,
  SupplierStatus as GrpcSupplierStatus
} from '@oes/common/generated/srm_service'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { SupplierManagementGrpcAdapter } from './adapters/supplier-management-grpc.adapter'
import { SupplierQueryGrpcAdapter } from './adapters/supplier-query-grpc.adapter'

type SupplierOfferingStatusValue = 'ACTIVE' | 'INACTIVE'
type SupplierStatusValue = 'ACTIVE' | 'INACTIVE'

@Injectable()
// Builds the tenant-scoped SRM supplier-management BFF model without widening SRM contract ownership boundaries.
export class SupplierManagementService {
  constructor(
    private readonly supplierQueryAdapter: SupplierQueryGrpcAdapter,
    private readonly supplierManagementAdapter: SupplierManagementGrpcAdapter
  ) {}

  /** searchSuppliers returns the paged SRM supplier directory needed by the tenant master-data entry. */
  async searchSuppliers(
    tenantId: string,
    query: {
      keyword?: string
      page?: number
      pageSize?: number
      status?: string
      tenantPartyId?: string
    },
    source: DownstreamRequestSource
  ) {
    this.resolveTenantId(tenantId, source)
    const result = await this.supplierQueryAdapter.searchSuppliers(
      {
        keyword: normalize(query.keyword),
        status: toGrpcSupplierStatus(query.status),
        tenantPartyId: normalize(query.tenantPartyId),
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100)
      },
      source
    )

    return mapSupplierPage(result)
  }

  /** getSupplierDetail aggregates one supplier shell with its contacts, addresses, and offerings for the phase 1 detail page. */
  async getSupplierDetail(tenantId: string, supplierId: string, source: DownstreamRequestSource) {
    this.resolveTenantId(tenantId, source)
    const resolvedSupplierId = requireNonBlank(supplierId, 'supplierId')
    const [supplierResult, contactsResult, addressesResult, offeringsResult] = await Promise.all([
      this.supplierQueryAdapter.getSupplier(
        {
          supplierId: resolvedSupplierId
        },
        source
      ),
      this.supplierQueryAdapter.listSupplierContacts(
        {
          supplierId: resolvedSupplierId
        },
        source
      ),
      this.supplierQueryAdapter.listSupplierAddresses(
        {
          supplierId: resolvedSupplierId
        },
        source
      ),
      this.supplierQueryAdapter.listSupplierOfferingsBySupplier(
        {
          supplierId: resolvedSupplierId,
          page: 1,
          pageSize: 20,
          status: undefined
        },
        source
      )
    ])

    const supplier = mapSupplierProfile(supplierResult.supplier)
    if (!supplier.supplierId) {
      throw new NotFoundException('supplier not found')
    }

    return {
      supplier,
      contacts: (contactsResult.contacts ?? []).map((contact) => mapSupplierContact(contact)),
      addresses: (addressesResult.addresses ?? []).map((address) => mapSupplierAddress(address)),
      offerings: (offeringsResult.offerings ?? []).map((offering) => mapSupplierOffering(offering))
    }
  }

  /** createSupplierProfile creates one SRM supplier shell without creating Party truth. */
  async createSupplierProfile(
    tenantId: string,
    input: {
      displayName: string
      supplierCategory?: string
      supplierNo?: string
      tags?: string[]
    },
    source: DownstreamRequestSource
  ) {
    this.resolveTenantId(tenantId, source)
    const result = await this.supplierManagementAdapter.createSupplierProfile(
      {
        displayName: requireNonBlank(input.displayName, 'displayName'),
        supplierNo: normalize(input.supplierNo),
        supplierCategory: normalize(input.supplierCategory),
        tags: normalizeStringArray(input.tags)
      },
      source
    )

    return mapSupplierProfile(result.supplier)
  }

  /** updateSupplierProfileBasics mutates only the frozen basics fields. */
  async updateSupplierProfileBasics(
    tenantId: string,
    supplierId: string,
    input: {
      displayName?: string
      supplierCategory?: string
      supplierNo?: string
      tags?: string[]
    },
    source: DownstreamRequestSource
  ) {
    this.resolveTenantId(tenantId, source)
    const result = await this.supplierManagementAdapter.updateSupplierProfileBasics(
      {
        supplierId: requireNonBlank(supplierId, 'supplierId'),
        displayName: normalize(input.displayName),
        supplierNo: normalize(input.supplierNo),
        supplierCategory: normalize(input.supplierCategory),
        tags: normalizeStringArray(input.tags)
      },
      source
    )

    return mapSupplierProfile(result.supplier)
  }

  /** bindSupplierToTenantParty establishes the phase 1 active tenantPartyId binding. */
  async bindSupplierToTenantParty(
    tenantId: string,
    supplierId: string,
    input: {
      tenantPartyId: string
    },
    source: DownstreamRequestSource
  ) {
    this.resolveTenantId(tenantId, source)
    const result = await this.supplierManagementAdapter.bindSupplierToTenantParty(
      {
        supplierId: requireNonBlank(supplierId, 'supplierId'),
        tenantPartyId: requireNonBlank(input.tenantPartyId, 'tenantPartyId')
      },
      source
    )

    return mapSupplierProfile(result.supplier)
  }

  /** upsertSupplierContact proxies one SRM business-contact create-or-update command. */
  async upsertSupplierContact(
    tenantId: string,
    supplierId: string,
    input: {
      displayName: string
      email?: string
      isActive?: boolean
      isPrimaryContact?: boolean
      phone?: string
      roleTitle?: string
      supplierContactId?: string
    },
    source: DownstreamRequestSource
  ) {
    this.resolveTenantId(tenantId, source)
    const result = await this.supplierManagementAdapter.upsertSupplierContact(
      {
        supplierId: requireNonBlank(supplierId, 'supplierId'),
        supplierContactId: normalize(input.supplierContactId),
        displayName: requireNonBlank(input.displayName, 'displayName'),
        roleTitle: normalize(input.roleTitle),
        email: normalize(input.email),
        phone: normalize(input.phone),
        isPrimaryContact: input.isPrimaryContact,
        isActive: input.isActive
      },
      source
    )

    return mapSupplierContact(result.contact)
  }

  /** upsertSupplierAddress proxies one SRM business-address create-or-update command. */
  async upsertSupplierAddress(
    tenantId: string,
    supplierId: string,
    input: {
      addressLine1: string
      addressLine2?: string
      countryCode: string
      isActive?: boolean
      isPrimaryAddress?: boolean
      label: string
      locality?: string
      postalCode?: string
      region?: string
      supplierAddressId?: string
    },
    source: DownstreamRequestSource
  ) {
    this.resolveTenantId(tenantId, source)
    const result = await this.supplierManagementAdapter.upsertSupplierAddress(
      {
        supplierId: requireNonBlank(supplierId, 'supplierId'),
        supplierAddressId: normalize(input.supplierAddressId),
        label: requireNonBlank(input.label, 'label'),
        countryCode: requireNonBlank(input.countryCode, 'countryCode'),
        region: normalize(input.region),
        locality: normalize(input.locality),
        addressLine1: requireNonBlank(input.addressLine1, 'addressLine1'),
        addressLine2: normalize(input.addressLine2),
        postalCode: normalize(input.postalCode),
        isPrimaryAddress: input.isPrimaryAddress,
        isActive: input.isActive
      },
      source
    )

    return mapSupplierAddress(result.address)
  }

  /** changeSupplierStatus proxies one explicit supplier lifecycle status change. */
  async changeSupplierStatus(
    tenantId: string,
    supplierId: string,
    input: { status: string },
    source: DownstreamRequestSource
  ) {
    this.resolveTenantId(tenantId, source)
    const result = await this.supplierManagementAdapter.changeSupplierStatus(
      {
        supplierId: requireNonBlank(supplierId, 'supplierId'),
        targetStatus: requireGrpcSupplierStatus(input.status)
      },
      source
    )

    return mapSupplierProfile(result.supplier)
  }

  /** listSupplierOfferingsBySupplier returns the paged offering page keyed by supplierId only. */
  async listSupplierOfferingsBySupplier(
    tenantId: string,
    supplierId: string,
    query: { page?: number; pageSize?: number; status?: string },
    source: DownstreamRequestSource
  ) {
    this.resolveTenantId(tenantId, source)
    const result = await this.supplierQueryAdapter.listSupplierOfferingsBySupplier(
      {
        supplierId: requireNonBlank(supplierId, 'supplierId'),
        status: toGrpcSupplierOfferingStatus(query.status),
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100)
      },
      source
    )

    return mapOfferingPage(result)
  }

  /** listSupplierOfferingsByItem returns the paged offering page keyed by itemId only. */
  async listSupplierOfferingsByItem(
    tenantId: string,
    itemId: string,
    query: { page?: number; pageSize?: number; status?: string },
    source: DownstreamRequestSource
  ) {
    this.resolveTenantId(tenantId, source)
    const result = await this.supplierQueryAdapter.listSupplierOfferingsByItem(
      {
        itemId: requireNonBlank(itemId, 'itemId'),
        status: toGrpcSupplierOfferingStatus(query.status),
        page: Math.max(query.page ?? 1, 1),
        pageSize: Math.min(Math.max(query.pageSize ?? 20, 1), 100)
      },
      source
    )

    return mapOfferingPage(result)
  }

  /** upsertSupplierOffering proxies one SRM offerability create-or-update command without adding pricing terms. */
  async upsertSupplierOffering(
    tenantId: string,
    supplierId: string,
    input: {
      itemId: string
      status: string
      supplierOfferingId?: string
    },
    source: DownstreamRequestSource
  ) {
    this.resolveTenantId(tenantId, source)
    const result = await this.supplierManagementAdapter.upsertSupplierOffering(
      {
        supplierId: requireNonBlank(supplierId, 'supplierId'),
        supplierOfferingId: normalize(input.supplierOfferingId),
        itemId: requireNonBlank(input.itemId, 'itemId'),
        targetStatus: requireGrpcSupplierOfferingStatus(input.status)
      },
      source
    )

    return mapSupplierOffering(result.offering)
  }

  /** resolveTenantId keeps tenant-scoped SRM requests pinned to the operator tenant unless the operator is at system scope. */
  private resolveTenantId(tenantId: string, source: DownstreamRequestSource): string {
    const requestedTenantId = requireNonBlank(tenantId, 'tenantId')
    const operatorTenantId = normalize(source.user?.tenantId) ?? normalize(source.user?.tid)

    if (source.user?.scopeLevel === 'SYSTEM') {
      return requestedTenantId
    }

    if (!operatorTenantId || operatorTenantId !== requestedTenantId) {
      throw new ForbiddenException(
        'Tenant administrators can only manage SRM supplier profiles in their current tenant'
      )
    }

    return operatorTenantId
  }
}

/** mapSupplierPage converts one generated supplier directory page into the stable tenant-web BFF shape. */
function mapSupplierPage(result: SearchSuppliersResponse) {
  return {
    suppliers: (result.suppliers ?? []).map((supplier) => mapSupplierProfile(supplier)),
    total: Number(result.total ?? 0),
    page: Number(result.page ?? 1),
    pageSize: Number(result.pageSize ?? 20)
  }
}

/** mapOfferingPage converts one generated supplier offering page into the stable tenant-web BFF shape. */
function mapOfferingPage(
  result: ListSupplierOfferingsByItemResponse | ListSupplierOfferingsBySupplierResponse
) {
  return {
    offerings: (result.offerings ?? []).map((offering) => mapSupplierOffering(offering)),
    total: Number(result.total ?? 0),
    page: Number(result.page ?? 1),
    pageSize: Number(result.pageSize ?? 20)
  }
}

/** mapSupplierProfile flattens one generated SRM supplier read model into the tenant-web detail shape. */
function mapSupplierProfile(supplier?: GetSupplierResponse['supplier']) {
  return {
    supplierId: supplier?.supplierId ?? '',
    supplierNo: supplier?.supplierNo ?? '',
    tenantId: supplier?.tenantId ?? '',
    displayName: supplier?.displayName ?? '',
    status: fromGrpcSupplierStatus(supplier?.status),
    supplierCategory: normalize(supplier?.supplierCategory) ?? '',
    tags: normalizeStringArray(supplier?.tags),
    partyBinding: supplier?.partyBinding
      ? {
          tenantPartyId: supplier.partyBinding.tenantPartyId ?? '',
          bindingStatus: fromGrpcBindingStatus(supplier.partyBinding.bindingStatus),
          partyDisplayName: supplier.partyBinding.partyDisplayName ?? ''
        }
      : undefined
  }
}

/** mapSupplierContact flattens one generated SRM contact read model into the tenant-web detail shape. */
function mapSupplierContact(contact?: any) {
  return {
    supplierContactId: contact?.supplierContactId ?? '',
    supplierId: contact?.supplierId ?? '',
    displayName: contact?.displayName ?? '',
    roleTitle: contact?.roleTitle ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    isPrimaryContact: Boolean(contact?.isPrimaryContact),
    isActive: Boolean(contact?.isActive)
  }
}

/** mapSupplierAddress flattens one generated SRM address read model into the tenant-web detail shape. */
function mapSupplierAddress(address?: any) {
  return {
    supplierAddressId: address?.supplierAddressId ?? '',
    supplierId: address?.supplierId ?? '',
    label: address?.label ?? '',
    countryCode: address?.countryCode ?? '',
    region: address?.region ?? '',
    locality: address?.locality ?? '',
    addressLine1: address?.addressLine1 ?? '',
    addressLine2: address?.addressLine2 ?? '',
    postalCode: address?.postalCode ?? '',
    isPrimaryAddress: Boolean(address?.isPrimaryAddress),
    isActive: Boolean(address?.isActive)
  }
}

/** mapSupplierOffering flattens one generated SRM offering read model into the tenant-web detail shape. */
function mapSupplierOffering(offering?: any) {
  return {
    supplierOfferingId: offering?.supplierOfferingId ?? '',
    supplierId: offering?.supplierId ?? '',
    itemId: offering?.itemId ?? '',
    itemCode: offering?.itemCode ?? '',
    itemName: offering?.itemName ?? '',
    status: fromGrpcSupplierOfferingStatus(offering?.status)
  }
}

/** fromGrpcBindingStatus maps the generated SRM binding enum into the stable tenant-web string union. */
function fromGrpcBindingStatus(value?: number): 'ACTIVE' | '' {
  switch (value) {
    case 1:
      return 'ACTIVE'
    default:
      return ''
  }
}

/** fromGrpcSupplierOfferingStatus maps the generated SRM offering enum into the stable tenant-web string union. */
function fromGrpcSupplierOfferingStatus(value?: number): SupplierOfferingStatusValue | '' {
  switch (value) {
    case GrpcSupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE:
      return 'ACTIVE'
    case GrpcSupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_INACTIVE:
      return 'INACTIVE'
    default:
      return ''
  }
}

/** fromGrpcSupplierStatus maps the generated SRM supplier enum into the stable tenant-web string union. */
function fromGrpcSupplierStatus(value?: number): SupplierStatusValue | '' {
  switch (value) {
    case GrpcSupplierStatus.SUPPLIER_STATUS_ACTIVE:
      return 'ACTIVE'
    case GrpcSupplierStatus.SUPPLIER_STATUS_INACTIVE:
      return 'INACTIVE'
    default:
      return ''
  }
}

/** toGrpcSupplierOfferingStatus maps one stable BFF string value into the generated SRM offering enum. */
function toGrpcSupplierOfferingStatus(value?: string) {
  switch (normalize(value)) {
    case 'ACTIVE':
      return GrpcSupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE
    case 'INACTIVE':
      return GrpcSupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_INACTIVE
    default:
      return undefined
  }
}

/** toGrpcSupplierStatus maps one stable BFF string value into the generated SRM supplier enum. */
function toGrpcSupplierStatus(value?: string) {
  switch (normalize(value)) {
    case 'ACTIVE':
      return GrpcSupplierStatus.SUPPLIER_STATUS_ACTIVE
    case 'INACTIVE':
      return GrpcSupplierStatus.SUPPLIER_STATUS_INACTIVE
    default:
      return undefined
  }
}

/** requireGrpcSupplierOfferingStatus validates one required SRM offering status payload. */
function requireGrpcSupplierOfferingStatus(value?: string) {
  const grpcValue = toGrpcSupplierOfferingStatus(value)
  if (grpcValue === undefined) {
    throw new NotFoundException('status is required')
  }

  return grpcValue
}

/** requireGrpcSupplierStatus validates one required SRM supplier status payload. */
function requireGrpcSupplierStatus(value?: string) {
  const grpcValue = toGrpcSupplierStatus(value)
  if (grpcValue === undefined) {
    throw new NotFoundException('status is required')
  }

  return grpcValue
}

/** normalize trims one optional string and turns blank values into undefined. */
function normalize(value?: string | null): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

/** normalizeStringArray trims one optional string array and removes blank entries. */
function normalizeStringArray(values?: string[] | null): string[] {
  if (!Array.isArray(values)) {
    return []
  }

  return values.map((value) => value.trim()).filter(Boolean)
}

/** requireNonBlank asserts that one required string field is present after trimming. */
function requireNonBlank(value: string, field: string): string {
  const normalized = value?.trim()
  if (!normalized) {
    throw new NotFoundException(`${field} is required`)
  }

  return normalized
}
