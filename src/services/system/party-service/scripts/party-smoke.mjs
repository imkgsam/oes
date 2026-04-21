import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { createSmokeSeed, runPartySmokeFlow } from './party-smoke-lib.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVICE_ROOT = path.resolve(__dirname, '..');
const WORKSPACE_ROOT = path.resolve(SERVICE_ROOT, '../../../..');

const { ClientProxyFactory, Transport } = require('@nestjs/microservices');
const { firstValueFrom } = require('rxjs');
const { resolveCommonProtoPath } = require('@oes/common/contracts');
const {
  PARTY_QUERY_SERVICE_NAME,
  PARTY_REGISTRATION_SERVICE_NAME,
} = require(path.join(WORKSPACE_ROOT, 'src/common/dist/generated/party_service/party.js'));

// Loads the local party-service .env so smoke uses the same target as the running service by default.
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

// Creates one direct gRPC client bound to the local party-service endpoint for smoke verification.
function createGrpcClient() {
  const host = process.env.PARTY_SERVICE_GRPC_HOST || process.env.GRPC_LISTEN_HOST || '127.0.0.1';
  const port = process.env.PARTY_SERVICE_GRPC_PORT || process.env.GRPC_LISTEN_PORT || '50053';

  return ClientProxyFactory.create({
    transport: Transport.GRPC,
    options: {
      package: 'party_service',
      protoPath: [resolveCommonProtoPath('party_service/party.proto')],
      url: `${host}:${port}`,
    },
  });
}

// Wraps generated observable-based gRPC clients into promise-returning functions for the smoke flow.
function createSmokeServices(client) {
  const registration = client.getService(PARTY_REGISTRATION_SERVICE_NAME);
  const query = client.getService(PARTY_QUERY_SERVICE_NAME);

  return {
    registration: {
      registerOrganizationParty: async (request) => firstValueFrom(registration.registerOrganizationParty(request)),
    },
    query: {
      searchPartyCandidates: async (request) => firstValueFrom(query.searchPartyCandidates(request)),
      getTenantPartyById: async (request) => firstValueFrom(query.getTenantPartyById(request)),
    },
  };
}

// Executes the local smoke flow against a running party-service instance and prints a compact result summary.
async function main() {
  loadServiceEnv();

  const seed = createSmokeSeed();
  const client = createGrpcClient();
  const services = createSmokeServices(client);

  try {
    const result = await runPartySmokeFlow(services, seed, (message) => {
      console.log(`[party-smoke] ${message}`);
    });

    console.log('[party-smoke] PASS');
    console.log(
      JSON.stringify(
        {
          tenantId: seed.tenantId,
          partyId: result.partyId,
          tenantPartyId: result.tenantPartyId,
          matchResult: result.matchResult,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[party-smoke] FAIL');
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
