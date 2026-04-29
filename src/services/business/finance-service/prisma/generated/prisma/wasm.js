
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.4.1
 * Query Engine version: a9055b89e58b4b5bfb59600785423b1db3d0e75d
 */
Prisma.prismaVersion = {
  client: "6.4.1",
  engine: "a9055b89e58b4b5bfb59600785423b1db3d0e75d"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.FinanceSequenceCounterScalarFieldEnum = {
  tenantId: 'tenantId',
  nextFinancialAccountNo: 'nextFinancialAccountNo',
  nextReceivableScheduleNo: 'nextReceivableScheduleNo',
  nextPayableScheduleNo: 'nextPayableScheduleNo',
  nextPaymentRequestNo: 'nextPaymentRequestNo',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FinancialAccountScalarFieldEnum = {
  id: 'id',
  accountNo: 'accountNo',
  tenantId: 'tenantId',
  orgId: 'orgId',
  accountType: 'accountType',
  accountName: 'accountName',
  currencyCode: 'currencyCode',
  institutionName: 'institutionName',
  accountIdentifierMasked: 'accountIdentifierMasked',
  status: 'status',
  lastTransactionAt: 'lastTransactionAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FinancialAccountBalanceSnapshotScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  financialAccountId: 'financialAccountId',
  snapshotBalance: 'snapshotBalance',
  snapshotAt: 'snapshotAt',
  createdAt: 'createdAt'
};

exports.Prisma.AccountTransactionImportBatchScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  financialAccountId: 'financialAccountId',
  sourceType: 'sourceType',
  sourceBatchReference: 'sourceBatchReference',
  fileAssetId: 'fileAssetId',
  attachmentRef: 'attachmentRef',
  importedBy: 'importedBy',
  totalRows: 'totalRows',
  acceptedCount: 'acceptedCount',
  duplicateCount: 'duplicateCount',
  failedCount: 'failedCount',
  createdAt: 'createdAt'
};

exports.Prisma.AccountTransactionScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  orgId: 'orgId',
  financialAccountId: 'financialAccountId',
  importBatchId: 'importBatchId',
  direction: 'direction',
  amount: 'amount',
  currencyCode: 'currencyCode',
  transactionTime: 'transactionTime',
  valueDate: 'valueDate',
  sourceType: 'sourceType',
  status: 'status',
  externalReference: 'externalReference',
  counterpartyName: 'counterpartyName',
  counterpartyAccountSnapshot: 'counterpartyAccountSnapshot',
  memo: 'memo',
  paymentExecutionId: 'paymentExecutionId',
  allocationStatus: 'allocationStatus',
  allocatedAmount: 'allocatedAmount',
  unallocatedAmount: 'unallocatedAmount',
  fileAssetId: 'fileAssetId',
  attachmentRef: 'attachmentRef',
  dedupeKey: 'dedupeKey',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CustomerFinancialAccountScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  customerTenantPartyId: 'customerTenantPartyId',
  accountHolderName: 'accountHolderName',
  accountProviderType: 'accountProviderType',
  accountIdentifierMasked: 'accountIdentifierMasked',
  currencyCode: 'currencyCode',
  isDefault: 'isDefault',
  verifiedStatus: 'verifiedStatus',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SupplierFinancialAccountScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  supplierTenantPartyId: 'supplierTenantPartyId',
  accountHolderName: 'accountHolderName',
  accountProviderType: 'accountProviderType',
  accountIdentifierMasked: 'accountIdentifierMasked',
  currencyCode: 'currencyCode',
  isDefault: 'isDefault',
  verifiedStatus: 'verifiedStatus',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReceivableScheduleScalarFieldEnum = {
  id: 'id',
  scheduleNo: 'scheduleNo',
  tenantId: 'tenantId',
  orgId: 'orgId',
  sourceSalesOrderId: 'sourceSalesOrderId',
  customerTenantPartyId: 'customerTenantPartyId',
  customerSnapshot: 'customerSnapshot',
  currencyCode: 'currencyCode',
  status: 'status',
  totalScheduledAmount: 'totalScheduledAmount',
  totalAllocatedAmount: 'totalAllocatedAmount',
  outstandingAmount: 'outstandingAmount',
  salesExchangeRateSnapshot: 'salesExchangeRateSnapshot',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayableScheduleScalarFieldEnum = {
  id: 'id',
  scheduleNo: 'scheduleNo',
  tenantId: 'tenantId',
  orgId: 'orgId',
  sourceType: 'sourceType',
  sourcePurchaseOrderId: 'sourcePurchaseOrderId',
  sourcePurchaseOrderNo: 'sourcePurchaseOrderNo',
  procurementSnapshotReference: 'procurementSnapshotReference',
  supplierTenantPartyId: 'supplierTenantPartyId',
  supplierSnapshot: 'supplierSnapshot',
  currencyCode: 'currencyCode',
  status: 'status',
  totalScheduledAmount: 'totalScheduledAmount',
  totalRequestedAmount: 'totalRequestedAmount',
  totalExecutedAmount: 'totalExecutedAmount',
  totalAllocatedAmount: 'totalAllocatedAmount',
  outstandingAmount: 'outstandingAmount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayableScheduleLineScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  payableScheduleId: 'payableScheduleId',
  lineNo: 'lineNo',
  lineType: 'lineType',
  sourceRef: 'sourceRef',
  dueDate: 'dueDate',
  scheduledAmount: 'scheduledAmount',
  requestedAmount: 'requestedAmount',
  executedAmount: 'executedAmount',
  allocatedAmount: 'allocatedAmount',
  outstandingAmount: 'outstandingAmount',
  status: 'status',
  requestGovernanceStatus: 'requestGovernanceStatus',
  sourcePurchaseOrderLineId: 'sourcePurchaseOrderLineId',
  supersedesSourceRef: 'supersedesSourceRef',
  memo: 'memo',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReceivableScheduleLineScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  receivableScheduleId: 'receivableScheduleId',
  lineNo: 'lineNo',
  dueDate: 'dueDate',
  scheduledAmount: 'scheduledAmount',
  allocatedAmount: 'allocatedAmount',
  outstandingAmount: 'outstandingAmount',
  status: 'status',
  sourceSalesOrderLineId: 'sourceSalesOrderLineId',
  memo: 'memo',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentAllocationScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  accountTransactionId: 'accountTransactionId',
  paymentExecutionId: 'paymentExecutionId',
  paymentRequestId: 'paymentRequestId',
  targetType: 'targetType',
  targetScheduleId: 'targetScheduleId',
  targetScheduleLineId: 'targetScheduleLineId',
  allocatedAmount: 'allocatedAmount',
  currencyCode: 'currencyCode',
  allocatedAt: 'allocatedAt',
  createdAt: 'createdAt'
};

exports.Prisma.PaymentRequestScalarFieldEnum = {
  id: 'id',
  requestNo: 'requestNo',
  tenantId: 'tenantId',
  orgId: 'orgId',
  requestSource: 'requestSource',
  sourcePurchaseOrderId: 'sourcePurchaseOrderId',
  supplierTenantPartyId: 'supplierTenantPartyId',
  supplierSnapshot: 'supplierSnapshot',
  beneficiarySupplierFinancialAccountId: 'beneficiarySupplierFinancialAccountId',
  currencyCode: 'currencyCode',
  requestedAmount: 'requestedAmount',
  status: 'status',
  reason: 'reason',
  requestedAt: 'requestedAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentRequestLineScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  paymentRequestId: 'paymentRequestId',
  payableScheduleId: 'payableScheduleId',
  payableScheduleLineId: 'payableScheduleLineId',
  scheduleDueDate: 'scheduleDueDate',
  requestedAmount: 'requestedAmount',
  executedAmount: 'executedAmount',
  isEarlyRequest: 'isEarlyRequest',
  lineStatus: 'lineStatus',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SupplierBillEvidenceSnapshotScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  paymentRequestId: 'paymentRequestId',
  evidenceType: 'evidenceType',
  externalDocumentNo: 'externalDocumentNo',
  documentDate: 'documentDate',
  currencyCode: 'currencyCode',
  documentAmount: 'documentAmount',
  attachmentRef: 'attachmentRef',
  note: 'note',
  capturedAt: 'capturedAt'
};

exports.Prisma.PaymentExecutionScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  orgId: 'orgId',
  paymentRequestId: 'paymentRequestId',
  supplierTenantPartyId: 'supplierTenantPartyId',
  sourceFinancialAccountId: 'sourceFinancialAccountId',
  beneficiarySupplierFinancialAccountId: 'beneficiarySupplierFinancialAccountId',
  beneficiaryAccountSnapshot: 'beneficiaryAccountSnapshot',
  executedAmount: 'executedAmount',
  currencyCode: 'currencyCode',
  executedAt: 'executedAt',
  executionReference: 'executionReference',
  attachmentRefs: 'attachmentRefs',
  linkedAccountTransactionId: 'linkedAccountTransactionId',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FinanceReleaseSignalScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  salesOrderId: 'salesOrderId',
  customerTenantPartyId: 'customerTenantPartyId',
  signalStatus: 'signalStatus',
  reasonCode: 'reasonCode',
  reasonSummary: 'reasonSummary',
  effectiveAt: 'effectiveAt',
  expiresAt: 'expiresAt',
  basedOnSummary: 'basedOnSummary',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExchangeRateScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  baseCurrencyCode: 'baseCurrencyCode',
  quoteCurrencyCode: 'quoteCurrencyCode',
  rateValue: 'rateValue',
  effectiveAt: 'effectiveAt',
  setBy: 'setBy',
  updatedAt: 'updatedAt'
};

exports.Prisma.FinanceAuditEnvelopeScalarFieldEnum = {
  id: 'id',
  service: 'service',
  module: 'module',
  eventType: 'eventType',
  occurredAt: 'occurredAt',
  result: 'result',
  operatorId: 'operatorId',
  operatorType: 'operatorType',
  tenantId: 'tenantId',
  orgId: 'orgId',
  traceId: 'traceId',
  resourceType: 'resourceType',
  resourceId: 'resourceId',
  details: 'details',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.FinancialAccountType = exports.$Enums.FinancialAccountType = {
  BANK: 'BANK',
  CASH: 'CASH',
  WECHAT: 'WECHAT',
  ALIPAY: 'ALIPAY',
  PAYPAL: 'PAYPAL',
  STRIPE: 'STRIPE',
  OTHER_PSP: 'OTHER_PSP'
};

exports.FinancialAccountStatus = exports.$Enums.FinancialAccountStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  CLOSED: 'CLOSED'
};

exports.AccountTransactionDirection = exports.$Enums.AccountTransactionDirection = {
  INFLOW: 'INFLOW',
  OUTFLOW: 'OUTFLOW'
};

exports.AccountTransactionSourceType = exports.$Enums.AccountTransactionSourceType = {
  MANUAL: 'MANUAL',
  CSV_IMPORT: 'CSV_IMPORT',
  FUTURE_API: 'FUTURE_API'
};

exports.AccountTransactionStatus = exports.$Enums.AccountTransactionStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  VOIDED: 'VOIDED'
};

exports.AccountTransactionAllocationStatus = exports.$Enums.AccountTransactionAllocationStatus = {
  UNALLOCATED: 'UNALLOCATED',
  PARTIALLY_ALLOCATED: 'PARTIALLY_ALLOCATED',
  FULLY_ALLOCATED: 'FULLY_ALLOCATED'
};

exports.CustomerFinancialAccountVerifiedStatus = exports.$Enums.CustomerFinancialAccountVerifiedStatus = {
  UNVERIFIED: 'UNVERIFIED',
  VERIFIED: 'VERIFIED'
};

exports.ReceivableScheduleStatus = exports.$Enums.ReceivableScheduleStatus = {
  OPEN: 'OPEN',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD'
};

exports.ReceivableScheduleLineStatus = exports.$Enums.ReceivableScheduleLineStatus = {
  OPEN: 'OPEN',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  OVERDUE: 'OVERDUE'
};

exports.FinanceReleaseSignalStatus = exports.$Enums.FinanceReleaseSignalStatus = {
  RELEASED: 'RELEASED',
  HELD: 'HELD',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED'
};

exports.Prisma.ModelName = {
  FinanceSequenceCounter: 'FinanceSequenceCounter',
  FinancialAccount: 'FinancialAccount',
  FinancialAccountBalanceSnapshot: 'FinancialAccountBalanceSnapshot',
  AccountTransactionImportBatch: 'AccountTransactionImportBatch',
  AccountTransaction: 'AccountTransaction',
  CustomerFinancialAccount: 'CustomerFinancialAccount',
  SupplierFinancialAccount: 'SupplierFinancialAccount',
  ReceivableSchedule: 'ReceivableSchedule',
  PayableSchedule: 'PayableSchedule',
  PayableScheduleLine: 'PayableScheduleLine',
  ReceivableScheduleLine: 'ReceivableScheduleLine',
  PaymentAllocation: 'PaymentAllocation',
  PaymentRequest: 'PaymentRequest',
  PaymentRequestLine: 'PaymentRequestLine',
  SupplierBillEvidenceSnapshot: 'SupplierBillEvidenceSnapshot',
  PaymentExecution: 'PaymentExecution',
  FinanceReleaseSignal: 'FinanceReleaseSignal',
  ExchangeRate: 'ExchangeRate',
  FinanceAuditEnvelope: 'FinanceAuditEnvelope'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
