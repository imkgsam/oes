import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { createSmokeSeed, runCrmP1SmokeFlow } from './crm-smoke-lib.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVICE_ROOT = path.resolve(__dirname, '..');
const WORKSPACE_ROOT = path.resolve(SERVICE_ROOT, '../../../..');

const { ClientProxyFactory, Transport } = require('@nestjs/microservices');
const { firstValueFrom } = require('rxjs');
const { resolveCommonProtoPath } = require('@oes/common/contracts');
const {
  CUSTOMER_QUERY_SERVICE_NAME,
  CUSTOMER_MANAGEMENT_SERVICE_NAME,
} = require(path.join(WORKSPACE_ROOT, 'src/common/dist/generated/crm_service/crm.js'));

// disableProxyForLocalGrpc clears shell proxy variables so grpc-js talks to localhost directly during smoke verification.
function disableProxyForLocalGrpc() {
  for (const key of [
    'grpc_proxy',
    'GRPC_PROXY',
    'http_proxy',
    'HTTP_PROXY',
    'https_proxy',
    'HTTPS_PROXY',
    'all_proxy',
    'ALL_PROXY',
  ]) {
    delete process.env[key];
  }
}

// loadServiceEnv reuses the local crm-service .env file so smoke follows the same endpoint and downstream convention.
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

// normalizeGrpcClientHost converts wildcard listen hosts into a loopback target that local smoke clients can dial.
function normalizeGrpcClientHost(host) {
  if (!host || host === '0.0.0.0' || host === '::' || host === '[::]') {
    return '127.0.0.1';
  }

  return host;
}

// createCrmGrpcClient binds one direct gRPC client to the running local crm-service endpoint.
function createCrmGrpcClient() {
  const host = normalizeGrpcClientHost(
    process.env.CRM_SERVICE_GRPC_HOST || process.env.GRPC_LISTEN_HOST || '127.0.0.1',
  );
  const port = process.env.CRM_SERVICE_GRPC_PORT || process.env.GRPC_LISTEN_PORT || '50060';

  return ClientProxyFactory.create({
    transport: Transport.GRPC,
    options: {
      package: 'crm_service',
      protoPath: [resolveCommonProtoPath('crm_service/crm.proto')],
      url: `${host}:${port}`,
    },
  });
}

// createCrmServices wraps generated CRM observable clients into promise-returning functions for smoke verification.
function createCrmServices(client) {
  const query = client.getService(CUSTOMER_QUERY_SERVICE_NAME);
  const management = client.getService(CUSTOMER_MANAGEMENT_SERVICE_NAME);

  return {
    query: {
      listCrmAccounts: async (request) => firstValueFrom(query.listCrmAccounts(request)),
      getCrmAccount: async (request) => firstValueFrom(query.getCrmAccount(request)),
    },
    management: {
      createLead: async (request) => firstValueFrom(management.createLead(request)),
      convertLeadToProspectCustomer: async (request) =>
        firstValueFrom(management.convertLeadToProspectCustomer(request)),
    },
  };
}

// closeClient closes one Nest client proxy when the implementation exposes a close hook.
async function closeClient(client) {
  const close = client?.close?.bind(client);
  if (close) {
    await Promise.resolve(close()).catch(() => undefined);
  }
}

// main executes the CRM P1 smoke flow against a running local crm-service.
async function main() {
  loadServiceEnv();
  disableProxyForLocalGrpc();

  const seed = createSmokeSeed();
  const crmClient = createCrmGrpcClient();
  const crmServices = createCrmServices(crmClient);

  try {
    const result = await runCrmP1SmokeFlow(
      {
        crm: crmServices,
      },
      seed,
      (message) => {
        console.log(`[crm-smoke] ${message}`);
      },
    );

    console.log('[crm-smoke] PASS');
    console.log(
      JSON.stringify(
        {
          tenantId: seed.tenantId,
          crmAccountId: result.crmAccountId,
          conversionResultType: result.conversionResultType,
          tenantPartyId: result.tenantPartyId,
          listTotals: result.listTotals,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[crm-smoke] FAIL');
    console.error(message);
    process.exitCode = 1;
  } finally {
    await closeClient(crmClient);
  }
}

await main();
