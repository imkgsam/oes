import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

import { createSmokeSeed, runWmsSmokeFlow } from './wms-smoke-lib.mjs'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SERVICE_ROOT = path.resolve(__dirname, '..')
const WORKSPACE_ROOT = path.resolve(SERVICE_ROOT, '../../../..')
const PRISMA_BIN = path.join(WORKSPACE_ROOT, 'node_modules/.bin/prisma')
const SMOKE_SCHEMA = process.env.WMS_SMOKE_SCHEMA || 'wms_service_smoke'

const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')
const { NestFactory } = require('@nestjs/core')
const { ClientProxyFactory, Transport } = require('@nestjs/microservices')
const { firstValueFrom } = require('rxjs')
const { resolveCommonProtoPath } = require('@oes/common/contracts')
const { AppModule } = require(path.join(SERVICE_ROOT, 'dist/app.module.js'))
const { PrismaClient } = require(path.join(SERVICE_ROOT, 'prisma/generated/prisma/index.js'))
const {
  INVENTORY_QUERY_SERVICE_NAME,
  RECEIPT_MANAGEMENT_SERVICE_NAME,
  WAREHOUSE_QUERY_SERVICE_NAME
} = require(path.join(WORKSPACE_ROOT, 'src/common/dist/generated/wms_service/wms.js'))

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
    delete process.env[key]
  }
}

// loadServiceEnv reuses the local wms-service .env file so smoke follows the same runtime endpoints and database conventions.
function loadServiceEnv() {
  const envPath = path.join(SERVICE_ROOT, '.env')
  if (!existsSync(envPath)) {
    return
  }

  const content = readFileSync(envPath, 'utf8')
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const rawValue = line.slice(separatorIndex + 1).trim()
    const value =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

// normalizeGrpcClientHost converts wildcard listen hosts into a loopback target that the local smoke client can dial.
function normalizeGrpcClientHost(host) {
  if (!host || host === '0.0.0.0' || host === '::' || host === '[::]') {
    return '127.0.0.1'
  }

  return host
}

// resolveGrpcTarget returns one explicit host:port pair from a service URL env var or a fallback endpoint.
function resolveGrpcTarget(explicitUrl, fallbackHost, fallbackPort) {
  if (!explicitUrl?.trim()) {
    return {
      host: fallbackHost,
      port: fallbackPort
    }
  }

  const [host = fallbackHost, port = fallbackPort] = explicitUrl.trim().split(':', 2)
  return { host, port }
}

// applySmokeDatabaseUrl rewrites DATABASE_URL to a dedicated smoke schema so live verification stays isolated from the default service schema.
function applySmokeDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error('wms-service smoke failed: DATABASE_URL is not configured')
  }

  const parsed = new URL(process.env.DATABASE_URL)
  parsed.searchParams.set('schema', SMOKE_SCHEMA)
  process.env.DATABASE_URL = parsed.toString()
  return process.env.DATABASE_URL
}

// ensureSmokeSchema pushes the Prisma model into the dedicated smoke schema before the live runtime starts.
function ensureSmokeSchema(databaseUrl) {
  try {
    execFileSync(
      PRISMA_BIN,
      ['db', 'push', '--schema=./prisma/schema.prisma', '--skip-generate', '--accept-data-loss'],
      {
        cwd: SERVICE_ROOT,
        encoding: 'utf8',
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl
        },
        stdio: 'pipe'
      }
    )
  } catch (error) {
    const parsed = new URL(databaseUrl)
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
        : String(error)
    throw new Error(
      `unable to prepare smoke schema ${SMOKE_SCHEMA} at ${parsed.hostname}:${parsed.port || '(default-port)'}/${parsed.pathname.replace(/^\//, '')}; prisma detail: ${detail}`
    )
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
  })
}

// cleanupSmokeFixture removes any rows created by a prior smoke run for the same tenant prefix.
async function cleanupSmokeFixture(prisma, seed) {
  await prisma.wmsAuditEnvelope.deleteMany({
    where: {
      tenantId: seed.tenantId
    }
  })
  await prisma.inventoryBalance.deleteMany({
    where: {
      tenantId: seed.tenantId
    }
  })
  await prisma.stockLedgerEntry.deleteMany({
    where: {
      tenantId: seed.tenantId
    }
  })
  await prisma.receiptLine.deleteMany({
    where: {
      tenantId: seed.tenantId
    }
  })
  await prisma.receipt.deleteMany({
    where: {
      tenantId: seed.tenantId
    }
  })
  await prisma.location.deleteMany({
    where: {
      tenantId: seed.tenantId
    }
  })
  await prisma.warehouse.deleteMany({
    where: {
      tenantId: seed.tenantId
    }
  })
  await prisma.wmsSequenceCounter.deleteMany({
    where: {
      tenantId: seed.tenantId
    }
  })
}

// seedWmsSmokeFixture inserts the minimal local WMS warehouse and storage location required for posting smoke inventory.
async function seedWmsSmokeFixture(prisma, seed) {
  await prisma.warehouse.create({
    data: {
      id: seed.warehouseId,
      tenantId: seed.tenantId,
      orgId: seed.orgId,
      warehouseCode: seed.warehouseCode,
      warehouseName: seed.warehouseName,
      warehouseScope: 'INTERNAL',
      status: 'ACTIVE',
      defaultReceivingLocationId: seed.locationId,
      createdAt: new Date('2026-04-29T10:00:00.000Z'),
      updatedAt: new Date('2026-04-29T10:00:00.000Z')
    }
  })

  await prisma.location.create({
    data: {
      id: seed.locationId,
      tenantId: seed.tenantId,
      warehouseId: seed.warehouseId,
      locationCode: seed.locationCode,
      locationName: seed.locationName,
      locationScope: 'INTERNAL',
      locationType: 'STORAGE',
      status: 'ACTIVE',
      supportsReceipt: true,
      supportsStorage: true,
      createdAt: new Date('2026-04-29T10:00:00.000Z'),
      updatedAt: new Date('2026-04-29T10:00:00.000Z')
    }
  })
}

// loadGrpcPackage loads one grpc-js package descriptor from the shared contract directory.
function loadGrpcPackage(relativeProtoPath) {
  const definition = protoLoader.loadSync(resolveCommonProtoPath(relativeProtoPath), {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  })

  return grpc.loadPackageDefinition(definition)
}

// startItemMasterStub starts one local gRPC query stub that always returns the stockable smoke item expected by PostReceipt.
async function startItemMasterStub(seed) {
  const pkg = loadGrpcPackage('item_master_service/item_master.proto')
  const target = resolveGrpcTarget(process.env.GRPC_SERVICE_ITEM_MASTER_URL, '127.0.0.1', '50058')
  const server = new grpc.Server()

  server.addService(pkg.item_master_service.ItemMasterQueryService.service, {
    GetItem(call, callback) {
      callback(null, {
        item: {
          itemId: call.request.itemId,
          itemCode: seed.itemCode,
          itemName: seed.itemName,
          active: true,
          capabilities: {
            stockable: true
          }
        }
      })
    }
  })

  await bindGrpcServer(server, target)
  return {
    server,
    target: `${target.host}:${target.port}`
  }
}

// startProcurementStub starts one local receiving-expectation query stub so the configured procurement client target is reachable during smoke startup.
async function startProcurementStub() {
  const pkg = loadGrpcPackage('procurement_service/procurement.proto')
  const target = resolveGrpcTarget(process.env.GRPC_SERVICE_PROCUREMENT_URL, '127.0.0.1', '50062')
  const server = new grpc.Server()

  server.addService(pkg.procurement_service.ReceivingExpectationQueryService.service, {
    GetReceivingExpectation(_call, callback) {
      callback(null, {})
    }
  })

  await bindGrpcServer(server, target)
  return {
    server,
    target: `${target.host}:${target.port}`
  }
}

// bindGrpcServer binds and starts one raw grpc-js server on the requested host:port endpoint.
async function bindGrpcServer(server, target) {
  await new Promise((resolve, reject) => {
    server.bindAsync(
      `${target.host}:${target.port}`,
      grpc.ServerCredentials.createInsecure(),
      (error) => {
        if (error) {
          reject(error)
          return
        }

        server.start()
        resolve()
      }
    )
  })
}

// startWmsRuntime boots the compiled Nest microservice with the same gRPC transport contract used by the real service entrypoint.
async function startWmsRuntime() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'wms_service',
      protoPath: [resolveCommonProtoPath('wms_service/wms.proto')],
      url: `${process.env.GRPC_LISTEN_HOST || '0.0.0.0'}:${process.env.GRPC_LISTEN_PORT || '50064'}`
    }
  })

  await app.listen()
  return app
}

// createWmsGrpcClient binds one direct gRPC client to the running local wms-service endpoint.
function createWmsGrpcClient() {
  const host = normalizeGrpcClientHost(
    process.env.WMS_SERVICE_GRPC_HOST || process.env.GRPC_LISTEN_HOST || '127.0.0.1'
  )
  const port = process.env.WMS_SERVICE_GRPC_PORT || process.env.GRPC_LISTEN_PORT || '50064'

  return ClientProxyFactory.create({
    transport: Transport.GRPC,
    options: {
      package: 'wms_service',
      protoPath: [resolveCommonProtoPath('wms_service/wms.proto')],
      url: `${host}:${port}`
    }
  })
}

// createWmsServices wraps the generated WMS observable clients into promise-returning helpers for smoke verification.
function createWmsServices(client) {
  const warehouseQuery = client.getService(WAREHOUSE_QUERY_SERVICE_NAME)
  const receiptManagement = client.getService(RECEIPT_MANAGEMENT_SERVICE_NAME)
  const inventoryQuery = client.getService(INVENTORY_QUERY_SERVICE_NAME)

  return {
    warehouse: {
      query: {
        listWarehouses: async (request) => firstValueFrom(warehouseQuery.listWarehouses(request))
      }
    },
    receipt: {
      management: {
        createReceiptDraft: async (request) =>
          firstValueFrom(receiptManagement.createReceiptDraft(request)),
        addOrReplaceReceiptLines: async (request) =>
          firstValueFrom(receiptManagement.addOrReplaceReceiptLines(request)),
        postReceipt: async (request) => firstValueFrom(receiptManagement.postReceipt(request))
      }
    },
    inventory: {
      query: {
        searchStockLedgerEntries: async (request) =>
          firstValueFrom(inventoryQuery.searchStockLedgerEntries(request)),
        searchInventoryBalances: async (request) =>
          firstValueFrom(inventoryQuery.searchInventoryBalances(request))
      }
    }
  }
}

// closeClient closes one Nest gRPC client proxy after smoke verification completes.
async function closeClient(client) {
  if (!client) {
    return
  }

  await client.close()
}

// forceShutdownServer terminates one raw grpc-js stub server without surfacing shutdown noise into the smoke result.
async function forceShutdownServer(server) {
  if (!server) {
    return
  }

  await new Promise((resolve) => server.tryShutdown(() => resolve()))
}

// main runs the WMS live smoke against the local service endpoint and emits one JSON summary for terminal consumers.
async function main() {
  disableProxyForLocalGrpc()
  loadServiceEnv()

  const databaseUrl = applySmokeDatabaseUrl()
  ensureSmokeSchema(databaseUrl)

  const seed = createSmokeSeed()
  const prisma = createPrismaClient(databaseUrl)

  let itemMasterStub
  let procurementStub
  let wmsApp
  let wmsClient

  try {
    await prisma.$connect()
    await cleanupSmokeFixture(prisma, seed)
    await seedWmsSmokeFixture(prisma, seed)

    itemMasterStub = await startItemMasterStub(seed)
    procurementStub = await startProcurementStub()
    wmsApp = await startWmsRuntime()
    wmsClient = createWmsGrpcClient()

    const services = createWmsServices(wmsClient)
    const result = await runWmsSmokeFlow(services, seed, (message) =>
      console.log(`[wms-smoke] ${message}`)
    )

    console.log(
      JSON.stringify(
        {
          tenantId: seed.tenantId,
          warehouseId: seed.warehouseId,
          locationId: seed.locationId,
          itemId: seed.itemId,
          receiptId: result.receipt.receiptId,
          postedStockLedgerEntryIds: result.postedStockLedgerEntryIds,
          warehouseTotal: result.warehouse.total,
          ledgerTotal: result.ledger.total,
          balanceTotal: result.balance.total,
          grpcTarget: `${normalizeGrpcClientHost(process.env.GRPC_LISTEN_HOST || '127.0.0.1')}:${process.env.GRPC_LISTEN_PORT || '50064'}`,
          downstreamTargets: {
            itemMaster: itemMasterStub.target,
            procurement: procurementStub.target
          },
          smokeSchema: SMOKE_SCHEMA
        },
        null,
        2
      )
    )
  } finally {
    await closeClient(wmsClient).catch(() => undefined)
    await wmsApp?.close().catch(() => undefined)
    await forceShutdownServer(itemMasterStub?.server).catch(() => undefined)
    await forceShutdownServer(procurementStub?.server).catch(() => undefined)
    await cleanupSmokeFixture(prisma, seed).catch(() => undefined)
    await prisma.$disconnect().catch(() => undefined)
  }
}

await main().catch((error) => {
  throw new Error(
    error instanceof Error ? `wms-service smoke failed: ${error.message}` : String(error)
  )
})
