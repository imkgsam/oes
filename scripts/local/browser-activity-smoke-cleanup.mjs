import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { PrismaClient } = require('../../src/services/system/browser-activity-service/prisma/generated/prisma')
const SMOKE_CLIENT_VISIT_ID_PREFIXES = ['live-smoke', 'ui-live-smoke']
const SMOKE_EXTENSION_SESSION_ID_PREFIXES = ['live-smoke', 'ui-smoke']

// resolveBrowserActivityDatabaseUrl loads the service-owned database URL for local smoke cleanup.
function resolveBrowserActivityDatabaseUrl() {
  if (process.env.BROWSER_ACTIVITY_DATABASE_URL?.trim()) {
    return process.env.BROWSER_ACTIVITY_DATABASE_URL
  }
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL
  }

  const envPath = resolve(process.cwd(), 'src/services/system/browser-activity-service/.env')
  if (!existsSync(envPath)) {
    throw new Error(`BROWSER_ACTIVITY_DATABASE_URL is not set and .env was not found at ${envPath}`)
  }

  const match = readFileSync(envPath, 'utf8').match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m)
  if (!match) {
    throw new Error(`DATABASE_URL was not found in ${envPath}`)
  }
  return parseEnvValue(match[1])
}

// parseEnvValue strips simple shell quotes from .env values.
function parseEnvValue(raw) {
  const trimmed = raw.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

// createBrowserActivitySmokePrisma creates a direct Prisma client for targeted smoke-data cleanup.
export function createBrowserActivitySmokePrisma() {
  return new PrismaClient({
    datasources: {
      db: {
        url: resolveBrowserActivityDatabaseUrl()
      }
    }
  })
}

// snapshotBrowserActivitySmokeState captures mutable records that smoke tests may overwrite.
export async function snapshotBrowserActivitySmokeState(prisma, { accountId, tenantId }) {
  const [grant, presence] = await Promise.all([
    prisma.browserActivityEmployeeAuditGrant.findUnique({
      where: {
        tenantId_accountId: {
          accountId,
          tenantId
        }
      }
    }),
    prisma.browserActivityOnlinePresence.findUnique({
      where: {
        tenantId_accountId: {
          accountId,
          tenantId
        }
      }
    })
  ])

  return { grant, presence }
}

// cleanupBrowserActivitySmokeData deletes generated facts and restores pre-smoke mutable state.
export async function cleanupBrowserActivitySmokeData(
  prisma,
  {
    accountId,
    clientVisitIds = [],
    extensionSessionIds = [],
    previousState,
    tenantId
  }
) {
  const clientVisitIdFilters = clientVisitIds.map((clientVisitId) => ({ clientVisitId }))
  const extensionSessionIdFilters = extensionSessionIds.map((extensionSessionId) => ({ extensionSessionId }))
  const smokeClientVisitIdPrefixFilters = SMOKE_CLIENT_VISIT_ID_PREFIXES.map((prefix) => ({
    clientVisitId: { startsWith: prefix }
  }))
  const smokeExtensionSessionIdPrefixFilters = SMOKE_EXTENSION_SESSION_ID_PREFIXES.map((prefix) => ({
    extensionSessionId: { startsWith: prefix }
  }))
  const keywordFilters = [
    ...clientVisitIds.map((clientVisitId) => ({ keyword: clientVisitId })),
    ...SMOKE_CLIENT_VISIT_ID_PREFIXES.map((prefix) => ({ keyword: { startsWith: prefix } }))
  ]

  await prisma.browserActivityReadAudit.deleteMany({
    where: {
      tenantId,
      OR: keywordFilters
    }
  })

  await prisma.browserActivityVisitSession.deleteMany({
    where: {
      employeeAccountId: accountId,
      tenantId,
      OR: [
        ...clientVisitIdFilters,
        ...extensionSessionIdFilters,
        ...smokeClientVisitIdPrefixFilters,
        ...smokeExtensionSessionIdPrefixFilters
      ]
    }
  })

  await prisma.browserActivityHeartbeat.deleteMany({
    where: {
      accountId,
      tenantId,
      OR: [
        ...extensionSessionIdFilters,
        ...smokeExtensionSessionIdPrefixFilters
      ]
    }
  })

  await restoreOnlinePresence(prisma, { accountId, previousState, tenantId })
  await restoreEmployeeGrant(prisma, { accountId, previousState, tenantId })
}

// restoreOnlinePresence puts the selected account's online state back to the pre-smoke value.
async function restoreOnlinePresence(prisma, { accountId, previousState, tenantId }) {
  const previous = previousState?.presence
  if (!previous) {
    await prisma.browserActivityOnlinePresence.deleteMany({
      where: {
        accountId,
        tenantId
      }
    })
    return
  }

  await prisma.browserActivityOnlinePresence.upsert({
    create: {
      accountId: previous.accountId,
      displayName: previous.displayName,
      extensionSessionId: previous.extensionSessionId,
      lastHeartbeatAt: previous.lastHeartbeatAt,
      lastObservedDomain: previous.lastObservedDomain,
      sessionStartedAt: previous.sessionStartedAt,
      tenantId: previous.tenantId
    },
    update: {
      displayName: previous.displayName,
      extensionSessionId: previous.extensionSessionId,
      lastHeartbeatAt: previous.lastHeartbeatAt,
      lastObservedDomain: previous.lastObservedDomain,
      sessionStartedAt: previous.sessionStartedAt
    },
    where: {
      tenantId_accountId: {
        accountId,
        tenantId
      }
    }
  })
}

// restoreEmployeeGrant puts the selected account's audit grant back to the pre-smoke value.
async function restoreEmployeeGrant(prisma, { accountId, previousState, tenantId }) {
  const previous = previousState?.grant
  if (!previous) {
    await prisma.browserActivityEmployeeAuditGrant.deleteMany({
      where: {
        accountId,
        tenantId
      }
    })
    return
  }

  await prisma.browserActivityEmployeeAuditGrant.upsert({
    create: {
      accountId: previous.accountId,
      enabled: previous.enabled,
      tenantId: previous.tenantId,
      updatedBy: previous.updatedBy
    },
    update: {
      enabled: previous.enabled,
      updatedBy: previous.updatedBy
    },
    where: {
      tenantId_accountId: {
        accountId,
        tenantId
      }
    }
  })
}
