import {
  SrmSupplierPartyBindingStatus as PrismaSupplierPartyBindingStatus,
  SrmSupplierOfferingStatus as PrismaSupplierOfferingStatus,
  SrmSupplierStatus as PrismaSupplierStatus,
  SupplierAddress as PrismaSupplierAddressRow,
  SupplierContact as PrismaSupplierContactRow,
  SupplierOffering as PrismaSupplierOfferingRow,
  Prisma
} from '../../../../prisma/generated/prisma'
import {
  SupplierOfferingRecord,
  SupplierOfferingStatus,
  SupplierProfileRecord,
  SupplierAddressRecord,
  SupplierContactRecord,
  SupplierPartyBindingStatus,
  SupplierStatus
} from '../../../domain/models/srm-records'

const supplierProfileInclude = {
  partyBinding: true
} satisfies Prisma.SupplierProfileInclude

export type SupplierProfileWithBinding = Prisma.SupplierProfileGetPayload<{
  include: typeof supplierProfileInclude
}>

/** PrismaSrmRecordMapper translates Prisma SRM persistence rows into the frozen phase 1 record shapes. */
export class PrismaSrmRecordMapper {
  /** supplierProfileIncludeValue exposes the canonical include graph for account repository round-trips. */
  static supplierProfileIncludeValue(): typeof supplierProfileInclude {
    return supplierProfileInclude
  }

  /** toSupplierProfile converts one persisted SRM account and optional primary binding into the domain record shape. */
  static toSupplierProfile(record: SupplierProfileWithBinding): SupplierProfileRecord {
    return {
      id: record.id,
      supplierNo: record.supplierNo,
      tenantId: record.tenantId,
      displayName: record.displayName,
      status: this.toDomainSupplierStatus(record.status),
      supplierCategory: record.supplierCategory,
      tags: this.fromJson<string[]>(record.tags),
      partyBinding: record.partyBinding
        ? {
            supplierPartyBindingId: record.partyBinding.id,
            supplierId: record.partyBinding.supplierId,
            tenantId: record.partyBinding.tenantId,
            tenantPartyId: record.partyBinding.tenantPartyId,
            bindingStatus: SupplierPartyBindingStatus.ACTIVE,
            partyDisplayName: record.partyBinding.partyDisplayName
          }
        : null
    }
  }

  /** toSupplierContact converts one persisted SRM contact row into the domain relationship record shape. */
  static toSupplierContact(record: PrismaSupplierContactRow): SupplierContactRecord {
    return {
      supplierContactId: record.id,
      tenantId: record.tenantId,
      supplierId: record.supplierId,
      displayName: record.displayName,
      roleTitle: record.roleTitle,
      email: record.email,
      phone: record.phone,
      isPrimaryContact: record.isPrimaryContact,
      isActive: record.isActive
    }
  }

  /** toSupplierAddress converts one persisted SRM address row into the domain relationship record shape. */
  static toSupplierAddress(record: PrismaSupplierAddressRow): SupplierAddressRecord {
    return {
      supplierAddressId: record.id,
      tenantId: record.tenantId,
      supplierId: record.supplierId,
      label: record.label,
      countryCode: record.countryCode,
      region: record.region,
      locality: record.locality,
      addressLine1: record.addressLine1,
      addressLine2: record.addressLine2,
      postalCode: record.postalCode,
      isPrimaryAddress: record.isPrimaryAddress,
      isActive: record.isActive
    }
  }

  /** toSupplierOffering converts one persisted offering row into the current supplyability fact shape. */
  static toSupplierOffering(record: PrismaSupplierOfferingRow): SupplierOfferingRecord {
    return {
      supplierOfferingId: record.id,
      tenantId: record.tenantId,
      supplierId: record.supplierId,
      itemId: record.itemId,
      itemCode: record.itemCode,
      itemName: record.itemName,
      status: this.toDomainSupplierOfferingStatus(record.status)
    }
  }

  /** toPersistedSupplierStatus converts the SRM domain status enum into the Prisma enum value. */
  static toPersistedSupplierStatus(status: SupplierStatus): PrismaSupplierStatus {
    return status === SupplierStatus.INACTIVE ? PrismaSupplierStatus.INACTIVE : PrismaSupplierStatus.ACTIVE
  }

  /** toPersistedBindingStatus converts the SRM binding status enum into the Prisma enum value. */
  static toPersistedBindingStatus(status: SupplierPartyBindingStatus): PrismaSupplierPartyBindingStatus {
    return status === SupplierPartyBindingStatus.ACTIVE
      ? PrismaSupplierPartyBindingStatus.ACTIVE
      : PrismaSupplierPartyBindingStatus.ACTIVE
  }

  /** toPersistedSupplierOfferingStatus converts the offering fact status enum into the Prisma enum value. */
  static toPersistedSupplierOfferingStatus(status: SupplierOfferingStatus): PrismaSupplierOfferingStatus {
    return status === SupplierOfferingStatus.INACTIVE
      ? PrismaSupplierOfferingStatus.INACTIVE
      : PrismaSupplierOfferingStatus.ACTIVE
  }

  /** toInputJson deep-clones one plain SRM payload into a Prisma JSON input payload. */
  static toInputJson(value: unknown): Prisma.InputJsonValue {
    return structuredClone(value) as Prisma.InputJsonValue
  }

  /** fromJson casts one stored JSON payload back into the snapshot shape used by the SRM records. */
  static fromJson<T>(value: Prisma.JsonValue): T {
    return structuredClone(value) as T
  }

  /** toDomainSupplierStatus maps the persisted SRM status enum into the domain status enum. */
  private static toDomainSupplierStatus(status: PrismaSupplierStatus): SupplierStatus {
    return status === PrismaSupplierStatus.INACTIVE ? SupplierStatus.INACTIVE : SupplierStatus.ACTIVE
  }

  /** toDomainSupplierOfferingStatus maps the persisted offering status into the minimal domain status set. */
  private static toDomainSupplierOfferingStatus(status: PrismaSupplierOfferingStatus): SupplierOfferingStatus {
    return status === PrismaSupplierOfferingStatus.INACTIVE
      ? SupplierOfferingStatus.INACTIVE
      : SupplierOfferingStatus.ACTIVE
  }
}
