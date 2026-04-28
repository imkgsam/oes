import { SupplierStatus } from '../../domain/models/srm-records'
import { Allow } from 'class-validator'

/** ChangeSupplierStatusCommand carries the phase 1 SRM status transition payload. */
export class ChangeSupplierStatusCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    supplierId: string
    targetStatus: SupplierStatus
  }

  constructor(payload: { tenantId: string; supplierId: string; targetStatus: SupplierStatus }) {
    this.payload = payload
  }

  get tenantId(): string {
    return this.payload.tenantId
  }

  get supplierId(): string {
    return this.payload.supplierId
  }

  get targetStatus(): SupplierStatus {
    return this.payload.targetStatus
  }
}
