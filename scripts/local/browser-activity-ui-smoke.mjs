import playwright from '../../app/web/node_modules/playwright/index.js'
import {
  cleanupBrowserActivitySmokeData,
  createBrowserActivitySmokePrisma,
  snapshotBrowserActivitySmokeState
} from './browser-activity-smoke-cleanup.mjs'

const { chromium } = playwright

const BASE_URL = process.env.TENANT_WEB_URL ?? 'http://localhost:5771'
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:9101/api/v1'
const IDENTIFIER = process.env.OES_SMOKE_IDENTIFIER ?? 'csp@ml.lc'
const CREDENTIAL = process.env.OES_SMOKE_CREDENTIAL ?? 'imkgsam6593'
const TENANT_ACCOUNT_ID = process.env.OES_SMOKE_TENANT_ACCOUNT_ID ?? '00000000-0000-4000-8000-000000000901'
const STORAGE_NAMESPACE = 'oes-tenant-web-5.7.0-dev'

async function main() {
  const smokeArtifacts = {
    clientVisitIds: [],
    extensionSessionIds: []
  }
  const auth = await authenticate()
  const tenantId = auth.sessionContext.tenant?.tenantId || auth.tenantOption.tenantId
  assert(tenantId, 'session context should include tenant id')
  const prisma = createBrowserActivitySmokePrisma()
  const previousState = await snapshotBrowserActivitySmokeState(prisma, {
    accountId: auth.tenantOption.accountId,
    tenantId
  })
  const browser = await chromium.launch({ headless: true })
  try {
    await seedCurrentBrowserActivity(auth, smokeArtifacts)
    const desktop = await browser.newContext({ viewport: { height: 900, width: 1440 } })
    const desktopPage = await desktop.newPage()
    await seedAuthStorage(desktopPage, auth)
    const desktopResult = await verifyWorkbench(desktopPage, 'desktop', auth.tenantOption.accountId)
    await desktop.close()

    const mobile = await browser.newContext({
      isMobile: true,
      viewport: { height: 844, width: 390 }
    })
    const mobilePage = await mobile.newPage()
    await seedAuthStorage(mobilePage, auth)
    const mobileResult = await verifyWorkbench(mobilePage, 'mobile', auth.tenantOption.accountId)
    await mobile.close()

    console.log(JSON.stringify({
      desktop: desktopResult,
      mobile: mobileResult
    }, null, 2))
  } finally {
    await browser.close()
    await cleanupBrowserActivitySmokeData(prisma, {
      accountId: auth.tenantOption.accountId,
      clientVisitIds: smokeArtifacts.clientVisitIds,
      extensionSessionIds: smokeArtifacts.extensionSessionIds,
      previousState,
      tenantId
    })
    await prisma.$disconnect()
  }
}

async function verifyWorkbench(page, label, accountId) {
  const responses = []
  page.on('response', (response) => {
    if (response.url().includes('browser-activity')) {
      responses.push({ status: response.status(), url: response.url() })
    }
  })

  const overviewResponse = page.waitForResponse(
    (response) => response.url().includes('/browser-activity/overview') && response.status() === 200,
    { timeout: 15_000 }
  )
  const presenceResponse = page.waitForResponse(
    (response) => response.url().includes('/browser-activity/online-presence') && response.status() === 200,
    { timeout: 15_000 }
  )
  await page.goto(`${BASE_URL}/admin/browser-activity-audit-workbench?accountId=${encodeURIComponent(accountId)}`, {
    waitUntil: 'domcontentloaded'
  })
  await page.getByTestId('browser-activity-workbench').waitFor({ timeout: 15_000 })
  await Promise.all([overviewResponse, presenceResponse])
  await page.getByTestId('browser-activity-monitoring-toggle').waitFor({ timeout: 15_000 })
  const employeeOptions = await page.locator('[data-testid="browser-activity-employee-selector"] option').count()
  assert(employeeOptions >= 1, `${label}: at least one employee selector option should render`)
  const selectedAccountId = await page.getByTestId('browser-activity-employee-selector').inputValue()
  assert(
    selectedAccountId === accountId,
    `${label}: selected employee should stay on query account; expected=${accountId}, actual=${selectedAccountId}`
  )
  const bodyText = await page.locator('body').innerText()
  assert(!bodyText.includes('绩效'), `${label}: page copy must not contain 绩效`)
  assert(!bodyText.includes('摸鱼'), `${label}: page copy must not contain 摸鱼`)
  assert(!bodyText.includes('租户审计开关'), `${label}: page must not render tenant audit switch`)
  assert(!bodyText.includes('明细保留'), `${label}: page must not render raw retention duration`)
  assert(!bodyText.includes('本地预览'), `${label}: page should use real BFF data, not preview fallback`)
  assert(
    responses.some((response) => response.url.includes('/browser-activity/overview') && response.status === 200),
    `${label}: overview BFF response should be 200; responses=${JSON.stringify(responses)}; body=${bodyText.slice(0, 800)}`
  )
  assert(
    responses.some((response) => response.url.includes('/browser-activity/online-presence') && response.status === 200),
    `${label}: online presence BFF response should be 200; responses=${JSON.stringify(responses)}; body=${bodyText.slice(0, 800)}`
  )
  assert(bodyText.includes('浏览器插件监控'), `${label}: browser monitoring title should render`)
  assert(bodyText.includes('当前展示用户'), `${label}: selected employee control should render`)
  assert(
    bodyText.includes('Domain 时长排名'),
    `${label}: domain ranking should render when monitoring is enabled; body=${bodyText.slice(0, 1200)}`
  )
  assert(
    bodyText.includes('URL 时长排名'),
    `${label}: URL ranking should render when monitoring is enabled; body=${bodyText.slice(0, 1200)}`
  )
  assert(
    bodyText.includes('时间分布'),
    `${label}: time distribution should render when monitoring is enabled; body=${bodyText.slice(0, 1200)}`
  )
  assert(
    bodyText.includes('活跃构成'),
    `${label}: activity composition should render when monitoring is enabled; body=${bodyText.slice(0, 1200)}`
  )
  assert(bodyText.includes('最近心跳'), `${label}: selected employee heartbeat detail should render`)
  assert(bodyText.includes('在线'), `${label}: online employee status should render after live smoke heartbeat`)

  await page.getByTestId('browser-activity-period-LAST_1_HOUR').click()
  const selectedAccountIdAfterPeriodChange = await page.getByTestId('browser-activity-employee-selector').inputValue()
  assert(
    selectedAccountIdAfterPeriodChange === accountId,
    `${label}: selected employee should stay on query account after period change; expected=${accountId}, actual=${selectedAccountIdAfterPeriodChange}`
  )
  await page.getByText('Supplier Orders Live Smoke').first().waitFor({ timeout: 15_000 })
  const domainButton = page.getByTestId('browser-activity-domain-supplier-example').first()
  await domainButton.click()
  await page.getByTestId('browser-activity-drilldown-drawer').waitFor({ timeout: 15_000 })
  await page.getByText('supplier.example 明细').first().waitFor({ timeout: 15_000 })

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  assert(overflow <= 2, `${label}: page should not horizontally overflow; overflow=${overflow}`)

  return {
    bffResponses: responses.length,
    employeeOptions,
    label,
    noHorizontalOverflow: true,
    onlinePresenceRendered: true,
    realBffOverview: true,
    rankingDrilldownRendered: true
  }
}

// seedAuthStorage primes persisted Pinia auth state before tenant-web bootstraps.
async function seedAuthStorage(page, auth) {
  await page.addInitScript(({ accessSummary, session, sessionContext, storageNamespace }) => {
    localStorage.setItem(
      `${storageNamespace}-core-access`,
      JSON.stringify({
        accessCodes: [],
        accessToken: session.accessToken,
        isLockScreen: false,
        lockScreenPassword: undefined,
        refreshToken: session.refreshToken
      })
    )
    localStorage.setItem(
      `${storageNamespace}-auth-context`,
      JSON.stringify({
        accessSummary,
        homePath: '/workbench/home',
        sessionContext,
        visibleEntries: sessionContext.navigation?.visibleEntries ?? []
      })
    )
  }, {
    accessSummary: auth.accessSummary,
    session: auth.session,
    sessionContext: auth.sessionContext,
    storageNamespace: STORAGE_NAMESPACE
  })
}

async function authenticate() {
  const login = await post('/auth/login', {
    credential: CREDENTIAL,
    identifier: IDENTIFIER,
    method: 'EMAIL_PASSWORD'
  })
  const tenantOption = login.accountOptions.find((option) => option.accountId === TENANT_ACCOUNT_ID)
  assert(tenantOption, 'tenant account option should be present')
  const selected = await post('/auth/account-selection', {
    accountId: tenantOption.accountId,
    loginMethod: 'EMAIL_PASSWORD',
    userId: login.operator.userId
  })
  const session = selected.session
  const sessionContext = await get('/auth/session/context', session.accessToken)
  const accessSummary = await get('/auth/session/access-summary', session.accessToken)
  return { accessSummary, session, sessionContext, tenantOption, userId: login.operator.userId }
}

// seedCurrentBrowserActivity creates fresh extension-only facts for deterministic UI presence checks.
async function seedCurrentBrowserActivity(auth, smokeArtifacts) {
  await put(
    `/browser-activity/employees/${encodeURIComponent(auth.tenantOption.accountId)}/audit-grant`,
    auth.session.accessToken,
    { enabled: true }
  )

  const extensionLogin = await post('/extension/auth/login', {
    credential: CREDENTIAL,
    identifier: IDENTIFIER,
    method: 'EMAIL_PASSWORD'
  })
  const extensionAuth = await post('/extension/auth/account-selection', {
    accountId: auth.tenantOption.accountId,
    loginMethod: 'EMAIL_PASSWORD',
    userId: extensionLogin.operator.userId || auth.userId
  })

  const now = Date.now()
  const extensionSessionId = `ui-smoke:${now}`
  smokeArtifacts.extensionSessionIds.push(extensionSessionId)
  const startedAt = new Date(now - 120_000).toISOString()
  const endedAt = new Date(now - 30_000).toISOString()
  const clientVisitId = `ui-live-smoke-visit-${now}`
  smokeArtifacts.clientVisitIds.push(clientVisitId)

  const heartbeat = await post('/extension/browser-activity/heartbeat', {
    extensionSessionId,
    observedAt: new Date(now).toISOString()
  }, extensionAuth.session.accessToken)
  assert(heartbeat.accepted === true, 'UI smoke extension heartbeat should be accepted')

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
        mergeKey: `${auth.tenantOption.accountId}:supplier.example:https://supplier.example/orders/${clientVisitId}`,
        pageTitle: 'Supplier Orders Live Smoke',
        startedAt,
        url: `https://supplier.example/orders/${clientVisitId}`
      }
    ]
  }, extensionAuth.session.accessToken)
  assert(append.acceptedCount === 1, 'UI smoke extension visit session should be accepted')
}

async function get(path, accessToken) {
  return request('GET', path, undefined, accessToken)
}

async function post(path, body, accessToken) {
  return request('POST', path, body, accessToken)
}

async function put(path, accessToken, body) {
  return request('PUT', path, body, accessToken)
}

async function request(method, path, body, accessToken) {
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
    throw new Error(`${method} ${path} failed with ${response.status}: ${JSON.stringify(payload)}`)
  }
  return payload.data ?? payload
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
