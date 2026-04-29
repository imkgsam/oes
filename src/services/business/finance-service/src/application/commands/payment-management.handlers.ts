import { randomUUID } from 'node:crypto'
import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import {
  FINANCE_ALREADY_EXISTS,
  FINANCE_INVALID_ARGUMENT,
  FINANCE_FAILED_PRECONDITION,
  FINANCE_NOT_FOUND
} from '../../common/errors/finance.errors'
import {
  AccountTransactionAllocationStatus,
  AccountTransactionDirection,
  PayableLineRequestGovernanceStatus,
  PayableScheduleLineRecord,
  PayableScheduleLineStatus,
  PayableScheduleLineType,
  PayableScheduleRecord,
  PayableScheduleStatus,
  PaymentAllocationRecord,
  PaymentAllocationTargetType,
  PaymentExecutionRecord,
  PaymentExecutionStatus,
  PaymentRequestDecision,
  PaymentRequestLineRecord,
  PaymentRequestLineStatus,
  PaymentRequestRecord,
  PaymentRequestSource,
  PaymentRequestStatus,
  addMoneyAmount,
  cloneRecord,
  compareMoneyAmount,
  computeAllocationStatus,
  computePayableLineGovernanceStatus,
  computePayableLineStatus,
  computePayableScheduleStatus,
  normalizeMoneyAmount,
  sumMoneyAmounts,
  subtractMoneyAmount
} from '../../domain/models/finance-records'
import { FinanceRepository } from '../../domain/repositories/finance.repository'
import {
  assertOptionalDateString,
  assertRequiredString
} from '../support/finance-assertions'
import {
  AllocatePaymentToPayableCommand,
  AllocatePaymentToReceivableCommand,
  ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeCommand,
  CreatePayableScheduleFromPurchaseOrderCommand,
  CreatePaymentRequestCommand,
  DecidePaymentRequestCommand,
  ExecutePaymentRequestCommand
} from './payment-management.commands'

/** recalculatePayableSchedule refreshes line and header totals while keeping execution separate from real allocation truth. */
function recalculatePayableSchedule(
  record: PayableScheduleRecord,
  now = new Date().toISOString()
): PayableScheduleRecord {
  const lines = record.lines.map((line) => {
    if (line.status === PayableScheduleLineStatus.CANCELLED) {
      return {
        ...line,
        requestedAmount: normalizeMoneyAmount(line.requestedAmount),
        executedAmount: normalizeMoneyAmount(line.executedAmount),
        allocatedAmount: normalizeMoneyAmount(line.allocatedAmount),
        outstandingAmount: '0.00',
        requestGovernanceStatus: PayableLineRequestGovernanceStatus.NONE
      }
    }

    const scheduledAmount = normalizeMoneyAmount(line.scheduledAmount)
    const requestedAmount = normalizeMoneyAmount(line.requestedAmount)
    const executedAmount = normalizeMoneyAmount(line.executedAmount)
    const allocatedAmount = normalizeMoneyAmount(line.allocatedAmount)
    const outstandingAmount =
      compareMoneyAmount(scheduledAmount, allocatedAmount) <= 0
        ? '0.00'
        : subtractMoneyAmount(scheduledAmount, allocatedAmount)
    const status = computePayableLineStatus(scheduledAmount, allocatedAmount, line.dueDate, now)
    const requestGovernanceStatus = computePayableLineGovernanceStatus({
      storedStatus: line.requestGovernanceStatus as PayableLineRequestGovernanceStatus,
      dueDate: line.dueDate,
      requestedAmount,
      executedAmount,
      allocatedAmount,
      lineStatus: status,
      now
    })

    return {
      ...line,
      scheduledAmount,
      requestedAmount,
      executedAmount,
      allocatedAmount,
      outstandingAmount,
      status,
      requestGovernanceStatus
    }
  })

  const activeLines = lines.filter((line) => line.status !== PayableScheduleLineStatus.CANCELLED)
  const totalScheduledAmount = sumMoneyAmounts(activeLines.map((line) => line.scheduledAmount))
  const totalRequestedAmount = sumMoneyAmounts(activeLines.map((line) => line.requestedAmount))
  const totalExecutedAmount = sumMoneyAmounts(activeLines.map((line) => line.executedAmount))
  const totalAllocatedAmount = sumMoneyAmounts(activeLines.map((line) => line.allocatedAmount))
  const outstandingAmount = sumMoneyAmounts(activeLines.map((line) => line.outstandingAmount))
  const status =
    activeLines.length === 0
      ? PayableScheduleStatus.CANCELLED
      : computePayableScheduleStatus(totalScheduledAmount, totalAllocatedAmount)

  return {
    ...record,
    status,
    totalScheduledAmount,
    totalRequestedAmount,
    totalExecutedAmount,
    totalAllocatedAmount,
    outstandingAmount,
    lines
  }
}

/** loadPayableScheduleOrThrow fetches one finance-owned payable schedule or raises the contract's NOT_FOUND semantics. */
async function loadPayableScheduleOrThrow(
  repository: FinanceRepository,
  tenantId: string,
  payableScheduleId: string
): Promise<PayableScheduleRecord> {
  const schedule = await repository.findPayableScheduleById(tenantId, payableScheduleId)
  if (!schedule) {
    throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
      resource: 'payableSchedule'
    })
  }

  return schedule
}

/** loadPaymentRequestOrThrow fetches one finance-owned payment request or raises the contract's NOT_FOUND semantics. */
async function loadPaymentRequestOrThrow(
  repository: FinanceRepository,
  tenantId: string,
  paymentRequestId: string
): Promise<PaymentRequestRecord> {
  const request = await repository.findPaymentRequestById(tenantId, paymentRequestId)
  if (!request) {
    throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
      resource: 'paymentRequest'
    })
  }

  return request
}

/** assertUnprotectedPayableLine rejects schedule-line rewrites when payment governance or settlement history already exists. */
function assertUnprotectedPayableLine(line: PayableScheduleLineRecord): void {
  if (
    compareMoneyAmount(line.requestedAmount, '0.00') > 0 ||
    compareMoneyAmount(line.executedAmount, '0.00') > 0 ||
    compareMoneyAmount(line.allocatedAmount, '0.00') > 0 ||
    line.status === PayableScheduleLineStatus.CANCELLED
  ) {
    throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
      reason: 'only unexecuted schedule lines can be cancelled or superseded'
    })
  }
}

/** toRequestedExecutionStatus maps one accumulated executed amount onto the frozen payment request lifecycle. */
function toRequestedExecutionStatus(
  requestedAmount: string,
  executedAmount: string
): PaymentRequestStatus {
  if (compareMoneyAmount(executedAmount, requestedAmount) >= 0) {
    return PaymentRequestStatus.EXECUTED
  }

  return compareMoneyAmount(executedAmount, '0.00') > 0
    ? PaymentRequestStatus.PARTIALLY_EXECUTED
    : PaymentRequestStatus.APPROVED
}

/** CreatePayableScheduleFromPurchaseOrderHandler builds one payable plan truth from one issued purchase order snapshot. */
@CommandHandler(CreatePayableScheduleFromPurchaseOrderCommand)
export class CreatePayableScheduleFromPurchaseOrderHandler
  implements ICommandHandler<CreatePayableScheduleFromPurchaseOrderCommand>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(command: CreatePayableScheduleFromPurchaseOrderCommand): Promise<PayableScheduleRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.purchaseOrderId, 'purchaseOrderId')
    assertRequiredString(command.payload.supplierTenantPartyId, 'supplierTenantPartyId')
    assertRequiredString(command.payload.supplierSnapshot, 'supplierSnapshot')
    assertRequiredString(command.payload.currencyCode, 'currencyCode')

    if ((command.payload.lines ?? []).length === 0) {
      throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
        reason: 'payable schedule requires at least one line'
      })
    }

    const existing = await this.repository.findActivePayableScheduleByPurchaseOrderId(
      command.payload.tenantId,
      command.payload.purchaseOrderId
    )
    if (existing) {
      throw ExceptionFactory.application(FINANCE_ALREADY_EXISTS, {
        resource: 'payableSchedule'
      })
    }

    const now = new Date().toISOString()
    const lines = command.payload.lines.map((line, index) => ({
      id: randomUUID(),
      tenantId: command.payload.tenantId,
      payableScheduleId: '',
      lineNo: index + 1,
      lineType: line.lineType as PayableScheduleLineType,
      sourceRef: line.sourceRef,
      dueDate: line.dueDate,
      scheduledAmount: normalizeMoneyAmount(line.scheduledAmount),
      requestedAmount: '0.00',
      executedAmount: '0.00',
      allocatedAmount: '0.00',
      outstandingAmount: normalizeMoneyAmount(line.scheduledAmount),
      status: computePayableLineStatus(line.scheduledAmount, '0.00', line.dueDate, now),
      requestGovernanceStatus: PayableLineRequestGovernanceStatus.NONE,
      sourcePurchaseOrderLineId: line.sourcePurchaseOrderLineId ?? null,
      supersedesSourceRef: null,
      memo: line.memo ?? null,
      createdAt: now,
      updatedAt: now
    }))

    const id = randomUUID()
    const scheduleNo = await this.repository.nextPayableScheduleNo(command.payload.tenantId)
    const record = recalculatePayableSchedule(
      {
        id,
        scheduleNo,
        tenantId: command.payload.tenantId,
        orgId: command.payload.orgId ?? null,
        sourceType: 'PURCHASE_ORDER',
        sourcePurchaseOrderId: command.payload.purchaseOrderId,
        sourcePurchaseOrderNo: command.payload.purchaseOrderNo ?? null,
        procurementSnapshotReference: command.payload.procurementSnapshotReference ?? null,
        supplierTenantPartyId: command.payload.supplierTenantPartyId,
        supplierSnapshot: command.payload.supplierSnapshot,
        currencyCode: command.payload.currencyCode,
        status: PayableScheduleStatus.OPEN,
        totalScheduledAmount: '0.00',
        totalRequestedAmount: '0.00',
        totalExecutedAmount: '0.00',
        totalAllocatedAmount: '0.00',
        outstandingAmount: '0.00',
        createdAt: now,
        updatedAt: now,
        lines: lines.map((line) => ({
          ...line,
          payableScheduleId: id
        }))
      },
      now
    )

    await this.repository.savePayableSchedule(record)
    return record
  }
}

/** ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeHandler mutates only future unexecuted payable lines while preserving paid history. */
@CommandHandler(ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeCommand)
export class ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeHandler
  implements ICommandHandler<ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeCommand>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(
    command: ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeCommand
  ): Promise<PayableScheduleRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.purchaseOrderId, 'purchaseOrderId')
    assertRequiredString(command.payload.purchaseOrderChangeId, 'purchaseOrderChangeId')

    const schedule = await this.repository.findActivePayableScheduleByPurchaseOrderId(
      command.payload.tenantId,
      command.payload.purchaseOrderId
    )
    if (!schedule) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'payableSchedule'
      })
    }

    const working = cloneRecord(schedule)
    const now = new Date().toISOString()
    let nextLineNo = Math.max(...working.lines.map((line) => line.lineNo), 0) + 1

    for (const adjustment of command.payload.adjustments) {
      if (adjustment.action === 'ADD') {
        assertRequiredString(adjustment.newSourceRef ?? '', 'adjustments.newSourceRef')
        assertRequiredString(adjustment.lineType ?? '', 'adjustments.lineType')
        assertRequiredString(adjustment.dueDate ?? '', 'adjustments.dueDate')
        assertRequiredString(adjustment.scheduledAmount ?? '', 'adjustments.scheduledAmount')

        working.lines.push({
          id: randomUUID(),
          tenantId: working.tenantId,
          payableScheduleId: working.id,
          lineNo: nextLineNo++,
          lineType: adjustment.lineType as PayableScheduleLineType,
          sourceRef: adjustment.newSourceRef!,
          dueDate: adjustment.dueDate!,
          scheduledAmount: normalizeMoneyAmount(adjustment.scheduledAmount!),
          requestedAmount: '0.00',
          executedAmount: '0.00',
          allocatedAmount: '0.00',
          outstandingAmount: normalizeMoneyAmount(adjustment.scheduledAmount!),
          status: computePayableLineStatus(adjustment.scheduledAmount!, '0.00', adjustment.dueDate!, now),
          requestGovernanceStatus: PayableLineRequestGovernanceStatus.NONE,
          sourcePurchaseOrderLineId: adjustment.sourcePurchaseOrderLineId ?? null,
          supersedesSourceRef: null,
          memo: adjustment.memo ?? null,
          createdAt: now,
          updatedAt: now
        })
        continue
      }

      const target = working.lines.find((line) => line.sourceRef === adjustment.targetSourceRef)
      if (!target) {
        throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
          resource: 'payableScheduleLine'
        })
      }

      assertUnprotectedPayableLine(target)

      target.status = PayableScheduleLineStatus.CANCELLED
      target.requestGovernanceStatus = PayableLineRequestGovernanceStatus.NONE
      target.outstandingAmount = '0.00'
      target.updatedAt = now

      if (adjustment.action === 'SUPERSEDE_UNEXECUTED') {
        assertRequiredString(adjustment.newSourceRef ?? '', 'adjustments.newSourceRef')
        assertRequiredString(adjustment.lineType ?? '', 'adjustments.lineType')
        assertRequiredString(adjustment.dueDate ?? '', 'adjustments.dueDate')
        assertRequiredString(adjustment.scheduledAmount ?? '', 'adjustments.scheduledAmount')

        working.lines.push({
          id: randomUUID(),
          tenantId: working.tenantId,
          payableScheduleId: working.id,
          lineNo: nextLineNo++,
          lineType: adjustment.lineType as PayableScheduleLineType,
          sourceRef: adjustment.newSourceRef!,
          dueDate: adjustment.dueDate!,
          scheduledAmount: normalizeMoneyAmount(adjustment.scheduledAmount!),
          requestedAmount: '0.00',
          executedAmount: '0.00',
          allocatedAmount: '0.00',
          outstandingAmount: normalizeMoneyAmount(adjustment.scheduledAmount!),
          status: computePayableLineStatus(adjustment.scheduledAmount!, '0.00', adjustment.dueDate!, now),
          requestGovernanceStatus: PayableLineRequestGovernanceStatus.NONE,
          sourcePurchaseOrderLineId: adjustment.sourcePurchaseOrderLineId ?? null,
          supersedesSourceRef: target.sourceRef,
          memo: adjustment.memo ?? null,
          createdAt: now,
          updatedAt: now
        })
      }
    }

    const updated = recalculatePayableSchedule(
      {
        ...working,
        procurementSnapshotReference: command.payload.procurementSnapshotReference ?? working.procurementSnapshotReference,
        updatedAt: now
      },
      now
    )

    await this.repository.savePayableSchedule(updated)
    return updated
  }
}

/** CreatePaymentRequestHandler creates one payment-governance object without replacing payable schedule truth. */
@CommandHandler(CreatePaymentRequestCommand)
export class CreatePaymentRequestHandler
  implements ICommandHandler<CreatePaymentRequestCommand>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(command: CreatePaymentRequestCommand): Promise<PaymentRequestRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.supplierTenantPartyId, 'supplierTenantPartyId')
    assertRequiredString(
      command.payload.beneficiarySupplierFinancialAccountId,
      'beneficiarySupplierFinancialAccountId'
    )
    assertRequiredString(command.payload.currencyCode, 'currencyCode')
    assertRequiredString(command.payload.requestedAmount, 'requestedAmount')

    const supplierAccount = await this.repository.findSupplierFinancialAccountById(
      command.payload.tenantId,
      command.payload.beneficiarySupplierFinancialAccountId
    )
    if (!supplierAccount) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'supplierFinancialAccount'
      })
    }

    if (
      command.payload.requestSource === PaymentRequestSource.PROCUREMENT_INITIATED &&
      !command.payload.sourcePurchaseOrderId
    ) {
      throw ExceptionFactory.application(FINANCE_INVALID_ARGUMENT, {
        field: 'sourcePurchaseOrderId'
      })
    }

    const normalizedRequestedAmount = normalizeMoneyAmount(command.payload.requestedAmount)
    const requestedLineAmount = sumMoneyAmounts(
      (command.payload.requestedLines ?? []).map((line) => normalizeMoneyAmount(line.requestedAmount))
    )
    if (compareMoneyAmount(normalizedRequestedAmount, requestedLineAmount) !== 0) {
      throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
        reason: 'requested amount must equal the sum of requested lines'
      })
    }

    const now = new Date().toISOString()
    const scheduleCache = new Map<string, PayableScheduleRecord>()
    const requestLines: PaymentRequestLineRecord[] = []
    let supplierSnapshot = ''
    let hasEarlyRequest = false

    for (const inputLine of command.payload.requestedLines) {
      const schedule =
        scheduleCache.get(inputLine.payableScheduleId) ??
        (await loadPayableScheduleOrThrow(
          this.repository,
          command.payload.tenantId,
          inputLine.payableScheduleId
        ))
      scheduleCache.set(schedule.id, cloneRecord(schedule))

      const targetLine = schedule.lines.find((line) => line.id === inputLine.payableScheduleLineId)
      if (!targetLine) {
        throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
          resource: 'payableScheduleLine'
        })
      }

      if (schedule.supplierTenantPartyId !== command.payload.supplierTenantPartyId) {
        throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
          reason: 'payment request supplier must match payable schedule supplier'
        })
      }
      if (schedule.currencyCode !== command.payload.currencyCode) {
        throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
          reason: 'payment request currency must match payable schedule currency'
        })
      }
      if (
        command.payload.requestSource === PaymentRequestSource.PROCUREMENT_INITIATED &&
        command.payload.sourcePurchaseOrderId !== schedule.sourcePurchaseOrderId
      ) {
        throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
          reason: 'procurement-initiated request must stay on the PO-backed normal path'
        })
      }

      const normalizedLineAmount = normalizeMoneyAmount(inputLine.requestedAmount)
      if (compareMoneyAmount(normalizedLineAmount, targetLine.outstandingAmount) > 0) {
        throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
          reason: 'payment request cannot exceed payable outstanding amount'
        })
      }

      const isEarlyRequest = targetLine.dueDate > now.slice(0, 10)
      if (isEarlyRequest) {
        hasEarlyRequest = true
      }
      if (
        command.payload.requestSource === PaymentRequestSource.FINANCE_INITIATED &&
        isEarlyRequest
      ) {
        throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
          reason: 'finance-initiated requests must come from due schedule lines'
        })
      }

      supplierSnapshot = schedule.supplierSnapshot
      requestLines.push({
        id: randomUUID(),
        tenantId: command.payload.tenantId,
        paymentRequestId: '',
        payableScheduleId: schedule.id,
        payableScheduleLineId: targetLine.id,
        scheduleDueDate: targetLine.dueDate,
        requestedAmount: normalizedLineAmount,
        executedAmount: '0.00',
        isEarlyRequest,
        lineStatus: PaymentRequestLineStatus.OPEN,
        createdAt: now,
        updatedAt: now
      })
    }

    if (hasEarlyRequest && !command.payload.reason?.trim()) {
      throw ExceptionFactory.application(FINANCE_INVALID_ARGUMENT, {
        field: 'reason'
      })
    }

    const id = randomUUID()
    for (const requestLine of requestLines) {
      requestLine.paymentRequestId = id
      const schedule = scheduleCache.get(requestLine.payableScheduleId)!
      const scheduleLine = schedule.lines.find((line) => line.id === requestLine.payableScheduleLineId)!
      scheduleLine.requestedAmount = addMoneyAmount(
        scheduleLine.requestedAmount,
        requestLine.requestedAmount
      )
      scheduleLine.requestGovernanceStatus = requestLine.isEarlyRequest
        ? PayableLineRequestGovernanceStatus.EARLY_REQUEST
        : PayableLineRequestGovernanceStatus.REQUEST_SUBMITTED
      scheduleLine.updatedAt = now
      schedule.updatedAt = now
      scheduleCache.set(schedule.id, recalculatePayableSchedule(schedule, now))
    }

    for (const schedule of scheduleCache.values()) {
      await this.repository.savePayableSchedule(schedule)
    }

    const requestNo = await this.repository.nextPaymentRequestNo(command.payload.tenantId)
    const record: PaymentRequestRecord = {
      id,
      requestNo,
      tenantId: command.payload.tenantId,
      orgId: command.payload.orgId ?? null,
      requestSource: command.payload.requestSource as PaymentRequestSource,
      sourcePurchaseOrderId: command.payload.sourcePurchaseOrderId ?? null,
      supplierTenantPartyId: command.payload.supplierTenantPartyId,
      supplierSnapshot,
      beneficiarySupplierFinancialAccountId: command.payload.beneficiarySupplierFinancialAccountId,
      currencyCode: command.payload.currencyCode,
      requestedAmount: normalizedRequestedAmount,
      status: PaymentRequestStatus.SUBMITTED,
      reason: command.payload.reason?.trim() || null,
      requestedAt: now,
      updatedAt: now,
      lines: requestLines,
      evidenceSnapshots: (command.payload.evidenceSnapshots ?? []).map((snapshot) => ({
        id: randomUUID(),
        tenantId: command.payload.tenantId,
        paymentRequestId: id,
        evidenceType: snapshot.evidenceType,
        externalDocumentNo: snapshot.externalDocumentNo ?? null,
        documentDate: snapshot.documentDate ?? null,
        currencyCode: snapshot.currencyCode ?? null,
        documentAmount: snapshot.documentAmount ? normalizeMoneyAmount(snapshot.documentAmount) : null,
        attachmentRef: snapshot.attachmentRef ?? null,
        note: snapshot.note ?? null,
        capturedAt: now
      }))
    }

    await this.repository.savePaymentRequest(record)
    return record
  }
}

/** DecidePaymentRequestHandler approves or rejects one payment request without conflating approval with actual payment. */
@CommandHandler(DecidePaymentRequestCommand)
export class DecidePaymentRequestHandler
  implements ICommandHandler<DecidePaymentRequestCommand>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(command: DecidePaymentRequestCommand): Promise<PaymentRequestRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.paymentRequestId, 'paymentRequestId')

    const request = await loadPaymentRequestOrThrow(
      this.repository,
      command.payload.tenantId,
      command.payload.paymentRequestId
    )
    if (request.status !== PaymentRequestStatus.SUBMITTED) {
      throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
        reason: 'only submitted payment requests can be decided'
      })
    }

    const now = new Date().toISOString()
    const updated = cloneRecord(request)
    const decision = command.payload.decision as PaymentRequestDecision
    updated.status =
      decision === PaymentRequestDecision.APPROVED
        ? PaymentRequestStatus.APPROVED
        : PaymentRequestStatus.REJECTED
    updated.updatedAt = now
    updated.lines = updated.lines.map((line) => ({
      ...line,
      lineStatus:
        decision === PaymentRequestDecision.REJECTED
          ? PaymentRequestLineStatus.CANCELLED
          : line.lineStatus,
      updatedAt: now
    }))

    const affectedSchedules = new Map<string, PayableScheduleRecord>()
    for (const line of updated.lines) {
      const schedule =
        affectedSchedules.get(line.payableScheduleId) ??
        (await loadPayableScheduleOrThrow(this.repository, updated.tenantId, line.payableScheduleId))
      const clonedSchedule = cloneRecord(schedule)
      const scheduleLine = clonedSchedule.lines.find((item) => item.id === line.payableScheduleLineId)!

      if (decision === PaymentRequestDecision.REJECTED) {
        scheduleLine.requestedAmount = subtractMoneyAmount(
          scheduleLine.requestedAmount,
          line.requestedAmount
        )
        scheduleLine.requestGovernanceStatus = PayableLineRequestGovernanceStatus.NONE
      } else {
        scheduleLine.requestGovernanceStatus =
          PayableLineRequestGovernanceStatus.APPROVED_PENDING_EXECUTION
      }
      scheduleLine.updatedAt = now
      clonedSchedule.updatedAt = now
      affectedSchedules.set(clonedSchedule.id, recalculatePayableSchedule(clonedSchedule, now))
    }

    for (const schedule of affectedSchedules.values()) {
      await this.repository.savePayableSchedule(schedule)
    }

    await this.repository.savePaymentRequest(updated)
    return updated
  }
}

/** ExecutePaymentRequestHandler records one finance payment action without auto-creating the underlying real fund transaction. */
@CommandHandler(ExecutePaymentRequestCommand)
export class ExecutePaymentRequestHandler
  implements ICommandHandler<ExecutePaymentRequestCommand>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(command: ExecutePaymentRequestCommand): Promise<{
    paymentRequest: PaymentRequestRecord
    paymentExecution: PaymentExecutionRecord
  }> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.paymentRequestId, 'paymentRequestId')
    assertRequiredString(command.payload.sourceFinancialAccountId, 'sourceFinancialAccountId')
    assertRequiredString(command.payload.executedAmount, 'executedAmount')
    assertRequiredString(command.payload.currencyCode, 'currencyCode')
    assertRequiredString(command.payload.executedAt, 'executedAt')
    assertOptionalDateString(command.payload.executedAt, 'executedAt')

    const request = await loadPaymentRequestOrThrow(
      this.repository,
      command.payload.tenantId,
      command.payload.paymentRequestId
    )
    if (
      request.status !== PaymentRequestStatus.APPROVED &&
      request.status !== PaymentRequestStatus.PARTIALLY_EXECUTED
    ) {
      throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
        reason: 'only approved payment requests can execute'
      })
    }

    const account = await this.repository.findFinancialAccountById(
      command.payload.tenantId,
      command.payload.sourceFinancialAccountId
    )
    if (!account) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'financialAccount'
      })
    }

    const normalizedExecutedAmount = normalizeMoneyAmount(command.payload.executedAmount)
    const alreadyExecuted = sumMoneyAmounts(request.lines.map((line) => line.executedAmount))
    const remaining = subtractMoneyAmount(request.requestedAmount, alreadyExecuted)
    if (compareMoneyAmount(normalizedExecutedAmount, remaining) > 0) {
      throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
        reason: 'payment execution cannot exceed remaining approved request amount'
      })
    }

    const now = new Date().toISOString()
    const updatedRequest = cloneRecord(request)
    const scheduleCache = new Map<string, PayableScheduleRecord>()
    let undistributedAmount = normalizedExecutedAmount

    const nextRequestLines: PaymentRequestLineRecord[] = []
    for (const line of updatedRequest.lines) {
      const lineRemaining = subtractMoneyAmount(line.requestedAmount, line.executedAmount)
      if (compareMoneyAmount(undistributedAmount, '0.00') <= 0 || compareMoneyAmount(lineRemaining, '0.00') <= 0) {
        nextRequestLines.push(line)
        continue
      }

      const appliedAmount =
        compareMoneyAmount(undistributedAmount, lineRemaining) >= 0
          ? lineRemaining
          : undistributedAmount
      undistributedAmount = subtractMoneyAmount(undistributedAmount, appliedAmount)

      const schedule =
        scheduleCache.get(line.payableScheduleId) ??
        cloneRecord(
          await loadPayableScheduleOrThrow(this.repository, updatedRequest.tenantId, line.payableScheduleId)
        )
      const scheduleLine = schedule.lines.find((item) => item.id === line.payableScheduleLineId)!
      scheduleLine.executedAmount = addMoneyAmount(scheduleLine.executedAmount, appliedAmount)
      scheduleLine.requestGovernanceStatus =
        compareMoneyAmount(scheduleLine.executedAmount, scheduleLine.scheduledAmount) >= 0
          ? PayableLineRequestGovernanceStatus.PAID
          : PayableLineRequestGovernanceStatus.PARTIALLY_PAID
      scheduleLine.updatedAt = now
      schedule.updatedAt = now
      scheduleCache.set(schedule.id, recalculatePayableSchedule(schedule, now))

      const nextExecutedAmount = addMoneyAmount(line.executedAmount, appliedAmount)
      nextRequestLines.push({
        ...line,
        executedAmount: nextExecutedAmount,
        lineStatus:
          compareMoneyAmount(nextExecutedAmount, line.requestedAmount) >= 0
            ? PaymentRequestLineStatus.EXECUTED
            : PaymentRequestLineStatus.PARTIALLY_EXECUTED,
        updatedAt: now
      })
    }
    updatedRequest.lines = nextRequestLines

    const totalExecuted = sumMoneyAmounts(updatedRequest.lines.map((line) => line.executedAmount))
    updatedRequest.status = toRequestedExecutionStatus(updatedRequest.requestedAmount, totalExecuted)
    updatedRequest.updatedAt = now

    for (const schedule of scheduleCache.values()) {
      await this.repository.savePayableSchedule(schedule)
    }

    const supplierAccount = await this.repository.findSupplierFinancialAccountById(
      updatedRequest.tenantId,
      updatedRequest.beneficiarySupplierFinancialAccountId
    )
    const paymentExecution: PaymentExecutionRecord = {
      id: randomUUID(),
      tenantId: updatedRequest.tenantId,
      orgId: updatedRequest.orgId ?? null,
      paymentRequestId: updatedRequest.id,
      supplierTenantPartyId: updatedRequest.supplierTenantPartyId,
      sourceFinancialAccountId: account.id,
      beneficiarySupplierFinancialAccountId: updatedRequest.beneficiarySupplierFinancialAccountId,
      beneficiaryAccountSnapshot: supplierAccount?.accountIdentifierMasked ?? null,
      executedAmount: normalizedExecutedAmount,
      currencyCode: command.payload.currencyCode,
      executedAt: command.payload.executedAt,
      executionReference: command.payload.executionReference ?? null,
      attachmentRefs: command.payload.attachmentRefs ?? [],
      linkedAccountTransactionId: command.payload.linkedAccountTransactionId ?? null,
      status: command.payload.linkedAccountTransactionId
        ? PaymentExecutionStatus.MATCHED
        : PaymentExecutionStatus.RECORDED,
      createdAt: now,
      updatedAt: now
    }

    await this.repository.savePaymentRequest(updatedRequest)
    await this.repository.savePaymentExecution(paymentExecution)

    return {
      paymentRequest: updatedRequest,
      paymentExecution
    }
  }
}

/** AllocatePaymentToPayableHandler settles one confirmed outflow against payable plan lines through real account-transaction truth. */
@CommandHandler(AllocatePaymentToPayableCommand)
export class AllocatePaymentToPayableHandler
  implements ICommandHandler<AllocatePaymentToPayableCommand>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(command: AllocatePaymentToPayableCommand): Promise<PaymentAllocationRecord[]> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.accountTransactionId, 'accountTransactionId')

    const transaction = await this.repository.findAccountTransactionById(
      command.payload.tenantId,
      command.payload.accountTransactionId
    )
    if (!transaction) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'accountTransaction'
      })
    }
    if (transaction.direction !== AccountTransactionDirection.OUTFLOW) {
      throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
        reason: 'only outflow account transactions can allocate to payable lines'
      })
    }

    let paymentExecution: PaymentExecutionRecord | null = null
    if (command.payload.paymentExecutionId) {
      paymentExecution = await this.repository.findPaymentExecutionById(
        command.payload.tenantId,
        command.payload.paymentExecutionId
      )
      if (!paymentExecution) {
        throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
          resource: 'paymentExecution'
        })
      }
    }

    const normalizedAmounts = command.payload.allocations.map((allocation) =>
      normalizeMoneyAmount(allocation.allocatedAmount)
    )
    const totalAllocation = sumMoneyAmounts(normalizedAmounts)
    if (compareMoneyAmount(totalAllocation, transaction.unallocatedAmount) > 0) {
      throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
        reason: 'payment allocation cannot exceed transaction unallocated amount'
      })
    }

    const now = new Date().toISOString()
    const allocations: PaymentAllocationRecord[] = []

    for (let index = 0; index < command.payload.allocations.length; index += 1) {
      const allocation = command.payload.allocations[index]
      const schedule = await loadPayableScheduleOrThrow(
        this.repository,
        command.payload.tenantId,
        allocation.payableScheduleId
      )
      const line = schedule.lines.find((item) => item.id === allocation.payableScheduleLineId)
      if (!line) {
        throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
          resource: 'payableScheduleLine'
        })
      }

      const normalizedAmount = normalizedAmounts[index]
      if (compareMoneyAmount(normalizedAmount, line.outstandingAmount) > 0) {
        throw ExceptionFactory.application(FINANCE_FAILED_PRECONDITION, {
            reason: 'allocation cannot exceed payable line outstanding amount'
          })
        }

      allocations.push({
        id: randomUUID(),
        tenantId: command.payload.tenantId,
        accountTransactionId: command.payload.accountTransactionId,
        paymentExecutionId: command.payload.paymentExecutionId ?? null,
        paymentRequestId: paymentExecution?.paymentRequestId ?? null,
        targetType: PaymentAllocationTargetType.PAYABLE_SCHEDULE_LINE,
        targetScheduleId: schedule.id,
        targetScheduleLineId: line.id,
        allocatedAmount: normalizedAmount,
        currencyCode: transaction.currencyCode,
        allocatedAt: now,
        createdAt: now
      })
    }

    for (const allocation of allocations) {
      await this.repository.allocateTransactionToPayable(allocation)
    }

    if (paymentExecution) {
      paymentExecution.linkedAccountTransactionId =
        paymentExecution.linkedAccountTransactionId ?? transaction.id
      paymentExecution.status = PaymentExecutionStatus.MATCHED
      paymentExecution.updatedAt = now
      await this.repository.savePaymentExecution(paymentExecution)
    }

    return allocations
  }
}

/** AllocatePaymentToReceivableHandler writes receivable allocations against confirmed inflow transactions while preserving residual unallocated cash. */
@CommandHandler(AllocatePaymentToReceivableCommand)
export class AllocatePaymentToReceivableHandler
  implements ICommandHandler<AllocatePaymentToReceivableCommand>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(command: AllocatePaymentToReceivableCommand) {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertRequiredString(command.payload.accountTransactionId, 'accountTransactionId')

    const transaction = await this.repository.findAccountTransactionById(
      command.payload.tenantId,
      command.payload.accountTransactionId
    )
    if (!transaction) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'accountTransaction'
      })
    }

    const createdAt = new Date().toISOString()
    const allocations = command.payload.allocations.map((allocation) => ({
      id: randomUUID(),
      tenantId: command.payload.tenantId,
      accountTransactionId: command.payload.accountTransactionId,
      paymentExecutionId: null,
      paymentRequestId: null,
      targetType: PaymentAllocationTargetType.RECEIVABLE_SCHEDULE_LINE,
      targetScheduleId: allocation.receivableScheduleId,
      targetScheduleLineId: allocation.receivableScheduleLineId,
      allocatedAmount: normalizeMoneyAmount(allocation.allocatedAmount),
      currencyCode: transaction.currencyCode,
      allocatedAt: createdAt,
      createdAt
    }))

    for (const allocation of allocations) {
      await this.repository.allocateTransactionToReceivable(allocation)
    }

    return allocations
  }
}
