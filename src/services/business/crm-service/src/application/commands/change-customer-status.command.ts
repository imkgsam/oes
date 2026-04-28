import { CustomerStatus } from '../../domain/models/crm-records'
import { Allow } from 'class-validator'

/** ChangeCustomerStatusCommand carries the phase 1 CRM status transition payload. */
export class ChangeCustomerStatusCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    customerAccountId: string
    targetStatus: CustomerStatus
  }

  constructor(payload: { tenantId: string; customerAccountId: string; targetStatus: CustomerStatus }) {
    this.payload = payload
  }

  get tenantId(): string {
    return this.payload.tenantId
  }

  get customerAccountId(): string {
    return this.payload.customerAccountId
  }

  get targetStatus(): CustomerStatus {
    return this.payload.targetStatus
  }
}
