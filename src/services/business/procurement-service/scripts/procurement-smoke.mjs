import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

import { createSmokeSeed, runProcurementSmokeFlow } from './procurement-smoke-lib.mjs'

const require = createRequire(import.meta.url)
const serviceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = path.resolve(serviceRoot, '../../../..')
const { ClientProxyFactory, Transport } = require('@nestjs/microservices')
const { firstValueFrom } = require('rxjs')
const { resolveCommonProtoPath } = require('@oes/common/contracts')
const { PURCHASE_REQUEST_QUERY_SERVICE_NAME, PURCHASE_REQUEST_MANAGEMENT_SERVICE_NAME } = require(
  path.join(workspaceRoot, 'src/common/dist/generated/procurement_service/procurement.js')
)

/** Clears shell proxy settings so the local Procurement smoke client dials loopback directly. */
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
  ])
    delete process.env[key]
}

/** Loads only the local Procurement service environment when a fixture file exists. */
function loadServiceEnv() {
  const envPath = path.join(serviceRoot, '.env')
  if (!existsSync(envPath)) return
  for (const rawLine of readFileSync(envPath, 'utf8').split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const separator = line.indexOf('=')
    if (separator < 0) continue
    const key = line.slice(0, separator).trim()
    const raw = line.slice(separator + 1).trim()
    const value =
      (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))
        ? raw.slice(1, -1)
        : raw
    if (!(key in process.env)) process.env[key] = value
  }
}

/** Creates the direct Procurement client only; SRM provisioning intentionally enters through Gateway elsewhere. */
function createProcurementGrpcClient() {
  const rawHost =
    process.env.PROCUREMENT_SERVICE_GRPC_HOST || process.env.GRPC_LISTEN_HOST || '127.0.0.1'
  const host = ['0.0.0.0', '::', '[::]'].includes(rawHost) ? '127.0.0.1' : rawHost
  const port = process.env.PROCUREMENT_SERVICE_GRPC_PORT || process.env.GRPC_LISTEN_PORT || '50062'
  return ClientProxyFactory.create({
    transport: Transport.GRPC,
    options: {
      package: 'procurement_service',
      protoPath: [resolveCommonProtoPath('procurement_service/procurement.proto')],
      url: `${host}:${port}`
    }
  })
}

/** Wraps only Procurement's own generated smoke RPCs and carries no downstream SRM authority. */
function createProcurementServices(client) {
  const query = client.getService(PURCHASE_REQUEST_QUERY_SERVICE_NAME)
  const management = client.getService(PURCHASE_REQUEST_MANAGEMENT_SERVICE_NAME)
  return {
    query: {
      searchPurchaseRequests: async (request) =>
        firstValueFrom(query.searchPurchaseRequests(request))
    },
    management: {
      createPurchaseRequest: async (request) =>
        firstValueFrom(management.createPurchaseRequest(request)),
      submitPurchaseRequest: async (request) =>
        firstValueFrom(management.submitPurchaseRequest(request)),
      decidePurchaseRequest: async (request) =>
        firstValueFrom(management.decidePurchaseRequest(request)),
      convertPurchaseRequestToPurchaseOrder: async (request) =>
        firstValueFrom(management.convertPurchaseRequestToPurchaseOrder(request))
    }
  }
}

/** Runs Procurement smoke without the retired direct SRM bootstrap hook. */
async function main() {
  disableProxyForLocalGrpc()
  loadServiceEnv()
  const client = createProcurementGrpcClient()
  try {
    const result = await runProcurementSmokeFlow(
      { procurement: createProcurementServices(client), bootstrap: {} },
      createSmokeSeed(),
      (message) => console.log(`[procurement-smoke] ${message}`)
    )
    console.log(JSON.stringify(result, null, 2))
  } finally {
    if (typeof client?.close === 'function') await client.close()
  }
}

await main().catch((error) => {
  console.error(
    error instanceof Error ? `procurement-service smoke failed: ${error.message}` : String(error)
  )
  process.exitCode = 1
})
