import { Allow } from 'class-validator'

/** UpdateSupplierProfileBasicsCommand carries the mutable SRM supplier-profile fields allowed in phase 1. */
export class UpdateSupplierProfileBasicsCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    supplierId: string
    displayName?: string
    supplierNo?: string
    supplierCategory?: string
    tags?: string[]
  }

  constructor(payload: {
    tenantId: string
    supplierId: string
    displayName?: string
    supplierNo?: string
    supplierCategory?: string
    tags?: string[]
  }) {
    this.payload = payload
  }

  get tenantId(): string {
    return this.payload.tenantId
  }

  get supplierId(): string {
    return this.payload.supplierId
  }

  get displayName(): string | undefined {
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
