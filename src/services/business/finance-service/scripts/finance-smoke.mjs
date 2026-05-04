import { existsSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVICE_ROOT = path.resolve(__dirname, '..');
const WORKSPACE_ROOT = path.resolve(SERVICE_ROOT, '../../../..');

const { firstValueFrom } = require('rxjs');
const { resolveCommonProtoPath } = require('@oes/common/contracts');
const {
  AccountTransactionDirection,
  AccountTransactionSourceType,
  AccountTransactionStatus,
  CustomerFinancialAccountProviderType,
  FinancialAccountType,
  FINANCIAL_ACCOUNT_MANAGEMENT_SERVICE_NAME,
  FINANCIAL_ACCOUNT_QUERY_SERVICE_NAME,
  PAYMENT_MANAGEMENT_SERVICE_NAME,
  PAYMENT_QUERY_SERVICE_NAME,
  RECEIVABLE_MANAGEMENT_SERVICE_NAME
} = require(path.join(WORKSPACE_ROOT, 'src/common/dist/generated/finance_service/finance.js'));
const { PrismaClient } = require(path.join(SERVICE_ROOT, 'prisma/generated/prisma'));

/** disableProxyForLocalGrpc clears proxy-related env vars so grpc-js can reach localhost directly during smoke verification. */
function disableProxyForLocalGrpc() {
  for (const key of [
    'grpc_proxy',
    'GRPC_PROXY',
    'http_proxy',
    'HTTP_PROXY',
    'https_proxy',
    'HTTPS_PROXY',
    'all_proxy',
    'ALL_PROXY'
  ]) {
    delete process.env[key];
  }
}

/** loadServiceEnv reuses finance-service .env so smoke follows the same local runtime endpoint and database convention. */
function loadServiceEnv() {
  const envPath = path.join(SERVICE_ROOT, '.env');
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    const value =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

/** normalizeGrpcClientHost turns wildcard listen hosts into a loopback address that the smoke client can dial. */
function normalizeGrpcClientHost(host) {
  if (!host || host === '0.0.0.0' || host === '::' || host === '[::]') {
    return '127.0.0.1';
  }

  return host;
}

/** createGrpcClient binds one direct gRPC client to the running local finance-service endpoint. */
function createGrpcClient() {
  const { ClientProxyFactory, Transport } = require('@nestjs/microservices');
  const host = normalizeGrpcClientHost(
    process.env.FINANCE_SERVICE_GRPC_HOST || process.env.GRPC_LISTEN_HOST || '127.0.0.1'
  );
  const port = process.env.FINANCE_SERVICE_GRPC_PORT || process.env.GRPC_LISTEN_PORT || '50063';

  return ClientProxyFactory.create({
    transport: Transport.GRPC,
    options: {
      package: 'finance_service',
      protoPath: [resolveCommonProtoPath('finance_service/finance.proto')],
      url: `${host}:${port}`
    }
  });
}

/** createSmokeSeed builds one isolated tenant-scoped seed so the live finance smoke can assert empty-first behavior safely. */
function createSmokeSeed(now = Date.now()) {
  const suffix = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  const inflowTransactionTime = new Date(now).toISOString();
  const receivableDueDate = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const payableDueDate = new Date(now - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const paymentExecutedAt = new Date(now + 5 * 60 * 1000).toISOString();
  const outflowTransactionTime = new Date(now + 10 * 60 * 1000).toISOString();
  const supplierAccountIdentifier = `622203000000${suffix
    .replace(/[^0-9]/g, '')
    .slice(-8)
    .padStart(8, '0')}`;

  return {
    tenantId: process.env.FINANCE_SMOKE_TENANT_ID || `finance-smoke-tenant-${suffix}`,
    orgId: process.env.FINANCE_SMOKE_ORG_ID || 'finance-smoke-org',
    operatorContext: {
      operatorId: process.env.FINANCE_SMOKE_OPERATOR_ID || 'finance-smoke-operator',
      operatorType: process.env.FINANCE_SMOKE_OPERATOR_TYPE || 'HUMAN',
      orgId: process.env.FINANCE_SMOKE_ORG_ID || 'finance-smoke-org'
    },
    traceContext: {
      traceId: process.env.FINANCE_SMOKE_TRACE_ID || `finance-smoke-trace-${suffix}`,
      requestId: process.env.FINANCE_SMOKE_REQUEST_ID || `finance-smoke-request-${suffix}`
    },
    auditContext: {
      auditId: process.env.FINANCE_SMOKE_AUDIT_ID || `finance-smoke-audit-${suffix}`,
      reason: process.env.FINANCE_SMOKE_AUDIT_REASON || 'finance-service smoke verification',
      source: process.env.FINANCE_SMOKE_AUDIT_SOURCE || 'finance-smoke'
    },
    accountName: process.env.FINANCE_SMOKE_ACCOUNT_NAME || `Finance Smoke Account ${suffix}`,
    accountIdentifier:
      process.env.FINANCE_SMOKE_ACCOUNT_IDENTIFIER || `622202000000${suffix.replace(/[^0-9]/g, '').slice(-8).padStart(8, '0')}`,
    customerTenantPartyId:
      process.env.FINANCE_SMOKE_CUSTOMER_TENANT_PARTY_ID || `finance-smoke-customer-${suffix}`,
    customerSnapshot:
      process.env.FINANCE_SMOKE_CUSTOMER_SNAPSHOT || `Finance Smoke Customer ${suffix}`,
    salesOrderId: process.env.FINANCE_SMOKE_SALES_ORDER_ID || `finance-smoke-sales-order-${suffix}`,
    purchaseOrderId:
      process.env.FINANCE_SMOKE_PURCHASE_ORDER_ID || `finance-smoke-purchase-order-${suffix}`,
    purchaseOrderNo:
      process.env.FINANCE_SMOKE_PURCHASE_ORDER_NO || `FIN-SMOKE-PO-${suffix.slice(-6).toUpperCase()}`,
    supplierTenantPartyId:
      process.env.FINANCE_SMOKE_SUPPLIER_TENANT_PARTY_ID || `finance-smoke-supplier-${suffix}`,
    supplierSnapshot:
      process.env.FINANCE_SMOKE_SUPPLIER_SNAPSHOT || `Finance Smoke Supplier ${suffix}`,
    supplierFinancialAccountId:
      process.env.FINANCE_SMOKE_SUPPLIER_FINANCIAL_ACCOUNT_ID || randomUUID(),
    supplierAccountHolderName:
      process.env.FINANCE_SMOKE_SUPPLIER_ACCOUNT_HOLDER_NAME ||
      `Finance Smoke Supplier Account ${suffix}`,
    supplierAccountIdentifier:
      process.env.FINANCE_SMOKE_SUPPLIER_ACCOUNT_IDENTIFIER || supplierAccountIdentifier,
    currencyCode: process.env.FINANCE_SMOKE_CURRENCY_CODE || 'CNY',
    inflowTransactionTime,
    receivableDueDate,
    payableDueDate,
    paymentExecutedAt,
    outflowTransactionTime
  };
}

/** createFinanceServices wraps the generated finance RPC clients into promise-returning helpers for smoke verification. */
function createFinanceServices(client) {
  const query = client.getService(FINANCIAL_ACCOUNT_QUERY_SERVICE_NAME);
  const accountManagement = client.getService(FINANCIAL_ACCOUNT_MANAGEMENT_SERVICE_NAME);
  const receivableManagement = client.getService(RECEIVABLE_MANAGEMENT_SERVICE_NAME);
  const paymentManagement = client.getService(PAYMENT_MANAGEMENT_SERVICE_NAME);
  const paymentQuery = client.getService(PAYMENT_QUERY_SERVICE_NAME);

  return {
    query: {
      searchFinancialAccounts: async (request) =>
        firstValueFrom(query.searchFinancialAccounts(request))
    },
    accountManagement: {
      createFinancialAccount: async (request) =>
        firstValueFrom(accountManagement.createFinancialAccount(request)),
      recordAccountTransaction: async (request) =>
        firstValueFrom(accountManagement.recordAccountTransaction(request)),
      registerCustomerFinancialAccount: async (request) =>
        firstValueFrom(accountManagement.registerCustomerFinancialAccount(request))
    },
    receivableManagement: {
      createReceivableScheduleFromSalesOrder: async (request) =>
        firstValueFrom(receivableManagement.createReceivableScheduleFromSalesOrder(request))
    },
    paymentManagement: {
      createPayableScheduleFromPurchaseOrder: async (request) =>
        firstValueFrom(paymentManagement.createPayableScheduleFromPurchaseOrder(request)),
      createPaymentRequest: async (request) =>
        firstValueFrom(paymentManagement.createPaymentRequest(request)),
      decidePaymentRequest: async (request) =>
        firstValueFrom(paymentManagement.decidePaymentRequest(request)),
      executePaymentRequest: async (request) =>
        firstValueFrom(paymentManagement.executePaymentRequest(request)),
      allocatePaymentToPayable: async (request) =>
        firstValueFrom(paymentManagement.allocatePaymentToPayable(request)),
      allocatePaymentToReceivable: async (request) =>
        firstValueFrom(paymentManagement.allocatePaymentToReceivable(request))
    },
    paymentQuery: {
      searchPayableSchedules: async (request) =>
        firstValueFrom(paymentQuery.searchPayableSchedules(request)),
      searchPaymentRequests: async (request) =>
        firstValueFrom(paymentQuery.searchPaymentRequests(request)),
      searchPaymentExecutions: async (request) =>
        firstValueFrom(paymentQuery.searchPaymentExecutions(request)),
      searchPaymentAllocations: async (request) =>
        firstValueFrom(paymentQuery.searchPaymentAllocations(request))
    }
  };
}

/** createQueryContext returns the shared read context required by finance query RPCs. */
function createQueryContext(seed) {
  return {
    tenantId: seed.tenantId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext
  };
}

/** createManagementContext returns the shared command context required by finance management RPCs. */
function createManagementContext(seed) {
  return {
    tenantId: seed.tenantId,
    orgId: seed.orgId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    auditContext: seed.auditContext
  };
}

/** maskAccountIdentifier returns one stable masked account snapshot for smoke fixtures and downstream assertions. */
function maskAccountIdentifier(accountIdentifier) {
  const suffix = accountIdentifier.slice(-4);
  return `***${suffix}`;
}

/** seedSupplierFinancialAccount inserts one supplier beneficiary account fixture because phase 1B payment smoke depends on a valid supplier account id. */
async function seedSupplierFinancialAccount(prisma, seed, log = () => {}) {
  await prisma.supplierFinancialAccount.create({
    data: {
      id: seed.supplierFinancialAccountId,
      tenantId: seed.tenantId,
      supplierTenantPartyId: seed.supplierTenantPartyId,
      accountHolderName: seed.supplierAccountHolderName,
      accountProviderType: 'BANK',
      accountIdentifierMasked: maskAccountIdentifier(seed.supplierAccountIdentifier),
      currencyCode: seed.currencyCode,
      isDefault: true,
      verifiedStatus: 'UNVERIFIED'
    }
  });

  log(`seedSupplierFinancialAccount supplierAccount=${seed.supplierFinancialAccountId}`);
}

/** runFinanceSmokeFlow executes the required phase 1A and phase 1B live gRPC smoke against one running finance-service instance. */
async function runFinanceSmokeFlow(services, prisma, seed, log = () => {}) {
  const initialPage = await services.query.searchFinancialAccounts({
    ...createQueryContext(seed),
    keyword: seed.accountName,
    page: 1,
    pageSize: 20
  });

  if (!initialPage || initialPage.total !== 0 || (initialPage.financialAccounts?.length ?? 0) !== 0) {
    throw new Error(
      'finance-service smoke failed: SearchFinancialAccounts should return an empty page for a fresh smoke tenant'
    );
  }

  log(`searchFinancialAccounts empty for tenant=${seed.tenantId}`);

  const createAccountResponse = await services.accountManagement.createFinancialAccount({
    ...createManagementContext(seed),
    accountType: FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_BANK,
    accountName: seed.accountName,
    currencyCode: seed.currencyCode,
    institutionName: 'Smoke Bank',
    accountIdentifier: seed.accountIdentifier
  });

  const financialAccount = createAccountResponse?.financialAccount;
  if (!financialAccount?.financialAccountId) {
    throw new Error('finance-service smoke failed: CreateFinancialAccount did not return a financial account id');
  }

  log(`createFinancialAccount account=${financialAccount.financialAccountId}`);

  const recordTransactionResponse = await services.accountManagement.recordAccountTransaction({
    ...createManagementContext(seed),
    financialAccountId: financialAccount.financialAccountId,
    direction: AccountTransactionDirection.ACCOUNT_TRANSACTION_DIRECTION_INFLOW,
    amount: '1200.00',
    currencyCode: seed.currencyCode,
    transactionTime: seed.inflowTransactionTime,
    sourceType: AccountTransactionSourceType.ACCOUNT_TRANSACTION_SOURCE_TYPE_MANUAL,
    status: AccountTransactionStatus.ACCOUNT_TRANSACTION_STATUS_CONFIRMED,
    externalReference: `finance-smoke-ref-${seed.traceContext.requestId}`,
    counterpartyName: seed.customerSnapshot,
    counterpartyAccountSnapshot: '***8888',
    memo: 'finance smoke inflow'
  });

  const accountTransaction = recordTransactionResponse?.accountTransaction;
  if (!accountTransaction?.accountTransactionId) {
    throw new Error('finance-service smoke failed: RecordAccountTransaction did not return an account transaction id');
  }

  log(`recordAccountTransaction transaction=${accountTransaction.accountTransactionId}`);

  const registerCustomerResponse = await services.accountManagement.registerCustomerFinancialAccount({
    ...createManagementContext(seed),
    customerTenantPartyId: seed.customerTenantPartyId,
    accountHolderName: seed.customerSnapshot,
    accountProviderType: CustomerFinancialAccountProviderType.CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_BANK,
    accountIdentifier: `9558800000${seed.traceContext.requestId.slice(-4)}`,
    currencyCode: seed.currencyCode,
    isDefault: true
  });

  const customerFinancialAccount = registerCustomerResponse?.customerFinancialAccount;
  if (!customerFinancialAccount?.customerFinancialAccountId) {
    throw new Error(
      'finance-service smoke failed: RegisterCustomerFinancialAccount did not return a customer financial account id'
    );
  }

  log(`registerCustomerFinancialAccount customerAccount=${customerFinancialAccount.customerFinancialAccountId}`);

  const receivableResponse = await services.receivableManagement.createReceivableScheduleFromSalesOrder({
    ...createManagementContext(seed),
    salesOrderId: seed.salesOrderId,
    customerTenantPartyId: seed.customerTenantPartyId,
    customerSnapshot: seed.customerSnapshot,
    currencyCode: seed.currencyCode,
    salesExchangeRateSnapshot: '7.200000',
    lines: [
      {
        dueDate: seed.receivableDueDate,
        scheduledAmount: '1200.00',
        sourceSalesOrderLineId: `${seed.salesOrderId}-line-1`,
        memo: 'finance smoke receivable line'
      }
    ]
  });

  const receivableSchedule = receivableResponse?.receivableSchedule;
  const receivableLine = receivableSchedule?.lines?.[0];
  if (!receivableSchedule?.receivableScheduleId || !receivableLine?.receivableScheduleLineId) {
    throw new Error(
      'finance-service smoke failed: CreateReceivableScheduleFromSalesOrder did not return the persisted schedule and line ids'
    );
  }

  log(`createReceivableScheduleFromSalesOrder schedule=${receivableSchedule.receivableScheduleId}`);

  const allocateResponse = await services.paymentManagement.allocatePaymentToReceivable({
    ...createManagementContext(seed),
    accountTransactionId: accountTransaction.accountTransactionId,
    allocations: [
      {
        receivableScheduleId: receivableSchedule.receivableScheduleId,
        receivableScheduleLineId: receivableLine.receivableScheduleLineId,
        allocatedAmount: '1200.00'
      }
    ]
  });

  const paymentAllocation = allocateResponse?.paymentAllocations?.[0];
  if (!paymentAllocation?.paymentAllocationId) {
    throw new Error(
      'finance-service smoke failed: AllocatePaymentToReceivable did not return a payment allocation id'
    );
  }

  log(`allocatePaymentToReceivable allocation=${paymentAllocation.paymentAllocationId}`);

  await seedSupplierFinancialAccount(prisma, seed, log);

  const payableResponse = await services.paymentManagement.createPayableScheduleFromPurchaseOrder({
    ...createManagementContext(seed),
    purchaseOrderId: seed.purchaseOrderId,
    purchaseOrderNo: seed.purchaseOrderNo,
    procurementSnapshotReference: `${seed.purchaseOrderId}-snapshot`,
    supplierTenantPartyId: seed.supplierTenantPartyId,
    supplierSnapshot: seed.supplierSnapshot,
    currencyCode: seed.currencyCode,
    lines: [
      {
        lineType: 'TERM_DUE',
        sourceRef: `${seed.purchaseOrderId}/term-1`,
        dueDate: seed.payableDueDate,
        scheduledAmount: '300.00',
        sourcePurchaseOrderLineId: `${seed.purchaseOrderId}-line-1`,
        memo: 'finance smoke payable line'
      }
    ]
  });

  const payableSchedule = payableResponse?.payableSchedule;
  const payableLine = payableSchedule?.lines?.[0];
  if (!payableSchedule?.payableScheduleId || !payableLine?.payableScheduleLineId) {
    throw new Error(
      'finance-service smoke failed: CreatePayableScheduleFromPurchaseOrder did not return the persisted schedule and line ids'
    );
  }

  log(`createPayableScheduleFromPurchaseOrder schedule=${payableSchedule.payableScheduleId}`);

  const paymentRequestResponse = await services.paymentManagement.createPaymentRequest({
    ...createManagementContext(seed),
    requestSource: 'FINANCE_INITIATED',
    supplierTenantPartyId: seed.supplierTenantPartyId,
    beneficiarySupplierFinancialAccountId: seed.supplierFinancialAccountId,
    currencyCode: seed.currencyCode,
    requestedAmount: '300.00',
    requestedLines: [
      {
        payableScheduleId: payableSchedule.payableScheduleId,
        payableScheduleLineId: payableLine.payableScheduleLineId,
        requestedAmount: '300.00'
      }
    ],
    evidenceSnapshots: [
      {
        evidenceType: 'SUPPLIER_INVOICE',
        externalDocumentNo: `${seed.purchaseOrderNo}-invoice`,
        documentDate: seed.payableDueDate,
        currencyCode: seed.currencyCode,
        documentAmount: '300.00',
        attachmentRef: 'asset://finance-smoke-supplier-invoice',
        note: 'finance smoke supplier invoice snapshot'
      }
    ]
  });

  const paymentRequest = paymentRequestResponse?.paymentRequest;
  if (!paymentRequest?.paymentRequestId) {
    throw new Error('finance-service smoke failed: CreatePaymentRequest did not return a payment request id');
  }

  log(`createPaymentRequest request=${paymentRequest.paymentRequestId}`);

  const decidedResponse = await services.paymentManagement.decidePaymentRequest({
    ...createManagementContext(seed),
    paymentRequestId: paymentRequest.paymentRequestId,
    decision: 'APPROVED'
  });

  const approvedRequest = decidedResponse?.paymentRequest;
  if (!approvedRequest?.paymentRequestId || approvedRequest.status !== 'APPROVED') {
    throw new Error('finance-service smoke failed: DecidePaymentRequest did not approve the payment request');
  }

  log(`decidePaymentRequest request=${approvedRequest.paymentRequestId}`);

  const executeResponse = await services.paymentManagement.executePaymentRequest({
    ...createManagementContext(seed),
    paymentRequestId: paymentRequest.paymentRequestId,
    sourceFinancialAccountId: financialAccount.financialAccountId,
    executedAmount: '300.00',
    currencyCode: seed.currencyCode,
    executedAt: seed.paymentExecutedAt,
    executionReference: `${seed.purchaseOrderNo}-execution`,
    attachmentRefs: ['asset://finance-smoke-payment-proof']
  });

  const paymentExecution = executeResponse?.paymentExecution;
  if (!paymentExecution?.paymentExecutionId) {
    throw new Error('finance-service smoke failed: ExecutePaymentRequest did not return a payment execution id');
  }

  log(`executePaymentRequest execution=${paymentExecution.paymentExecutionId}`);

  const outflowResponse = await services.accountManagement.recordAccountTransaction({
    ...createManagementContext(seed),
    financialAccountId: financialAccount.financialAccountId,
    direction: AccountTransactionDirection.ACCOUNT_TRANSACTION_DIRECTION_OUTFLOW,
    amount: '300.00',
    currencyCode: seed.currencyCode,
    transactionTime: seed.outflowTransactionTime,
    sourceType: AccountTransactionSourceType.ACCOUNT_TRANSACTION_SOURCE_TYPE_MANUAL,
    status: AccountTransactionStatus.ACCOUNT_TRANSACTION_STATUS_CONFIRMED,
    externalReference: `${seed.purchaseOrderNo}-execution`,
    counterpartyName: seed.supplierSnapshot,
    counterpartyAccountSnapshot: maskAccountIdentifier(seed.supplierAccountIdentifier),
    memo: 'finance smoke outflow payment transaction'
  });

  const outflowTransaction = outflowResponse?.accountTransaction;
  if (!outflowTransaction?.accountTransactionId) {
    throw new Error(
      'finance-service smoke failed: RecordAccountTransaction did not return an outflow account transaction id'
    );
  }

  log(`recordAccountTransaction outflow=${outflowTransaction.accountTransactionId}`);

  const payableAllocationResponse = await services.paymentManagement.allocatePaymentToPayable({
    ...createManagementContext(seed),
    accountTransactionId: outflowTransaction.accountTransactionId,
    paymentExecutionId: paymentExecution.paymentExecutionId,
    allocations: [
      {
        payableScheduleId: payableSchedule.payableScheduleId,
        payableScheduleLineId: payableLine.payableScheduleLineId,
        allocatedAmount: '300.00'
      }
    ]
  });

  const payableAllocation = payableAllocationResponse?.paymentAllocations?.[0];
  if (!payableAllocation?.paymentAllocationId) {
    throw new Error(
      'finance-service smoke failed: AllocatePaymentToPayable did not return a payment allocation id'
    );
  }

  log(`allocatePaymentToPayable allocation=${payableAllocation.paymentAllocationId}`);

  const payableSchedules = await services.paymentQuery.searchPayableSchedules({
    ...createQueryContext(seed),
    sourcePurchaseOrderId: seed.purchaseOrderId,
    page: 1,
    pageSize: 20
  });
  if ((payableSchedules?.total ?? 0) !== 1 || payableSchedules?.payableSchedules?.[0]?.status !== 'PAID') {
    throw new Error(
      'finance-service smoke failed: SearchPayableSchedules did not surface the paid payable schedule'
    );
  }

  log(`searchPayableSchedules total=${payableSchedules.total}`);

  const paymentRequests = await services.paymentQuery.searchPaymentRequests({
    ...createQueryContext(seed),
    supplierTenantPartyId: seed.supplierTenantPartyId,
    page: 1,
    pageSize: 20
  });
  if (
    (paymentRequests?.total ?? 0) !== 1 ||
    paymentRequests?.paymentRequests?.[0]?.paymentRequestId !== paymentRequest.paymentRequestId
  ) {
    throw new Error(
      'finance-service smoke failed: SearchPaymentRequests did not surface the created payment request'
    );
  }

  log(`searchPaymentRequests total=${paymentRequests.total}`);

  const paymentExecutions = await services.paymentQuery.searchPaymentExecutions({
    ...createQueryContext(seed),
    paymentRequestId: paymentRequest.paymentRequestId,
    page: 1,
    pageSize: 20
  });
  if (
    (paymentExecutions?.total ?? 0) !== 1 ||
    paymentExecutions?.paymentExecutions?.[0]?.paymentExecutionId !==
      paymentExecution.paymentExecutionId
  ) {
    throw new Error(
      'finance-service smoke failed: SearchPaymentExecutions did not surface the recorded payment execution'
    );
  }

  log(`searchPaymentExecutions total=${paymentExecutions.total}`);

  const paymentAllocations = await services.paymentQuery.searchPaymentAllocations({
    ...createQueryContext(seed),
    paymentExecutionId: paymentExecution.paymentExecutionId,
    targetType: 'PAYABLE_SCHEDULE_LINE',
    targetScheduleId: payableSchedule.payableScheduleId,
    page: 1,
    pageSize: 20
  });
  if (
    (paymentAllocations?.total ?? 0) !== 1 ||
    paymentAllocations?.paymentAllocations?.[0]?.paymentAllocationId !==
      payableAllocation.paymentAllocationId
  ) {
    throw new Error(
      'finance-service smoke failed: SearchPaymentAllocations did not surface the payable allocation'
    );
  }

  log(`searchPaymentAllocations total=${paymentAllocations.total}`);

  return {
    tenantId: seed.tenantId,
    financialAccountId: financialAccount.financialAccountId,
    accountTransactionId: accountTransaction.accountTransactionId,
    customerFinancialAccountId: customerFinancialAccount.customerFinancialAccountId,
    receivableScheduleId: receivableSchedule.receivableScheduleId,
    receivableScheduleLineId: receivableLine.receivableScheduleLineId,
    receivablePaymentAllocationId: paymentAllocation.paymentAllocationId,
    supplierFinancialAccountId: seed.supplierFinancialAccountId,
    payableScheduleId: payableSchedule.payableScheduleId,
    payableScheduleLineId: payableLine.payableScheduleLineId,
    paymentRequestId: paymentRequest.paymentRequestId,
    paymentExecutionId: paymentExecution.paymentExecutionId,
    outflowAccountTransactionId: outflowTransaction.accountTransactionId,
    payablePaymentAllocationId: payableAllocation.paymentAllocationId
  };
}

/** main executes the finance live smoke against a running local finance-service instance and prints one concise verification summary. */
async function main() {
  disableProxyForLocalGrpc();
  loadServiceEnv();

  const client = createGrpcClient();
  const services = createFinanceServices(client);
  const prisma = new PrismaClient();
  const seed = createSmokeSeed();

  try {
    const result = await runFinanceSmokeFlow(services, prisma, seed, (message) =>
      console.log(`[finance-smoke] ${message}`)
    );

    console.log('[finance-smoke] PASS');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[finance-smoke] FAIL');
    console.error(message);
    process.exitCode = 1;
  } finally {
    const close = client.close?.bind(client);
    if (close) {
      await Promise.resolve(close()).catch(() => undefined);
    }
    await prisma.$disconnect().catch(() => undefined);
  }
}

await main();
