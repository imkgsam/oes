import { createRequire } from 'node:module'

import {
  createAnnotationP1SmokeSeed,
  runCollaborationAnnotationP1GatewaySmokeFlow,
  runCollaborationAnnotationP1SmokeFlow,
} from './collaboration-annotation-p1-smoke-lib.mjs'

const require = createRequire(import.meta.url)
const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')
const { resolveCommonProtoPath } = require('../../src/common/dist/contracts')
const { PrismaClient: CollaborationPrismaClient } = require(
  '../../src/services/system/collaboration-service/prisma/generated/prisma',
)
const { PrismaClient: CrmPrismaClient } = require(
  '../../src/services/business/crm-service/prisma/generated/prisma',
)
const { PrismaClient: PermissionPrismaClient } = require(
  '../../src/services/system/permission-service/prisma/generated/prisma',
)

const DEFAULT_COLLABORATION_DATABASE_URL = 'postgres://imkgsam:imkgsam@localhost:5432/collaborationdb'
const DEFAULT_CRM_DATABASE_URL = 'postgres://imkgsam:imkgsam@127.0.0.1:5432/crmdb'
const DEFAULT_PERMISSION_DATABASE_URL = 'postgres://imkgsam:imkgsam@localhost:5432/permissiondb'
const DEFAULT_COLLABORATION_GRPC_URL = '127.0.0.1:50068'
const DEFAULT_GATEWAY_BASE_URL = 'http://127.0.0.1:9101/api/v1'

const CREATE_PERMISSION = 'collaboration.annotation.create'
const MANAGE_PERMISSION = 'collaboration.annotation.manage'

// resolveDatabaseUrl chooses an explicit service-owned database URL and applies a schema only when requested.
function resolveDatabaseUrl(envKeys, fallbackUrl, schema) {
  const rawDatabaseUrl =
    envKeys.map((key) => process.env[key]).find((value) => value?.trim()) ||
    (process.env.NODE_ENV !== 'production' ? fallbackUrl : '')
  if (!rawDatabaseUrl) {
    throw new Error(`${envKeys.join(' or ')} is required for production Annotation P1 smoke.`)
  }
  const parsed = new URL(rawDatabaseUrl)
  if (schema && !parsed.searchParams.get('schema')) {
    parsed.searchParams.set('schema', schema)
  }
  return parsed.toString()
}

// createAnnotationGrpcClient opens typed callback clients for the live collaboration-service gRPC surface.
function createAnnotationGrpcClient() {
  const packageDefinition = protoLoader.loadSync(
    resolveCommonProtoPath('collaboration_service/collaboration.proto'),
    {
      defaults: true,
      enums: Number,
      keepCase: false,
      longs: String,
      oneofs: true,
    },
  )
  const collaborationPackage = grpc.loadPackageDefinition(packageDefinition).collaboration_service
  const target = process.env.COLLABORATION_ANNOTATION_SMOKE_GRPC_URL || DEFAULT_COLLABORATION_GRPC_URL
  const commandClient = new collaborationPackage.AnnotationCommandService(
    target,
    grpc.credentials.createInsecure(),
  )
  const queryClient = new collaborationPackage.AnnotationQueryService(
    target,
    grpc.credentials.createInsecure(),
  )

  return {
    close: () => {
      commandClient.close()
      queryClient.close()
    },
    createAnnotation: (request) => grpcCall(commandClient, 'createAnnotation', request),
    deleteAnnotation: (request) => grpcCall(commandClient, 'deleteAnnotation', request),
    getAnnotation: (request) => grpcCall(queryClient, 'getAnnotation', request),
    listAnnotationsForObject: (request) =>
      grpcCall(queryClient, 'listAnnotationsForObject', request),
    setAnnotationPinned: (request) => grpcCall(commandClient, 'setAnnotationPinned', request),
    updateAnnotation: (request) => grpcCall(commandClient, 'updateAnnotation', request),
  }
}

// createGatewayAnnotationClient adapts authenticated API Gateway routes to the smoke flow contract.
async function createGatewayAnnotationClient(seed) {
  const gatewayBaseUrl =
    process.env.COLLABORATION_ANNOTATION_SMOKE_GATEWAY_BASE_URL ||
    process.env.API_GATEWAY_BASE_URL ||
    DEFAULT_GATEWAY_BASE_URL
  const login = await requestGateway(gatewayBaseUrl, '/auth/login', {
    body: {
      credential: process.env.COLLABORATION_ANNOTATION_SMOKE_CREDENTIAL || 'imkgsam6593',
      identifier: process.env.COLLABORATION_ANNOTATION_SMOKE_IDENTIFIER || 'csp@ml.lc',
      method: 'EMAIL_PASSWORD',
    },
    method: 'POST',
  })
  const account = login.accountOptions?.[0]
  if (!account?.accountId) {
    throw new Error('Annotation P1 gateway smoke requires one selectable tenant account.')
  }
  const selected = await requestGateway(gatewayBaseUrl, '/auth/account-selection', {
    body: {
      accountId: account.accountId,
      loginMethod: 'EMAIL_PASSWORD',
      userId: login.operator?.userId,
    },
    method: 'POST',
  })
  const token = selected.session?.accessToken
  if (!token) {
    throw new Error('Annotation P1 gateway smoke did not receive an access token after account selection.')
  }

  seed.authorAccountId = account.accountId
  seed.managerAccountId = account.accountId

  return {
    close: () => undefined,
    createAnnotation: (request) =>
      requestGateway(gatewayBaseUrl, objectAnnotationPath(request.objectRef), {
        body: {
          bodyText: request.bodyText,
          visibility: toGatewayVisibility(request.visibility),
        },
        method: 'POST',
        token,
      }),
    deleteAnnotation: (request) =>
      requestGateway(gatewayBaseUrl, `/collaboration/annotations/${encodeURIComponent(request.annotationId)}`, {
        body: {
          deleteReason: request.deleteReason,
        },
        method: 'DELETE',
        token,
      }),
    getAnnotation: (request) =>
      requestGateway(gatewayBaseUrl, `/collaboration/annotations/${encodeURIComponent(request.annotationId)}`, {
        token,
      }),
    listAnnotationsForObject: (request) => {
      const query = new URLSearchParams({
        includePrivate: String(Boolean(request.includePrivate)),
        page: String(request.page ?? 1),
        pageSize: String(request.pageSize ?? 20),
      })
      return requestGateway(gatewayBaseUrl, `${objectAnnotationPath(request.objectRef)}?${query.toString()}`, {
        token,
      })
    },
    setAnnotationPinned: (request) =>
      requestGateway(
        gatewayBaseUrl,
        `/collaboration/annotations/${encodeURIComponent(request.annotationId)}/pinned`,
        {
          body: { pinned: Boolean(request.pinned) },
          method: 'PATCH',
          token,
        },
      ),
    updateAnnotation: (request) =>
      requestGateway(gatewayBaseUrl, `/collaboration/annotations/${encodeURIComponent(request.annotationId)}`, {
        body: {
          bodyText: request.bodyText,
          visibility: toGatewayVisibility(request.visibility),
        },
        method: 'PATCH',
        token,
      }),
  }
}

// requestGateway calls one Gateway response envelope and returns its stable data payload.
async function requestGateway(gatewayBaseUrl, path, { body, method = 'GET', token } = {}) {
  const response = await fetch(`${gatewayBaseUrl}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      'x-request-id': `annotation-p1-smoke-${Date.now()}`,
      'x-trace-id': `annotation-p1-smoke-${Date.now()}`,
    },
    method,
  })
  const text = await response.text()
  const envelope = text ? JSON.parse(text) : {}

  if (!response.ok || (envelope.code && envelope.code !== 'SYS_000000')) {
    throw new Error(
      `Gateway request failed: method=${method}; path=${path}; status=${response.status}; body=${text.slice(
        0,
        1000,
      )}`,
    )
  }

  return envelope.data
}

// objectAnnotationPath builds the object-scoped Annotation BFF route for one owner object.
function objectAnnotationPath(objectRef) {
  return `/collaboration/objects/${encodeURIComponent(objectRef.objectOwnerService)}/${encodeURIComponent(
    objectRef.objectType,
  )}/${encodeURIComponent(objectRef.objectId)}/annotations`
}

// toGatewayVisibility maps proto-loader enum numbers to Gateway string DTO values.
function toGatewayVisibility(value) {
  return value === 1 ? 'PRIVATE' : 'OBJECT_VISIBLE'
}

// grpcCall converts a unary callback API into an awaitable smoke assertion boundary.
function grpcCall(client, method, request) {
  return new Promise((resolve, reject) => {
    client.waitForReady(Date.now() + 8000, (readyError) => {
      if (readyError) {
        reject(readyError)
        return
      }
      client[method](request, (error, response) => {
        if (error) {
          reject(error)
          return
        }
        resolve(response)
      })
    })
  })
}

// createFixtureStore prepares local CRM and permission fixtures while runtime validation still uses gRPC.
function createFixtureStore() {
  const crmPrisma = new CrmPrismaClient({
    datasources: {
      db: {
        url: resolveDatabaseUrl(
          ['COLLABORATION_ANNOTATION_SMOKE_CRM_DATABASE_URL', 'CRM_DATABASE_URL'],
          DEFAULT_CRM_DATABASE_URL,
        ),
      },
    },
  })
  const permissionPrisma = new PermissionPrismaClient({
    datasources: {
      db: {
        url: resolveDatabaseUrl(
          ['COLLABORATION_ANNOTATION_SMOKE_PERMISSION_DATABASE_URL', 'PERMISSION_DATABASE_URL'],
          DEFAULT_PERMISSION_DATABASE_URL,
        ),
      },
    },
  })

  return {
    archiveCrmAccount: (accountId) =>
      crmPrisma.crmAccount.update({
        data: {
          archivedAt: new Date(),
          recordStatus: 'ARCHIVED',
        },
        where: { id: accountId },
      }),
    close: async () => {
      await Promise.all([crmPrisma.$disconnect(), permissionPrisma.$disconnect()])
    },
    prepare: async (seed) => {
      await Promise.all([
        upsertCrmAccount(crmPrisma, seed, seed.activeAccountId, 'ACTIVE', 'active'),
        upsertCrmAccount(crmPrisma, seed, seed.archivedAccountId, 'ACTIVE', 'archived'),
        upsertAnnotationPermissions(permissionPrisma, seed),
      ])
    },
  }
}

// upsertCrmAccount creates a minimal CrmAccount row owned by crm-service for smoke object validation.
async function upsertCrmAccount(prisma, seed, accountId, recordStatus, label) {
  await prisma.crmAccount.upsert({
    create: {
      id: accountId,
      createdBy: seed.authorAccountId,
      displayName: `${seed.marker} ${label}`,
      leadCompanyName: `${seed.marker} ${label}`,
      leadIdentifiers: {},
      lifecycleStage: 'CUSTOMER',
      ownerAccountId: seed.authorAccountId,
      partyTypeHint: 'ORGANIZATION',
      priority: 'B',
      recordStatus,
      tenantId: seed.tenantId,
    },
    update: {
      archivedAt: null,
      displayName: `${seed.marker} ${label}`,
      leadCompanyName: `${seed.marker} ${label}`,
      recordStatus,
    },
    where: { id: accountId },
  })
}

// upsertAnnotationPermissions grants create to the author and create/manage to the smoke manager account.
async function upsertAnnotationPermissions(prisma, seed) {
  const createPermission = await prisma.permission.upsert({
    create: {
      code: CREATE_PERMISSION,
      description: 'Create collaboration annotations',
      module: 'COLLABORATION_SERVICE',
    },
    update: {
      module: 'COLLABORATION_SERVICE',
    },
    where: { code: CREATE_PERMISSION },
  })
  const managePermission = await prisma.permission.upsert({
    create: {
      code: MANAGE_PERMISSION,
      description: 'Manage collaboration annotations',
      module: 'COLLABORATION_SERVICE',
    },
    update: {
      module: 'COLLABORATION_SERVICE',
    },
    where: { code: MANAGE_PERMISSION },
  })

  const createRole = await upsertRole(prisma, seed.tenantId, 'codex_annotation_p1_smoke_create')
  const manageRole = await upsertRole(prisma, seed.tenantId, 'codex_annotation_p1_smoke_manage')
  await Promise.all([
    upsertRolePermission(prisma, createRole.id, createPermission.id),
    upsertRolePermission(prisma, manageRole.id, createPermission.id),
    upsertRolePermission(prisma, manageRole.id, managePermission.id),
    upsertAccountRole(prisma, seed.authorAccountId, seed.tenantId, createRole.id),
    upsertAccountRole(prisma, seed.managerAccountId, seed.tenantId, manageRole.id),
  ])
}

// upsertRole creates one tenant-scoped RBAC role for the smoke account fixture.
function upsertRole(prisma, tenantId, code) {
  return prisma.role.upsert({
    create: {
      code,
      kind: 'TENANT_INSTANCE',
      name: code,
      scopeKey: tenantId,
      tenantId,
    },
    update: {
      isEnabled: true,
      tenantId,
    },
    where: {
      scopeKey_kind_code: {
        code,
        kind: 'TENANT_INSTANCE',
        scopeKey: tenantId,
      },
    },
  })
}

// upsertRolePermission attaches one Permission row to one Role row idempotently.
function upsertRolePermission(prisma, roleId, permissionId) {
  return prisma.rolePermission.upsert({
    create: {
      permissionId,
      roleId,
    },
    update: {},
    where: {
      roleId_permissionId: {
        permissionId,
        roleId,
      },
    },
  })
}

// upsertAccountRole assigns one smoke role to one tenant account idempotently.
function upsertAccountRole(prisma, accountId, tenantId, roleId) {
  return prisma.accountRole.upsert({
    create: {
      accountId,
      accountType: 'USER',
      roleId,
      scopeLevel: 'TENANT',
      tenantId,
    },
    update: {
      scopeLevel: 'TENANT',
      tenantId,
    },
    where: {
      accountId_roleId: {
        accountId,
        roleId,
      },
    },
  })
}

// createAuditStore reads collaboration-service owned audit envelopes from collaborationdb only.
function createAuditStore() {
  const prisma = new CollaborationPrismaClient({
    datasources: {
      db: {
        url: resolveDatabaseUrl(
          ['COLLABORATION_ANNOTATION_SMOKE_DATABASE_URL', 'COLLABORATION_DATABASE_URL'],
          DEFAULT_COLLABORATION_DATABASE_URL,
          'collaboration_service',
        ),
      },
    },
  })

  return {
    close: () => prisma.$disconnect(),
    readAnnotationAuditActions: async (annotationId) => {
      const audits = await prisma.collaborationAnnotationAuditEnvelope.findMany({
        orderBy: { occurredAt: 'asc' },
        select: { action: true },
        where: { annotationId },
      })
      return audits.map((audit) => audit.action)
    },
  }
}

// main runs the live Annotation P1 smoke and prints a compact verification summary.
async function main() {
  const seed = createAnnotationP1SmokeSeed()
  const mode = process.env.COLLABORATION_ANNOTATION_SMOKE_MODE || 'grpc'
  const annotations =
    mode === 'gateway' ? await createGatewayAnnotationClient(seed) : createAnnotationGrpcClient()
  const auditStore = createAuditStore()
  const fixtureStore = createFixtureStore()

  try {
    const dependencies = {
      annotations,
      auditStore,
      fixtureStore,
    }
    const result =
      mode === 'gateway'
        ? await runCollaborationAnnotationP1GatewaySmokeFlow(dependencies, seed)
        : await runCollaborationAnnotationP1SmokeFlow(dependencies, seed)
    console.log(JSON.stringify(result, null, 2))
  } finally {
    annotations.close()
    await Promise.all([auditStore.close(), fixtureStore.close()])
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
