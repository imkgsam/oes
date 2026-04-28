import { Allow } from 'class-validator'

/** UpsertSupplierAddressCommand carries one create-or-update SRM business-address payload. */
export class UpsertSupplierAddressCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    supplierId: string
    supplierAddressId?: string
    label: string
    countryCode: string
    region?: string
    locality?: string
    addressLine1: string
    addressLine2?: string
    postalCode?: string
    isPrimaryAddress?: boolean
    isActive?: boolean
  }

  constructor(payload: {
    tenantId: string
    supplierId: string
    supplierAddressId?: string
    label: string
    countryCode: string
    region?: string
    locality?: string
    addressLine1: string
    addressLine2?: string
    postalCode?: string
    isPrimaryAddress?: boolean
    isActive?: boolean
  }) {
    this.payload = payload
  }

  get tenantId(): string {
    return this.payload.tenantId
  }

  get supplierId(): string {
    return this.payload.supplierId
  }

  get supplierAddressId(): string | undefined {
    return this.payload.supplierAddressId
  }

  get label(): string {
    return this.payload.label
  }

  get countryCode(): string {
    return this.payload.countryCode
  }

  get region(): string | undefined {
    return this.payload.region
  }

  get locality(): string | undefined {
    return this.payload.locality
  }

  get addressLine1(): string {
    return this.payload.addressLine1
  }

  get addressLine2(): string | undefined {
    return this.payload.addressLine2
  }

  get postalCode(): string | undefined {
    return this.payload.postalCode
  }

  get isPrimaryAddress(): boolean | undefined {
    return this.payload.isPrimaryAddress
  }

  get isActive(): boolean | undefined {
    return this.payload.isActive
  }
}
