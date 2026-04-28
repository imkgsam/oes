import { Allow } from 'class-validator'
import { SupplierOfferingStatus } from '../../domain/models/srm-records'

/** UpsertSupplierOfferingCommand carries one create-or-update current supplyability fact for supplierId + itemId. */
export class UpsertSupplierOfferingCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    supplierOfferingId?: string
    supplierId: string
    itemId: string
    targetStatus: SupplierOfferingStatus
  }

  constructor(payload: {
    tenantId: string
    supplierOfferingId?: string
    supplierId: string
    itemId: string
    targetStatus: SupplierOfferingStatus
  }) {
    this.payload = payload
  }

  get tenantId(): string {
    return this.payload.tenantId
  }

  get supplierOfferingId(): string | undefined {
    return this.payload.supplierOfferingId
  }

  get supplierId(): string {
    return this.payload.supplierId
  }

  get itemId(): string {
    return this.payload.itemId
  }

  get targetStatus(): SupplierOfferingStatus {
    return this.payload.targetStatus
  }
}
