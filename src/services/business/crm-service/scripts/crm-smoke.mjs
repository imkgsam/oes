import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { createSmokeSeed, runCrmSmokeFlow } from './crm-smoke-lib.mjs';

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
const { PARTY_REGISTRATION_SERVICE_NAME } = require(path.join(
  WORKSPACE_ROOT,
  'src/common/dist/generated/party_service/party.js',
));

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

// createPartyGrpcClient binds one direct gRPC client to the configured downstream party-service endpoint for bind smoke.
function createPartyGrpcClient() {
  const explicitUrl = process.env.GRPC_SERVICE_PARTY_URL?.trim();
  const [host = '127.0.0.1', port = '50053'] = explicitUrl ? explicitUrl.split(':', 2) : ['127.0.0.1', '50053'];

  return ClientProxyFactory.create({
    transport: Transport.GRPC,
    options: {
      package: 'party_service',
      protoPath: [resolveCommonProtoPath('party_service/party.proto')],
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
      searchSelectableCustomers: async (request) => firstValueFrom(query.searchSelectableCustomers(request)),
    },
    management: {
      createCustomerAccount: async (request) => firstValueFrom(management.createCustomerAccount(request)),
      bindCustomerAccountToTenantParty: async (request) =>
        firstValueFrom(management.bindCustomerAccountToTenantParty(request)),
    },
  };
}

// createPartyServices wraps the generated party registration client needed to exercise the real CRM binding path.
function createPartyServices(client) {
  const registration = client.getService(PARTY_REGISTRATION_SERVICE_NAME);

  return {
    registration: {
      registerOrganizationParty: async (request) => firstValueFrom(registration.registerOrganizationParty(request)),
    },
  };
}

// isOptionalPartyUnavailableError detects environment-level party unavailability so the smoke can skip optional binding cleanly.
function isOptionalPartyUnavailableError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('UNAVAILABLE') ||
    message.includes('ECONNREFUSED') ||
    message.includes('No connection established') ||
    message.includes('14 ')
  );
}

// closeClient closes one Nest client proxy when the implementation exposes a close hook.
async function closeClient(client) {
  const close = client?.close?.bind(client);
  if (close) {
    await Promise.resolve(close()).catch(() => undefined);
  }
}

// main executes the minimal CRM smoke flow against a running local crm-service and optionally a live party-service.
async function main() {
  loadServiceEnv();
  disableProxyForLocalGrpc();

  const seed = createSmokeSeed();
  const crmClient = createCrmGrpcClient();
  const partyClient = createPartyGrpcClient();
  const crmServices = createCrmServices(crmClient);
  let partyServices;

  try {
    try {
      if ((process.env.CRM_SMOKE_ENABLE_BIND ?? 'true').toLowerCase() !== 'false') {
        partyServices = createPartyServices(partyClient);
      }
    } catch (error) {
      if (!isOptionalPartyUnavailableError(error)) {
        throw error;
      }
    }

    if (partyServices) {
      const registerOrganizationParty = partyServices.registration.registerOrganizationParty;
      partyServices = {
        registration: {
          registerOrganizationParty: async (request) => {
            try {
              return await registerOrganizationParty(request);
            } catch (error) {
              if (!isOptionalPartyUnavailableError(error)) {
                throw error;
              }

              const unavailable = new Error('party-service unavailable');
              unavailable.crmSmokeOptionalPartyUnavailable = true;
              throw unavailable;
            }
          },
        },
      };
    }

    const result = await runCrmSmokeFlow(
      {
        crm: crmServices,
        party: partyServices,
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
          customerAccountId: result.customerAccountId,
          customerAccountNo: result.customerAccountNo,
          bindingStatus: result.binding.status,
          tenantPartyId: result.binding.tenantPartyId,
          selectableTotals: result.selectableTotals,
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
    await closeClient(partyClient);
  }
}

await main();
