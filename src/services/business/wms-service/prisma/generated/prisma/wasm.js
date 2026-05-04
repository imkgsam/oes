
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

exports.Prisma.WmsSequenceCounterScalarFieldEnum = {
  tenantId: 'tenantId',
  nextReceiptNo: 'nextReceiptNo',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WarehouseScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  orgId: 'orgId',
  warehouseCode: 'warehouseCode',
  warehouseName: 'warehouseName',
  warehouseScope: 'warehouseScope',
  status: 'status',
  defaultReceivingLocationId: 'defaultReceivingLocationId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LocationScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  warehouseId: 'warehouseId',
  parentLocationId: 'parentLocationId',
  locationCode: 'locationCode',
  locationName: 'locationName',
  locationScope: 'locationScope',
  locationType: 'locationType',
  status: 'status',
  supportsReceipt: 'supportsReceipt',
  supportsStorage: 'supportsStorage',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReceiptScalarFieldEnum = {
  id: 'id',
  receiptNo: 'receiptNo',
  tenantId: 'tenantId',
  orgId: 'orgId',
  warehouseId: 'warehouseId',
  status: 'status',
  receiptSourceType: 'receiptSourceType',
  referencedReceivingExpectationIds: 'referencedReceivingExpectationIds',
  receiptDate: 'receiptDate',
  note: 'note',
  attachmentRefs: 'attachmentRefs',
  lineCount: 'lineCount',
  postedAt: 'postedAt',
  cancelledAt: 'cancelledAt',
  cancelReason: 'cancelReason',
  postComment: 'postComment',
  procurementReceiptSummary: 'procurementReceiptSummary',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ReceiptLineScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  receiptId: 'receiptId',
  lineNo: 'lineNo',
  itemId: 'itemId',
  itemCode: 'itemCode',
  itemName: 'itemName',
  receivingExpectationId: 'receivingExpectationId',
  targetLocationId: 'targetLocationId',
  confirmedQuantity: 'confirmedQuantity',
  uom: 'uom',
  inventoryStatus: 'inventoryStatus',
  restrictedReason: 'restrictedReason',
  trackingRefs: 'trackingRefs',
  physicalDiscrepancy: 'physicalDiscrepancy',
  evidenceAttachmentRefs: 'evidenceAttachmentRefs',
  postedStockLedgerEntryIds: 'postedStockLedgerEntryIds',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StockLedgerEntryScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  orgId: 'orgId',
  entryType: 'entryType',
  direction: 'direction',
  warehouseId: 'warehouseId',
  locationId: 'locationId',
  itemId: 'itemId',
  itemCode: 'itemCode',
  itemName: 'itemName',
  quantityDelta: 'quantityDelta',
  uom: 'uom',
  inventoryStatus: 'inventoryStatus',
  restrictedReason: 'restrictedReason',
  sourceDocumentType: 'sourceDocumentType',
  sourceDocumentId: 'sourceDocumentId',
  sourceDocumentLineId: 'sourceDocumentLineId',
  receivingExpectationId: 'receivingExpectationId',
  trackingRefs: 'trackingRefs',
  postedAt: 'postedAt'
};

exports.Prisma.InventoryBalanceScalarFieldEnum = {
  balanceKey: 'balanceKey',
  tenantId: 'tenantId',
  orgId: 'orgId',
  warehouseId: 'warehouseId',
  locationId: 'locationId',
  itemId: 'itemId',
  itemCode: 'itemCode',
  itemName: 'itemName',
  uom: 'uom',
  onHandQuantity: 'onHandQuantity',
  availableQuantity: 'availableQuantity',
  restrictedQuantity: 'restrictedQuantity',
  restrictedQuantities: 'restrictedQuantities',
  lastLedgerEntryId: 'lastLedgerEntryId',
  lastPostedAt: 'lastPostedAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WmsAuditEnvelopeScalarFieldEnum = {
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

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
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
exports.WmsWarehouseScope = exports.$Enums.WmsWarehouseScope = {
  INTERNAL: 'INTERNAL'
};

exports.WmsWarehouseStatus = exports.$Enums.WmsWarehouseStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

exports.WmsLocationScope = exports.$Enums.WmsLocationScope = {
  INTERNAL: 'INTERNAL'
};

exports.WmsLocationType = exports.$Enums.WmsLocationType = {
  RECEIVING: 'RECEIVING',
  STORAGE: 'STORAGE',
  STAGING: 'STAGING',
  RESTRICTED: 'RESTRICTED'
};

exports.WmsLocationStatus = exports.$Enums.WmsLocationStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

exports.WmsReceiptStatus = exports.$Enums.WmsReceiptStatus = {
  DRAFT: 'DRAFT',
  POSTED: 'POSTED',
  CANCELLED: 'CANCELLED'
};

exports.WmsReceiptSourceType = exports.$Enums.WmsReceiptSourceType = {
  MANUAL: 'MANUAL',
  RECEIVING_EXPECTATION_REFERENCE: 'RECEIVING_EXPECTATION_REFERENCE'
};

exports.WmsInventoryStatus = exports.$Enums.WmsInventoryStatus = {
  AVAILABLE: 'AVAILABLE',
  RESTRICTED: 'RESTRICTED'
};

exports.WmsStockLedgerEntryType = exports.$Enums.WmsStockLedgerEntryType = {
  RECEIPT_POSTED: 'RECEIPT_POSTED'
};

exports.WmsStockLedgerDirection = exports.$Enums.WmsStockLedgerDirection = {
  IN: 'IN'
};

exports.WmsStockLedgerSourceDocumentType = exports.$Enums.WmsStockLedgerSourceDocumentType = {
  RECEIPT: 'RECEIPT'
};

exports.Prisma.ModelName = {
  WmsSequenceCounter: 'WmsSequenceCounter',
  Warehouse: 'Warehouse',
  Location: 'Location',
  Receipt: 'Receipt',
  ReceiptLine: 'ReceiptLine',
  StockLedgerEntry: 'StockLedgerEntry',
  InventoryBalance: 'InventoryBalance',
  WmsAuditEnvelope: 'WmsAuditEnvelope'
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
