import { Allow } from 'class-validator'

/** CreateSupplierProfileCommand carries the phase 1 SRM supplier-profile creation payload. */
export class CreateSupplierProfileCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    displayName: string
    supplierNo?: string
    supplierCategory?: string
    tags?: string[]
  }

  constructor(payload: {
    tenantId: string
    displayName: string
    supplierNo?: string
    supplierCategory?: string
    tags?: string[]
  }) {
    this.payload = payload
  }

  get tenantId(): string {
    return this.payload.tenantId
  }

  get displayName(): string {
    return this.payload.displayName
  }

  get supplierNo(): string | undefined {
    return this.payload.supplierNo
  }

  get supplierCategory(): string | undefined {
    return this.payload.supplierCategory
  }

  get tags(): string[] | undefined {
    return this.payload.tags
  }
}
