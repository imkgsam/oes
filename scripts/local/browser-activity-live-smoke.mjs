import {
  cleanupBrowserActivitySmokeData,
  createBrowserActivitySmokePrisma,
  snapshotBrowserActivitySmokeState
} from './browser-activity-smoke-cleanup.mjs'

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:9101/api/v1'
const IDENTIFIER = process.env.OES_SMOKE_IDENTIFIER ?? 'csp@ml.lc'
const CREDENTIAL = process.env.OES_SMOKE_CREDENTIAL ?? 'imkgsam6593'
const TENANT_ACCOUNT_ID = process.env.OES_SMOKE_TENANT_ACCOUNT_ID ?? '00000000-0000-4000-8000-000000000901'

async function main() {
  const smokeArtifacts = {
    clientVisitIds: [],
    extensionSessionIds: []
  }
  const login = await post('/auth/login', {
    credential: CREDENTIAL,
    identifier: IDENTIFIER,
    method: 'EMAIL_PASSWORD'
  })
  assertEqual(login.status, 'ACCOUNT_SELECTION_REQUIRED', 'web login should require account selection')
  const tenantOption = login.accountOptions.find((option) => option.accountId === TENANT_ACCOUNT_ID)
  assert(tenantOption, 'tenant account option should be present')

  const webAuth = await post('/auth/account-selection', {
    accountId: tenantOption.accountId,
    loginMethod: 'EMAIL_PASSWORD',
    userId: login.operator.userId
  })
  assertEqual(webAuth.status, 'SUCCESS', 'web account selection should succeed')
  assertEqual(webAuth.session.terminal, 'WEB', 'web token terminal should be WEB')
  assert(webAuth.session.accessToken, 'web access token should be present')

  const context = await get('/auth/session/context', webAuth.session.accessToken)
  const accessSummary = await get('/auth/session/access-summary', webAuth.session.accessToken)
  assertEqual(context.account.accountId, TENANT_ACCOUNT_ID, 'session context should use tenant account')
  const tenantId = context.tenant?.tenantId || tenantOption.tenantId
  assert(tenantId, 'session context should include tenant id')
  assertIncludes(
    accessSummary.actionCodes,
    'browser_activity.overview.read',
    'tenant account should have browser activity overview permission'
  )

  const prisma = createBrowserActivitySmokePrisma()
  const previousState = await snapshotBrowserActivitySmokeState(prisma, {
    accountId: tenantOption.accountId,
    tenantId
  })

  try {
  const grant = await put(
    `/browser-activity/employees/${encodeURIComponent(tenantOption.accountId)}/audit-grant`,
    webAuth.session.accessToken,
    {
      enabled: true
    }
  )
  assertEqual(grant.enabled, true, 'web admin should enable employee browser activity audit grant')

  const webIngest = await post('/extension/browser-activity/heartbeat', {
    extensionSessionId: 'web-token-should-not-ingest',
    observedAt: new Date().toISOString()
  }, webAuth.session.accessToken, { acceptError: true })
  assertEqual(webIngest.status, 403, 'WEB token must not be accepted by extension ingest endpoint')

  const extensionLogin = await post('/extension/auth/login', {
    credential: CREDENTIAL,
    identifier: IDENTIFIER,
    method: 'EMAIL_PASSWORD'
  })
  assertEqual(extensionLogin.status, 'ACCOUNT_SELECTION_REQUIRED', 'extension login should require account selection')
  const extensionAuth = await post('/extension/auth/account-selection', {
    accountId: tenantOption.accountId,
    loginMethod: 'EMAIL_PASSWORD',
    userId: extensionLogin.operator.userId
  })
  assertEqual(extensionAuth.status, 'SUCCESS', 'extension account selection should succeed')
  assertEqual(extensionAuth.session.terminal, 'BROWSER_EXTENSION', 'extension token terminal should be BROWSER_EXTENSION')

  const extensionSessionId = `live-smoke:${Date.now()}`
  smokeArtifacts.extensionSessionIds.push(extensionSessionId)
  const startedAt = new Date(Date.now() - 120_000).toISOString()
  const endedAt = new Date(Date.now() - 30_000).toISOString()
  const heartbeat = await post('/extension/browser-activity/heartbeat', {
    extensionSessionId,
    observedAt: new Date().toISOString()
  }, extensionAuth.session.accessToken)
  assertEqual(heartbeat.accepted, true, 'authenticated extension heartbeat should be accepted')
  const presence = await get(
    '/browser-activity/online-presence?status=ALL&includeOfflineWithinMinutes=1440',
    webAuth.session.accessToken
  )
  const currentPresence = presence.employees.find((employee) => employee.accountId === tenantOption.accountId)
  assert(currentPresence, 'online presence should include the extension account after heartbeat')
  assertEqual(
    currentPresence.onlineStatus,
    'ONLINE',
    'extension heartbeat should mark collection channel online'
  )

  const clientVisitId = `live-smoke-visit-${Date.now()}`
  smokeArtifacts.clientVisitIds.push(clientVisitId)
  const append = await post('/extension/browser-activity/visit-sessions', {
    sessions: [
      {
        activeDurationSeconds: 90,
        clientVisitId,
        domain: 'supplier.example',
        dwellDurationSeconds: 90,
        endedAt,
        extensionSessionId,
        foregroundDurationSeconds: 90,
        idleDurationSeconds: 0,
        lastFlushedAt: endedAt,
        mergeKey: `${tenantOption.accountId}:supplier.example:https://supplier.example/orders/${clientVisitId}`,
        pageTitle: 'Supplier Orders Live Smoke',
        startedAt,
        url: `https://supplier.example/orders/${clientVisitId}`
      }
    ]
  }, extensionAuth.session.accessToken)
  assertEqual(append.acceptedCount, 1, 'authenticated extension visit session should be accepted')

  const overview = await get('/browser-activity/overview?period=LAST_1_DAY', webAuth.session.accessToken)
  assert(overview.metrics.activeDurationSeconds >= 90, 'overview should include accepted active duration')
  const timeline = await get(
    `/browser-activity/employees/${encodeURIComponent(tenantOption.accountId)}/timeline?period=LAST_1_DAY`,
    webAuth.session.accessToken
  )
  assert(
    timeline.visits.some((visit) => visit.url.includes(clientVisitId)),
    'employee timeline should include the live-smoke visit URL'
  )
  const search = await get(
    `/browser-activity/url-search?keyword=${encodeURIComponent(clientVisitId)}&period=LAST_1_DAY`,
    webAuth.session.accessToken
  )
  assert(
    search.results.some((result) => result.url.includes(clientVisitId)),
    'URL search should find the live-smoke visit'
  )

  console.log(JSON.stringify({
    accountId: tenantOption.accountId,
    browserActivityOverviewEmployees: overview.employees.length,
    liveSmokeVisitFound: true,
    onlinePresenceStatus: currentPresence.onlineStatus,
    employeeAuditGrantEnabled: grant.enabled,
    webIngestRejectedStatus: webIngest.status
  }, null, 2))
  } finally {
    await cleanupBrowserActivitySmokeData(prisma, {
      accountId: tenantOption.accountId,
      clientVisitIds: smokeArtifacts.clientVisitIds,
      extensionSessionIds: smokeArtifacts.extensionSessionIds,
      previousState,
      tenantId
    })
    await prisma.$disconnect()
  }
}

async function get(path, accessToken) {
  return request('GET', path, undefined, accessToken)
}

async function put(path, accessToken, body) {
  return request('PUT', path, body, accessToken)
}

async function post(path, body, accessToken, options = {}) {
  return request('POST', path, body, accessToken, options)
}

async function request(method, path, body, accessToken, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    method
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (options.acceptError) {
      return { payload, status: response.status }
    }
    throw new Error(`${method} ${path} failed with ${response.status}: ${JSON.stringify(payload)}`)
  }
  return payload.data ?? payload
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}; expected ${expected}, got ${actual}`)
  }
}

function assertIncludes(values, expected, message) {
  if (!Array.isArray(values) || !values.includes(expected)) {
    throw new Error(`${message}; missing ${expected}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
