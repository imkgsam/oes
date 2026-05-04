const RECEIPT_SOURCE_TYPE_MANUAL = 1;
const RECEIPT_STATUS_DRAFT = 1;
const RECEIPT_STATUS_POSTED = 2;
const INVENTORY_STATUS_AVAILABLE = 1;

/** createSmokeSeed builds one deterministic WMS smoke tenant, fixture, and request context bundle. */
export function createSmokeSeed(now = Date.now()) {
  const suffix = `${now}`;

  return {
    tenantId: `wms-smoke-tenant-${suffix}`,
    orgId: 'wms-smoke-org',
    warehouseId: `wms-smoke-wh-${suffix}`,
    warehouseCode: `WMS-SMOKE-${suffix.slice(-6)}`,
    warehouseName: 'WMS Smoke Warehouse',
    locationId: `wms-smoke-loc-${suffix}`,
    locationCode: `STK-${suffix.slice(-6)}`,
    locationName: 'WMS Smoke Storage',
    itemId: `wms-smoke-item-${suffix}`,
    itemCode: `ITEM-${suffix.slice(-6)}`,
    itemName: 'WMS Smoke Item',
    uom: 'EA',
    confirmedQuantity: '10',
    operatorContext: {
      operatorId: 'wms-smoke-operator',
      operatorType: 'HUMAN',
      orgId: 'wms-smoke-org'
    },
    traceContext: {
      traceId: `wms-smoke-trace-${suffix}`,
      requestId: `wms-smoke-request-${suffix}`
    },
    auditContext: {
      auditId: `wms-smoke-audit-${suffix}`,
      reason: 'wms-service smoke verification',
      source: 'wms-smoke'
    }
  };
}

/** runWmsSmokeFlow executes the minimum phase 1 warehouse, receipt, ledger, and balance path expected from WMS. */
export async function runWmsSmokeFlow(services, seed, report = () => undefined) {
  assertWmsServices(services);

  const warehouse = requirePage(
    await services.warehouse.query.listWarehouses({
      ...buildQueryContext(seed),
      page: 1,
      pageSize: 20
    }),
    'warehouses',
    'ListWarehouses'
  );

  const seededWarehouse = warehouse.warehouses.find((item) => item?.warehouseId === seed.warehouseId);
  if (!seededWarehouse) {
    throw new Error('wms-service smoke failed: ListWarehouses did not return the seeded warehouse fixture');
  }
  report(`warehouse fixture visible: ${seed.warehouseId}`);

  const createdReceipt = requireReceipt(
    await services.receipt.management.createReceiptDraft({
      ...buildManagementContext(seed),
      orgId: seed.orgId,
      warehouseId: seed.warehouseId,
      receiptSourceType: RECEIPT_SOURCE_TYPE_MANUAL,
      note: 'created by wms smoke'
    }),
    'CreateReceiptDraft'
  );
  if (createdReceipt.status !== RECEIPT_STATUS_DRAFT) {
    throw new Error('wms-service smoke failed: CreateReceiptDraft did not create a DRAFT receipt');
  }
  report(`draft created: ${createdReceipt.receiptId}`);

  const linedReceipt = requireReceipt(
    await services.receipt.management.addOrReplaceReceiptLines({
      ...buildManagementContext(seed),
      receiptId: createdReceipt.receiptId,
      lines: [
        {
          itemId: seed.itemId,
          targetLocationId: seed.locationId,
          confirmedQuantity: seed.confirmedQuantity,
          uom: seed.uom,
          inventoryStatus: INVENTORY_STATUS_AVAILABLE,
          evidenceAttachmentRefs: [],
          trackingRefs: []
        }
      ]
    }),
    'AddOrReplaceReceiptLines'
  );
  if ((linedReceipt.lineCount ?? 0) !== 1) {
    throw new Error('wms-service smoke failed: AddOrReplaceReceiptLines did not persist exactly one receipt line');
  }
  report(`draft lined: ${createdReceipt.receiptId}`);

  const postResponse = await services.receipt.management.postReceipt({
    ...buildManagementContext(seed),
    receiptId: createdReceipt.receiptId,
    postComment: 'posted by wms smoke'
  });
  const postedReceipt = requireReceipt(postResponse, 'PostReceipt');
  if (postedReceipt.status !== RECEIPT_STATUS_POSTED) {
    throw new Error('wms-service smoke failed: PostReceipt did not move the receipt to POSTED');
  }
  if (!Array.isArray(postResponse.postedStockLedgerEntryIds) || postResponse.postedStockLedgerEntryIds.length !== 1) {
    throw new Error('wms-service smoke failed: PostReceipt did not return exactly one posted ledger entry id');
  }
  report(`receipt posted: ${createdReceipt.receiptId}`);

  const ledger = requirePage(
    await services.inventory.query.searchStockLedgerEntries({
      ...buildQueryContext(seed),
      receiptId: createdReceipt.receiptId,
      page: 1,
      pageSize: 20
    }),
    'entries',
    'SearchStockLedgerEntries'
  );
  const postedEntry = ledger.entries.find(
    (entry) =>
      entry?.sourceDocumentId === createdReceipt.receiptId &&
      entry?.itemId === seed.itemId &&
      entry?.quantityDelta === seed.confirmedQuantity
  );
  if (!postedEntry) {
    throw new Error('wms-service smoke failed: SearchStockLedgerEntries did not return the posted receipt ledger row');
  }
  report(`ledger visible: ${postResponse.postedStockLedgerEntryIds[0]}`);

  const balance = requirePage(
    await services.inventory.query.searchInventoryBalances({
      ...buildQueryContext(seed),
      warehouseId: seed.warehouseId,
      itemId: seed.itemId,
      page: 1,
      pageSize: 20
    }),
    'inventoryBalances',
    'SearchInventoryBalances'
  );
  const projectedBalance = balance.inventoryBalances.find(
    (item) =>
      item?.warehouseId === seed.warehouseId &&
      item?.locationId === seed.locationId &&
      item?.itemId === seed.itemId &&
      item?.onHandQuantity === seed.confirmedQuantity
  );
  if (!projectedBalance) {
    throw new Error('wms-service smoke failed: SearchInventoryBalances did not return the posted inventory projection');
  }
  report(`balance visible: ${seed.itemId}`);

  return {
    warehouse,
    receipt: postedReceipt,
    postedStockLedgerEntryIds: postResponse.postedStockLedgerEntryIds,
    ledger,
    balance
  };
}

/** buildQueryContext attaches the explicit tenant, operator, and trace payload frozen by the WMS query contracts. */
function buildQueryContext(seed) {
  return {
    tenantId: seed.tenantId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext
  };
}

/** buildManagementContext attaches the explicit tenant, operator, trace, and audit payload frozen by the WMS command contracts. */
function buildManagementContext(seed) {
  return {
    ...buildQueryContext(seed),
    auditContext: seed.auditContext
  };
}

/** assertWmsServices verifies the smoke received the warehouse, receipt, and inventory RPC wrappers it needs. */
function assertWmsServices(services) {
  if (
    !services?.warehouse?.query?.listWarehouses ||
    !services?.receipt?.management?.createReceiptDraft ||
    !services?.receipt?.management?.addOrReplaceReceiptLines ||
    !services?.receipt?.management?.postReceipt ||
    !services?.inventory?.query?.searchStockLedgerEntries ||
    !services?.inventory?.query?.searchInventoryBalances
  ) {
    throw new Error('wms-service smoke failed: warehouse, receipt, or inventory clients are not fully configured');
  }
}

/** requireReceipt unwraps one receipt payload from the command response envelope or raises a targeted smoke failure. */
function requireReceipt(response, step) {
  const receipt = response?.receipt;
  if (!receipt?.receiptId) {
    throw new Error(`wms-service smoke failed: ${step} did not return a receipt payload`);
  }

  return receipt;
}

/** requirePage unwraps one page payload and ensures the expected list field is present for smoke assertions. */
function requirePage(response, field, step) {
  const items = response?.[field];
  if (!Array.isArray(items)) {
    throw new Error(`wms-service smoke failed: ${step} did not return the expected page payload`);
  }

  return response;
}
