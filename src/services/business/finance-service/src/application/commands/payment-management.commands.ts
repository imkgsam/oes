import { Allow } from 'class-validator'
import {
  PaymentRequestDecision,
  PaymentRequestSource
} from '../../domain/models/finance-records'

export class CreatePayableScheduleFromPurchaseOrderCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    orgId?: string
    purchaseOrderId: string
    purchaseOrderNo?: string
    procurementSnapshotReference?: string
    supplierTenantPartyId: string
    supplierSnapshot: string
    currencyCode: string
    lines: Array<{
      lineType: 'DEPOSIT' | 'BALANCE' | 'INSTALLMENT' | 'TERM_DUE'
      sourceRef: string
      dueDate: string
      scheduledAmount: string
      sourcePurchaseOrderLineId?: string
      memo?: string
    }>
  }

  constructor(payload: CreatePayableScheduleFromPurchaseOrderCommand['payload']) {
    this.payload = payload
  }
}

export class ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    orgId?: string
    purchaseOrderId: string
    purchaseOrderChangeId: string
    procurementSnapshotReference?: string
    changeReason?: string
    adjustments: Array<{
      action: 'ADD' | 'CANCEL_UNEXECUTED' | 'SUPERSEDE_UNEXECUTED'
      targetSourceRef?: string
      newSourceRef?: string
      lineType?: 'DEPOSIT' | 'BALANCE' | 'INSTALLMENT' | 'TERM_DUE' | 'ADJUSTMENT'
      dueDate?: string
      scheduledAmount?: string
      sourcePurchaseOrderLineId?: string
      memo?: string
    }>
  }

  constructor(payload: ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeCommand['payload']) {
    this.payload = payload
  }
}

export class CreatePaymentRequestCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    orgId?: string
    requestSource: PaymentRequestSource | 'PROCUREMENT_INITIATED' | 'FINANCE_INITIATED'
    sourcePurchaseOrderId?: string
    supplierTenantPartyId: string
    beneficiarySupplierFinancialAccountId: string
    currencyCode: string
    requestedAmount: string
    requestedLines: Array<{
      payableScheduleId: string
      payableScheduleLineId: string
      requestedAmount: string
    }>
    evidenceSnapshots?: Array<{
      evidenceType: 'SUPPLIER_BILL' | 'SUPPLIER_INVOICE' | 'SUPPLIER_STATEMENT' | 'OTHER'
      externalDocumentNo?: string
      documentDate?: string
      currencyCode?: string
      documentAmount?: string
      attachmentRef?: string
      note?: string
    }>
    reason?: string
  }

  constructor(payload: CreatePaymentRequestCommand['payload']) {
    this.payload = payload
  }
}

export class DecidePaymentRequestCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    paymentRequestId: string
    decision: PaymentRequestDecision | 'APPROVED' | 'REJECTED'
    decisionReason?: string
  }

  constructor(payload: DecidePaymentRequestCommand['payload']) {
    this.payload = payload
  }
}

export class ExecutePaymentRequestCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    paymentRequestId: string
    sourceFinancialAccountId: string
    executedAmount: string
    currencyCode: string
    executedAt: string
    executionReference?: string
    attachmentRefs?: string[]
    linkedAccountTransactionId?: string
  }

  constructor(payload: ExecutePaymentRequestCommand['payload']) {
    this.payload = payload
  }
}

export class AllocatePaymentToPayableCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    accountTransactionId: string
    paymentExecutionId?: string
    allocations: Array<{
      payableScheduleId: string
      payableScheduleLineId: string
      allocatedAmount: string
    }>
  }

  constructor(payload: AllocatePaymentToPayableCommand['payload']) {
    this.payload = payload
  }
}

export class AllocatePaymentToReceivableCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    accountTransactionId: string
    allocations: Array<{
      receivableScheduleId: string
      receivableScheduleLineId: string
      allocatedAmount: string
    }>
  }

  constructor(payload: AllocatePaymentToReceivableCommand['payload']) {
    this.payload = payload
  }
}
