import { Allow } from 'class-validator'
import {
  PaymentAllocationTargetType,
  PaymentExecutionStatus,
  PaymentRequestSource,
  PaymentRequestStatus,
  PayableLineRequestGovernanceStatus,
  PayableScheduleStatus
} from '../../domain/models/finance-records'

export class GetPayableScheduleQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly payableScheduleId: string

  constructor(
    tenantId: string,
    payableScheduleId: string
  ) {
    this.tenantId = tenantId
    this.payableScheduleId = payableScheduleId
  }
}

export class SearchPayableSchedulesQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    orgId?: string
    keyword?: string
    supplierTenantPartyId?: string
    sourcePurchaseOrderId?: string
    status?: PayableScheduleStatus
    requestGovernanceStatus?: PayableLineRequestGovernanceStatus
    overdueOnly?: boolean
    dueFrom?: string
    dueTo?: string
    page?: number
    pageSize?: number
  }

  constructor(input: SearchPayableSchedulesQuery['input']) {
    this.input = input
  }
}

export class SearchPaymentRequestsQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    orgId?: string
    requestSource?: PaymentRequestSource
    supplierTenantPartyId?: string
    sourcePurchaseOrderId?: string
    status?: PaymentRequestStatus
    beneficiarySupplierFinancialAccountId?: string
    requestedFrom?: string
    requestedTo?: string
    page?: number
    pageSize?: number
  }

  constructor(input: SearchPaymentRequestsQuery['input']) {
    this.input = input
  }
}

export class SearchPaymentExecutionsQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    orgId?: string
    paymentRequestId?: string
    supplierTenantPartyId?: string
    sourceFinancialAccountId?: string
    linkedAccountTransactionId?: string
    status?: PaymentExecutionStatus
    executedFrom?: string
    executedTo?: string
    page?: number
    pageSize?: number
  }

  constructor(input: SearchPaymentExecutionsQuery['input']) {
    this.input = input
  }
}

export class SearchPaymentAllocationsQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    accountTransactionId?: string
    paymentExecutionId?: string
    targetType?: PaymentAllocationTargetType
    targetScheduleId?: string
    targetScheduleLineId?: string
    receivableScheduleId?: string
    receivableScheduleLineId?: string
    allocatedFrom?: string
    allocatedTo?: string
    page?: number
    pageSize?: number
  }

  constructor(input: SearchPaymentAllocationsQuery['input']) {
    this.input = input
  }
}
