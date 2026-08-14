import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

import { createSmokeSeed, runProcurementSmokeFlow } from './procurement-smoke-lib.mjs'
import {
  createGatewayItemManagementClient,
  createPurchasableSmokeItem
} from '../../../../../scripts/local/item-master-smoke-fixture.mjs'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SERVICE_ROOT = path.resolve(__dirname, '..')
const WORKSPACE_ROOT = path.resolve(SERVICE_ROOT, '../../../..')

const { ClientProxyFactory, Transport } = require('@nestjs/microservices')
const { firstValueFrom } = require('rxjs')
const { resolveCommonProtoPath } = require('@oes/common/contracts')
const { PURCHASE_REQUEST_QUERY_SERVICE_NAME, PURCHASE_REQUEST_MANAGEMENT_SERVICE_NAME } = require(
  path.join(WORKSPACE_ROOT, 'src/common/dist/generated/procurement_service/procurement.js')
)
const { SUPPLIER_MANAGEMENT_SERVICE_NAME } = require(
  path.join(WORKSPACE_ROOT, 'src/common/dist/generated/srm_service/srm.js')
)
const { PARTY_REGISTRATION_SERVICE_NAME } = require(
  path.join(WORKSPACE_ROOT, 'src/common/dist/generated/party_service/party.js')
)

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

// loadServiceEnv reuses the local procurement-service .env file so smoke follows the same runtime endpoints and database conventions.
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

// createProcurementGrpcClient binds one direct gRPC client to the running local procurement-service endpoint.
function createProcurementGrpcClient() {
  const host = normalizeGrpcClientHost(
    process.env.PROCUREMENT_SERVICE_GRPC_HOST || process.env.GRPC_LISTEN_HOST || '127.0.0.1'
  )
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

// createSrmGrpcClient binds one direct gRPC client to the configured downstream srm-service endpoint for optional offering bootstrap.
function createSrmGrpcClient() {
  const target = resolveGrpcTarget(process.env.GRPC_SERVICE_SRM_URL, '127.0.0.1', '50061')

  return ClientProxyFactory.create({
    transport: Transport.GRPC,
    options: {
      package: 'srm_service',
      protoPath: [resolveCommonProtoPath('srm_service/srm.proto')],
      url: `${target.host}:${target.port}`
    }
  })
}

// createPartyGrpcClient binds one direct gRPC client to the configured downstream party-service endpoint for optional supplier bootstrap.
function createPartyGrpcClient() {
  const target = resolveGrpcTarget(process.env.GRPC_SERVICE_PARTY_URL, '127.0.0.1', '50053')

  return ClientProxyFactory.create({
    transport: Transport.GRPC,
    options: {
      package: 'party_service',
      protoPath: [resolveCommonProtoPath('party_service/party.proto')],
      url: `${target.host}:${target.port}`
    }
  })
}

// createProcurementServices wraps the generated procurement observable clients into promise-returning helpers for smoke verification.
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

// createSrmServices wraps the generated SRM management client needed to bootstrap one active supplier offering when the environment allows it.
function createSrmServices(client) {
  const management = client.getService(SUPPLIER_MANAGEMENT_SERVICE_NAME)

  return {
    management: {
      createSupplierProfile: async (request) =>
        firstValueFrom(management.createSupplierProfile(request)),
      bindSupplierToTenantParty: async (request) =>
        firstValueFrom(management.bindSupplierToTenantParty(request)),
      changeSupplierStatus: async (request) =>
        firstValueFrom(management.changeSupplierStatus(request)),
      upsertSupplierOffering: async (request) =>
        firstValueFrom(management.upsertSupplierOffering(request))
    }
  }
}

// createPartyServices wraps the generated party registration client needed to create one tenantParty for the optional supplier bootstrap.
function createPartyServices(client) {
  const registration = client.getService(PARTY_REGISTRATION_SERVICE_NAME)

  return {
    registration: {
      registerTenantParty: async (request) =>
        firstValueFrom(registration.registerTenantParty(request))
    }
  }
}

// createBootstrapHook exposes one optional supplier/item provisioning hook so procurement smoke can exercise PO conversion when dependencies are reachable.
function createBootstrapHook(seed) {
  const shouldBootstrap =
    (process.env.PROCUREMENT_SMOKE_BOOTSTRAP_ACTIVE_OFFERING || 'true').toLowerCase() !== 'false'
  if (!shouldBootstrap) {
    return {}
  }

  return {
    ensureActiveOffering: async () => {
      const srmClient = createSrmGrpcClient()
      const partyClient = createPartyGrpcClient()

      try {
        const services = {
          srm: createSrmServices(srmClient),
          party: createPartyServices(partyClient),
          itemMaster: createGatewayItemManagementClient(seed)
        }
        return await ensureActiveOffering(services, seed)
      } finally {
        await closeClient(srmClient)
        await closeClient(partyClient)
      }
    }
  }
}

// ensureActiveOffering provisions one active supplier plus one purchasable item/offering when all downstream collaborators are reachable.
async function ensureActiveOffering(services, seed) {
  try {
    const registerResponse = await services.party.registration.registerTenantParty(
      createPartyRegistrationRequest(seed)
    )
    const tenantPartyId = registerResponse?.tenantParty?.id
    if (!tenantPartyId) {
      throw new Error('party registration did not return tenantParty.id')
    }

    const createSupplierResponse = await services.srm.management.createSupplierProfile(
      createSupplierProfileRequest(seed)
    )
    const supplierId = createSupplierResponse?.supplier?.supplierId
    if (!supplierId) {
      throw new Error('CreateSupplierProfile did not return supplier.supplierId')
    }

    const bindResponse = await services.srm.management.bindSupplierToTenantParty(
      createBindSupplierRequest(seed, supplierId, tenantPartyId)
    )
    if (bindResponse?.supplier?.partyBinding?.tenantPartyId !== tenantPartyId) {
      throw new Error('BindSupplierToTenantParty did not return the expected tenantParty binding')
    }

    const activationResponse = await services.srm.management.changeSupplierStatus(
      createActivateSupplierRequest(seed, supplierId)
    )
    if (activationResponse?.supplier?.status !== 1) {
      throw new Error('ChangeSupplierStatus did not activate the supplier')
    }

    const itemFixture = await createPurchasableSmokeItem(
      services.itemMaster.management,
      seed,
      createItemFixtureInput(seed)
    )
    const itemId = itemFixture.itemId

    const offeringResponse = await services.srm.management.upsertSupplierOffering(
      createSupplierOfferingRequest(seed, supplierId, itemId)
    )
    if (!offeringResponse?.offering?.supplierOfferingId) {
      throw new Error('UpsertSupplierOffering did not return supplierOfferingId')
    }

    return {
      supplierId,
      itemId
    }
  } catch (error) {
    if (isOptionalBootstrapUnavailableError(error)) {
      return null
    }

    throw error
  }
}

// createPartyRegistrationRequest builds one downstream party registration request for the optional supplier bootstrap path.
function createPartyRegistrationRequest(seed) {
  return {
    tenantId: seed.tenantId,
    legalName: `Procurement Smoke Supplier ${seed.title}`,
    type: 'ORGANIZATION',
    displayName: `Procurement Smoke Party ${seed.title}`,
    localCode: `PROC-SMOKE-${seed.traceContext.requestId.slice(-10).toUpperCase()}`,
    registeredCountry: 'CN',
    identifiers: [
      {
        identifierType: 'BUSINESS_REG_NO',
        normalizedValue: `procurement-smoke-${seed.traceContext.requestId}`,
        rawValue: `procurement-smoke-${seed.traceContext.requestId}`,
        issuerCountryOrRegion: 'CN'
      }
    ]
  }
}

// createSupplierProfileRequest builds one deterministic SRM supplier-profile creation request for the optional conversion bootstrap.
function createSupplierProfileRequest(seed) {
  return {
    tenantId: seed.tenantId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    auditContext: seed.auditContext,
    displayName: `Procurement Smoke Supplier ${seed.title}`,
    supplierCategory: 'RAW_MATERIAL',
    tags: ['smoke', 'procurement']
  }
}

// createBindSupplierRequest builds one SRM bind command so the bootstrap supplier can point at a formal tenantPartyId.
function createBindSupplierRequest(seed, supplierId, tenantPartyId) {
  return {
    tenantId: seed.tenantId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    auditContext: seed.auditContext,
    supplierId,
    tenantPartyId
  }
}

// createActivateSupplierRequest activates the newly bound bootstrap supplier so active offerings become valid.
function createActivateSupplierRequest(seed, supplierId) {
  return {
    tenantId: seed.tenantId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    auditContext: seed.auditContext,
    supplierId,
    targetStatus: 1
  }
}

// createItemFixtureInput builds deterministic ItemModel and Item names for the optional conversion bootstrap.
function createItemFixtureInput(seed) {
  const suffix = seed.traceContext.requestId.slice(-8).toUpperCase()
  return {
    modelCode: `PROC-SMOKE-MODEL-${suffix}`,
    modelName: `Procurement Smoke Model ${seed.title}`,
    itemCode: `PROC-SMOKE-ITEM-${suffix}`,
    itemName: `Procurement Smoke Item ${seed.title}`
  }
}

// createSupplierOfferingRequest builds one active SRM supplier-offering upsert against the bootstrap purchasable item.
function createSupplierOfferingRequest(seed, supplierId, itemId) {
  return {
    tenantId: seed.tenantId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    auditContext: seed.auditContext,
    supplierId,
    itemId,
    targetStatus: 1
  }
}

// isOptionalBootstrapUnavailableError detects environment-level dependency unavailability so conversion bootstrap can skip cleanly.
function isOptionalBootstrapUnavailableError(error) {
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes('UNAVAILABLE') ||
    message.includes('ECONNREFUSED') ||
    message.includes('No connection established') ||
    message.includes('14 ') ||
    message.includes('Gateway HUMAN access token is unavailable')
  )
}

// closeClient closes one Nest client proxy if the transport instance exposes a close hook.
async function closeClient(client) {
  if (typeof client?.close === 'function') {
    await client.close()
  }
}

// main runs the procurement live smoke against the local service endpoint and emits one JSON summary for terminal consumers.
async function main() {
  disableProxyForLocalGrpc()
  loadServiceEnv()

  const procurementClient = createProcurementGrpcClient()
  const seed = createSmokeSeed()

  try {
    const result = await runProcurementSmokeFlow(
      {
        procurement: createProcurementServices(procurementClient),
        bootstrap: createBootstrapHook(seed)
      },
      seed,
      (message) => console.log(`[procurement-smoke] ${message}`)
    )

    console.log(JSON.stringify(result, null, 2))
  } finally {
    await closeClient(procurementClient)
  }
}

await main().catch((error) => {
  console.error(
    error instanceof Error ? `procurement-service smoke failed: ${error.message}` : String(error)
  )
  process.exitCode = 1
})
