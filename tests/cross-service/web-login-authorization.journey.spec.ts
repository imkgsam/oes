import { chromium, type Browser } from 'playwright'
import { LoginStatus } from '@oes/common/generated/auth_service'
import { LoginWithEmailPasswordCommand } from '../../src/services/system/auth-service/src/application/commands/auth/login-with-email-password.command'
import { LoginWithEmailPasswordHandler } from '../../src/services/system/auth-service/src/application/commands/auth/login-with-email-password.handler'
import { TenantSessionAccessService } from '../../src/services/system/auth-service/src/application/services/tenant-session-access.service'
import { TerminalLoginPolicyService } from '../../src/services/system/auth-service/src/application/services/terminal-login-policy.service'
import { LoginUseCase } from '../../src/services/api-gateway/src/modules/auth-bff/application/use-cases/login.use-case'
import { SessionAccessSummaryUseCase } from '../../src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-access-summary.use-case'
import { SessionContextUseCase } from '../../src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-context.use-case'
import { html, json, listen, readJson, type JourneyServer } from './support/http'

/**
 * Prerequisites: Playwright Chromium; loopback ports are allocated by the operating system.
 * Boundaries: browser -> Gateway use cases -> Auth handler -> Identity and Permission HTTP boundaries.
 * Success: valid credentials select a tenant account and expose only its managed authorized entry.
 * Critical failure: invalid credentials do not create a session or reach the protected operation.
 * Reproduce: pnpm test:run -- --type journey (or the risk-selected change plan).
 */
describe('Web login and authorization Journey', () => {
  let browser: Browser
  const servers: JourneyServer[] = []

  afterAll(async () => {
    await browser?.close()
    await Promise.all(servers.splice(0).map((server) => server.close()))
  })

  it('crosses Gateway, Auth, Identity, and Permission before entering an authorized page', async () => {
    const identity = await listen(async (request, response) => {
      if (request.url === '/users/journey-user/accounts') {
        json(response, 200, {
          accounts: [
            {
              accountId: 'journey-account',
              tenantId: 'journey-tenant',
              scopeLevel: 'TENANT',
              displayName: 'Journey Operator'
            }
          ]
        })
        return
      }
      if (request.url === '/accounts/journey-account') {
        json(response, 200, {
          account: {
            id: 'journey-account',
            tenantId: 'journey-tenant',
            scopeLevel: 'TENANT',
            displayName: 'Journey Operator'
          }
        })
        return
      }
      response.writeHead(404).end()
    })
    servers.push(identity)

    const permission = await listen(async (request, response) => {
      if (request.url === '/account-access') {
        json(response, 200, {
          roles: [
            {
              roleId: 'journey-sales-role',
              code: 'SALES_OPERATOR',
              name: 'Sales operator',
              tenantId: 'journey-tenant',
              scope: 'TENANT'
            }
          ],
          actionCodes: ['sales.order.read']
        })
        return
      }
      if (request.url === '/navigation') {
        json(response, 200, {
          visibleEntries: ['sales.orders'],
          defaultEntry: 'sales.orders',
          resolvedByRoleId: 'journey-sales-role'
        })
        return
      }
      response.writeHead(404).end()
    })
    servers.push(permission)

    const tenantAccess = new TenantSessionAccessService({
      getTenantStatus: async (tenantId: string) =>
        tenantId === 'journey-tenant' ? 'ACTIVE' : 'DISABLED'
    } as never)
    const terminalPolicy = new TerminalLoginPolicyService({
      findByTerminal: async () => null,
      save: async (value: unknown) => value
    } as never)
    const authHandler = new LoginWithEmailPasswordHandler(
      {
        get: () => ({
          authenticate: async ({ email, password }: { email: string; password: string }) =>
            email === 'operator@example.test' && password === 'journey-password'
              ? { authenticated: true as const, userId: 'journey-user' }
              : { authenticated: false as const, auditUserId: 'journey-user' }
        })
      } as never,
      {
        emitLoginBlocked: () => undefined,
        emitLoginFailed: () => undefined
      } as never,
      {
        assertPasswordLoginAllowed: async () => undefined,
        recordPasswordLoginFailure: async () => undefined,
        clearPasswordLoginFailures: async () => undefined
      } as never,
      {
        getAvailableAccountsByUserId: async (userId: string) => {
          const response = await fetch(`${identity.origin}/users/${userId}/accounts`)
          return ((await response.json()) as any).accounts
        }
      } as never,
      tenantAccess,
      terminalPolicy
    )

    const auth = await listen(async (request, response) => {
      if (request.method !== 'POST' || request.url !== '/login') {
        response.writeHead(404).end()
        return
      }
      const body = await readJson(request)
      try {
        const result = await authHandler.execute(
          new LoginWithEmailPasswordCommand(body.email, body.password, { terminal: 'WEB' })
        )
        json(response, 200, {
          status: LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED,
          loginMethod: result.method,
          userId: result.userId,
          accounts: 'accounts' in result ? result.accounts : []
        })
      } catch {
        json(response, 401, { code: 'AUTH_INVALID_CREDENTIALS' })
      }
    })
    servers.push(auth)

    const authAdapter = {
      loginWithEmailPassword: async (input: { email?: string; password?: string }) => {
        const response = await fetch(`${auth.origin}/login`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input)
        })
        if (!response.ok) throw new Error('AUTH_INVALID_CREDENTIALS')
        return response.json()
      }
    }
    const permissionAdapter = {
      getAccountAccessSummary: async () =>
        (await fetch(`${permission.origin}/account-access`)).json(),
      resolveAccountNavigation: async () => (await fetch(`${permission.origin}/navigation`)).json()
    }
    const sessionAccess = new SessionAccessSummaryUseCase(permissionAdapter as never)
    const login = new LoginUseCase(authAdapter as never)
    const sessionContext = new SessionContextUseCase(
      {
        getAccountById: async (accountId: string) =>
          (await fetch(`${identity.origin}/accounts/${accountId}`)).json()
      } as never,
      sessionAccess
    )
    const authenticatedSource = {
      requestId: 'journey-web-request',
      traceId: 'journey-web-trace',
      user: {
        userId: 'journey-user',
        holderId: 'journey-account',
        tenantId: 'journey-tenant',
        scopeLevel: 'TENANT',
        sid: 'journey-session',
        terminal: 'WEB',
        allowedTerminals: ['WEB']
      }
    }
    let protectedCalls = 0
    const gateway = await listen(async (request, response) => {
      if (request.method === 'GET' && request.url === '/') {
        html(
          response,
          `<!doctype html><html><body>
            <label>Email <input id="email"></label>
            <label>Password <input id="password" type="password"></label>
            <button id="login">Sign in</button>
            <output id="result"></output>
            <script>
              document.querySelector('#login').addEventListener('click', async () => {
                const login = await fetch('/api/login', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:email.value,password:password.value})});
                if (!login.ok) { result.textContent = 'LOGIN_DENIED'; return; }
                const session = await fetch('/api/session').then(value => value.json());
                const protectedResult = await fetch('/api/protected');
                result.textContent = session.navigation.defaultEntry + ':' + protectedResult.status;
              });
            </script>
          </body></html>`
        )
        return
      }
      if (request.method === 'POST' && request.url === '/api/login') {
        const body = await readJson(request)
        try {
          const result = await login.execute(
            {
              method: 'EMAIL_PASSWORD',
              identifier: body.email,
              credential: body.password
            } as never,
            { requestId: 'journey-login', traceId: 'journey-login-trace' },
            { userAgent: request.headers['user-agent'], ipAddress: '127.0.0.1' },
            'WEB'
          )
          json(response, 200, result)
        } catch {
          json(response, 401, { code: 'AUTH_INVALID_CREDENTIALS' })
        }
        return
      }
      if (request.method === 'GET' && request.url === '/api/session') {
        json(response, 200, await sessionContext.execute(authenticatedSource as never))
        return
      }
      if (request.method === 'GET' && request.url === '/api/protected') {
        protectedCalls += 1
        const access = await sessionAccess.execute(authenticatedSource as never)
        json(response, access.actionCodes.includes('sales.order.read') ? 200 : 403, {
          allowed: access.actionCodes.includes('sales.order.read')
        })
        return
      }
      response.writeHead(404).end()
    })
    servers.push(gateway)

    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto(gateway.origin)
    await page.locator('#email').fill('operator@example.test')
    await page.locator('#password').fill('journey-password')
    await page.locator('#login').click()
    await page.waitForFunction(
      () => document.querySelector('#result')?.textContent === 'sales.orders:200'
    )
    expect(await page.locator('#result').textContent()).toBe('sales.orders:200')
    expect(protectedCalls).toBe(1)

    await page.locator('#password').fill('wrong-password')
    await page.locator('#login').click()
    await page.waitForFunction(
      () => document.querySelector('#result')?.textContent === 'LOGIN_DENIED'
    )
    expect(await page.locator('#result').textContent()).toBe('LOGIN_DENIED')
    expect(protectedCalls).toBe(1)
  })
})
