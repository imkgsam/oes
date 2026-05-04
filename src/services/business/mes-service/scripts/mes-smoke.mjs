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
const { NestFactory } = require('@nestjs/core');
const { ClientProxyFactory, Transport } = require('@nestjs/microservices');
const { firstValueFrom } = require('rxjs');
const { resolveCommonProtoPath } = require('@oes/common/contracts');
const { AppModule } = require(path.join(SERVICE_ROOT, 'dist/app.module.js'));
const { PrismaClient } = require(path.join(SERVICE_ROOT, 'prisma/generated/prisma/index.js'));
const {
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

// ensureSmokeSchema pushes the Prisma model into the dedicated smoke schema before the live runtime starts.
function ensureSmokeSchema(databaseUrl) {
  try {
    execFileSync(PRISMA_BIN, ['db', 'push', '--schema=./prisma/schema.prisma', '--skip-generate'], {
      cwd: SERVICE_ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl
      },
      stdio: 'pipe'
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
  await prisma.moldWarningEvent.deleteMany({ where });
  await prisma.moldUsageEvent.deleteMany({ where });
  await prisma.moldInstallation.deleteMany({ where });
  await prisma.moldMovementEvent.deleteMany({ where });
  await prisma.moldLifeCounter.deleteMany({ where });
  await prisma.productionMoldInstance.deleteMany({ where });
  await prisma.masterMold.deleteMany({ where });
  await prisma.moldDesignOutput.deleteMany({ where });
  await prisma.moldDesign.deleteMany({ where });
  await prisma.resourcePosition.deleteMany({ where });
  await prisma.workCenter.deleteMany({ where });
  await prisma.mesLocation.deleteMany({ where });
}

// seedMesSmokeFixture inserts the minimal MES physical location, work center, and resource position needed for the mold flow.
async function seedMesSmokeFixture(prisma, seed) {
  const createdAt = new Date('2026-05-04T10:00:00.000Z');

  await prisma.mesLocation.createMany({
    data: [
      {
        id: seed.dryingLocationId,
        tenantId: seed.tenantId,
        orgId: seed.orgId,
        locationCode: `DRY-${seed.designCode.slice(-6)}`,
        name: 'MES Smoke Drying Area',
        locationType: 'DRYING',
        parentLocationId: null,
        relatedWorkCenterId: null,
        capacityProfileId: null,
        status: 'ACTIVE',
        createdAt,
        updatedAt: createdAt
      },
      {
        id: seed.readyLocationId,
        tenantId: seed.tenantId,
        orgId: seed.orgId,
        locationCode: `READY-${seed.designCode.slice(-6)}`,
        name: 'MES Smoke Ready Rack',
        locationType: 'AVAILABLE',
        parentLocationId: null,
        relatedWorkCenterId: seed.workCenterId,
        capacityProfileId: null,
        status: 'ACTIVE',
        createdAt,
        updatedAt: createdAt
      }
    ]
  });

  await prisma.workCenter.create({
    data: {
      id: seed.workCenterId,
      tenantId: seed.tenantId,
      orgId: seed.orgId,
      workCenterCode: `WC-${seed.designCode.slice(-6)}`,
      name: 'MES Smoke Work Center',
      workCenterType: 'CASTING_LINE',
      parentWorkCenterId: null,
      relatedMesLocationId: seed.readyLocationId,
      capacityProfileId: null,
      status: 'ACTIVE',
      createdAt,
      updatedAt: createdAt
    }
  });

  await prisma.resourcePosition.create({
    data: {
      id: seed.resourcePositionId,
      tenantId: seed.tenantId,
      orgId: seed.orgId,
      workCenterId: seed.workCenterId,
      positionCode: 'A',
      name: 'MES Smoke Mold Position A',
      positionType: 'MOLD_SLOT',
      compatibleMoldDesignRefs: [],
      status: 'ACTIVE',
      createdAt,
      updatedAt: createdAt
    }
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
  const management = client.getService(MOLD_MANAGEMENT_SERVICE_NAME);
  const query = client.getService(MOLD_QUERY_SERVICE_NAME);

  return {
    management: {
      registerMoldDesign: async (request) => firstValueFrom(management.registerMoldDesign(request)),
      registerProductionMoldInstance: async (request) =>
        firstValueFrom(management.registerProductionMoldInstance(request)),
      moveMold: async (request) => firstValueFrom(management.moveMold(request)),
      installMold: async (request) => firstValueFrom(management.installMold(request)),
      recordMoldUsage: async (request) => firstValueFrom(management.recordMoldUsage(request))
    },
    query: {
      listCurrentMoldsByWorkCenter: async (request) =>
        firstValueFrom(query.listCurrentMoldsByWorkCenter(request)),
      listMoldLifeWarnings: async (request) => firstValueFrom(query.listMoldLifeWarnings(request))
    },
    diagnostics: {
      replaySameCommand: async (request) => {
        await Promise.all([
          firstValueFrom(management.registerProductionMoldInstance(request)),
          firstValueFrom(management.registerProductionMoldInstance(request))
        ]);

        const where = { tenantId: seed.tenantId };
        return {
          productionMoldInstanceCount: await prisma.productionMoldInstance.count({ where }),
          commandOutboxCount: await prisma.mesOutboxEvent.count({
            where: { ...where, commandId: seed.instanceCommandId }
          }),
          commandAuditCount: await prisma.mesAuditEnvelope.count({
            where: { ...where, commandId: seed.instanceCommandId }
          })
        };
      },
      conflictSameCommandDifferentPayload: async (request) => {
        try {
          await firstValueFrom(management.registerProductionMoldInstance(request));
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

// main runs the MES live smoke against the local service endpoint and emits one JSON summary for terminal consumers.
async function main() {
  disableProxyForLocalGrpc();
  loadServiceEnv();

  const databaseUrl = applySmokeDatabaseUrl();
  ensureSmokeSchema(databaseUrl);

  const seed = createSmokeSeed();
  const prisma = createPrismaClient(databaseUrl);

  let mesApp;
  let mesClient;

  try {
    await prisma.$connect();
    await cleanupSmokeFixture(prisma, seed);
    await seedMesSmokeFixture(prisma, seed);

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
          productionMoldInstanceId: result.instance.productionMoldInstanceId,
          workCenterId: seed.workCenterId,
          resourcePositionId: seed.resourcePositionId,
          warningTotal: result.warnings.total,
          installedMoldTotal: result.currentMolds.total,
          idempotency: result.idempotency,
          outbox: result.outbox,
          grpcTarget: `${normalizeGrpcClientHost(process.env.GRPC_LISTEN_HOST || '127.0.0.1')}:${process.env.GRPC_LISTEN_PORT || '50065'}`,
          smokeSchema: SMOKE_SCHEMA
        },
        null,
        2
      )
    );
  } finally {
    await closeClient(mesClient).catch(() => undefined);
    await mesApp?.close().catch(() => undefined);
    await cleanupSmokeFixture(prisma, seed).catch(() => undefined);
    await prisma.$disconnect().catch(() => undefined);
  }
}

await main().catch((error) => {
  throw new Error(error instanceof Error ? `mes-service smoke failed: ${error.message}` : String(error));
});
