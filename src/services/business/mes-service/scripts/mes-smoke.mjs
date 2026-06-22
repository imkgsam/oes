import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { createSmokeSeed, runMesSmokeFlow } from './mes-smoke-lib.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVICE_ROOT = path.resolve(__dirname, '..');
const WORKSPACE_ROOT = path.resolve(SERVICE_ROOT, '../../../..');
const PRISMA_BIN = path.join(WORKSPACE_ROOT, 'node_modules/.bin/prisma');
const SMOKE_SCHEMA = process.env.MES_SMOKE_SCHEMA || 'mes_service_smoke';

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { NestFactory } = require('@nestjs/core');
const { ClientProxyFactory, Transport } = require('@nestjs/microservices');
const { firstValueFrom } = require('rxjs');
const { resolveCommonProtoPath } = require('@oes/common/contracts');
const { AppModule } = require(path.join(SERVICE_ROOT, 'dist/app.module.js'));
const { PrismaClient } = require(path.join(SERVICE_ROOT, 'prisma/generated/prisma/index.js'));
const {
  PRODUCTION_SPEC_MANAGEMENT_SERVICE_NAME,
  MOLD_MANAGEMENT_SERVICE_NAME,
  MOLD_QUERY_SERVICE_NAME
} = require(path.join(WORKSPACE_ROOT, 'src/common/dist/generated/mes_service/mes.js'));

// disableProxyForLocalGrpc clears shell proxy variables so grpc-js can talk to localhost targets directly during smoke verification.
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

// loadServiceEnv reuses the local mes-service .env file so smoke follows the same runtime endpoint and database conventions.
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

// normalizeGrpcClientHost converts wildcard listen hosts into a loopback target that the local smoke client can dial.
function normalizeGrpcClientHost(host) {
  if (!host || host === '0.0.0.0' || host === '::' || host === '[::]') {
    return '127.0.0.1';
  }

  return host;
}

// resolveGrpcTarget returns one explicit host:port pair from a service URL env var or a fallback endpoint.
function resolveGrpcTarget(explicitUrl, fallbackHost, fallbackPort) {
  const value = explicitUrl?.trim();
  if (!value) {
    return { host: fallbackHost, port: fallbackPort };
  }

  const withoutScheme = value.replace(/^grpc:\/\//, '').replace(/^http:\/\//, '').replace(/^https:\/\//, '');
  const [host, port] = withoutScheme.split(':');
  return {
    host: normalizeGrpcClientHost(host || fallbackHost),
    port: port || fallbackPort
  };
}

// applySmokeDatabaseUrl rewrites DATABASE_URL to a dedicated smoke schema so live verification stays isolated from the default service schema.
function applySmokeDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error('mes-service smoke failed: DATABASE_URL is not configured');
  }

  const parsed = new URL(process.env.DATABASE_URL);
  parsed.searchParams.set('schema', SMOKE_SCHEMA);
  process.env.DATABASE_URL = parsed.toString();
  return process.env.DATABASE_URL;
}

// splitSqlStatements strips generated diff comments before replaying DDL into the smoke schema.
function splitSqlStatements(script) {
  return script.replace(/^--.*$/gm, '').trim();
}

// buildBootstrapSql recreates only the dedicated smoke schema before replaying generated Prisma DDL.
function buildBootstrapSql(schemaScript) {
  return [
    `DROP SCHEMA IF EXISTS "${SMOKE_SCHEMA}" CASCADE;`,
    `CREATE SCHEMA "${SMOKE_SCHEMA}";`,
    `SET search_path TO "${SMOKE_SCHEMA}";`,
    splitSqlStatements(schemaScript)
  ]
    .filter((statement) => statement.length > 0)
    .join('\n');
}

// ensureSmokeSchema recreates the dedicated smoke schema without relying on MES db push.
function ensureSmokeSchema(databaseUrl) {
  try {
    const schemaScript = execFileSync(
      PRISMA_BIN,
      ['migrate', 'diff', '--from-empty', '--to-schema-datamodel', './prisma/schema.prisma', '--script'],
      {
        cwd: SERVICE_ROOT,
        encoding: 'utf8',
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl
        },
        stdio: 'pipe'
      }
    );

    execFileSync(PRISMA_BIN, ['db', 'execute', '--stdin', '--schema=./prisma/schema.prisma'], {
      cwd: SERVICE_ROOT,
      input: buildBootstrapSql(schemaScript),
      encoding: 'utf8',
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (error) {
    const parsed = new URL(databaseUrl);
    const detail =
      error && typeof error === 'object'
        ? JSON.stringify(
            {
              message: error.message,
              status: error.status ?? null,
              signal: error.signal ?? null,
              stdout: typeof error.stdout === 'string' ? error.stdout : null,
              stderr: typeof error.stderr === 'string' ? error.stderr : null
            },
            null,
            2
          )
        : String(error);
    throw new Error(
      `unable to prepare smoke schema ${SMOKE_SCHEMA} at ${parsed.hostname}:${parsed.port || '(default-port)'}/${parsed.pathname.replace(/^\//, '')}; prisma detail: ${detail}`
    );
  }
}

// createPrismaClient creates one Prisma client bound to the dedicated smoke schema.
function createPrismaClient(databaseUrl) {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });
}

// cleanupSmokeFixture removes any rows created by a prior smoke run for the same tenant.
async function cleanupSmokeFixture(prisma, seed) {
  const where = {
    tenantId: seed.tenantId
  };

  await prisma.mesCommandIdempotency.deleteMany({ where });
  await prisma.mesOutboxEvent.deleteMany({ where });
  await prisma.mesAuditEnvelope.deleteMany({ where });
  await prisma.moldUsageRecord.deleteMany({ where });
  await prisma.toolingInstallation.deleteMany({ where });
  await prisma.moldMovement.deleteMany({ where });
  await prisma.moldLifeCounter.deleteMany({ where });
  await prisma.productionMold.deleteMany({ where });
  await prisma.masterMold.deleteMany({ where });
  await prisma.moldDesignOutput.deleteMany({ where });
  await prisma.moldDesign.deleteMany({ where });
  await prisma.productionSpec.deleteMany({ where });
  await prisma.workUnit.deleteMany({ where });
  await prisma.workCenter.deleteMany({ where });
  await prisma.carrierResource.deleteMany({ where });
  await prisma.storageResource.deleteMany({ where });
}

// seedMesSmokeFixture inserts the minimal MES storage, carrier, work center, and work unit references needed for the mold flow.
async function seedMesSmokeFixture(prisma, seed) {
  const createdAt = new Date('2026-05-04T10:00:00.000Z');

  await prisma.storageResource.createMany({
    data: [
      {
        id: seed.initialStorageResourceId,
        tenantId: seed.tenantId,
        orgId: seed.orgId,
        orgScope: seed.orgId,
        resourceCode: `DRY-${seed.designCode.slice(-6)}`,
        name: 'MES Smoke Drying Storage',
        status: 'ACTIVE',
        createdAt,
        updatedAt: createdAt
      },
      {
        id: seed.readyStorageResourceId,
        tenantId: seed.tenantId,
        orgId: seed.orgId,
        orgScope: seed.orgId,
        resourceCode: `READY-${seed.designCode.slice(-6)}`,
        name: 'MES Smoke Ready Storage',
        status: 'ACTIVE',
        createdAt,
        updatedAt: createdAt
      }
    ]
  });

  await prisma.carrierResource.create({
    data: {
      id: seed.carrierResourceId,
      tenantId: seed.tenantId,
      orgId: seed.orgId,
      orgScope: seed.orgId,
      resourceCode: `CARRIER-${seed.designCode.slice(-6)}`,
      name: 'MES Smoke Carrier',
      status: 'ACTIVE',
      createdAt,
      updatedAt: createdAt
    }
  });

  await prisma.workCenter.create({
    data: {
      id: seed.workCenterId,
      tenantId: seed.tenantId,
      orgId: seed.orgId,
      orgScope: seed.orgId,
      workCenterCode: `WC-${seed.designCode.slice(-6)}`,
      name: 'MES Smoke Work Center',
      workCenterType: 'CASTING_LINE',
      areaId: null,
      status: 'ACTIVE',
      createdAt,
      updatedAt: createdAt
    }
  });

  await prisma.workUnit.create({
    data: {
      id: seed.workUnitId,
      tenantId: seed.tenantId,
      orgId: seed.orgId,
      workCenterId: seed.workCenterId,
      workUnitCode: 'WU-A',
      name: 'MES Smoke Work Unit A',
      status: 'ACTIVE',
      createdAt,
      updatedAt: createdAt
    }
  });
}

// loadGrpcPackage loads one grpc-js package descriptor from the shared contract directory.
function loadGrpcPackage(relativeProtoPath) {
  const definition = protoLoader.loadSync(resolveCommonProtoPath(relativeProtoPath), {
    keepCase: false,
    longs: String,
    enums: Number,
    defaults: true,
    oneofs: true
  });

  return grpc.loadPackageDefinition(definition);
}

// startItemMasterStub starts one local gRPC query stub that returns a manufacturable physical item for spec validation.
async function startItemMasterStub(seed) {
  const pkg = loadGrpcPackage('item_master_service/item_master.proto');
  const target = resolveGrpcTarget(process.env.GRPC_SERVICE_ITEM_MASTER_URL, '127.0.0.1', '50058');
  const server = new grpc.Server();

  server.addService(pkg.item_master_service.ItemMasterQueryService.service, {
    GetItem(call, callback) {
      callback(null, {
        item: {
          itemId: call.request.itemId,
          itemCode: 'MES-SMOKE-ITEM',
          itemName: 'MES Smoke Item',
          itemType: 1,
          active: true,
          capabilities: {
            manufacturable: true
          }
        }
      });
    }
  });

  await bindGrpcServer(server, target);
  return {
    server,
    target: `${target.host}:${target.port}`
  };
}

// bindGrpcServer binds and starts one raw grpc-js server on the requested host:port endpoint.
async function bindGrpcServer(server, target) {
  await new Promise((resolve, reject) => {
    server.bindAsync(`${target.host}:${target.port}`, grpc.ServerCredentials.createInsecure(), (error) => {
      if (error) {
        reject(error);
        return;
      }

      server.start();
      resolve();
    });
  });
}

// startMesRuntime boots the compiled Nest microservice with the same gRPC transport contract used by the real service entrypoint.
async function startMesRuntime() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'mes_service',
      protoPath: [resolveCommonProtoPath('mes_service/mes.proto')],
      url: `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50065'}`
    }
  });

  await app.listen();
  return app;
}

// createMesGrpcClient binds one direct gRPC client to the running local mes-service endpoint.
function createMesGrpcClient() {
  const host = normalizeGrpcClientHost(
    process.env.MES_SERVICE_GRPC_HOST || process.env.GRPC_LISTEN_HOST || '127.0.0.1'
  );
  const port = process.env.MES_SERVICE_GRPC_PORT || process.env.GRPC_LISTEN_PORT || '50065';

  return ClientProxyFactory.create({
    transport: Transport.GRPC,
    options: {
      package: 'mes_service',
      protoPath: [resolveCommonProtoPath('mes_service/mes.proto')],
      url: `${host}:${port}`
    }
  });
}

// createMesServices wraps the generated MES observable clients into promise-returning helpers for smoke verification.
function createMesServices(client, prisma, seed) {
  const specManagement = client.getService(PRODUCTION_SPEC_MANAGEMENT_SERVICE_NAME);
  const management = client.getService(MOLD_MANAGEMENT_SERVICE_NAME);
  const query = client.getService(MOLD_QUERY_SERVICE_NAME);

  return {
    specManagement: {
      createProductionSpec: async (request) => firstValueFrom(specManagement.createProductionSpec(request)),
      activateProductionSpec: async (request) => firstValueFrom(specManagement.activateProductionSpec(request))
    },
    management: {
      registerMoldDesign: async (request) => firstValueFrom(management.registerMoldDesign(request)),
      registerProductionMold: async (request) => firstValueFrom(management.registerProductionMold(request)),
      confirmProductionMoldArrival: async (request) =>
        firstValueFrom(management.confirmProductionMoldArrival(request)),
      moveTooling: async (request) => firstValueFrom(management.moveTooling(request)),
      installTooling: async (request) => firstValueFrom(management.installTooling(request)),
      confirmInstalledMoldReady: async (request) => firstValueFrom(management.confirmInstalledMoldReady(request)),
      recordMoldUsage: async (request) => firstValueFrom(management.recordMoldUsage(request))
    },
    query: {
      listCurrentMoldsByWorkCenter: async (request) =>
        firstValueFrom(query.listCurrentMoldsByWorkCenter(request)),
      listMoldLifeCounters: async (request) => firstValueFrom(query.listMoldLifeCounters(request))
    },
    diagnostics: {
      replaySameCommand: async (request) => {
        await Promise.all([
          firstValueFrom(management.registerProductionMold(request)),
          firstValueFrom(management.registerProductionMold(request))
        ]);

        const where = { tenantId: seed.tenantId };
        return {
          productionMoldCount: await prisma.productionMold.count({ where }),
          commandOutboxCount: await prisma.mesOutboxEvent.count({
            where: { ...where, commandId: seed.moldCommandId }
          }),
          commandAuditCount: await prisma.mesAuditEnvelope.count({
            where: { ...where, commandId: seed.moldCommandId }
          })
        };
      },
      conflictSameCommandDifferentPayload: async (request) => {
        try {
          await firstValueFrom(management.registerProductionMold(request));
          return { conflicted: false };
        } catch (error) {
          if (error?.code === grpc.status.ALREADY_EXISTS) {
            return { conflicted: true };
          }
          throw error;
        }
      },
      verifyOutbox: async () => {
        const rows = await prisma.mesOutboxEvent.findMany({
          where: { tenantId: seed.tenantId },
          orderBy: { occurredAt: 'asc' }
        });
        return {
          pendingCount: rows.filter((row) => row.status === 'PENDING').length,
          eventTypes: rows.map((row) => row.eventType)
        };
      }
    }
  };
}

// closeClient closes one Nest gRPC client proxy after smoke verification completes.
async function closeClient(client) {
  if (!client) {
    return;
  }

  await client.close();
}

// forceShutdownServer terminates one raw grpc-js stub server without surfacing shutdown noise into the smoke result.
async function forceShutdownServer(server) {
  if (!server) {
    return;
  }

  await new Promise((resolve) => server.tryShutdown(() => resolve()));
}

// main runs the MES live smoke against the local service endpoint and emits one JSON summary for terminal consumers.
async function main() {
  disableProxyForLocalGrpc();
  loadServiceEnv();

  const databaseUrl = applySmokeDatabaseUrl();
  ensureSmokeSchema(databaseUrl);

  const seed = createSmokeSeed();
  const prisma = createPrismaClient(databaseUrl);

  let itemMasterStub;
  let mesApp;
  let mesClient;

  try {
    await prisma.$connect();
    await cleanupSmokeFixture(prisma, seed);
    await seedMesSmokeFixture(prisma, seed);

    itemMasterStub = await startItemMasterStub(seed);
    mesApp = await startMesRuntime();
    mesClient = createMesGrpcClient();

    const services = createMesServices(mesClient, prisma, seed);
    const result = await runMesSmokeFlow(services, seed, (message) => console.log(`[mes-smoke] ${message}`));

    console.log(
      JSON.stringify(
        {
          tenantId: seed.tenantId,
          orgId: seed.orgId,
          moldDesignId: result.design.moldDesignId,
          productionMoldId: result.mold.productionMoldId,
          workCenterId: seed.workCenterId,
          workUnitId: seed.workUnitId,
          lifeCounterTotal: result.counters.total,
          installedMoldTotal: result.currentMolds.items.length,
          idempotency: result.idempotency,
          outbox: result.outbox,
          grpcTarget: `${normalizeGrpcClientHost(process.env.GRPC_LISTEN_HOST || '127.0.0.1')}:${process.env.GRPC_LISTEN_PORT || '50065'}`,
          downstreamTargets: {
            itemMaster: itemMasterStub.target
          },
          smokeSchema: SMOKE_SCHEMA
        },
        null,
        2
      )
    );
  } finally {
    await closeClient(mesClient).catch(() => undefined);
    await mesApp?.close().catch(() => undefined);
    await forceShutdownServer(itemMasterStub?.server).catch(() => undefined);
    await cleanupSmokeFixture(prisma, seed).catch(() => undefined);
    await prisma.$disconnect().catch(() => undefined);
  }
}

await main().catch((error) => {
  throw new Error(error instanceof Error ? `mes-service smoke failed: ${error.message}` : String(error));
});
