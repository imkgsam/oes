export enum FinancialAccountType {
  BANK = 'BANK',
  CASH = 'CASH',
  WECHAT = 'WECHAT',
  ALIPAY = 'ALIPAY',
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE',
  OTHER_PSP = 'OTHER_PSP'
}

export enum FinancialAccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CLOSED = 'CLOSED'
}

export enum AccountTransactionDirection {
  INFLOW = 'INFLOW',
  OUTFLOW = 'OUTFLOW'
}

export enum AccountTransactionSourceType {
  MANUAL = 'MANUAL',
  CSV_IMPORT = 'CSV_IMPORT',
  FUTURE_API = 'FUTURE_API'
}

export enum AccountTransactionStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  VOIDED = 'VOIDED'
}

export enum AccountTransactionAllocationStatus {
  UNALLOCATED = 'UNALLOCATED',
  PARTIALLY_ALLOCATED = 'PARTIALLY_ALLOCATED',
  FULLY_ALLOCATED = 'FULLY_ALLOCATED'
}

export enum CustomerFinancialAccountVerifiedStatus {
  UNVERIFIED = 'UNVERIFIED',
  VERIFIED = 'VERIFIED'
}

export enum SupplierFinancialAccountVerifiedStatus {
  UNVERIFIED = 'UNVERIFIED',
  VERIFIED = 'VERIFIED'
}

export enum ReceivableScheduleStatus {
  OPEN = 'OPEN',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD'
}

export enum ReceivableScheduleLineStatus {
  OPEN = 'OPEN',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE'
}

export enum PayableScheduleStatus {
  OPEN = 'OPEN',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD'
}

export enum PayableScheduleLineStatus {
  OPEN = 'OPEN',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE'
}

export enum PayableScheduleLineType {
  DEPOSIT = 'DEPOSIT',
  BALANCE = 'BALANCE',
  INSTALLMENT = 'INSTALLMENT',
  TERM_DUE = 'TERM_DUE',
  ADJUSTMENT = 'ADJUSTMENT'
}

export enum PayableLineRequestGovernanceStatus {
  NONE = 'NONE',
  DUE_NO_REQUEST = 'DUE_NO_REQUEST',
  EARLY_REQUEST = 'EARLY_REQUEST',
  REQUEST_SUBMITTED = 'REQUEST_SUBMITTED',
  APPROVED_PENDING_EXECUTION = 'APPROVED_PENDING_EXECUTION',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID'
}

export enum PaymentRequestSource {
  PROCUREMENT_INITIATED = 'PROCUREMENT_INITIATED',
  FINANCE_INITIATED = 'FINANCE_INITIATED'
}

export enum PaymentRequestStatus {
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PARTIALLY_EXECUTED = 'PARTIALLY_EXECUTED',
  EXECUTED = 'EXECUTED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentRequestLineStatus {
  OPEN = 'OPEN',
  PARTIALLY_EXECUTED = 'PARTIALLY_EXECUTED',
  EXECUTED = 'EXECUTED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentRequestDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum PaymentExecutionStatus {
  RECORDED = 'RECORDED',
  MATCHED = 'MATCHED',
  VOIDED = 'VOIDED'
}

export enum PaymentAllocationTargetType {
  PAYABLE_SCHEDULE_LINE = 'PAYABLE_SCHEDULE_LINE',
  RECEIVABLE_SCHEDULE_LINE = 'RECEIVABLE_SCHEDULE_LINE'
}

export enum FinanceReleaseStatus {
  RELEASED = 'RELEASED',
  HELD = 'HELD',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED'
}

export type CustomerFinancialAccountProviderType =
  | 'BANK'
  | 'WECHAT'
  | 'ALIPAY'
  | 'PAYPAL'
  | 'STRIPE'
  | 'OTHER'

export type SupplierFinancialAccountProviderType = CustomerFinancialAccountProviderType

export interface FinanceOperatorContext {
  operatorId: string
  operatorType: string
  orgId?: string | null
}

export interface FinanceTraceContext {
  traceId: string
  requestId: string
}

export interface FinanceAuditContext {
  auditId: string
  reason: string
  source: string
}

export interface PageResult<TItem> {
  items: TItem[]
  total: number
  page: number
  pageSize: number
}

export interface FinancialAccountRecord {
  id: string
  accountNo: string
  tenantId: string
  orgId?: string | null
  accountType: FinancialAccountType
  accountName: string
  currencyCode: string
  institutionName?: string | null
  accountIdentifierMasked: string
  status: FinancialAccountStatus
  lastTransactionAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface FinancialAccountBalanceSnapshotRecord {
  id: string
  tenantId: string
  financialAccountId: string
  snapshotBalance: string
  snapshotAt: string
  createdAt: string
}

export interface AccountTransactionRecord {
  id: string
  tenantId: string
  orgId?: string | null
  financialAccountId: string
  importBatchId?: string | null
  direction: AccountTransactionDirection
  amount: string
  currencyCode: string
  transactionTime: string
  valueDate?: string | null
  sourceType: AccountTransactionSourceType
  status: AccountTransactionStatus
  externalReference?: string | null
  counterpartyName?: string | null
  counterpartyAccountSnapshot?: string | null
  memo?: string | null
  paymentExecutionId?: string | null
  allocationStatus: AccountTransactionAllocationStatus
  allocatedAmount: string
  unallocatedAmount: string
  fileAssetId?: string | null
  attachmentRef?: string | null
  createdAt: string
  updatedAt: string
}

export interface AccountTransactionImportBatchRecord {
  id: string
  tenantId: string
  financialAccountId: string
  sourceType: string
  sourceBatchReference?: string | null
  fileAssetId?: string | null
  attachmentRef?: string | null
  importedBy: string
  totalRows: number
  acceptedCount: number
  duplicateCount: number
  failedCount: number
  createdAt: string
}

export interface CustomerFinancialAccountRecord {
  id: string
  tenantId: string
  customerTenantPartyId: string
  accountHolderName: string
  accountProviderType: CustomerFinancialAccountProviderType
  accountIdentifierMasked: string
  currencyCode?: string | null
  isDefault: boolean
  verifiedStatus: CustomerFinancialAccountVerifiedStatus
  createdAt: string
  updatedAt: string
}

export interface SupplierFinancialAccountRecord {
  id: string
  tenantId: string
  supplierTenantPartyId: string
  accountHolderName: string
  accountProviderType: SupplierFinancialAccountProviderType
  accountIdentifierMasked: string
  currencyCode?: string | null
  isDefault: boolean
  verifiedStatus: SupplierFinancialAccountVerifiedStatus
  createdAt: string
  updatedAt: string
}

export interface ReceivableScheduleLineRecord {
  id: string
  tenantId: string
  receivableScheduleId: string
  lineNo: number
  dueDate: string
  scheduledAmount: string
  allocatedAmount: string
  outstandingAmount: string
  status: ReceivableScheduleLineStatus
  sourceSalesOrderLineId?: string | null
  memo?: string | null
  createdAt: string
  updatedAt: string
}

export interface ReceivableScheduleRecord {
  id: string
  scheduleNo: string
  tenantId: string
  orgId?: string | null
  sourceSalesOrderId: string
  customerTenantPartyId: string
  customerSnapshot: string
  currencyCode: string
  status: ReceivableScheduleStatus
  totalScheduledAmount: string
  totalAllocatedAmount: string
  outstandingAmount: string
  salesExchangeRateSnapshot?: string | null
  createdAt: string
  updatedAt: string
  lines: ReceivableScheduleLineRecord[]
}

export interface PayableScheduleLineRecord {
  id: string
  tenantId: string
  payableScheduleId: string
  lineNo: number
  lineType: PayableScheduleLineType
  sourceRef: string
  dueDate: string
  scheduledAmount: string
  requestedAmount: string
  executedAmount: string
  allocatedAmount: string
  outstandingAmount: string
  status: PayableScheduleLineStatus
  requestGovernanceStatus: PayableLineRequestGovernanceStatus
  sourcePurchaseOrderLineId?: string | null
  supersedesSourceRef?: string | null
  memo?: string | null
  createdAt: string
  updatedAt: string
}

export interface PayableScheduleRecord {
  id: string
  scheduleNo: string
  tenantId: string
  orgId?: string | null
  sourceType: 'PURCHASE_ORDER'
  sourcePurchaseOrderId: string
  sourcePurchaseOrderNo?: string | null
  procurementSnapshotReference?: string | null
  supplierTenantPartyId: string
  supplierSnapshot: string
  currencyCode: string
  status: PayableScheduleStatus
  totalScheduledAmount: string
  totalRequestedAmount: string
  totalExecutedAmount: string
  totalAllocatedAmount: string
  outstandingAmount: string
  createdAt: string
  updatedAt: string
  lines: PayableScheduleLineRecord[]
}

export interface SupplierBillEvidenceSnapshotRecord {
  id: string
  tenantId: string
  paymentRequestId: string
  evidenceType: 'SUPPLIER_BILL' | 'SUPPLIER_INVOICE' | 'SUPPLIER_STATEMENT' | 'OTHER'
  externalDocumentNo?: string | null
  documentDate?: string | null
  currencyCode?: string | null
  documentAmount?: string | null
  attachmentRef?: string | null
  note?: string | null
  capturedAt: string
}

export interface PaymentRequestLineRecord {
  id: string
  tenantId: string
  paymentRequestId: string
  payableScheduleId: string
  payableScheduleLineId: string
  scheduleDueDate: string
  requestedAmount: string
  executedAmount: string
  isEarlyRequest: boolean
  lineStatus: PaymentRequestLineStatus
  createdAt: string
  updatedAt: string
}

export interface PaymentRequestRecord {
  id: string
  requestNo: string
  tenantId: string
  orgId?: string | null
  requestSource: PaymentRequestSource
  sourcePurchaseOrderId?: string | null
  supplierTenantPartyId: string
  supplierSnapshot: string
  beneficiarySupplierFinancialAccountId: string
  currencyCode: string
  requestedAmount: string
  status: PaymentRequestStatus
  reason?: string | null
  requestedAt: string
  updatedAt: string
  lines: PaymentRequestLineRecord[]
  evidenceSnapshots: SupplierBillEvidenceSnapshotRecord[]
}

export interface PaymentExecutionRecord {
  id: string
  tenantId: string
  orgId?: string | null
  paymentRequestId: string
  supplierTenantPartyId: string
  sourceFinancialAccountId: string
  beneficiarySupplierFinancialAccountId?: string | null
  beneficiaryAccountSnapshot?: string | null
  executedAmount: string
  currencyCode: string
  executedAt: string
  executionReference?: string | null
  attachmentRefs: string[]
  linkedAccountTransactionId?: string | null
  status: PaymentExecutionStatus
  createdAt: string
  updatedAt: string
}

export interface PaymentAllocationRecord {
  id: string
  tenantId: string
  accountTransactionId: string
  paymentExecutionId?: string | null
  paymentRequestId?: string | null
  targetType: PaymentAllocationTargetType | 'RECEIVABLE_SCHEDULE_LINE' | 'PAYABLE_SCHEDULE_LINE'
  targetScheduleId: string
  targetScheduleLineId: string
  allocatedAmount: string
  currencyCode: string
  allocatedAt: string
  createdAt: string
}

export interface FinanceReleaseSignalRecord {
  id: string
  tenantId: string
  salesOrderId: string
  customerTenantPartyId: string
  signalStatus: FinanceReleaseStatus
  reasonCode?: string | null
  reasonSummary?: string | null
  effectiveAt: string
  expiresAt?: string | null
  basedOnSummary?: string | null
  updatedAt: string
}

export interface ExchangeRateRecord {
  id: string
  tenantId: string
  baseCurrencyCode: string
  quoteCurrencyCode: string
  rateValue: string
  effectiveAt: string
  setBy: string
  updatedAt: string
}

export interface FinancialAccountSearchInput {
  tenantId: string
  orgId?: string
  keyword?: string
  accountType?: FinancialAccountType
  currencyCode?: string
  status?: FinancialAccountStatus
  page?: number
  pageSize?: number
}

export interface AccountTransactionSearchInput {
  tenantId: string
  orgId?: string
  financialAccountId?: string
  direction?: AccountTransactionDirection
  sourceType?: AccountTransactionSourceType
  allocationStatus?: AccountTransactionAllocationStatus
  externalReference?: string
  occurredFrom?: string
  occurredTo?: string
  page?: number
  pageSize?: number
}

export interface ReceivableScheduleSearchInput {
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

export interface PayableScheduleSearchInput {
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

export interface PaymentRequestSearchInput {
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

export interface PaymentExecutionSearchInput {
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

export interface PaymentAllocationSearchInput {
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

/** cloneRecord deep-clones plain finance records so repositories do not leak mutable state between calls. */
export function cloneRecord<T>(value: T): T {
  return structuredClone(value)
}

/** paginate slices a fully filtered record list into the standard phase 1A page envelope. */
export function paginate<T>(items: T[], page: number, pageSize: number): { pageItems: T[]; total: number } {
  const start = (page - 1) * pageSize
  return {
    pageItems: items.slice(start, start + pageSize),
    total: items.length
  }
}

/** normalizeMoneyAmount canonicalizes one decimal amount string and keeps at least two fraction digits. */
export function normalizeMoneyAmount(value: string): string {
  return normalizeDecimal(value, 2)
}

/** normalizeRateValue canonicalizes one exchange-rate decimal string while preserving provided precision. */
export function normalizeRateValue(value: string): string {
  return normalizeDecimal(value, 6)
}

/** addMoneyAmount sums two decimal amount strings and keeps at least two fraction digits. */
export function addMoneyAmount(left: string, right: string): string {
  return formatDecimal(addDecimal(left, right), 2)
}

/** subtractMoneyAmount subtracts one decimal amount string from another and keeps at least two fraction digits. */
export function subtractMoneyAmount(left: string, right: string): string {
  return formatDecimal(subtractDecimal(left, right), 2)
}

/** compareMoneyAmount compares two decimal strings and returns -1, 0, or 1. */
export function compareMoneyAmount(left: string, right: string): number {
  const normalizedLeft = toComparableDecimal(left)
  const normalizedRight = toComparableDecimal(right)
  if (normalizedLeft < normalizedRight) {
    return -1
  }
  if (normalizedLeft > normalizedRight) {
    return 1
  }
  return 0
}

/** isZeroAmount reports whether one monetary amount is exactly zero after normalization. */
export function isZeroAmount(value: string): boolean {
  return compareMoneyAmount(value, '0') === 0
}

/** maskAccountIdentifier preserves the last four visible characters for account reference auditability. */
export function maskAccountIdentifier(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length <= 4) {
    return `****${trimmed}`
  }

  return `${'*'.repeat(Math.max(4, trimmed.length - 4))}${trimmed.slice(-4)}`
}

/** computeAllocationStatus derives the allocation status from allocated and original amount totals. */
export function computeAllocationStatus(
  amount: string,
  allocatedAmount: string
): AccountTransactionAllocationStatus {
  if (isZeroAmount(allocatedAmount)) {
    return AccountTransactionAllocationStatus.UNALLOCATED
  }

  if (compareMoneyAmount(allocatedAmount, amount) >= 0) {
    return AccountTransactionAllocationStatus.FULLY_ALLOCATED
  }

  return AccountTransactionAllocationStatus.PARTIALLY_ALLOCATED
}

/** computeReceivableLineStatus derives the schedule-line payment status from scheduled and allocated amounts. */
export function computeReceivableLineStatus(
  scheduledAmount: string,
  allocatedAmount: string
): ReceivableScheduleLineStatus {
  if (isZeroAmount(allocatedAmount)) {
    return ReceivableScheduleLineStatus.OPEN
  }

  if (compareMoneyAmount(allocatedAmount, scheduledAmount) >= 0) {
    return ReceivableScheduleLineStatus.PAID
  }

  return ReceivableScheduleLineStatus.PARTIALLY_PAID
}

/** computeReceivableScheduleStatus rolls up line statuses into the schedule header status used by phase 1A reads. */
export function computeReceivableScheduleStatus(
  totalScheduledAmount: string,
  totalAllocatedAmount: string
): ReceivableScheduleStatus {
  if (isZeroAmount(totalAllocatedAmount)) {
    return ReceivableScheduleStatus.OPEN
  }

  if (compareMoneyAmount(totalAllocatedAmount, totalScheduledAmount) >= 0) {
    return ReceivableScheduleStatus.PAID
  }

  return ReceivableScheduleStatus.PARTIALLY_PAID
}

/** computePayableLineStatus derives one payable line status from scheduled and allocated amounts plus due visibility. */
export function computePayableLineStatus(
  scheduledAmount: string,
  allocatedAmount: string,
  dueDate: string,
  now = new Date().toISOString()
): PayableScheduleLineStatus {
  if (compareMoneyAmount(allocatedAmount, scheduledAmount) >= 0) {
    return PayableScheduleLineStatus.PAID
  }

  if (!isZeroAmount(allocatedAmount)) {
    return PayableScheduleLineStatus.PARTIALLY_PAID
  }

  if (normalizeDateOnly(dueDate) < normalizeDateOnly(now)) {
    return PayableScheduleLineStatus.OVERDUE
  }

  return PayableScheduleLineStatus.OPEN
}

/** computePayableScheduleStatus rolls up payable header status from allocated progress only, keeping execution separate from account truth. */
export function computePayableScheduleStatus(
  totalScheduledAmount: string,
  totalAllocatedAmount: string
): PayableScheduleStatus {
  if (isZeroAmount(totalAllocatedAmount)) {
    return PayableScheduleStatus.OPEN
  }

  if (compareMoneyAmount(totalAllocatedAmount, totalScheduledAmount) >= 0) {
    return PayableScheduleStatus.PAID
  }

  return PayableScheduleStatus.PARTIALLY_PAID
}

/** computePayableLineGovernanceStatus derives one line's governance state from active request/execution progress and due visibility. */
export function computePayableLineGovernanceStatus(input: {
  storedStatus: PayableLineRequestGovernanceStatus
  dueDate: string
  requestedAmount: string
  executedAmount: string
  allocatedAmount: string
  lineStatus: PayableScheduleLineStatus
  now?: string
}): PayableLineRequestGovernanceStatus {
  if (
    input.lineStatus === PayableScheduleLineStatus.PAID ||
    compareMoneyAmount(input.allocatedAmount, '0.00') > 0 ||
    compareMoneyAmount(input.executedAmount, '0.00') > 0
  ) {
    const progressAmount =
      compareMoneyAmount(input.allocatedAmount, input.executedAmount) >= 0
        ? input.allocatedAmount
        : input.executedAmount

    return compareMoneyAmount(progressAmount, '0.00') > 0 &&
      input.lineStatus !== PayableScheduleLineStatus.PAID
      ? PayableLineRequestGovernanceStatus.PARTIALLY_PAID
      : PayableLineRequestGovernanceStatus.PAID
  }

  if (
    input.storedStatus === PayableLineRequestGovernanceStatus.EARLY_REQUEST ||
    input.storedStatus === PayableLineRequestGovernanceStatus.REQUEST_SUBMITTED ||
    input.storedStatus === PayableLineRequestGovernanceStatus.APPROVED_PENDING_EXECUTION
  ) {
    return input.storedStatus
  }

  if (
    compareMoneyAmount(input.requestedAmount, '0.00') <= 0 &&
    normalizeDateOnly(input.dueDate) < normalizeDateOnly(input.now ?? new Date().toISOString())
  ) {
    return PayableLineRequestGovernanceStatus.DUE_NO_REQUEST
  }

  return PayableLineRequestGovernanceStatus.NONE
}

/** computePayableScheduleGovernanceSummary chooses one schedule-level governance summary from its line-level states. */
export function computePayableScheduleGovernanceSummary(
  lines: PayableScheduleLineRecord[],
  now = new Date().toISOString()
): PayableLineRequestGovernanceStatus {
  const priorities: PayableLineRequestGovernanceStatus[] = [
    PayableLineRequestGovernanceStatus.DUE_NO_REQUEST,
    PayableLineRequestGovernanceStatus.EARLY_REQUEST,
    PayableLineRequestGovernanceStatus.APPROVED_PENDING_EXECUTION,
    PayableLineRequestGovernanceStatus.REQUEST_SUBMITTED,
    PayableLineRequestGovernanceStatus.PARTIALLY_PAID,
    PayableLineRequestGovernanceStatus.PAID,
    PayableLineRequestGovernanceStatus.NONE
  ]

  const computed = lines.map((line) =>
    computePayableLineGovernanceStatus({
      storedStatus: line.requestGovernanceStatus as PayableLineRequestGovernanceStatus,
      dueDate: line.dueDate,
      requestedAmount: line.requestedAmount,
      executedAmount: line.executedAmount,
      allocatedAmount: line.allocatedAmount,
      lineStatus: line.status,
      now
    })
  )

  for (const priority of priorities) {
    if (computed.includes(priority)) {
      return priority
    }
  }

  return PayableLineRequestGovernanceStatus.NONE
}

/** sumMoneyAmounts totals one collection of amount strings into a canonical monetary amount. */
export function sumMoneyAmounts(values: string[]): string {
  return values.reduce((total, value) => addMoneyAmount(total, value), '0.00')
}

/** normalizeDecimal validates one scalar decimal string and returns a canonical representation. */
function normalizeDecimal(value: string, minScale: number): string {
  const parsed = parseDecimal(value)
  return formatDecimal(parsed, minScale, parsed.scale)
}

interface ParsedDecimal {
  value: bigint
  scale: number
}

/** parseDecimal parses one decimal scalar into an integer-value plus scale pair for exact arithmetic. */
function parseDecimal(input: string): ParsedDecimal {
  const trimmed = input.trim()
  const match = trimmed.match(/^([+-]?)(\d+)(?:\.(\d+))?$/)

  if (!match) {
    throw new Error(`Invalid decimal value: ${input}`)
  }

  const sign = match[1] === '-' ? -1n : 1n
  const integerPart = match[2]
  const decimalPart = match[3] ?? ''
  const digits = `${integerPart}${decimalPart}`.replace(/^0+(?=\d)/, '') || '0'

  return {
    value: sign * BigInt(digits),
    scale: decimalPart.length
  }
}

/** addDecimal performs exact addition across differently scaled decimal operands. */
function addDecimal(left: string, right: string): ParsedDecimal {
  const leftParsed = parseDecimal(left)
  const rightParsed = parseDecimal(right)
  const scale = Math.max(leftParsed.scale, rightParsed.scale)

  return {
    value:
      alignDecimalValue(leftParsed, scale) +
      alignDecimalValue(rightParsed, scale),
    scale
  }
}

/** subtractDecimal performs exact subtraction across differently scaled decimal operands. */
function subtractDecimal(left: string, right: string): ParsedDecimal {
  const leftParsed = parseDecimal(left)
  const rightParsed = parseDecimal(right)
  const scale = Math.max(leftParsed.scale, rightParsed.scale)

  return {
    value:
      alignDecimalValue(leftParsed, scale) -
      alignDecimalValue(rightParsed, scale),
    scale
  }
}

/** toComparableDecimal converts one decimal string into a common-scale bigint comparable value. */
function toComparableDecimal(value: string): bigint {
  const parsed = parseDecimal(value)
  return alignDecimalValue(parsed, Math.max(parsed.scale, 6))
}

/** alignDecimalValue rescales one parsed decimal value to the requested common scale. */
function alignDecimalValue(parsed: ParsedDecimal, targetScale: number): bigint {
  return parsed.value * 10n ** BigInt(targetScale - parsed.scale)
}

/** formatDecimal renders one parsed decimal into a canonical string with a requested minimum fraction width. */
function formatDecimal(
  parsed: ParsedDecimal,
  minScale: number,
  preserveScale = parsed.scale
): string {
  const scale = Math.max(minScale, preserveScale)
  const adjustedValue =
    parsed.value * 10n ** BigInt(Math.max(0, scale - parsed.scale))
  const absolute = adjustedValue < 0 ? -adjustedValue : adjustedValue
  const digits = absolute.toString().padStart(scale + 1, '0')
  const split = digits.length - scale
  const integerPart = digits.slice(0, split)
  const fractionalPart = scale > 0 ? digits.slice(split) : ''
  const sign = adjustedValue < 0 ? '-' : ''

  if (scale === 0) {
    return `${sign}${integerPart}`
  }

  return `${sign}${integerPart}.${fractionalPart}`
}

/** normalizeDateOnly reduces one ISO-like date or datetime string into the contract's comparable YYYY-MM-DD form. */
function normalizeDateOnly(value: string): string {
  return value.slice(0, 10)
}
