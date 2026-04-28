import { Allow } from 'class-validator'

/** UpsertSupplierItemMappingCommand captures the phase 1 supplier identifier mapping replacement intent. */
export class UpsertSupplierItemMappingCommand {
  @Allow()
  public readonly input: {
    tenantId: string
    supplierId: string
    supplierItemCode?: string
    supplierItemName?: string
    itemId: string
  }

  constructor(input: {
    tenantId: string
    supplierId: string
    supplierItemCode?: string
    supplierItemName?: string
    itemId: string
  }) {
    this.input = input
  }

  get tenantId(): string {
    return this.input.tenantId
  }
  get supplierId(): string {
    return this.input.supplierId
  }
  get supplierItemCode(): string | undefined {
    return this.input.supplierItemCode
  }
  get supplierItemName(): string | undefined {
    return this.input.supplierItemName
  }
  get itemId(): string {
    return this.input.itemId
  }
}
