import {
  CrmCustomerPartyBindingStatus as PrismaCustomerPartyBindingStatus,
  CrmCustomerStatus as PrismaCustomerStatus,
  CustomerAddress as PrismaCustomerAddressRow,
  CustomerContact as PrismaCustomerContactRow,
  Prisma
} from '../../../../prisma/generated/prisma'
import {
  CustomerAccountRecord,
  CustomerAddressRecord,
  CustomerContactRecord,
  CustomerPartyBindingStatus,
  CustomerStatus
} from '../../../domain/models/crm-records'

const customerAccountInclude = {
  primaryBinding: true
} satisfies Prisma.CustomerAccountInclude

export type CustomerAccountWithBinding = Prisma.CustomerAccountGetPayload<{
  include: typeof customerAccountInclude
}>

/** PrismaCrmRecordMapper translates Prisma CRM persistence rows into the frozen phase 1 record shapes. */
export class PrismaCrmRecordMapper {
  /** customerAccountIncludeValue exposes the canonical include graph for account repository round-trips. */
  static customerAccountIncludeValue(): typeof customerAccountInclude {
    return customerAccountInclude
  }

  /** toCustomerAccount converts one persisted CRM account and optional primary binding into the domain record shape. */
  static toCustomerAccount(record: CustomerAccountWithBinding): CustomerAccountRecord {
    return {
      id: record.id,
      customerAccountNo: record.customerAccountNo,
      tenantId: record.tenantId,
      displayName: record.displayName,
      status: this.toDomainCustomerStatus(record.status),
      customerCategory: record.customerCategory,
      tags: this.fromJson<string[]>(record.tags),
      primaryBinding: record.primaryBinding
        ? {
            customerPartyBindingId: record.primaryBinding.id,
            customerAccountId: record.primaryBinding.customerAccountId,
            tenantId: record.primaryBinding.tenantId,
            tenantPartyId: record.primaryBinding.tenantPartyId,
            bindingStatus:
              record.primaryBinding.bindingStatus === PrismaCustomerPartyBindingStatus.ACTIVE_PRIMARY
                ? CustomerPartyBindingStatus.ACTIVE_PRIMARY
                : CustomerPartyBindingStatus.ACTIVE_PRIMARY,
            partyDisplayName: record.primaryBinding.partyDisplayName
          }
        : null
    }
  }

  /** toCustomerContact converts one persisted CRM contact row into the domain relationship record shape. */
  static toCustomerContact(record: PrismaCustomerContactRow): CustomerContactRecord {
    return {
      customerContactId: record.id,
      tenantId: record.tenantId,
      customerAccountId: record.customerAccountId,
      displayName: record.displayName,
      roleTitle: record.roleTitle,
      email: record.email,
      phone: record.phone,
      isPrimaryContact: record.isPrimaryContact,
      isActive: record.isActive
    }
  }

  /** toCustomerAddress converts one persisted CRM address row into the domain relationship record shape. */
  static toCustomerAddress(record: PrismaCustomerAddressRow): CustomerAddressRecord {
    return {
      customerAddressId: record.id,
      tenantId: record.tenantId,
      customerAccountId: record.customerAccountId,
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

  /** toPersistedCustomerStatus converts the CRM domain status enum into the Prisma enum value. */
  static toPersistedCustomerStatus(status: CustomerStatus): PrismaCustomerStatus {
    if (status === CustomerStatus.BLOCKED) {
      return PrismaCustomerStatus.BLOCKED
    }
    if (status === CustomerStatus.ARCHIVED) {
      return PrismaCustomerStatus.ARCHIVED
    }
    return PrismaCustomerStatus.ACTIVE_CUSTOMER
  }

  /** toPersistedBindingStatus converts the CRM binding status enum into the Prisma enum value. */
  static toPersistedBindingStatus(status: CustomerPartyBindingStatus): PrismaCustomerPartyBindingStatus {
    return status === CustomerPartyBindingStatus.ACTIVE_PRIMARY
      ? PrismaCustomerPartyBindingStatus.ACTIVE_PRIMARY
      : PrismaCustomerPartyBindingStatus.ACTIVE_PRIMARY
  }

  /** toInputJson deep-clones one plain CRM payload into a Prisma JSON input payload. */
  static toInputJson(value: unknown): Prisma.InputJsonValue {
    return structuredClone(value) as Prisma.InputJsonValue
  }

  /** fromJson casts one stored JSON payload back into the snapshot shape used by the CRM records. */
  static fromJson<T>(value: Prisma.JsonValue): T {
    return structuredClone(value) as T
  }

  /** toDomainCustomerStatus maps the persisted CRM status enum into the domain status enum. */
  private static toDomainCustomerStatus(status: PrismaCustomerStatus): CustomerStatus {
    if (status === PrismaCustomerStatus.BLOCKED) {
      return CustomerStatus.BLOCKED
    }
    if (status === PrismaCustomerStatus.ARCHIVED) {
      return CustomerStatus.ARCHIVED
    }
    return CustomerStatus.ACTIVE_CUSTOMER
  }
}
