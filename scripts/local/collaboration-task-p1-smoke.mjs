import { createRequire } from 'node:module'

import { createTaskP1SmokeSeed, runCollaborationTaskP1SmokeFlow } from './collaboration-task-p1-smoke-lib.mjs'

const require = createRequire(import.meta.url)
const { PrismaClient } = require('../../src/services/system/collaboration-service/prisma/generated/prisma')

const DEFAULT_LOCAL_DATABASE_URL = 'postgres://imkgsam:imkgsam@localhost:5432/mydb'
const gatewayBaseUrl =
  process.env.COLLABORATION_TASK_SMOKE_GATEWAY_BASE_URL ||
  process.env.API_GATEWAY_BASE_URL ||
  'http://127.0.0.1:9101/api/v1'

/** resolveCollaborationDatabaseUrl keeps smoke audit reads inside collaboration-service storage. */
function resolveCollaborationDatabaseUrl() {
  const rawDatabaseUrl =
    process.env.COLLABORATION_DATABASE_URL ||
    process.env.DATABASE_URL ||
    (process.env.NODE_ENV !== 'production' ? DEFAULT_LOCAL_DATABASE_URL : '')
  if (!rawDatabaseUrl) {
    throw new Error('COLLABORATION_DATABASE_URL or DATABASE_URL is required for production Task P1 smoke.')
  }
  const parsed = new URL(rawDatabaseUrl)
  if (!parsed.searchParams.get('schema')) {
    parsed.searchParams.set('schema', 'collaboration_service')
  }
  return parsed.toString()
}

// requestGateway calls the API Gateway response envelope and returns the stable data payload.
async function requestGateway(path, { body, method = 'GET', token } = {}) {
  const response = await fetch(`${gatewayBaseUrl}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
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

// createGatewayClient adapts Gateway HTTP endpoints to the Task P1 smoke flow contract.
function createGatewayClient(seed) {
  const tenantPrefix = `/collaboration/tenants/${seed.tenantId}/tasks`

  return {
    archiveTask: (taskId, request) =>
      requestGateway(`${tenantPrefix}/${taskId}/archive`, {
        body: {},
        method: 'POST',
        token: request.token,
      }),
    cancelTask: (taskId, request) =>
      requestGateway(`${tenantPrefix}/${taskId}/cancel`, {
        body: { cancelReason: request.cancelReason },
        method: 'POST',
        token: request.token,
      }),
    completeTask: (taskId, request) =>
      requestGateway(`${tenantPrefix}/${taskId}/complete`, {
        body: { completionNote: request.completionNote },
        method: 'POST',
        token: request.token,
      }),
    createTask: (request) =>
      requestGateway(tenantPrefix, {
        body: {
          assigneeAccountId: request.assigneeAccountId,
          description: request.description,
          dueAt: request.dueAt,
          priority: request.priority,
          title: request.title,
        },
        method: 'POST',
        token: request.token,
      }),
    listTasks: (request) => {
      const query = new URLSearchParams({
        includeArchived: String(Boolean(request.includeArchived)),
        page: String(request.page),
        pageSize: String(request.pageSize),
        scope: request.scope,
      })
      return requestGateway(`${tenantPrefix}?${query.toString()}`, { token: request.token })
    },
    login: (request) =>
      requestGateway('/auth/login', {
        body: {
          credential: request.credential,
          identifier: request.identifier,
          method: request.method,
        },
        method: 'POST',
      }),
    reopenTask: (taskId, request) =>
      requestGateway(`${tenantPrefix}/${taskId}/reopen`, {
        body: { reopenReason: request.reopenReason },
        method: 'POST',
        token: request.token,
      }),
    selectAccount: (request) =>
      requestGateway('/auth/account-selection', {
        body: {
          accountId: request.accountId,
          loginMethod: request.loginMethod,
          userId: request.userId,
        },
        method: 'POST',
      }),
    startTask: (taskId, request) =>
      requestGateway(`${tenantPrefix}/${taskId}/start`, {
        body: {},
        method: 'POST',
        token: request.token,
      }),
    unarchiveTask: (taskId, request) =>
      requestGateway(`${tenantPrefix}/${taskId}/unarchive`, {
        body: {},
        method: 'POST',
        token: request.token,
      }),
    updateTask: (taskId, request) =>
      requestGateway(`${tenantPrefix}/${taskId}`, {
        body: {
          description: request.description,
          dueAt: request.dueAt,
          priority: request.priority,
          title: request.title,
        },
        method: 'PATCH',
        token: request.token,
      }),
  }
}

// createAuditStore reads collaboration-service owned audit and event envelopes for the smoke-created tasks.
function createAuditStore() {
  process.env.DATABASE_URL = resolveCollaborationDatabaseUrl()
  const prisma = new PrismaClient()

  return {
    close: () => prisma.$disconnect(),
    readTaskSideEffects: async (taskId) => {
      const [audits, events] = await Promise.all([
        prisma.collaborationTaskAuditEnvelope.findMany({
          orderBy: { occurredAt: 'asc' },
          select: { action: true },
          where: { taskId },
        }),
        prisma.collaborationTaskEventEnvelope.findMany({
          orderBy: { occurredAt: 'asc' },
          select: { eventType: true },
          where: { taskId },
        }),
      ])
      return {
        auditActions: audits.map((audit) => audit.action),
        eventTypes: events.map((event) => event.eventType),
      }
    },
  }
}

// main runs the repeatable local Task P1 smoke and prints a compact verification summary.
async function main() {
  const seed = createTaskP1SmokeSeed()
  const auditStore = createAuditStore()
  try {
    const result = await runCollaborationTaskP1SmokeFlow(
      {
        auditStore,
        gateway: createGatewayClient(seed),
      },
      seed,
    )
    console.log(JSON.stringify(result, null, 2))
  } finally {
    await auditStore.close()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
