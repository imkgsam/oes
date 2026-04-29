import { Allow } from 'class-validator'
import { FinanceReleaseStatus, ReceivableScheduleStatus } from '../../domain/models/finance-records'

export class GetReceivableScheduleQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly receivableScheduleId: string

  constructor(tenantId: string, receivableScheduleId: string) {
    this.tenantId = tenantId
    this.receivableScheduleId = receivableScheduleId
  }
}

export class SearchReceivableSchedulesQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    orgId?: string
    keyword?: string
    customerTenantPartyId?: string
    sourceSalesOrderId?: string
    status?: ReceivableScheduleStatus
    financeReleaseStatus?: FinanceReleaseStatus
    overdueOnly?: boolean
    dueFrom?: string
    dueTo?: string
    page?: number
    pageSize?: number
  }

  constructor(input: SearchReceivableSchedulesQuery['input']) {
    this.input = input
  }
}

export class GetFinanceReleaseSignalQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly salesOrderId: string

  constructor(tenantId: string, salesOrderId: string) {
    this.tenantId = tenantId
    this.salesOrderId = salesOrderId
  }
}
