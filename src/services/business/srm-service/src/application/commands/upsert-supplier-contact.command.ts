import { Allow } from 'class-validator'

/** UpsertSupplierContactCommand carries one create-or-update SRM business-contact payload. */
export class UpsertSupplierContactCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    supplierId: string
    supplierContactId?: string
    displayName: string
    roleTitle?: string
    email?: string
    phone?: string
    isPrimaryContact?: boolean
    isActive?: boolean
  }

  constructor(payload: {
    tenantId: string
    supplierId: string
    supplierContactId?: string
    displayName: string
    roleTitle?: string
    email?: string
    phone?: string
    isPrimaryContact?: boolean
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

  get supplierContactId(): string | undefined {
    return this.payload.supplierContactId
  }

  get displayName(): string {
    return this.payload.displayName
  }

  get roleTitle(): string | undefined {
    return this.payload.roleTitle
  }

  get email(): string | undefined {
    return this.payload.email
  }

  get phone(): string | undefined {
    return this.payload.phone
  }

  get isPrimaryContact(): boolean | undefined {
    return this.payload.isPrimaryContact
  }

  get isActive(): boolean | undefined {
    return this.payload.isActive
  }
}
