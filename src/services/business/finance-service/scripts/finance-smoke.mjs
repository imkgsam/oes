import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVICE_ROOT = path.resolve(__dirname, '..');
const WORKSPACE_ROOT = path.resolve(SERVICE_ROOT, '../../../..');

const { ClientProxyFactory, Transport } = require('@nestjs/microservices');
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
  RECEIVABLE_MANAGEMENT_SERVICE_NAME
} = require(path.join(WORKSPACE_ROOT, 'src/common/dist/generated/finance_service/finance.js'));

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
  const transactionTime = new Date(now).toISOString();
  const dueDate = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

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
    currencyCode: process.env.FINANCE_SMOKE_CURRENCY_CODE || 'CNY',
    transactionTime,
    dueDate
  };
}

/** createFinanceServices wraps the generated finance RPC clients into promise-returning helpers for smoke verification. */
function createFinanceServices(client) {
  const query = client.getService(FINANCIAL_ACCOUNT_QUERY_SERVICE_NAME);
  const accountManagement = client.getService(FINANCIAL_ACCOUNT_MANAGEMENT_SERVICE_NAME);
  const receivableManagement = client.getService(RECEIVABLE_MANAGEMENT_SERVICE_NAME);
  const paymentManagement = client.getService(PAYMENT_MANAGEMENT_SERVICE_NAME);

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
      allocatePaymentToReceivable: async (request) =>
        firstValueFrom(paymentManagement.allocatePaymentToReceivable(request))
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

/** runFinanceSmokeFlow executes the required phase 1A live gRPC smoke against one running finance-service instance. */
async function runFinanceSmokeFlow(services, seed, log = () => {}) {
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
    transactionTime: seed.transactionTime,
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
        dueDate: seed.dueDate,
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

  return {
    tenantId: seed.tenantId,
    financialAccountId: financialAccount.financialAccountId,
    accountTransactionId: accountTransaction.accountTransactionId,
    customerFinancialAccountId: customerFinancialAccount.customerFinancialAccountId,
    receivableScheduleId: receivableSchedule.receivableScheduleId,
    receivableScheduleLineId: receivableLine.receivableScheduleLineId,
    paymentAllocationId: paymentAllocation.paymentAllocationId
  };
}

/** main executes the finance live smoke against a running local finance-service instance and prints one concise verification summary. */
async function main() {
  disableProxyForLocalGrpc();
  loadServiceEnv();

  const client = createGrpcClient();
  const services = createFinanceServices(client);
  const seed = createSmokeSeed();

  try {
    const result = await runFinanceSmokeFlow(services, seed, (message) =>
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
  }
}

await main();
