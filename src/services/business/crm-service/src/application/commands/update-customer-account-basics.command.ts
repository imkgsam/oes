import { Allow } from 'class-validator'

/** UpdateCustomerAccountBasicsCommand carries the mutable CRM account-shell fields allowed in phase 1. */
export class UpdateCustomerAccountBasicsCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    customerAccountId: string
    displayName?: string
    customerCategory?: string
    tags?: string[]
  }

  constructor(payload: {
    tenantId: string
    customerAccountId: string
    displayName?: string
    customerCategory?: string
    tags?: string[]
  }) {
    this.payload = payload
  }

  get tenantId(): string {
    return this.payload.tenantId
  }

  get customerAccountId(): string {
    return this.payload.customerAccountId
  }

  get displayName(): string | undefined {
    return this.payload.displayName
  }

  get customerCategory(): string | undefined {
    return this.payload.customerCategory
  }

  get tags(): string[] | undefined {
    return this.payload.tags
  }
}
