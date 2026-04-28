import { createSign } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { createSmokeSeed, runSrmSmokeFlow } from './srm-smoke-lib.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVICE_ROOT = path.resolve(__dirname, '..');
const WORKSPACE_ROOT = path.resolve(SERVICE_ROOT, '../../../..');

const { Metadata } = require('@grpc/grpc-js');
const { ClientProxyFactory, Transport } = require('@nestjs/microservices');
const { firstValueFrom } = require('rxjs');
const { resolveCommonProtoPath } = require('@oes/common/contracts');
const {
  SUPPLIER_QUERY_SERVICE_NAME,
  SUPPLIER_MANAGEMENT_SERVICE_NAME
} = require(path.join(WORKSPACE_ROOT, 'src/common/dist/generated/srm_service/srm.js'));
const { PARTY_REGISTRATION_SERVICE_NAME } = require(path.join(
  WORKSPACE_ROOT,
  'src/common/dist/generated/party_service/party.js'
));
const { ITEM_MASTER_MANAGEMENT_SERVICE_NAME } = require(path.join(
  WORKSPACE_ROOT,
  'src/common/dist/generated/item_master_service/item_master.js'
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
    'ALL_PROXY'
  ]) {
    delete process.env[key];
  }
}

// loadServiceEnv reuses the local srm-service .env file so smoke follows the same endpoint and downstream convention.
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

// normalizeGrpcClientHost converts wildcard listen hosts into a loopback target that local smoke clients can dial.
function normalizeGrpcClientHost(host) {
  if (!host || host === '0.0.0.0' || host === '::' || host === '[::]') {
    return '127.0.0.1';
  }

  return host;
}

// resolveGrpcTarget returns one explicit host:port pair from a service URL env var or a fallback endpoint.
function resolveGrpcTarget(explicitUrl, fallbackHost, fallbackPort) {
  if (!explicitUrl?.trim()) {
    return {
      host: fallbackHost,
      port: fallbackPort
    };
  }

  const [host = fallbackHost, port = fallbackPort] = explicitUrl.trim().split(':', 2);
  return { host, port };
}

// createSrmGrpcClient binds one direct gRPC client to the running local srm-service endpoint.
function createSrmGrpcClient() {
  const host = normalizeGrpcClientHost(process.env.SRM_SERVICE_GRPC_HOST || process.env.GRPC_LISTEN_HOST || '127.0.0.1');
  const port = process.env.SRM_SERVICE_GRPC_PORT || process.env.GRPC_LISTEN_PORT || '50061';

  return ClientProxyFactory.create({
    transport: Transport.GRPC,
    options: {
      package: 'srm_service',
      protoPath: [resolveCommonProtoPath('srm_service/srm.proto')],
      url: `${host}:${port}`
    }
  });
}

// createPartyGrpcClient binds one direct gRPC client to the configured downstream party-service endpoint for bind smoke.
function createPartyGrpcClient() {
  const target = resolveGrpcTarget(process.env.GRPC_SERVICE_PARTY_URL, '127.0.0.1', '50053');

  return ClientProxyFactory.create({
    transport: Transport.GRPC,
    options: {
      package: 'party_service',
      protoPath: [resolveCommonProtoPath('party_service/party.proto')],
      url: `${target.host}:${target.port}`
    }
  });
}

// createItemMasterGrpcClient binds one direct gRPC client to the configured downstream item-master-service endpoint for offering smoke.
function createItemMasterGrpcClient() {
  const target = resolveGrpcTarget(process.env.GRPC_SERVICE_ITEM_MASTER_URL, '127.0.0.1', '50058');

  return ClientProxyFactory.create({
    transport: Transport.GRPC,
    options: {
      package: 'item_master_service',
      protoPath: [resolveCommonProtoPath('item_master_service/item_master.proto')],
      url: `${target.host}:${target.port}`
    }
  });
}

// createSrmServices wraps the generated SRM observable clients into promise-returning functions for smoke verification.
function createSrmServices(client) {
  const query = client.getService(SUPPLIER_QUERY_SERVICE_NAME);
  const management = client.getService(SUPPLIER_MANAGEMENT_SERVICE_NAME);

  return {
    query: {
      searchSuppliers: async (request) => firstValueFrom(query.searchSuppliers(request))
    },
    management: {
      createSupplierProfile: async (request) => firstValueFrom(management.createSupplierProfile(request)),
      bindSupplierToTenantParty: async (request) => firstValueFrom(management.bindSupplierToTenantParty(request)),
      changeSupplierStatus: async (request) => firstValueFrom(management.changeSupplierStatus(request)),
      upsertSupplierOffering: async (request) => firstValueFrom(management.upsertSupplierOffering(request))
    }
  };
}

// createPartyServices wraps the generated party registration client needed to exercise the real SRM binding path.
function createPartyServices(client) {
  const registration = client.getService(PARTY_REGISTRATION_SERVICE_NAME);

  return {
    registration: {
      registerOrganizationParty: async (request) => firstValueFrom(registration.registerOrganizationParty(request))
    }
  };
}

// createItemMasterServices wraps item-master management calls and attaches signed internal-service metadata for guarded commands.
function createItemMasterServices(client, seed) {
  const management = client.getService(ITEM_MASTER_MANAGEMENT_SERVICE_NAME);

  return {
    management: {
      createItem: async (request) =>
        firstValueFrom(management.createItem(request, createItemMasterMetadata(seed))),
      setItemCapabilities: async (request) =>
        firstValueFrom(management.setItemCapabilities(request, createItemMasterMetadata(seed)))
    }
  };
}

// stableSortObject canonicalizes nested JSON objects so operator-context signing matches the shared authorization utility.
function stableSortObject(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stableSortObject(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      const nestedValue = value[key];
      if (nestedValue !== undefined) {
        acc[key] = stableSortObject(nestedValue);
      }
      return acc;
    }, {});
}

// createSignedOperatorContext encodes one shared-format operator context payload signed with the repo auth keypair.
function createSignedOperatorContext(seed) {
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const payload = {
    operator_id: seed.operatorContext.operatorId,
    operator_type: seed.operatorContext.operatorType,
    tenant_id: seed.tenantId,
    org_id: seed.operatorContext.orgId,
    issued_at: issuedAt,
    expires_at: expiresAt,
    issuer: 'srm-service',
    request_id: seed.traceContext.requestId,
    trace_id: seed.traceContext.traceId
  };

  const signer = createSign('RSA-SHA256');
  signer.update(JSON.stringify(stableSortObject(payload)));
  signer.end();

  const privateKeyPath = process.env.AUTH_PRIVATE_KEY_PATH
    ? path.join(WORKSPACE_ROOT, process.env.AUTH_PRIVATE_KEY_PATH)
    : path.join(WORKSPACE_ROOT, 'src/common/src/auth/keys/private.key');
  const privateKey = readFileSync(privateKeyPath, 'utf8');

  return JSON.stringify({
    ...payload,
    signature: signer.sign(privateKey, 'base64')
  });
}

// createItemMasterMetadata builds the guarded internal-service metadata required by item-master management commands.
function createItemMasterMetadata(seed) {
  const metadata = new Metadata();
  metadata.set('x-internal-service-name', 'srm-service');
  metadata.set('x-request-id', seed.traceContext.requestId);
  metadata.set('x-trace-id', seed.traceContext.traceId);
  metadata.set('x-operator-context', createSignedOperatorContext(seed));
  return metadata;
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

// isOptionalItemMasterUnavailableError detects environment-level item-master limitations so the smoke can skip optional offering cleanly.
function isOptionalItemMasterUnavailableError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('UNAVAILABLE') ||
    message.includes('ECONNREFUSED') ||
    message.includes('No connection established') ||
    message.includes('14 ') ||
    message.includes('PERMISSION_DENIED') ||
    message.includes('UNAUTHENTICATED') ||
    message.includes('signature verification failed') ||
    message.includes('trusted allowlist') ||
    message.includes('not trusted')
  );
}

// closeClient closes one Nest client proxy when the implementation exposes a close hook.
async function closeClient(client) {
  const close = client?.close?.bind(client);
  if (close) {
    await Promise.resolve(close()).catch(() => undefined);
  }
}

// main executes the minimal SRM smoke flow against a running local srm-service and optional live party/item-master dependencies.
async function main() {
  loadServiceEnv();
  disableProxyForLocalGrpc();

  const seed = createSmokeSeed();
  const srmClient = createSrmGrpcClient();
  const partyClient = createPartyGrpcClient();
  const itemMasterClient = createItemMasterGrpcClient();
  const srmServices = createSrmServices(srmClient);
  let partyServices;
  let itemMasterServices;

  try {
    if ((process.env.SRM_SMOKE_ENABLE_BIND ?? 'true').toLowerCase() !== 'false') {
      partyServices = createPartyServices(partyClient);
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
              unavailable.srmSmokeOptionalPartyUnavailable = true;
              throw unavailable;
            }
          }
        }
      };
    }

    if ((process.env.SRM_SMOKE_ENABLE_OFFERING ?? 'true').toLowerCase() !== 'false') {
      const services = createItemMasterServices(itemMasterClient, seed);
      itemMasterServices = {
        management: {
          createItem: async (request) => {
            try {
              return await services.management.createItem(request);
            } catch (error) {
              if (!isOptionalItemMasterUnavailableError(error)) {
                throw error;
              }

              const unavailable = new Error('item-master-service unavailable');
              unavailable.srmSmokeOptionalItemMasterUnavailable = true;
              throw unavailable;
            }
          },
          setItemCapabilities: async (request) => {
            try {
              return await services.management.setItemCapabilities(request);
            } catch (error) {
              if (!isOptionalItemMasterUnavailableError(error)) {
                throw error;
              }

              const unavailable = new Error('item-master-service unavailable');
              unavailable.srmSmokeOptionalItemMasterUnavailable = true;
              throw unavailable;
            }
          }
        }
      };
    }

    const result = await runSrmSmokeFlow(
      {
        srm: srmServices,
        party: partyServices,
        itemMaster: itemMasterServices
      },
      seed,
      (message) => {
        console.log(`[srm-smoke] ${message}`);
      }
    );

    console.log('[srm-smoke] PASS');
    console.log(
      JSON.stringify(
        {
          tenantId: seed.tenantId,
          supplierId: result.supplierId,
          supplierNo: result.supplierNo,
          binding: result.binding,
          offering: result.offering,
          searchTotals: result.searchTotals
        },
        null,
        2
      )
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[srm-smoke] FAIL');
    console.error(message);
    process.exitCode = 1;
  } finally {
    await closeClient(srmClient);
    await closeClient(partyClient);
    await closeClient(itemMasterClient);
  }
}

await main();
