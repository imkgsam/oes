import { Allow } from 'class-validator'

/** UpsertCustomerContactCommand carries one create-or-update CRM business-contact payload. */
export class UpsertCustomerContactCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    customerAccountId: string
    customerContactId?: string
    displayName: string
    roleTitle?: string
    email?: string
    phone?: string
    isPrimaryContact?: boolean
    isActive?: boolean
  }

  constructor(payload: {
    tenantId: string
    customerAccountId: string
    customerContactId?: string
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

  get customerAccountId(): string {
    return this.payload.customerAccountId
  }

  get customerContactId(): string | undefined {
    return this.payload.customerContactId
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
