
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime,
  createParam,
} = require('./runtime/library.js')


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

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

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




  const path = require('path')

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
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "/Users/acehood/Documents/GitHub/oes/src/services/business/finance-service/prisma/generated/prisma",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "darwin-arm64",
        "native": true
      }
    ],
    "previewFeatures": [],
    "sourceFilePath": "/Users/acehood/Documents/GitHub/oes/src/services/business/finance-service/prisma/schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../../.env"
  },
  "relativePath": "../..",
  "clientVersion": "6.4.1",
  "engineVersion": "a9055b89e58b4b5bfb59600785423b1db3d0e75d",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "postgresql",
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "generator client {\n  provider = \"prisma-client-js\"\n  output   = \"../prisma/generated/prisma\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")\n}\n\nenum FinancialAccountType {\n  BANK\n  CASH\n  WECHAT\n  ALIPAY\n  PAYPAL\n  STRIPE\n  OTHER_PSP\n}\n\nenum FinancialAccountStatus {\n  ACTIVE\n  INACTIVE\n  CLOSED\n}\n\nenum AccountTransactionDirection {\n  INFLOW\n  OUTFLOW\n}\n\nenum AccountTransactionSourceType {\n  MANUAL\n  CSV_IMPORT\n  FUTURE_API\n}\n\nenum AccountTransactionStatus {\n  DRAFT\n  CONFIRMED\n  VOIDED\n}\n\nenum AccountTransactionAllocationStatus {\n  UNALLOCATED\n  PARTIALLY_ALLOCATED\n  FULLY_ALLOCATED\n}\n\nenum CustomerFinancialAccountVerifiedStatus {\n  UNVERIFIED\n  VERIFIED\n}\n\nenum ReceivableScheduleStatus {\n  OPEN\n  PARTIALLY_PAID\n  PAID\n  CANCELLED\n  ON_HOLD\n}\n\nenum ReceivableScheduleLineStatus {\n  OPEN\n  PARTIALLY_PAID\n  PAID\n  CANCELLED\n  OVERDUE\n}\n\nenum FinanceReleaseSignalStatus {\n  RELEASED\n  HELD\n  REVIEW_REQUIRED\n}\n\nmodel FinanceSequenceCounter {\n  tenantId                 String   @id @db.VarChar(128)\n  nextFinancialAccountNo   Int      @default(1)\n  nextReceivableScheduleNo Int      @default(1)\n  nextPayableScheduleNo    Int      @default(1)\n  nextPaymentRequestNo     Int      @default(1)\n  createdAt                DateTime @default(now())\n  updatedAt                DateTime @updatedAt\n}\n\nmodel FinancialAccount {\n  id                      String                            @id @db.Uuid\n  accountNo               String                            @db.VarChar(64)\n  tenantId                String                            @db.VarChar(128)\n  orgId                   String?                           @db.VarChar(128)\n  accountType             FinancialAccountType\n  accountName             String                            @db.VarChar(255)\n  currencyCode            String                            @db.VarChar(16)\n  institutionName         String?                           @db.VarChar(255)\n  accountIdentifierMasked String                            @db.VarChar(255)\n  status                  FinancialAccountStatus\n  lastTransactionAt       DateTime?\n  createdAt               DateTime                          @default(now())\n  updatedAt               DateTime                          @updatedAt\n  balanceSnapshots        FinancialAccountBalanceSnapshot[]\n  transactions            AccountTransaction[]\n  importBatches           AccountTransactionImportBatch[]\n\n  @@unique([tenantId, accountNo])\n  @@index([tenantId, accountNo])\n  @@index([tenantId, status, accountType])\n}\n\nmodel FinancialAccountBalanceSnapshot {\n  id                 String   @id @db.Uuid\n  tenantId           String   @db.VarChar(128)\n  financialAccountId String   @db.Uuid\n  snapshotBalance    Decimal  @db.Decimal(18, 6)\n  snapshotAt         DateTime\n  createdAt          DateTime @default(now())\n\n  financialAccount FinancialAccount @relation(fields: [financialAccountId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId, financialAccountId, snapshotAt])\n}\n\nmodel AccountTransactionImportBatch {\n  id                   String               @id @db.Uuid\n  tenantId             String               @db.VarChar(128)\n  financialAccountId   String               @db.Uuid\n  sourceType           String               @db.VarChar(64)\n  sourceBatchReference String?              @db.VarChar(255)\n  fileAssetId          String?              @db.VarChar(128)\n  attachmentRef        String?              @db.VarChar(255)\n  importedBy           String               @db.VarChar(128)\n  totalRows            Int\n  acceptedCount        Int\n  duplicateCount       Int\n  failedCount          Int\n  createdAt            DateTime             @default(now())\n  transactions         AccountTransaction[]\n\n  financialAccount FinancialAccount @relation(fields: [financialAccountId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId, financialAccountId, createdAt])\n}\n\nmodel AccountTransaction {\n  id                          String                             @id @db.Uuid\n  tenantId                    String                             @db.VarChar(128)\n  orgId                       String?                            @db.VarChar(128)\n  financialAccountId          String                             @db.Uuid\n  importBatchId               String?                            @db.Uuid\n  direction                   AccountTransactionDirection\n  amount                      Decimal                            @db.Decimal(18, 6)\n  currencyCode                String                             @db.VarChar(16)\n  transactionTime             DateTime\n  valueDate                   String?                            @db.VarChar(32)\n  sourceType                  AccountTransactionSourceType\n  status                      AccountTransactionStatus\n  externalReference           String?                            @db.VarChar(255)\n  counterpartyName            String?                            @db.VarChar(255)\n  counterpartyAccountSnapshot String?                            @db.VarChar(255)\n  memo                        String?                            @db.VarChar(1000)\n  paymentExecutionId          String?                            @db.VarChar(128)\n  allocationStatus            AccountTransactionAllocationStatus\n  allocatedAmount             Decimal                            @db.Decimal(18, 6)\n  unallocatedAmount           Decimal                            @db.Decimal(18, 6)\n  fileAssetId                 String?                            @db.VarChar(128)\n  attachmentRef               String?                            @db.VarChar(255)\n  dedupeKey                   String                             @db.VarChar(512)\n  createdAt                   DateTime                           @default(now())\n  updatedAt                   DateTime                           @updatedAt\n  allocations                 PaymentAllocation[]\n\n  financialAccount FinancialAccount               @relation(fields: [financialAccountId], references: [id], onDelete: Cascade)\n  importBatch      AccountTransactionImportBatch? @relation(fields: [importBatchId], references: [id], onDelete: SetNull)\n\n  @@unique([tenantId, financialAccountId, dedupeKey])\n  @@index([tenantId, financialAccountId, transactionTime])\n  @@index([tenantId, externalReference])\n}\n\nmodel CustomerFinancialAccount {\n  id                      String                                 @id @db.Uuid\n  tenantId                String                                 @db.VarChar(128)\n  customerTenantPartyId   String                                 @db.VarChar(128)\n  accountHolderName       String                                 @db.VarChar(255)\n  accountProviderType     String                                 @db.VarChar(64)\n  accountIdentifierMasked String                                 @db.VarChar(255)\n  currencyCode            String?                                @db.VarChar(16)\n  isDefault               Boolean\n  verifiedStatus          CustomerFinancialAccountVerifiedStatus\n  createdAt               DateTime                               @default(now())\n  updatedAt               DateTime                               @updatedAt\n\n  @@index([tenantId, customerTenantPartyId, isDefault])\n}\n\nmodel SupplierFinancialAccount {\n  id                      String   @id @db.Uuid\n  tenantId                String   @db.VarChar(128)\n  supplierTenantPartyId   String   @db.VarChar(128)\n  accountHolderName       String   @db.VarChar(255)\n  accountProviderType     String   @db.VarChar(64)\n  accountIdentifierMasked String   @db.VarChar(255)\n  currencyCode            String?  @db.VarChar(16)\n  isDefault               Boolean\n  verifiedStatus          String   @db.VarChar(64)\n  createdAt               DateTime @default(now())\n  updatedAt               DateTime @updatedAt\n\n  @@index([tenantId, supplierTenantPartyId, isDefault])\n}\n\nmodel ReceivableSchedule {\n  id                        String                   @id @db.Uuid\n  scheduleNo                String                   @db.VarChar(64)\n  tenantId                  String                   @db.VarChar(128)\n  orgId                     String?                  @db.VarChar(128)\n  sourceSalesOrderId        String                   @db.VarChar(128)\n  customerTenantPartyId     String                   @db.VarChar(128)\n  customerSnapshot          String                   @db.VarChar(255)\n  currencyCode              String                   @db.VarChar(16)\n  status                    ReceivableScheduleStatus\n  totalScheduledAmount      Decimal                  @db.Decimal(18, 6)\n  totalAllocatedAmount      Decimal                  @db.Decimal(18, 6)\n  outstandingAmount         Decimal                  @db.Decimal(18, 6)\n  salesExchangeRateSnapshot String?                  @db.VarChar(255)\n  createdAt                 DateTime                 @default(now())\n  updatedAt                 DateTime                 @updatedAt\n  lines                     ReceivableScheduleLine[]\n\n  @@unique([tenantId, scheduleNo])\n  @@index([tenantId, sourceSalesOrderId, status])\n  @@index([tenantId, customerTenantPartyId, scheduleNo])\n}\n\nmodel PayableSchedule {\n  id                           String                @id @db.Uuid\n  scheduleNo                   String                @db.VarChar(64)\n  tenantId                     String                @db.VarChar(128)\n  orgId                        String?               @db.VarChar(128)\n  sourceType                   String                @db.VarChar(64)\n  sourcePurchaseOrderId        String                @db.VarChar(128)\n  sourcePurchaseOrderNo        String?               @db.VarChar(128)\n  procurementSnapshotReference String?               @db.VarChar(255)\n  supplierTenantPartyId        String                @db.VarChar(128)\n  supplierSnapshot             String                @db.VarChar(255)\n  currencyCode                 String                @db.VarChar(16)\n  status                       String                @db.VarChar(64)\n  totalScheduledAmount         Decimal               @db.Decimal(18, 6)\n  totalRequestedAmount         Decimal               @db.Decimal(18, 6)\n  totalExecutedAmount          Decimal               @db.Decimal(18, 6)\n  totalAllocatedAmount         Decimal               @db.Decimal(18, 6)\n  outstandingAmount            Decimal               @db.Decimal(18, 6)\n  createdAt                    DateTime              @default(now())\n  updatedAt                    DateTime              @updatedAt\n  lines                        PayableScheduleLine[]\n\n  @@unique([tenantId, scheduleNo])\n  @@index([tenantId, sourcePurchaseOrderId, status])\n  @@index([tenantId, supplierTenantPartyId, scheduleNo])\n}\n\nmodel PayableScheduleLine {\n  id                        String   @id @db.Uuid\n  tenantId                  String   @db.VarChar(128)\n  payableScheduleId         String   @db.Uuid\n  lineNo                    Int\n  lineType                  String   @db.VarChar(64)\n  sourceRef                 String   @db.VarChar(255)\n  dueDate                   String   @db.VarChar(32)\n  scheduledAmount           Decimal  @db.Decimal(18, 6)\n  requestedAmount           Decimal  @db.Decimal(18, 6)\n  executedAmount            Decimal  @db.Decimal(18, 6)\n  allocatedAmount           Decimal  @db.Decimal(18, 6)\n  outstandingAmount         Decimal  @db.Decimal(18, 6)\n  status                    String   @db.VarChar(64)\n  requestGovernanceStatus   String   @db.VarChar(64)\n  sourcePurchaseOrderLineId String?  @db.VarChar(128)\n  supersedesSourceRef       String?  @db.VarChar(255)\n  memo                      String?  @db.VarChar(1000)\n  createdAt                 DateTime @default(now())\n  updatedAt                 DateTime @updatedAt\n\n  payableSchedule PayableSchedule @relation(fields: [payableScheduleId], references: [id], onDelete: Cascade)\n\n  @@unique([payableScheduleId, lineNo])\n  @@index([tenantId, payableScheduleId, dueDate])\n  @@index([tenantId, sourceRef])\n}\n\nmodel ReceivableScheduleLine {\n  id                     String                       @id @db.Uuid\n  tenantId               String                       @db.VarChar(128)\n  receivableScheduleId   String                       @db.Uuid\n  lineNo                 Int\n  dueDate                String                       @db.VarChar(32)\n  scheduledAmount        Decimal                      @db.Decimal(18, 6)\n  allocatedAmount        Decimal                      @db.Decimal(18, 6)\n  outstandingAmount      Decimal                      @db.Decimal(18, 6)\n  status                 ReceivableScheduleLineStatus\n  sourceSalesOrderLineId String?                      @db.VarChar(128)\n  memo                   String?                      @db.VarChar(1000)\n  createdAt              DateTime                     @default(now())\n  updatedAt              DateTime                     @updatedAt\n\n  receivableSchedule ReceivableSchedule @relation(fields: [receivableScheduleId], references: [id], onDelete: Cascade)\n\n  @@unique([receivableScheduleId, lineNo])\n  @@index([tenantId, receivableScheduleId, dueDate])\n}\n\nmodel PaymentAllocation {\n  id                   String   @id @db.Uuid\n  tenantId             String   @db.VarChar(128)\n  accountTransactionId String   @db.Uuid\n  paymentExecutionId   String?  @db.VarChar(128)\n  paymentRequestId     String?  @db.VarChar(128)\n  targetType           String   @db.VarChar(64)\n  targetScheduleId     String   @db.Uuid\n  targetScheduleLineId String   @db.Uuid\n  allocatedAmount      Decimal  @db.Decimal(18, 6)\n  currencyCode         String   @db.VarChar(16)\n  allocatedAt          DateTime\n  createdAt            DateTime @default(now())\n\n  accountTransaction AccountTransaction @relation(fields: [accountTransactionId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId, accountTransactionId, allocatedAt])\n  @@index([tenantId, paymentExecutionId, allocatedAt])\n  @@index([tenantId, targetScheduleId, targetScheduleLineId])\n}\n\nmodel PaymentRequest {\n  id                                    String                         @id @db.Uuid\n  requestNo                             String                         @db.VarChar(64)\n  tenantId                              String                         @db.VarChar(128)\n  orgId                                 String?                        @db.VarChar(128)\n  requestSource                         String                         @db.VarChar(64)\n  sourcePurchaseOrderId                 String?                        @db.VarChar(128)\n  supplierTenantPartyId                 String                         @db.VarChar(128)\n  supplierSnapshot                      String                         @db.VarChar(255)\n  beneficiarySupplierFinancialAccountId String                         @db.VarChar(128)\n  currencyCode                          String                         @db.VarChar(16)\n  requestedAmount                       Decimal                        @db.Decimal(18, 6)\n  status                                String                         @db.VarChar(64)\n  reason                                String?                        @db.VarChar(1000)\n  requestedAt                           DateTime\n  updatedAt                             DateTime                       @updatedAt\n  lines                                 PaymentRequestLine[]\n  evidenceSnapshots                     SupplierBillEvidenceSnapshot[]\n  executions                            PaymentExecution[]\n\n  @@unique([tenantId, requestNo])\n  @@index([tenantId, sourcePurchaseOrderId, status])\n  @@index([tenantId, supplierTenantPartyId, requestedAt])\n}\n\nmodel PaymentRequestLine {\n  id                    String   @id @db.Uuid\n  tenantId              String   @db.VarChar(128)\n  paymentRequestId      String   @db.Uuid\n  payableScheduleId     String   @db.Uuid\n  payableScheduleLineId String   @db.Uuid\n  scheduleDueDate       String   @db.VarChar(32)\n  requestedAmount       Decimal  @db.Decimal(18, 6)\n  executedAmount        Decimal  @db.Decimal(18, 6)\n  isEarlyRequest        Boolean\n  lineStatus            String   @db.VarChar(64)\n  createdAt             DateTime @default(now())\n  updatedAt             DateTime @updatedAt\n\n  paymentRequest PaymentRequest @relation(fields: [paymentRequestId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId, paymentRequestId])\n  @@index([tenantId, payableScheduleId, payableScheduleLineId])\n}\n\nmodel SupplierBillEvidenceSnapshot {\n  id                 String   @id @db.Uuid\n  tenantId           String   @db.VarChar(128)\n  paymentRequestId   String   @db.Uuid\n  evidenceType       String   @db.VarChar(64)\n  externalDocumentNo String?  @db.VarChar(255)\n  documentDate       String?  @db.VarChar(32)\n  currencyCode       String?  @db.VarChar(16)\n  documentAmount     Decimal? @db.Decimal(18, 6)\n  attachmentRef      String?  @db.VarChar(255)\n  note               String?  @db.VarChar(1000)\n  capturedAt         DateTime\n\n  paymentRequest PaymentRequest @relation(fields: [paymentRequestId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId, paymentRequestId, capturedAt])\n}\n\nmodel PaymentExecution {\n  id                                    String   @id @db.Uuid\n  tenantId                              String   @db.VarChar(128)\n  orgId                                 String?  @db.VarChar(128)\n  paymentRequestId                      String   @db.Uuid\n  supplierTenantPartyId                 String   @db.VarChar(128)\n  sourceFinancialAccountId              String   @db.Uuid\n  beneficiarySupplierFinancialAccountId String?  @db.VarChar(128)\n  beneficiaryAccountSnapshot            String?  @db.VarChar(255)\n  executedAmount                        Decimal  @db.Decimal(18, 6)\n  currencyCode                          String   @db.VarChar(16)\n  executedAt                            DateTime\n  executionReference                    String?  @db.VarChar(255)\n  attachmentRefs                        Json\n  linkedAccountTransactionId            String?  @db.VarChar(128)\n  status                                String   @db.VarChar(64)\n  createdAt                             DateTime @default(now())\n  updatedAt                             DateTime @updatedAt\n\n  paymentRequest PaymentRequest @relation(fields: [paymentRequestId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId, paymentRequestId, executedAt])\n  @@index([tenantId, supplierTenantPartyId, executedAt])\n}\n\nmodel FinanceReleaseSignal {\n  id                    String                     @id @db.Uuid\n  tenantId              String                     @db.VarChar(128)\n  salesOrderId          String                     @db.VarChar(128)\n  customerTenantPartyId String                     @db.VarChar(128)\n  signalStatus          FinanceReleaseSignalStatus\n  reasonCode            String?                    @db.VarChar(128)\n  reasonSummary         String?                    @db.VarChar(1000)\n  effectiveAt           DateTime\n  expiresAt             DateTime?\n  basedOnSummary        String?                    @db.VarChar(1000)\n  updatedAt             DateTime                   @updatedAt\n\n  @@index([tenantId, salesOrderId, effectiveAt])\n}\n\nmodel ExchangeRate {\n  id                String   @id @db.Uuid\n  tenantId          String   @db.VarChar(128)\n  baseCurrencyCode  String   @db.VarChar(16)\n  quoteCurrencyCode String   @db.VarChar(16)\n  rateValue         Decimal  @db.Decimal(18, 6)\n  effectiveAt       DateTime\n  setBy             String   @db.VarChar(128)\n  updatedAt         DateTime @updatedAt\n\n  @@unique([tenantId, baseCurrencyCode, quoteCurrencyCode, effectiveAt])\n  @@index([tenantId, baseCurrencyCode, quoteCurrencyCode, effectiveAt])\n}\n\nmodel FinanceAuditEnvelope {\n  id           String   @id\n  service      String\n  module       String\n  eventType    String\n  occurredAt   DateTime\n  result       String\n  operatorId   String?\n  operatorType String\n  tenantId     String?\n  orgId        String?\n  traceId      String?\n  resourceType String\n  resourceId   String?\n  details      Json\n  createdAt    DateTime @default(now())\n\n  @@index([service, module, eventType, occurredAt])\n  @@index([tenantId, occurredAt])\n  @@index([resourceType, resourceId, occurredAt])\n}\n",
  "inlineSchemaHash": "50e34b814f45dac125aa6da20d94aa023c7200adc1b04cbcfe0aab973e8b8cee",
  "copyEngine": true
}

const fs = require('fs')

config.dirname = __dirname
if (!fs.existsSync(path.join(__dirname, 'schema.prisma'))) {
  const alternativePaths = [
    "prisma/generated/prisma",
    "generated/prisma",
  ]
  
  const alternativePath = alternativePaths.find((altPath) => {
    return fs.existsSync(path.join(process.cwd(), altPath, 'schema.prisma'))
  }) ?? alternativePaths[0]

  config.dirname = path.join(process.cwd(), alternativePath)
  config.isBundled = true
}

config.runtimeDataModel = JSON.parse("{\"models\":{\"FinanceSequenceCounter\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"nextFinancialAccountNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":1,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"nextReceivableScheduleNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":1,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"nextPayableScheduleNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":1,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"nextPaymentRequestNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":1,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"FinancialAccount\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"accountNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"orgId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"accountType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"FinancialAccountType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"accountName\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"currencyCode\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"16\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"institutionName\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"accountIdentifierMasked\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"FinancialAccountStatus\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lastTransactionAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"balanceSnapshots\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"FinancialAccountBalanceSnapshot\",\"nativeType\":null,\"relationName\":\"FinancialAccountToFinancialAccountBalanceSnapshot\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"transactions\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AccountTransaction\",\"nativeType\":null,\"relationName\":\"AccountTransactionToFinancialAccount\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"importBatches\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AccountTransactionImportBatch\",\"nativeType\":null,\"relationName\":\"AccountTransactionImportBatchToFinancialAccount\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"tenantId\",\"accountNo\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"tenantId\",\"accountNo\"]}],\"isGenerated\":false},\"FinancialAccountBalanceSnapshot\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"financialAccountId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"snapshotBalance\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"snapshotAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"financialAccount\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"FinancialAccount\",\"nativeType\":null,\"relationName\":\"FinancialAccountToFinancialAccountBalanceSnapshot\",\"relationFromFields\":[\"financialAccountId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"AccountTransactionImportBatch\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"financialAccountId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sourceType\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sourceBatchReference\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fileAssetId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"attachmentRef\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"importedBy\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"totalRows\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"acceptedCount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"duplicateCount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"failedCount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"transactions\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AccountTransaction\",\"nativeType\":null,\"relationName\":\"AccountTransactionToAccountTransactionImportBatch\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"financialAccount\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"FinancialAccount\",\"nativeType\":null,\"relationName\":\"AccountTransactionImportBatchToFinancialAccount\",\"relationFromFields\":[\"financialAccountId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"AccountTransaction\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"orgId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"financialAccountId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"importBatchId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"direction\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AccountTransactionDirection\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"amount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"currencyCode\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"16\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"transactionTime\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"valueDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"32\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sourceType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AccountTransactionSourceType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AccountTransactionStatus\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"externalReference\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"counterpartyName\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"counterpartyAccountSnapshot\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"memo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"1000\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"paymentExecutionId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"allocationStatus\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AccountTransactionAllocationStatus\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"allocatedAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"unallocatedAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fileAssetId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"attachmentRef\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"dedupeKey\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"512\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"allocations\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PaymentAllocation\",\"nativeType\":null,\"relationName\":\"AccountTransactionToPaymentAllocation\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"financialAccount\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"FinancialAccount\",\"nativeType\":null,\"relationName\":\"AccountTransactionToFinancialAccount\",\"relationFromFields\":[\"financialAccountId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"importBatch\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AccountTransactionImportBatch\",\"nativeType\":null,\"relationName\":\"AccountTransactionToAccountTransactionImportBatch\",\"relationFromFields\":[\"importBatchId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"SetNull\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"tenantId\",\"financialAccountId\",\"dedupeKey\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"tenantId\",\"financialAccountId\",\"dedupeKey\"]}],\"isGenerated\":false},\"CustomerFinancialAccount\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"customerTenantPartyId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"accountHolderName\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"accountProviderType\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"accountIdentifierMasked\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"currencyCode\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"16\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isDefault\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Boolean\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"verifiedStatus\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CustomerFinancialAccountVerifiedStatus\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"SupplierFinancialAccount\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"supplierTenantPartyId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"accountHolderName\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"accountProviderType\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"accountIdentifierMasked\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"currencyCode\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"16\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isDefault\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Boolean\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"verifiedStatus\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"ReceivableSchedule\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"scheduleNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"orgId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sourceSalesOrderId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"customerTenantPartyId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"customerSnapshot\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"currencyCode\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"16\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ReceivableScheduleStatus\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"totalScheduledAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"totalAllocatedAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"outstandingAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"salesExchangeRateSnapshot\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"lines\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ReceivableScheduleLine\",\"nativeType\":null,\"relationName\":\"ReceivableScheduleToReceivableScheduleLine\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"tenantId\",\"scheduleNo\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"tenantId\",\"scheduleNo\"]}],\"isGenerated\":false},\"PayableSchedule\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"scheduleNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"orgId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sourceType\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sourcePurchaseOrderId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sourcePurchaseOrderNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"procurementSnapshotReference\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"supplierTenantPartyId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"supplierSnapshot\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"currencyCode\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"16\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"totalScheduledAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"totalRequestedAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"totalExecutedAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"totalAllocatedAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"outstandingAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"lines\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PayableScheduleLine\",\"nativeType\":null,\"relationName\":\"PayableScheduleToPayableScheduleLine\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"tenantId\",\"scheduleNo\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"tenantId\",\"scheduleNo\"]}],\"isGenerated\":false},\"PayableScheduleLine\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"payableScheduleId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lineNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lineType\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sourceRef\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"dueDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"32\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"scheduledAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"requestedAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"executedAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"allocatedAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"outstandingAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"requestGovernanceStatus\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sourcePurchaseOrderLineId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"supersedesSourceRef\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"memo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"1000\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"payableSchedule\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PayableSchedule\",\"nativeType\":null,\"relationName\":\"PayableScheduleToPayableScheduleLine\",\"relationFromFields\":[\"payableScheduleId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"payableScheduleId\",\"lineNo\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"payableScheduleId\",\"lineNo\"]}],\"isGenerated\":false},\"ReceivableScheduleLine\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"receivableScheduleId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lineNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"dueDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"32\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"scheduledAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"allocatedAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"outstandingAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ReceivableScheduleLineStatus\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sourceSalesOrderLineId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"memo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"1000\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"receivableSchedule\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ReceivableSchedule\",\"nativeType\":null,\"relationName\":\"ReceivableScheduleToReceivableScheduleLine\",\"relationFromFields\":[\"receivableScheduleId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"receivableScheduleId\",\"lineNo\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"receivableScheduleId\",\"lineNo\"]}],\"isGenerated\":false},\"PaymentAllocation\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"accountTransactionId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"paymentExecutionId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"paymentRequestId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"targetType\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"targetScheduleId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"targetScheduleLineId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"allocatedAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"currencyCode\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"16\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"allocatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"accountTransaction\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AccountTransaction\",\"nativeType\":null,\"relationName\":\"AccountTransactionToPaymentAllocation\",\"relationFromFields\":[\"accountTransactionId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"PaymentRequest\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"requestNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"orgId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"requestSource\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sourcePurchaseOrderId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"supplierTenantPartyId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"supplierSnapshot\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"beneficiarySupplierFinancialAccountId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"currencyCode\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"16\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"requestedAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"reason\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"1000\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"requestedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"lines\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PaymentRequestLine\",\"nativeType\":null,\"relationName\":\"PaymentRequestToPaymentRequestLine\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"evidenceSnapshots\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"SupplierBillEvidenceSnapshot\",\"nativeType\":null,\"relationName\":\"PaymentRequestToSupplierBillEvidenceSnapshot\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"executions\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PaymentExecution\",\"nativeType\":null,\"relationName\":\"PaymentExecutionToPaymentRequest\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"tenantId\",\"requestNo\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"tenantId\",\"requestNo\"]}],\"isGenerated\":false},\"PaymentRequestLine\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"paymentRequestId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"payableScheduleId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"payableScheduleLineId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"scheduleDueDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"32\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"requestedAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"executedAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isEarlyRequest\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Boolean\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lineStatus\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"paymentRequest\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PaymentRequest\",\"nativeType\":null,\"relationName\":\"PaymentRequestToPaymentRequestLine\",\"relationFromFields\":[\"paymentRequestId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"SupplierBillEvidenceSnapshot\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"paymentRequestId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"evidenceType\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"externalDocumentNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"documentDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"32\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"currencyCode\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"16\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"documentAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"attachmentRef\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"note\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"1000\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"capturedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"paymentRequest\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PaymentRequest\",\"nativeType\":null,\"relationName\":\"PaymentRequestToSupplierBillEvidenceSnapshot\",\"relationFromFields\":[\"paymentRequestId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"PaymentExecution\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"orgId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"paymentRequestId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"supplierTenantPartyId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sourceFinancialAccountId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"beneficiarySupplierFinancialAccountId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"beneficiaryAccountSnapshot\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"executedAmount\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"currencyCode\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"16\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"executedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"executionReference\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"attachmentRefs\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"linkedAccountTransactionId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"paymentRequest\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PaymentRequest\",\"nativeType\":null,\"relationName\":\"PaymentExecutionToPaymentRequest\",\"relationFromFields\":[\"paymentRequestId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"FinanceReleaseSignal\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"salesOrderId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"customerTenantPartyId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"signalStatus\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"FinanceReleaseSignalStatus\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"reasonCode\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"reasonSummary\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"1000\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"effectiveAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"expiresAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"basedOnSummary\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"1000\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"ExchangeRate\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"baseCurrencyCode\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"16\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"quoteCurrencyCode\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"16\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"rateValue\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"nativeType\":[\"Decimal\",[\"18\",\"6\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"effectiveAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"setBy\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true}],\"primaryKey\":null,\"uniqueFields\":[[\"tenantId\",\"baseCurrencyCode\",\"quoteCurrencyCode\",\"effectiveAt\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"tenantId\",\"baseCurrencyCode\",\"quoteCurrencyCode\",\"effectiveAt\"]}],\"isGenerated\":false},\"FinanceAuditEnvelope\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"service\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"module\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"eventType\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"occurredAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"result\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"operatorId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"operatorType\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"orgId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"traceId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"resourceType\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"resourceId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"details\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false}},\"enums\":{\"FinancialAccountType\":{\"values\":[{\"name\":\"BANK\",\"dbName\":null},{\"name\":\"CASH\",\"dbName\":null},{\"name\":\"WECHAT\",\"dbName\":null},{\"name\":\"ALIPAY\",\"dbName\":null},{\"name\":\"PAYPAL\",\"dbName\":null},{\"name\":\"STRIPE\",\"dbName\":null},{\"name\":\"OTHER_PSP\",\"dbName\":null}],\"dbName\":null},\"FinancialAccountStatus\":{\"values\":[{\"name\":\"ACTIVE\",\"dbName\":null},{\"name\":\"INACTIVE\",\"dbName\":null},{\"name\":\"CLOSED\",\"dbName\":null}],\"dbName\":null},\"AccountTransactionDirection\":{\"values\":[{\"name\":\"INFLOW\",\"dbName\":null},{\"name\":\"OUTFLOW\",\"dbName\":null}],\"dbName\":null},\"AccountTransactionSourceType\":{\"values\":[{\"name\":\"MANUAL\",\"dbName\":null},{\"name\":\"CSV_IMPORT\",\"dbName\":null},{\"name\":\"FUTURE_API\",\"dbName\":null}],\"dbName\":null},\"AccountTransactionStatus\":{\"values\":[{\"name\":\"DRAFT\",\"dbName\":null},{\"name\":\"CONFIRMED\",\"dbName\":null},{\"name\":\"VOIDED\",\"dbName\":null}],\"dbName\":null},\"AccountTransactionAllocationStatus\":{\"values\":[{\"name\":\"UNALLOCATED\",\"dbName\":null},{\"name\":\"PARTIALLY_ALLOCATED\",\"dbName\":null},{\"name\":\"FULLY_ALLOCATED\",\"dbName\":null}],\"dbName\":null},\"CustomerFinancialAccountVerifiedStatus\":{\"values\":[{\"name\":\"UNVERIFIED\",\"dbName\":null},{\"name\":\"VERIFIED\",\"dbName\":null}],\"dbName\":null},\"ReceivableScheduleStatus\":{\"values\":[{\"name\":\"OPEN\",\"dbName\":null},{\"name\":\"PARTIALLY_PAID\",\"dbName\":null},{\"name\":\"PAID\",\"dbName\":null},{\"name\":\"CANCELLED\",\"dbName\":null},{\"name\":\"ON_HOLD\",\"dbName\":null}],\"dbName\":null},\"ReceivableScheduleLineStatus\":{\"values\":[{\"name\":\"OPEN\",\"dbName\":null},{\"name\":\"PARTIALLY_PAID\",\"dbName\":null},{\"name\":\"PAID\",\"dbName\":null},{\"name\":\"CANCELLED\",\"dbName\":null},{\"name\":\"OVERDUE\",\"dbName\":null}],\"dbName\":null},\"FinanceReleaseSignalStatus\":{\"values\":[{\"name\":\"RELEASED\",\"dbName\":null},{\"name\":\"HELD\",\"dbName\":null},{\"name\":\"REVIEW_REQUIRED\",\"dbName\":null}],\"dbName\":null}},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = undefined
config.compilerWasm = undefined


const { warnEnvConflicts } = require('./runtime/library.js')

warnEnvConflicts({
    rootEnvPath: config.relativeEnvPaths.rootEnvPath && path.resolve(config.dirname, config.relativeEnvPaths.rootEnvPath),
    schemaEnvPath: config.relativeEnvPaths.schemaEnvPath && path.resolve(config.dirname, config.relativeEnvPaths.schemaEnvPath)
})

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

// file annotations for bundling tools to include these files
path.join(__dirname, "libquery_engine-darwin-arm64.dylib.node");
path.join(process.cwd(), "prisma/generated/prisma/libquery_engine-darwin-arm64.dylib.node")
// file annotations for bundling tools to include these files
path.join(__dirname, "schema.prisma");
path.join(process.cwd(), "prisma/generated/prisma/schema.prisma")
