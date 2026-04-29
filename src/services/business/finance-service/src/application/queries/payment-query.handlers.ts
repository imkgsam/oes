import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { FINANCE_NOT_FOUND } from '../../common/errors/finance.errors'
import {
  PageResult,
  PayableScheduleRecord,
  PayableScheduleSearchInput,
  PaymentAllocationSearchInput,
  PaymentRequestRecord,
  PaymentExecutionRecord,
  cloneRecord,
  computePayableScheduleGovernanceSummary
} from '../../domain/models/finance-records'
import { FinanceRepository } from '../../domain/repositories/finance.repository'
import { assertRequiredString, normalizePageInput } from '../support/finance-assertions'
import {
  GetPayableScheduleQuery,
  SearchPayableSchedulesQuery,
  SearchPaymentAllocationsQuery,
  SearchPaymentExecutionsQuery,
  SearchPaymentRequestsQuery
} from './payment-query.queries'

/** hydratePayableSchedule refreshes dynamic governance visibility like DUE_NO_REQUEST before the query surface returns one schedule. */
function hydratePayableSchedule(record: PayableScheduleRecord): PayableScheduleRecord {
  const computed = cloneRecord(record)
  computed.lines = computed.lines.map((line) => ({
    ...line,
    requestGovernanceStatus: line.requestGovernanceStatus
  }))
  return computed
}

/** buildPayableScheduleSummary maps one payable schedule record into the frozen query summary shape. */
function buildPayableScheduleSummary(record: PayableScheduleRecord) {
  const nearestDueDate = record.lines
    .filter((line) => line.status !== 'CANCELLED')
    .map((line) => line.dueDate)
    .sort()[0]

  return {
    payableScheduleId: record.id,
    scheduleNo: record.scheduleNo,
    sourcePurchaseOrderId: record.sourcePurchaseOrderId,
    sourcePurchaseOrderNo: record.sourcePurchaseOrderNo ?? undefined,
    supplierTenantPartyId: record.supplierTenantPartyId,
    supplierDisplayName: record.supplierSnapshot,
    currencyCode: record.currencyCode,
    status: record.status,
    requestGovernanceStatusSummary: computePayableScheduleGovernanceSummary(record.lines),
    outstandingAmount: record.outstandingAmount,
    nearestDueDate: nearestDueDate ?? undefined
  }
}

/** GetPayableScheduleHandler returns one finance-owned payable schedule without promoting requests into truth ownership. */
@QueryHandler(GetPayableScheduleQuery)
export class GetPayableScheduleHandler implements IQueryHandler<GetPayableScheduleQuery> {
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(query: GetPayableScheduleQuery) {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.payableScheduleId, 'payableScheduleId')

    const schedule = await this.repository.findPayableScheduleById(
      query.tenantId,
      query.payableScheduleId
    )
    if (!schedule) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'payableSchedule'
      })
    }

    return hydratePayableSchedule(schedule)
  }
}

/** SearchPayableSchedulesHandler lists payable plan summaries with governance visibility derived from stored finance truth. */
@QueryHandler(SearchPayableSchedulesQuery)
export class SearchPayableSchedulesHandler
  implements IQueryHandler<SearchPayableSchedulesQuery>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(query: SearchPayableSchedulesQuery) {
    assertRequiredString(query.input.tenantId, 'tenantId')
    const { page, pageSize } = normalizePageInput(query.input.page, query.input.pageSize)
    const result = await this.repository.searchPayableSchedules({
      ...(query.input as PayableScheduleSearchInput),
      page,
      pageSize
    })

    return {
      payableSchedules: result.items.map((item) => buildPayableScheduleSummary(item)),
      total: result.total,
      page,
      pageSize
    }
  }
}

/** SearchPaymentRequestsHandler lists payment-request summaries without confusing governance objects for payable truth. */
@QueryHandler(SearchPaymentRequestsQuery)
export class SearchPaymentRequestsHandler
  implements IQueryHandler<SearchPaymentRequestsQuery>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(query: SearchPaymentRequestsQuery) {
    assertRequiredString(query.input.tenantId, 'tenantId')
    const { page, pageSize } = normalizePageInput(query.input.page, query.input.pageSize)
    const result: PageResult<PaymentRequestRecord> = await this.repository.searchPaymentRequests({
      ...query.input,
      page,
      pageSize
    })

    return {
      paymentRequests: result.items.map((item) => ({
        paymentRequestId: item.id,
        requestNo: item.requestNo,
        requestSource: item.requestSource,
        supplierTenantPartyId: item.supplierTenantPartyId,
        supplierDisplayName: item.supplierSnapshot,
        currencyCode: item.currencyCode,
        requestedAmount: item.requestedAmount,
        status: item.status,
        requestedAt: item.requestedAt
      })),
      total: result.total,
      page,
      pageSize
    }
  }
}

/** SearchPaymentExecutionsHandler lists payment execution summaries while keeping account-transaction truth separate. */
@QueryHandler(SearchPaymentExecutionsQuery)
export class SearchPaymentExecutionsHandler
  implements IQueryHandler<SearchPaymentExecutionsQuery>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(query: SearchPaymentExecutionsQuery) {
    assertRequiredString(query.input.tenantId, 'tenantId')
    const { page, pageSize } = normalizePageInput(query.input.page, query.input.pageSize)
    const result: PageResult<PaymentExecutionRecord> = await this.repository.searchPaymentExecutions({
      ...query.input,
      page,
      pageSize
    })

    return {
      paymentExecutions: result.items.map((item) => ({
        paymentExecutionId: item.id,
        paymentRequestId: item.paymentRequestId,
        supplierTenantPartyId: item.supplierTenantPartyId,
        executedAmount: item.executedAmount,
        currencyCode: item.currencyCode,
        status: item.status,
        executedAt: item.executedAt
      })),
      total: result.total,
      page,
      pageSize
    }
  }
}

/** SearchPaymentAllocationsHandler lists allocation rows that tie real account transactions to receivable or payable plan lines. */
@QueryHandler(SearchPaymentAllocationsQuery)
export class SearchPaymentAllocationsHandler
  implements IQueryHandler<SearchPaymentAllocationsQuery>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(query: SearchPaymentAllocationsQuery) {
    assertRequiredString(query.input.tenantId, 'tenantId')
    const { page, pageSize } = normalizePageInput(query.input.page, query.input.pageSize)
    const input: PaymentAllocationSearchInput = {
      ...query.input,
      targetScheduleId: query.input.targetScheduleId ?? query.input.receivableScheduleId,
      targetScheduleLineId:
        query.input.targetScheduleLineId ?? query.input.receivableScheduleLineId,
      page,
      pageSize
    }
    const result = await this.repository.searchPaymentAllocations(input)

    return {
      paymentAllocations: result.items.map((item) => cloneRecord(item)),
      total: result.total,
      page,
      pageSize
    }
  }
}
