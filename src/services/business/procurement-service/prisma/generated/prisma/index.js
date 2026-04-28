
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

exports.Prisma.ProcurementSequenceCounterScalarFieldEnum = {
  tenantId: 'tenantId',
  nextPurchaseRequestNo: 'nextPurchaseRequestNo',
  nextPurchaseOrderNo: 'nextPurchaseOrderNo',
  nextReceivingExpectationNo: 'nextReceivingExpectationNo',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PurchaseRequestScalarFieldEnum = {
  id: 'id',
  requestNo: 'requestNo',
  tenantId: 'tenantId',
  orgId: 'orgId',
  requestType: 'requestType',
  status: 'status',
  requesterOperatorId: 'requesterOperatorId',
  requesterDisplayName: 'requesterDisplayName',
  title: 'title',
  reason: 'reason',
  submissionComment: 'submissionComment',
  cancelReason: 'cancelReason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  submittedAt: 'submittedAt',
  decidedAt: 'decidedAt',
  cancelledAt: 'cancelledAt'
};

exports.Prisma.PurchaseRequestLineScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  purchaseRequestId: 'purchaseRequestId',
  lineNo: 'lineNo',
  lineType: 'lineType',
  itemId: 'itemId',
  itemCode: 'itemCode',
  itemName: 'itemName',
  description: 'description',
  requestedQuantity: 'requestedQuantity',
  uom: 'uom',
  neededByDate: 'neededByDate',
  demandReferenceType: 'demandReferenceType',
  demandReferenceId: 'demandReferenceId'
};

exports.Prisma.PurchaseRequestApprovalSnapshotScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  purchaseRequestId: 'purchaseRequestId',
  decision: 'decision',
  decidedByOperatorId: 'decidedByOperatorId',
  decidedByDisplayName: 'decidedByDisplayName',
  decidedAt: 'decidedAt',
  comment: 'comment',
  approvalReference: 'approvalReference'
};

exports.Prisma.PurchaseOrderScalarFieldEnum = {
  id: 'id',
  orderNo: 'orderNo',
  tenantId: 'tenantId',
  orgId: 'orgId',
  status: 'status',
  currencyCode: 'currencyCode',
  supplierId: 'supplierId',
  supplierDisplayName: 'supplierDisplayName',
  supplierStatusAtIssue: 'supplierStatusAtIssue',
  sourcePurchaseRequestIds: 'sourcePurchaseRequestIds',
  sourcePurchaseRequestNos: 'sourcePurchaseRequestNos',
  acknowledgementStatus: 'acknowledgementStatus',
  acknowledgedAt: 'acknowledgedAt',
  acknowledgementExternalReference: 'acknowledgementExternalReference',
  acknowledgementComment: 'acknowledgementComment',
  issueComment: 'issueComment',
  cancelReason: 'cancelReason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  issuedAt: 'issuedAt',
  cancelledAt: 'cancelledAt'
};

exports.Prisma.PurchaseOrderLineScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  purchaseOrderId: 'purchaseOrderId',
  lineNo: 'lineNo',
  lineType: 'lineType',
  itemId: 'itemId',
  itemCode: 'itemCode',
  itemName: 'itemName',
  description: 'description',
  supplierOfferingId: 'supplierOfferingId',
  orderedQuantity: 'orderedQuantity',
  uom: 'uom',
  orderedUnitPrice: 'orderedUnitPrice',
  sourcePurchaseRequestLineId: 'sourcePurchaseRequestLineId',
  sourceRequestedQuantity: 'sourceRequestedQuantity',
  generalStockExcessReason: 'generalStockExcessReason'
};

exports.Prisma.PurchaseOrderLineAllocationScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  purchaseOrderLineId: 'purchaseOrderLineId',
  allocationType: 'allocationType',
  referenceId: 'referenceId',
  quantity: 'quantity',
  reason: 'reason'
};

exports.Prisma.PurchaseOrderChangeScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  purchaseOrderId: 'purchaseOrderId',
  changeType: 'changeType',
  changeSummary: 'changeSummary',
  changeReason: 'changeReason',
  appliedByOperatorId: 'appliedByOperatorId',
  appliedByDisplayName: 'appliedByDisplayName',
  appliedAt: 'appliedAt',
  status: 'status'
};

exports.Prisma.ReceivingExpectationScalarFieldEnum = {
  id: 'id',
  expectationNo: 'expectationNo',
  tenantId: 'tenantId',
  orgId: 'orgId',
  purchaseOrderId: 'purchaseOrderId',
  purchaseOrderLineId: 'purchaseOrderLineId',
  supplierId: 'supplierId',
  expectedQuantity: 'expectedQuantity',
  receivedQuantitySummary: 'receivedQuantitySummary',
  openQuantity: 'openQuantity',
  expectedReceiptDate: 'expectedReceiptDate',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReceivingDiscrepancyScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  receivingExpectationId: 'receivingExpectationId',
  discrepancyType: 'discrepancyType',
  summary: 'summary',
  status: 'status',
  resolutionCode: 'resolutionCode',
  resolutionNote: 'resolutionNote',
  resolvedAt: 'resolvedAt'
};

exports.Prisma.ProcurementAuditEnvelopeScalarFieldEnum = {
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
exports.ProcurementPurchaseRequestType = exports.$Enums.ProcurementPurchaseRequestType = {
  DEPARTMENTAL: 'DEPARTMENTAL',
  SALES_DEDICATED: 'SALES_DEDICATED',
  PRODUCTION_PACKAGING: 'PRODUCTION_PACKAGING',
  MAINTENANCE: 'MAINTENANCE',
  SAMPLE: 'SAMPLE'
};

exports.ProcurementPurchaseRequestStatus = exports.$Enums.ProcurementPurchaseRequestStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

exports.ProcurementPurchaseRequestLineType = exports.$Enums.ProcurementPurchaseRequestLineType = {
  STANDARD_ITEM: 'STANDARD_ITEM',
  TEXT: 'TEXT'
};

exports.ProcurementPurchaseRequestDecision = exports.$Enums.ProcurementPurchaseRequestDecision = {
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

exports.ProcurementPurchaseOrderStatus = exports.$Enums.ProcurementPurchaseOrderStatus = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  CANCELLED: 'CANCELLED'
};

exports.ProcurementPurchaseOrderLineAllocationType = exports.$Enums.ProcurementPurchaseOrderLineAllocationType = {
  SALES_ORDER_LINE: 'SALES_ORDER_LINE',
  FULFILLMENT_DEMAND: 'FULFILLMENT_DEMAND',
  GENERAL_STOCK: 'GENERAL_STOCK'
};

exports.ProcurementSupplierAcknowledgementStatus = exports.$Enums.ProcurementSupplierAcknowledgementStatus = {
  PENDING: 'PENDING',
  ACKNOWLEDGED: 'ACKNOWLEDGED'
};

exports.ProcurementPurchaseOrderChangeStatus = exports.$Enums.ProcurementPurchaseOrderChangeStatus = {
  APPLIED: 'APPLIED'
};

exports.ProcurementReceivingExpectationStatus = exports.$Enums.ProcurementReceivingExpectationStatus = {
  OPEN: 'OPEN',
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

exports.ProcurementReceivingDiscrepancyType = exports.$Enums.ProcurementReceivingDiscrepancyType = {
  SHORT_RECEIPT: 'SHORT_RECEIPT',
  OVER_RECEIPT: 'OVER_RECEIPT',
  DAMAGED: 'DAMAGED',
  RESTRICTED: 'RESTRICTED',
  OTHER: 'OTHER'
};

exports.ProcurementReceivingDiscrepancyStatus = exports.$Enums.ProcurementReceivingDiscrepancyStatus = {
  OPEN: 'OPEN',
  RESOLVED: 'RESOLVED'
};

exports.ProcurementReceivingResolutionCode = exports.$Enums.ProcurementReceivingResolutionCode = {
  WAIT_REDELIVERY: 'WAIT_REDELIVERY',
  ACCEPT_SHORT_CLOSE: 'ACCEPT_SHORT_CLOSE',
  RETURN_OR_REJECT_EXCESS: 'RETURN_OR_REJECT_EXCESS',
  MANUAL_FOLLOW_UP: 'MANUAL_FOLLOW_UP'
};

exports.Prisma.ModelName = {
  ProcurementSequenceCounter: 'ProcurementSequenceCounter',
  PurchaseRequest: 'PurchaseRequest',
  PurchaseRequestLine: 'PurchaseRequestLine',
  PurchaseRequestApprovalSnapshot: 'PurchaseRequestApprovalSnapshot',
  PurchaseOrder: 'PurchaseOrder',
  PurchaseOrderLine: 'PurchaseOrderLine',
  PurchaseOrderLineAllocation: 'PurchaseOrderLineAllocation',
  PurchaseOrderChange: 'PurchaseOrderChange',
  ReceivingExpectation: 'ReceivingExpectation',
  ReceivingDiscrepancy: 'ReceivingDiscrepancy',
  ProcurementAuditEnvelope: 'ProcurementAuditEnvelope'
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
      "value": "/Users/acehood/Documents/GitHub/oes/src/services/business/procurement-service/prisma/generated/prisma",
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
    "sourceFilePath": "/Users/acehood/Documents/GitHub/oes/src/services/business/procurement-service/prisma/schema.prisma",
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
  "inlineSchema": "generator client {\n  provider = \"prisma-client-js\"\n  output   = \"../prisma/generated/prisma\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")\n}\n\nenum ProcurementPurchaseRequestType {\n  DEPARTMENTAL\n  SALES_DEDICATED\n  PRODUCTION_PACKAGING\n  MAINTENANCE\n  SAMPLE\n}\n\nenum ProcurementPurchaseRequestStatus {\n  DRAFT\n  SUBMITTED\n  APPROVED\n  REJECTED\n  CANCELLED\n}\n\nenum ProcurementPurchaseRequestLineType {\n  STANDARD_ITEM\n  TEXT\n}\n\nenum ProcurementPurchaseRequestDecision {\n  APPROVED\n  REJECTED\n}\n\nenum ProcurementPurchaseOrderStatus {\n  DRAFT\n  ISSUED\n  ACKNOWLEDGED\n  CANCELLED\n}\n\nenum ProcurementPurchaseOrderLineAllocationType {\n  SALES_ORDER_LINE\n  FULFILLMENT_DEMAND\n  GENERAL_STOCK\n}\n\nenum ProcurementSupplierAcknowledgementStatus {\n  PENDING\n  ACKNOWLEDGED\n}\n\nenum ProcurementPurchaseOrderChangeStatus {\n  APPLIED\n}\n\nenum ProcurementReceivingExpectationStatus {\n  OPEN\n  PARTIALLY_RECEIVED\n  COMPLETED\n  CANCELLED\n}\n\nenum ProcurementReceivingDiscrepancyType {\n  SHORT_RECEIPT\n  OVER_RECEIPT\n  DAMAGED\n  RESTRICTED\n  OTHER\n}\n\nenum ProcurementReceivingDiscrepancyStatus {\n  OPEN\n  RESOLVED\n}\n\nenum ProcurementReceivingResolutionCode {\n  WAIT_REDELIVERY\n  ACCEPT_SHORT_CLOSE\n  RETURN_OR_REJECT_EXCESS\n  MANUAL_FOLLOW_UP\n}\n\nmodel ProcurementSequenceCounter {\n  tenantId                   String   @id @db.VarChar(128)\n  nextPurchaseRequestNo      Int      @default(1)\n  nextPurchaseOrderNo        Int      @default(1)\n  nextReceivingExpectationNo Int      @default(1)\n  createdAt                  DateTime @default(now())\n  updatedAt                  DateTime @updatedAt\n}\n\nmodel PurchaseRequest {\n  id                   String                           @id @db.Uuid\n  requestNo            String                           @unique @db.VarChar(64)\n  tenantId             String                           @db.VarChar(128)\n  orgId                String?                          @db.VarChar(128)\n  requestType          ProcurementPurchaseRequestType\n  status               ProcurementPurchaseRequestStatus\n  requesterOperatorId  String                           @db.VarChar(128)\n  requesterDisplayName String                           @db.VarChar(255)\n  title                String?                          @db.VarChar(255)\n  reason               String?                          @db.VarChar(500)\n  submissionComment    String?                          @db.VarChar(500)\n  cancelReason         String?                          @db.VarChar(500)\n  createdAt            DateTime\n  updatedAt            DateTime\n  submittedAt          DateTime?\n  decidedAt            DateTime?\n  cancelledAt          DateTime?\n  lines                PurchaseRequestLine[]\n  approvalSnapshot     PurchaseRequestApprovalSnapshot?\n\n  @@index([tenantId, requestNo])\n  @@index([tenantId, status, requestType])\n  @@index([tenantId, requesterOperatorId])\n}\n\nmodel PurchaseRequestLine {\n  id                  String                             @id @db.Uuid\n  tenantId            String                             @db.VarChar(128)\n  purchaseRequestId   String                             @db.Uuid\n  lineNo              Int\n  lineType            ProcurementPurchaseRequestLineType\n  itemId              String?                            @db.VarChar(128)\n  itemCode            String?                            @db.VarChar(128)\n  itemName            String?                            @db.VarChar(255)\n  description         String                             @db.VarChar(500)\n  requestedQuantity   String                             @db.VarChar(64)\n  uom                 String                             @db.VarChar(64)\n  neededByDate        String?                            @db.VarChar(64)\n  demandReferenceType String?                            @db.VarChar(128)\n  demandReferenceId   String?                            @db.VarChar(128)\n\n  purchaseRequest PurchaseRequest @relation(fields: [purchaseRequestId], references: [id], onDelete: Cascade)\n\n  @@unique([purchaseRequestId, lineNo])\n  @@index([tenantId, itemId])\n}\n\nmodel PurchaseRequestApprovalSnapshot {\n  id                   String                             @id @db.Uuid\n  tenantId             String                             @db.VarChar(128)\n  purchaseRequestId    String                             @unique @db.Uuid\n  decision             ProcurementPurchaseRequestDecision\n  decidedByOperatorId  String                             @db.VarChar(128)\n  decidedByDisplayName String                             @db.VarChar(255)\n  decidedAt            DateTime\n  comment              String?                            @db.VarChar(500)\n  approvalReference    String?                            @db.VarChar(255)\n\n  purchaseRequest PurchaseRequest @relation(fields: [purchaseRequestId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId, decision])\n}\n\nmodel PurchaseOrder {\n  id                               String                                   @id @db.Uuid\n  orderNo                          String                                   @unique @db.VarChar(64)\n  tenantId                         String                                   @db.VarChar(128)\n  orgId                            String?                                  @db.VarChar(128)\n  status                           ProcurementPurchaseOrderStatus\n  currencyCode                     String                                   @db.VarChar(32)\n  supplierId                       String                                   @db.VarChar(128)\n  supplierDisplayName              String                                   @db.VarChar(255)\n  supplierStatusAtIssue            String?                                  @db.VarChar(64)\n  sourcePurchaseRequestIds         Json\n  sourcePurchaseRequestNos         Json\n  acknowledgementStatus            ProcurementSupplierAcknowledgementStatus\n  acknowledgedAt                   DateTime?\n  acknowledgementExternalReference String?                                  @db.VarChar(255)\n  acknowledgementComment           String?                                  @db.VarChar(500)\n  issueComment                     String?                                  @db.VarChar(500)\n  cancelReason                     String?                                  @db.VarChar(500)\n  createdAt                        DateTime\n  updatedAt                        DateTime\n  issuedAt                         DateTime?\n  cancelledAt                      DateTime?\n  lines                            PurchaseOrderLine[]\n  changes                          PurchaseOrderChange[]\n  receivingExpectations            ReceivingExpectation[]\n\n  @@index([tenantId, orderNo])\n  @@index([tenantId, status, supplierId])\n}\n\nmodel PurchaseOrderLine {\n  id                          String                             @id @db.Uuid\n  tenantId                    String                             @db.VarChar(128)\n  purchaseOrderId             String                             @db.Uuid\n  lineNo                      Int\n  lineType                    ProcurementPurchaseRequestLineType\n  itemId                      String?                            @db.VarChar(128)\n  itemCode                    String?                            @db.VarChar(128)\n  itemName                    String?                            @db.VarChar(255)\n  description                 String                             @db.VarChar(500)\n  supplierOfferingId          String?                            @db.VarChar(128)\n  orderedQuantity             String                             @db.VarChar(64)\n  uom                         String                             @db.VarChar(64)\n  orderedUnitPrice            String?                            @db.VarChar(64)\n  sourcePurchaseRequestLineId String?                            @db.VarChar(128)\n  sourceRequestedQuantity     String?                            @db.VarChar(64)\n  generalStockExcessReason    String?                            @db.VarChar(500)\n  allocations                 PurchaseOrderLineAllocation[]\n  receivingExpectations       ReceivingExpectation[]\n\n  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)\n\n  @@unique([purchaseOrderId, lineNo])\n  @@index([tenantId, itemId])\n  @@index([tenantId, sourcePurchaseRequestLineId])\n}\n\nmodel PurchaseOrderLineAllocation {\n  id                  String                                     @id @db.Uuid\n  tenantId            String                                     @db.VarChar(128)\n  purchaseOrderLineId String                                     @db.Uuid\n  allocationType      ProcurementPurchaseOrderLineAllocationType\n  referenceId         String?                                    @db.VarChar(128)\n  quantity            String                                     @db.VarChar(64)\n  reason              String?                                    @db.VarChar(500)\n\n  purchaseOrderLine PurchaseOrderLine @relation(fields: [purchaseOrderLineId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId, allocationType, referenceId])\n}\n\nmodel PurchaseOrderChange {\n  id                   String                               @id @db.Uuid\n  tenantId             String                               @db.VarChar(128)\n  purchaseOrderId      String                               @db.Uuid\n  changeType           String                               @db.VarChar(128)\n  changeSummary        String                               @db.VarChar(500)\n  changeReason         String?                              @db.VarChar(500)\n  appliedByOperatorId  String                               @db.VarChar(128)\n  appliedByDisplayName String                               @db.VarChar(255)\n  appliedAt            DateTime\n  status               ProcurementPurchaseOrderChangeStatus\n\n  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId, purchaseOrderId, appliedAt])\n}\n\nmodel ReceivingExpectation {\n  id                      String                                @id @db.Uuid\n  expectationNo           String                                @unique @db.VarChar(64)\n  tenantId                String                                @db.VarChar(128)\n  orgId                   String?                               @db.VarChar(128)\n  purchaseOrderId         String                                @db.Uuid\n  purchaseOrderLineId     String                                @db.Uuid\n  supplierId              String                                @db.VarChar(128)\n  expectedQuantity        String                                @db.VarChar(64)\n  receivedQuantitySummary String                                @db.VarChar(64)\n  openQuantity            String                                @db.VarChar(64)\n  expectedReceiptDate     String?                               @db.VarChar(64)\n  status                  ProcurementReceivingExpectationStatus\n  createdAt               DateTime\n  updatedAt               DateTime\n  discrepancy             ReceivingDiscrepancy?\n  purchaseOrder           PurchaseOrder                         @relation(fields: [purchaseOrderId], references: [id], onDelete: Restrict)\n  purchaseOrderLine       PurchaseOrderLine                     @relation(fields: [purchaseOrderLineId], references: [id], onDelete: Restrict)\n\n  @@unique([tenantId, purchaseOrderLineId])\n  @@index([tenantId, purchaseOrderId, status])\n  @@index([tenantId, supplierId, status])\n}\n\nmodel ReceivingDiscrepancy {\n  id                     String                                @id @db.Uuid\n  tenantId               String                                @db.VarChar(128)\n  receivingExpectationId String                                @unique @db.Uuid\n  discrepancyType        ProcurementReceivingDiscrepancyType\n  summary                String                                @db.VarChar(500)\n  status                 ProcurementReceivingDiscrepancyStatus\n  resolutionCode         ProcurementReceivingResolutionCode?\n  resolutionNote         String?                               @db.VarChar(500)\n  resolvedAt             DateTime?\n\n  receivingExpectation ReceivingExpectation @relation(fields: [receivingExpectationId], references: [id], onDelete: Cascade)\n\n  @@index([tenantId, status, discrepancyType])\n}\n\nmodel ProcurementAuditEnvelope {\n  id           String   @id\n  service      String\n  module       String\n  eventType    String\n  occurredAt   DateTime\n  result       String\n  operatorId   String?\n  operatorType String\n  tenantId     String?\n  orgId        String?\n  traceId      String?\n  resourceType String\n  resourceId   String?\n  details      Json\n  createdAt    DateTime @default(now())\n\n  @@index([service, module, eventType, occurredAt])\n  @@index([tenantId, occurredAt])\n  @@index([resourceType, resourceId, occurredAt])\n}\n",
  "inlineSchemaHash": "e5b4fc030ca13acfadc4a15e18c3f0cc43827275ecd30fae5f03add3c5f79371",
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

config.runtimeDataModel = JSON.parse("{\"models\":{\"ProcurementSequenceCounter\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"nextPurchaseRequestNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":1,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"nextPurchaseOrderNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":1,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"nextReceivingExpectationNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":1,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"PurchaseRequest\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"requestNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"orgId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"requestType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ProcurementPurchaseRequestType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ProcurementPurchaseRequestStatus\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"requesterOperatorId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"requesterDisplayName\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"title\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"reason\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"500\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"submissionComment\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"500\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"cancelReason\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"500\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"submittedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"decidedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"cancelledAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lines\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PurchaseRequestLine\",\"nativeType\":null,\"relationName\":\"PurchaseRequestToPurchaseRequestLine\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"approvalSnapshot\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PurchaseRequestApprovalSnapshot\",\"nativeType\":null,\"relationName\":\"PurchaseRequestToPurchaseRequestApprovalSnapshot\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"PurchaseRequestLine\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"purchaseRequestId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lineNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lineType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ProcurementPurchaseRequestLineType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"itemId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"itemCode\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"itemName\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"500\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"requestedQuantity\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"uom\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"neededByDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"demandReferenceType\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"demandReferenceId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"purchaseRequest\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PurchaseRequest\",\"nativeType\":null,\"relationName\":\"PurchaseRequestToPurchaseRequestLine\",\"relationFromFields\":[\"purchaseRequestId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"purchaseRequestId\",\"lineNo\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"purchaseRequestId\",\"lineNo\"]}],\"isGenerated\":false},\"PurchaseRequestApprovalSnapshot\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"purchaseRequestId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"decision\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ProcurementPurchaseRequestDecision\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"decidedByOperatorId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"decidedByDisplayName\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"decidedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"comment\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"500\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"approvalReference\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"purchaseRequest\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PurchaseRequest\",\"nativeType\":null,\"relationName\":\"PurchaseRequestToPurchaseRequestApprovalSnapshot\",\"relationFromFields\":[\"purchaseRequestId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"PurchaseOrder\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"orderNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"orgId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ProcurementPurchaseOrderStatus\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"currencyCode\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"32\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"supplierId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"supplierDisplayName\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"supplierStatusAtIssue\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sourcePurchaseRequestIds\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sourcePurchaseRequestNos\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"acknowledgementStatus\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ProcurementSupplierAcknowledgementStatus\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"acknowledgedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"acknowledgementExternalReference\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"acknowledgementComment\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"500\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"issueComment\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"500\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"cancelReason\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"500\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"issuedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"cancelledAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lines\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PurchaseOrderLine\",\"nativeType\":null,\"relationName\":\"PurchaseOrderToPurchaseOrderLine\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"changes\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PurchaseOrderChange\",\"nativeType\":null,\"relationName\":\"PurchaseOrderToPurchaseOrderChange\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"receivingExpectations\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ReceivingExpectation\",\"nativeType\":null,\"relationName\":\"PurchaseOrderToReceivingExpectation\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"PurchaseOrderLine\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"purchaseOrderId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lineNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lineType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ProcurementPurchaseRequestLineType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"itemId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"itemCode\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"itemName\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"500\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"supplierOfferingId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"orderedQuantity\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"uom\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"orderedUnitPrice\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sourcePurchaseRequestLineId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sourceRequestedQuantity\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"generalStockExcessReason\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"500\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"allocations\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PurchaseOrderLineAllocation\",\"nativeType\":null,\"relationName\":\"PurchaseOrderLineToPurchaseOrderLineAllocation\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"receivingExpectations\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ReceivingExpectation\",\"nativeType\":null,\"relationName\":\"PurchaseOrderLineToReceivingExpectation\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"purchaseOrder\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PurchaseOrder\",\"nativeType\":null,\"relationName\":\"PurchaseOrderToPurchaseOrderLine\",\"relationFromFields\":[\"purchaseOrderId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"purchaseOrderId\",\"lineNo\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"purchaseOrderId\",\"lineNo\"]}],\"isGenerated\":false},\"PurchaseOrderLineAllocation\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"purchaseOrderLineId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"allocationType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ProcurementPurchaseOrderLineAllocationType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"referenceId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"quantity\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"reason\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"500\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"purchaseOrderLine\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PurchaseOrderLine\",\"nativeType\":null,\"relationName\":\"PurchaseOrderLineToPurchaseOrderLineAllocation\",\"relationFromFields\":[\"purchaseOrderLineId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"PurchaseOrderChange\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"purchaseOrderId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"changeType\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"changeSummary\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"500\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"changeReason\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"500\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"appliedByOperatorId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"appliedByDisplayName\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"255\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"appliedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ProcurementPurchaseOrderChangeStatus\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"purchaseOrder\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PurchaseOrder\",\"nativeType\":null,\"relationName\":\"PurchaseOrderToPurchaseOrderChange\",\"relationFromFields\":[\"purchaseOrderId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"ReceivingExpectation\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"expectationNo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"orgId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"purchaseOrderId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"purchaseOrderLineId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"supplierId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"expectedQuantity\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"receivedQuantitySummary\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"openQuantity\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"expectedReceiptDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"64\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ProcurementReceivingExpectationStatus\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"discrepancy\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ReceivingDiscrepancy\",\"nativeType\":null,\"relationName\":\"ReceivingDiscrepancyToReceivingExpectation\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"purchaseOrder\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PurchaseOrder\",\"nativeType\":null,\"relationName\":\"PurchaseOrderToReceivingExpectation\",\"relationFromFields\":[\"purchaseOrderId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Restrict\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"purchaseOrderLine\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PurchaseOrderLine\",\"nativeType\":null,\"relationName\":\"PurchaseOrderLineToReceivingExpectation\",\"relationFromFields\":[\"purchaseOrderLineId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Restrict\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"tenantId\",\"purchaseOrderLineId\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"tenantId\",\"purchaseOrderLineId\"]}],\"isGenerated\":false},\"ReceivingDiscrepancy\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"128\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"receivingExpectationId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Uuid\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"discrepancyType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ProcurementReceivingDiscrepancyType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"summary\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"500\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ProcurementReceivingDiscrepancyStatus\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"resolutionCode\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ProcurementReceivingResolutionCode\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"resolutionNote\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"VarChar\",[\"500\"]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"resolvedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"receivingExpectation\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ReceivingExpectation\",\"nativeType\":null,\"relationName\":\"ReceivingDiscrepancyToReceivingExpectation\",\"relationFromFields\":[\"receivingExpectationId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"ProcurementAuditEnvelope\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"service\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"module\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"eventType\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"occurredAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"result\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"operatorId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"operatorType\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tenantId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"orgId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"traceId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"resourceType\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"resourceId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"details\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false}},\"enums\":{\"ProcurementPurchaseRequestType\":{\"values\":[{\"name\":\"DEPARTMENTAL\",\"dbName\":null},{\"name\":\"SALES_DEDICATED\",\"dbName\":null},{\"name\":\"PRODUCTION_PACKAGING\",\"dbName\":null},{\"name\":\"MAINTENANCE\",\"dbName\":null},{\"name\":\"SAMPLE\",\"dbName\":null}],\"dbName\":null},\"ProcurementPurchaseRequestStatus\":{\"values\":[{\"name\":\"DRAFT\",\"dbName\":null},{\"name\":\"SUBMITTED\",\"dbName\":null},{\"name\":\"APPROVED\",\"dbName\":null},{\"name\":\"REJECTED\",\"dbName\":null},{\"name\":\"CANCELLED\",\"dbName\":null}],\"dbName\":null},\"ProcurementPurchaseRequestLineType\":{\"values\":[{\"name\":\"STANDARD_ITEM\",\"dbName\":null},{\"name\":\"TEXT\",\"dbName\":null}],\"dbName\":null},\"ProcurementPurchaseRequestDecision\":{\"values\":[{\"name\":\"APPROVED\",\"dbName\":null},{\"name\":\"REJECTED\",\"dbName\":null}],\"dbName\":null},\"ProcurementPurchaseOrderStatus\":{\"values\":[{\"name\":\"DRAFT\",\"dbName\":null},{\"name\":\"ISSUED\",\"dbName\":null},{\"name\":\"ACKNOWLEDGED\",\"dbName\":null},{\"name\":\"CANCELLED\",\"dbName\":null}],\"dbName\":null},\"ProcurementPurchaseOrderLineAllocationType\":{\"values\":[{\"name\":\"SALES_ORDER_LINE\",\"dbName\":null},{\"name\":\"FULFILLMENT_DEMAND\",\"dbName\":null},{\"name\":\"GENERAL_STOCK\",\"dbName\":null}],\"dbName\":null},\"ProcurementSupplierAcknowledgementStatus\":{\"values\":[{\"name\":\"PENDING\",\"dbName\":null},{\"name\":\"ACKNOWLEDGED\",\"dbName\":null}],\"dbName\":null},\"ProcurementPurchaseOrderChangeStatus\":{\"values\":[{\"name\":\"APPLIED\",\"dbName\":null}],\"dbName\":null},\"ProcurementReceivingExpectationStatus\":{\"values\":[{\"name\":\"OPEN\",\"dbName\":null},{\"name\":\"PARTIALLY_RECEIVED\",\"dbName\":null},{\"name\":\"COMPLETED\",\"dbName\":null},{\"name\":\"CANCELLED\",\"dbName\":null}],\"dbName\":null},\"ProcurementReceivingDiscrepancyType\":{\"values\":[{\"name\":\"SHORT_RECEIPT\",\"dbName\":null},{\"name\":\"OVER_RECEIPT\",\"dbName\":null},{\"name\":\"DAMAGED\",\"dbName\":null},{\"name\":\"RESTRICTED\",\"dbName\":null},{\"name\":\"OTHER\",\"dbName\":null}],\"dbName\":null},\"ProcurementReceivingDiscrepancyStatus\":{\"values\":[{\"name\":\"OPEN\",\"dbName\":null},{\"name\":\"RESOLVED\",\"dbName\":null}],\"dbName\":null},\"ProcurementReceivingResolutionCode\":{\"values\":[{\"name\":\"WAIT_REDELIVERY\",\"dbName\":null},{\"name\":\"ACCEPT_SHORT_CLOSE\",\"dbName\":null},{\"name\":\"RETURN_OR_REJECT_EXCESS\",\"dbName\":null},{\"name\":\"MANUAL_FOLLOW_UP\",\"dbName\":null}],\"dbName\":null}},\"types\":{}}")
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
