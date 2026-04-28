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
  SALES_QUERY_SERVICE_NAME,
} = require(path.join(WORKSPACE_ROOT, 'src/common/dist/generated/sales_service/sales.js'));

// loadServiceEnv reuses the local sales-service .env file so smoke follows the same endpoint and DB convention.
function loadServiceEnv() {
  const envPath = path.join(SERVICE_ROOT, '.env');
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

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

// createGrpcClient binds one direct gRPC client to the running local sales-service endpoint.
function createGrpcClient() {
  const host = process.env.SALES_SERVICE_GRPC_HOST || process.env.GRPC_LISTEN_HOST || '127.0.0.1';
  const port = process.env.SALES_SERVICE_GRPC_PORT || process.env.GRPC_LISTEN_PORT || '50059';

  return ClientProxyFactory.create({
    transport: Transport.GRPC,
    options: {
      package: 'sales_service',
      protoPath: [resolveCommonProtoPath('sales_service/sales.proto')],
      url: `${host}:${port}`,
    },
  });
}

// buildSearchQuotesRequest creates one contract-valid query that should succeed with an empty page on a clean DB.
function buildSearchQuotesRequest() {
  const timestamp = new Date().toISOString();

  return {
    tenantId: process.env.SALES_SMOKE_TENANT_ID || 'sales-smoke-tenant',
    page: 1,
    pageSize: 20,
    operatorContext: {
      operatorId: process.env.SALES_SMOKE_OPERATOR_ID || 'sales-smoke-operator',
      operatorType: process.env.SALES_SMOKE_OPERATOR_TYPE || 'HUMAN',
      orgId: process.env.SALES_SMOKE_ORG_ID || 'sales-smoke-org',
    },
    traceContext: {
      traceId: process.env.SALES_SMOKE_TRACE_ID || `sales-smoke-trace-${timestamp}`,
      requestId: process.env.SALES_SMOKE_REQUEST_ID || `sales-smoke-request-${timestamp}`,
    },
  };
}

// main executes one SearchQuotes query and asserts the response is a successful empty-or-nonempty page payload.
async function main() {
  loadServiceEnv();

  const client = createGrpcClient();

  try {
    const queryService = client.getService(SALES_QUERY_SERVICE_NAME);
    const request = buildSearchQuotesRequest();
    const response = await firstValueFrom(queryService.searchQuotes(request));

    if (!response || typeof response.total !== 'number' || typeof response.page !== 'number' || typeof response.pageSize !== 'number') {
      throw new Error('searchQuotes did not return the expected page payload.');
    }

    const quotes = Array.isArray(response.quotes) ? response.quotes : [];

    console.log('[sales-smoke] PASS');
    console.log(
      JSON.stringify(
        {
          tenantId: request.tenantId,
          page: response.page,
          pageSize: response.pageSize,
          total: response.total,
          quoteCount: quotes.length,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[sales-smoke] FAIL');
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
