import { Allow } from 'class-validator'

/** BindCustomerAccountToTenantPartyCommand carries the phase 1 CRM primary tenant-party binding request. */
export class BindCustomerAccountToTenantPartyCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    customerAccountId: string
    tenantPartyId: string
  }

  constructor(payload: { tenantId: string; customerAccountId: string; tenantPartyId: string }) {
    this.payload = payload
  }

  get tenantId(): string {
    return this.payload.tenantId
  }

  get customerAccountId(): string {
    return this.payload.customerAccountId
  }

  get tenantPartyId(): string {
    return this.payload.tenantPartyId
  }
}
