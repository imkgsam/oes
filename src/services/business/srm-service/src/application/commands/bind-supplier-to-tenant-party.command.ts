import { Allow } from 'class-validator'

/** BindSupplierToTenantPartyCommand carries the phase 1 SRM primary tenant-party binding request. */
export class BindSupplierToTenantPartyCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    supplierId: string
    tenantPartyId: string
  }

  constructor(payload: { tenantId: string; supplierId: string; tenantPartyId: string }) {
    this.payload = payload
  }

  get tenantId(): string {
    return this.payload.tenantId
  }

  get supplierId(): string {
    return this.payload.supplierId
  }

  get tenantPartyId(): string {
    return this.payload.tenantPartyId
  }
}
