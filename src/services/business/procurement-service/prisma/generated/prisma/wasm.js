
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
  cancelledAt: 'cancelledAt',
  linkedPurchaseOrders: 'linkedPurchaseOrders',
  nextExpectedReceiptDate: 'nextExpectedReceiptDate',
  receivingStatusSummary: 'receivingStatusSummary'
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
  demandReferenceId: 'demandReferenceId',
  conversionStatus: 'conversionStatus',
  linkedPurchaseOrderLines: 'linkedPurchaseOrderLines'
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
  paymentTermsCode: 'paymentTermsCode',
  paymentTermsText: 'paymentTermsText',
  incotermCode: 'incotermCode',
  commercialTermsText: 'commercialTermsText',
  paymentStatusSummary: 'paymentStatusSummary',
  depositPaidAmount: 'depositPaidAmount',
  balancePaidAmount: 'balancePaidAmount',
  paymentSummaryCurrencyCode: 'paymentSummaryCurrencyCode',
  attachmentRefs: 'attachmentRefs',
  lastPaymentAt: 'lastPaymentAt',
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
  sourceReferenceId: 'sourceReferenceId',
  quantity: 'quantity',
  reason: 'reason',
  targetWarehouseId: 'targetWarehouseId',
  targetReceivingAddressId: 'targetReceivingAddressId'
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
  allocationGroupingKey: 'allocationGroupingKey',
  sourceAllocationIds: 'sourceAllocationIds',
  targetWarehouseId: 'targetWarehouseId',
  targetReceivingAddressId: 'targetReceivingAddressId',
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
  resolutionReferences: 'resolutionReferences',
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

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
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
  PARTIALLY_CONVERTED: 'PARTIALLY_CONVERTED',
  CONVERTED: 'CONVERTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

exports.ProcurementPurchaseRequestLineType = exports.$Enums.ProcurementPurchaseRequestLineType = {
  STANDARD_ITEM: 'STANDARD_ITEM',
  TEXT: 'TEXT'
};

exports.ProcurementPurchaseRequestLineConversionStatus = exports.$Enums.ProcurementPurchaseRequestLineConversionStatus = {
  NOT_CONVERTED: 'NOT_CONVERTED',
  PARTIALLY_CONVERTED: 'PARTIALLY_CONVERTED',
  CONVERTED: 'CONVERTED'
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

exports.ProcurementSupplierAcknowledgementStatus = exports.$Enums.ProcurementSupplierAcknowledgementStatus = {
  PENDING: 'PENDING',
  ACKNOWLEDGED: 'ACKNOWLEDGED'
};

exports.ProcurementPurchaseOrderLineAllocationType = exports.$Enums.ProcurementPurchaseOrderLineAllocationType = {
  PURCHASE_REQUEST_LINE: 'PURCHASE_REQUEST_LINE',
  SALES_ORDER_LINE: 'SALES_ORDER_LINE',
  FULFILLMENT_DEMAND: 'FULFILLMENT_DEMAND',
  GENERAL_STOCK: 'GENERAL_STOCK'
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
  SHORT_RECEIVED: 'SHORT_RECEIVED',
  OVER_RECEIVED: 'OVER_RECEIVED',
  DAMAGED: 'DAMAGED',
  WRONG_ITEM: 'WRONG_ITEM',
  QUALITY_HOLD: 'QUALITY_HOLD'
};

exports.ProcurementReceivingDiscrepancyStatus = exports.$Enums.ProcurementReceivingDiscrepancyStatus = {
  OPEN: 'OPEN',
  RESOLVED: 'RESOLVED'
};

exports.ProcurementReceivingResolutionCode = exports.$Enums.ProcurementReceivingResolutionCode = {
  WAIT_REDELIVERY: 'WAIT_REDELIVERY',
  CLOSE_UNRECEIVED: 'CLOSE_UNRECEIVED',
  REQUEST_RESEND: 'REQUEST_RESEND',
  ACCEPT_WITH_PO_CHANGE: 'ACCEPT_WITH_PO_CHANGE',
  REJECT_EXCESS: 'REJECT_EXCESS',
  TEMP_HOLD: 'TEMP_HOLD',
  REJECT_DAMAGED: 'REJECT_DAMAGED',
  RECEIVE_WITH_RESTRICTION: 'RECEIVE_WITH_RESTRICTION',
  CLAIM: 'CLAIM',
  REJECT_WRONG_ITEM: 'REJECT_WRONG_ITEM',
  TEMP_RECEIVE_PENDING_DECISION: 'TEMP_RECEIVE_PENDING_DECISION',
  ACCEPT_WITH_CONTROLLED_CHANGE: 'ACCEPT_WITH_CONTROLLED_CHANGE',
  WAIT_INSPECTION: 'WAIT_INSPECTION',
  ACCEPT_WITH_ALLOWANCE: 'ACCEPT_WITH_ALLOWANCE',
  RETURN_TO_SUPPLIER: 'RETURN_TO_SUPPLIER'
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
