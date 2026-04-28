const PURCHASE_REQUEST_TYPE_DEPARTMENTAL = 1;
const PURCHASE_REQUEST_STATUS_DRAFT = 1;
const PURCHASE_REQUEST_STATUS_SUBMITTED = 2;
const PURCHASE_REQUEST_STATUS_APPROVED = 3;
const PURCHASE_REQUEST_LINE_TYPE_STANDARD_ITEM = 1;
const PURCHASE_REQUEST_LINE_TYPE_TEXT = 2;
const PURCHASE_REQUEST_DECISION_APPROVED = 1;

// createSmokeSeed builds one deterministic procurement smoke seed plus optional conversion prerequisites sourced from env.
export function createSmokeSeed(now = Date.now()) {
  const suffix = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    tenantId: process.env.PROCUREMENT_SMOKE_TENANT_ID || `procurement-smoke-tenant-${suffix}`,
    orgId: process.env.PROCUREMENT_SMOKE_ORG_ID || 'procurement-smoke-org',
    title: process.env.PROCUREMENT_SMOKE_TITLE || `Procurement Smoke Request ${suffix}`,
    reason: process.env.PROCUREMENT_SMOKE_REASON || 'procurement-service smoke verification',
    operatorContext: {
      operatorId: process.env.PROCUREMENT_SMOKE_OPERATOR_ID || 'procurement-smoke-operator',
      operatorType: process.env.PROCUREMENT_SMOKE_OPERATOR_TYPE || 'HUMAN',
      orgId: process.env.PROCUREMENT_SMOKE_ORG_ID || 'procurement-smoke-org'
    },
    traceContext: {
      traceId: process.env.PROCUREMENT_SMOKE_TRACE_ID || `procurement-smoke-trace-${suffix}`,
      requestId: process.env.PROCUREMENT_SMOKE_REQUEST_ID || `procurement-smoke-request-${suffix}`
    },
    auditContext: {
      auditId: process.env.PROCUREMENT_SMOKE_AUDIT_ID || `procurement-smoke-audit-${suffix}`,
      reason: process.env.PROCUREMENT_SMOKE_AUDIT_REASON || 'procurement-service smoke verification',
      source: process.env.PROCUREMENT_SMOKE_AUDIT_SOURCE || 'procurement-smoke'
    },
    textLine: {
      description:
        process.env.PROCUREMENT_SMOKE_TEXT_DESCRIPTION || `Procurement smoke text demand ${suffix}`,
      requestedQuantity: process.env.PROCUREMENT_SMOKE_TEXT_QTY || '5',
      uom: process.env.PROCUREMENT_SMOKE_TEXT_UOM || 'EA'
    },
    standardItemLine: {
      description:
        process.env.PROCUREMENT_SMOKE_STANDARD_DESCRIPTION || `Procurement smoke standard demand ${suffix}`,
      requestedQuantity: process.env.PROCUREMENT_SMOKE_STANDARD_QTY || '6',
      uom: process.env.PROCUREMENT_SMOKE_STANDARD_UOM || 'EA'
    },
    conversionTitle:
      process.env.PROCUREMENT_SMOKE_CONVERSION_TITLE || `Procurement Smoke Conversion ${suffix}`,
    conversionCurrencyCode: process.env.PROCUREMENT_SMOKE_CURRENCY_CODE || 'CNY',
    conversionSupplierId: process.env.PROCUREMENT_SMOKE_SUPPLIER_ID || null,
    conversionItemId: process.env.PROCUREMENT_SMOKE_ITEM_ID || null
  };
}

// runProcurementSmokeFlow executes the minimal live procurement smoke and optionally converts a second approved standard-item PR into a PO draft.
export async function runProcurementSmokeFlow(services, seed, log = () => {}) {
  assertProcurementServices(services);

  const beforeCreate = await services.procurement.query.searchPurchaseRequests(createApprovedSearchRequest(seed));
  const beforeCreatePage = assertPurchaseRequestPage(beforeCreate, 'initial purchase request search');
  if (beforeCreatePage.total !== 0 || beforeCreatePage.purchaseRequests.length !== 0) {
    throw new Error(
      'procurement-service smoke failed: SearchPurchaseRequests should return an empty approved page for a fresh tenant'
    );
  }

  log(`purchase-request search empty before create for tenant=${seed.tenantId}`);

  const createdDraft = await requirePurchaseRequest(
    services.procurement.management.createPurchaseRequest(createTextPurchaseRequest(seed)),
    'CreatePurchaseRequest'
  );
  if (createdDraft.status !== PURCHASE_REQUEST_STATUS_DRAFT) {
    throw new Error('procurement-service smoke failed: CreatePurchaseRequest did not create a DRAFT purchase request');
  }

  log(`created purchaseRequest=${createdDraft.purchaseRequestId} no=${createdDraft.requestNo ?? '(none)'}`);

  const submittedRequest = await requirePurchaseRequest(
    services.procurement.management.submitPurchaseRequest(createSubmitRequest(seed, createdDraft.purchaseRequestId)),
    'SubmitPurchaseRequest'
  );
  if (submittedRequest.status !== PURCHASE_REQUEST_STATUS_SUBMITTED) {
    throw new Error('procurement-service smoke failed: SubmitPurchaseRequest did not move the request to SUBMITTED');
  }

  log(`submitted purchaseRequest=${createdDraft.purchaseRequestId}`);

  const approvedRequest = await requirePurchaseRequest(
    services.procurement.management.decidePurchaseRequest(createApproveRequest(seed, createdDraft.purchaseRequestId)),
    'DecidePurchaseRequest'
  );
  if (approvedRequest.status !== PURCHASE_REQUEST_STATUS_APPROVED) {
    throw new Error('procurement-service smoke failed: DecidePurchaseRequest did not approve the request');
  }

  log(`approved purchaseRequest=${createdDraft.purchaseRequestId}`);

  const afterApprove = await services.procurement.query.searchPurchaseRequests(createApprovedSearchRequest(seed));
  const afterApprovePage = assertPurchaseRequestPage(afterApprove, 'post-approve purchase request search');
  const searchedRequest = afterApprovePage.purchaseRequests.find(
    (purchaseRequest) => purchaseRequest?.purchaseRequestId === createdDraft.purchaseRequestId
  );
  if (!searchedRequest) {
    throw new Error('procurement-service smoke failed: approved request did not appear in SearchPurchaseRequests');
  }

  log(`search returned approved purchaseRequest=${createdDraft.purchaseRequestId}`);

  const conversionTarget = await resolveConversionTarget(services, seed);
  if (!conversionTarget) {
    return {
      approvedRequest: {
        purchaseRequestId: approvedRequest.purchaseRequestId,
        requestNo: approvedRequest.requestNo ?? createdDraft.requestNo ?? null,
        status: approvedRequest.status
      },
      searchTotals: {
        beforeCreate: beforeCreatePage.total,
        afterApprove: afterApprovePage.total
      },
      conversion: {
        status: 'skipped',
        reason: 'ACTIVE SupplierOffering bootstrap unavailable',
        purchaseRequestId: null,
        purchaseOrderId: null,
        supplierId: null,
        itemId: null
      }
    };
  }

  const createdStandardDraft = await requirePurchaseRequest(
    services.procurement.management.createPurchaseRequest(
      createStandardItemPurchaseRequest(seed, conversionTarget.itemId)
    ),
    'CreatePurchaseRequest(standard-item)'
  );

  const standardLine = Array.isArray(createdStandardDraft.lines) ? createdStandardDraft.lines[0] : null;
  if (!standardLine?.purchaseRequestLineId) {
    throw new Error(
      'procurement-service smoke failed: standard-item purchase request did not return a persisted purchase-request line'
    );
  }

  await requirePurchaseRequest(
    services.procurement.management.submitPurchaseRequest(
      createSubmitRequest(seed, createdStandardDraft.purchaseRequestId)
    ),
    'SubmitPurchaseRequest(standard-item)'
  );
  await requirePurchaseRequest(
    services.procurement.management.decidePurchaseRequest(
      createApproveRequest(seed, createdStandardDraft.purchaseRequestId)
    ),
    'DecidePurchaseRequest(standard-item)'
  );

  log(`approved standard-item purchaseRequest=${createdStandardDraft.purchaseRequestId}`);

  const purchaseOrder = await requirePurchaseOrder(
    services.procurement.management.convertPurchaseRequestToPurchaseOrder(
      createConvertRequest(seed, createdStandardDraft.purchaseRequestId, standardLine.purchaseRequestLineId, conversionTarget)
    ),
    'ConvertPurchaseRequestToPurchaseOrder'
  );

  log(`converted purchaseRequest=${createdStandardDraft.purchaseRequestId} purchaseOrder=${purchaseOrder.purchaseOrderId}`);

  return {
    approvedRequest: {
      purchaseRequestId: approvedRequest.purchaseRequestId,
      requestNo: approvedRequest.requestNo ?? createdDraft.requestNo ?? null,
      status: approvedRequest.status
    },
    searchTotals: {
      beforeCreate: beforeCreatePage.total,
      afterApprove: afterApprovePage.total
    },
    conversion: {
      status: 'converted',
      reason: null,
      purchaseRequestId: createdStandardDraft.purchaseRequestId,
      purchaseOrderId: purchaseOrder.purchaseOrderId,
      supplierId: conversionTarget.supplierId,
      itemId: conversionTarget.itemId
    }
  };
}

// assertProcurementServices verifies the smoke received the required procurement query and management RPC wrappers.
function assertProcurementServices(services) {
  const search = services?.procurement?.query?.searchPurchaseRequests;
  const create = services?.procurement?.management?.createPurchaseRequest;
  const submit = services?.procurement?.management?.submitPurchaseRequest;
  const decide = services?.procurement?.management?.decidePurchaseRequest;

  if (typeof search !== 'function' || typeof create !== 'function' || typeof submit !== 'function' || typeof decide !== 'function') {
    throw new Error('procurement-service smoke failed: procurement query/management clients are not fully configured');
  }
}

// resolveConversionTarget chooses one active supplier-offering prerequisite from env or an optional bootstrap hook.
async function resolveConversionTarget(services, seed) {
  if (seed.conversionSupplierId && seed.conversionItemId) {
    return {
      supplierId: seed.conversionSupplierId,
      itemId: seed.conversionItemId
    };
  }

  const ensureActiveOffering = services?.bootstrap?.ensureActiveOffering;
  if (typeof ensureActiveOffering !== 'function') {
    return null;
  }

  const target = await ensureActiveOffering(seed);
  if (!target) {
    return null;
  }

  if (!target.supplierId || !target.itemId) {
    throw new Error(
      'procurement-service smoke failed: active offering bootstrap returned an incomplete supplier/item target'
    );
  }

  return target;
}

// createApprovedSearchRequest builds the deterministic approved-request search used for empty-page and post-approve verification.
function createApprovedSearchRequest(seed) {
  return {
    tenantId: seed.tenantId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    keyword: seed.title,
    requestType: PURCHASE_REQUEST_TYPE_DEPARTMENTAL,
    status: PURCHASE_REQUEST_STATUS_APPROVED,
    page: 1,
    pageSize: 20
  };
}

// createTextPurchaseRequest builds the mandatory text-line procurement smoke draft so no downstream lookup is required.
function createTextPurchaseRequest(seed) {
  return {
    tenantId: seed.tenantId,
    orgId: seed.orgId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    auditContext: seed.auditContext,
    requestType: PURCHASE_REQUEST_TYPE_DEPARTMENTAL,
    title: seed.title,
    reason: seed.reason,
    lines: [
      {
        lineType: PURCHASE_REQUEST_LINE_TYPE_TEXT,
        description: seed.textLine.description,
        requestedQuantity: seed.textLine.requestedQuantity,
        uom: seed.textLine.uom
      }
    ]
  };
}

// createStandardItemPurchaseRequest builds the optional standard-item procurement smoke draft used for PO conversion validation.
function createStandardItemPurchaseRequest(seed, itemId) {
  return {
    tenantId: seed.tenantId,
    orgId: seed.orgId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    auditContext: seed.auditContext,
    requestType: PURCHASE_REQUEST_TYPE_DEPARTMENTAL,
    title: seed.conversionTitle,
    reason: seed.reason,
    lines: [
      {
        lineType: PURCHASE_REQUEST_LINE_TYPE_STANDARD_ITEM,
        itemId,
        description: seed.standardItemLine.description,
        requestedQuantity: seed.standardItemLine.requestedQuantity,
        uom: seed.standardItemLine.uom
      }
    ]
  };
}

// createSubmitRequest builds the minimal submission command used for both the text and standard-item smoke requests.
function createSubmitRequest(seed, purchaseRequestId) {
  return {
    tenantId: seed.tenantId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    auditContext: seed.auditContext,
    purchaseRequestId,
    submissionComment: 'submitted by procurement smoke'
  };
}

// createApproveRequest builds the minimal approval command used for both smoke requests.
function createApproveRequest(seed, purchaseRequestId) {
  return {
    tenantId: seed.tenantId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    auditContext: seed.auditContext,
    purchaseRequestId,
    decision: PURCHASE_REQUEST_DECISION_APPROVED,
    comment: 'approved by procurement smoke',
    approvalReference: 'procurement-smoke-approval'
  };
}

// createConvertRequest builds the minimal PO-draft conversion command against one approved standard-item smoke request.
function createConvertRequest(seed, purchaseRequestId, purchaseRequestLineId, conversionTarget) {
  return {
    tenantId: seed.tenantId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    auditContext: seed.auditContext,
    purchaseRequestId,
    supplierId: conversionTarget.supplierId,
    currencyCode: seed.conversionCurrencyCode,
    selectedLines: [
      {
        purchaseRequestLineId,
        purchaseOrderQuantity: seed.standardItemLine.requestedQuantity
      }
    ]
  };
}

// requirePurchaseRequest unwraps the expected procurement purchase_request response envelope or raises a targeted smoke failure.
async function requirePurchaseRequest(responsePromise, step) {
  const response = await responsePromise;
  const purchaseRequest = response?.purchaseRequest;
  if (!purchaseRequest?.purchaseRequestId) {
    throw new Error(`procurement-service smoke failed: ${step} did not return a purchaseRequest payload`);
  }

  return purchaseRequest;
}

// requirePurchaseOrder unwraps the expected procurement purchase_order response envelope or raises a targeted smoke failure.
async function requirePurchaseOrder(responsePromise, step) {
  const response = await responsePromise;
  const purchaseOrder = response?.purchaseOrder;
  if (!purchaseOrder?.purchaseOrderId) {
    throw new Error(`procurement-service smoke failed: ${step} did not return a purchaseOrder payload`);
  }

  return purchaseOrder;
}

// assertPurchaseRequestPage validates the procurement search page payload shape shared by the smoke checks.
function assertPurchaseRequestPage(response, step) {
  if (
    !response ||
    typeof response.total !== 'number' ||
    typeof response.page !== 'number' ||
    typeof response.pageSize !== 'number'
  ) {
    throw new Error(`procurement-service smoke failed: ${step} did not return the expected page payload`);
  }

  return {
    purchaseRequests: Array.isArray(response.purchaseRequests) ? response.purchaseRequests : [],
    total: response.total,
    page: response.page,
    pageSize: response.pageSize
  };
}
