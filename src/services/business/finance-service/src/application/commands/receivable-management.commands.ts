import { Allow } from 'class-validator'
import { FinanceReleaseStatus } from '../../domain/models/finance-records'

export class CreateReceivableScheduleFromSalesOrderCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    orgId?: string
    salesOrderId: string
    customerTenantPartyId: string
    customerSnapshot: string
    currencyCode: string
    salesExchangeRateSnapshot?: string
    lines: Array<{
      dueDate: string
      scheduledAmount: string
      sourceSalesOrderLineId?: string
      memo?: string
    }>
  }

  constructor(payload: CreateReceivableScheduleFromSalesOrderCommand['payload']) {
    this.payload = payload
  }
}

export class SetFinanceReleaseSignalCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    salesOrderId: string
    customerTenantPartyId: string
    signalStatus: FinanceReleaseStatus
    reasonCode?: string
    reasonSummary?: string
    effectiveAt: string
    expiresAt?: string
    basedOnSummary?: string
  }

  constructor(payload: SetFinanceReleaseSignalCommand['payload']) {
    this.payload = payload
  }
}
