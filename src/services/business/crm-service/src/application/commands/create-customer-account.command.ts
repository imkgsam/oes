import { Allow } from 'class-validator'

/** CreateCustomerAccountCommand carries the phase 1 CRM account-shell creation payload. */
export class CreateCustomerAccountCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    displayName: string
    customerCategory?: string
    tags?: string[]
  }

  constructor(payload: { tenantId: string; displayName: string; customerCategory?: string; tags?: string[] }) {
    this.payload = payload
  }

  get tenantId(): string {
    return this.payload.tenantId
  }

  get displayName(): string {
    return this.payload.displayName
  }

  get customerCategory(): string | undefined {
    return this.payload.customerCategory
  }

  get tags(): string[] | undefined {
    return this.payload.tags
  }
}
