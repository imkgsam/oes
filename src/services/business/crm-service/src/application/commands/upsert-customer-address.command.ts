import { Allow } from 'class-validator'

/** UpsertCustomerAddressCommand carries one create-or-update CRM business-address payload. */
export class UpsertCustomerAddressCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    customerAccountId: string
    customerAddressId?: string
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
    customerAccountId: string
    customerAddressId?: string
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

  get customerAccountId(): string {
    return this.payload.customerAccountId
  }

  get customerAddressId(): string | undefined {
    return this.payload.customerAddressId
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
