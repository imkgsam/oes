import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '@oes/common/auth'
import { TenantTargetBindingGuard } from './tenant-target-binding.guard'
import { getVerifiedTenantTarget } from './verified-tenant-target.request'

type TestRequest = {
  body?: unknown
  method?: string
  params?: Record<string, unknown>
  query?: unknown
  route?: { path?: unknown }
  user?: Record<string, unknown>
}

/** createContext builds the minimal matched HTTP context consumed by the global tenant-target guard. */
function createContext(request: TestRequest, type: string = 'http'): ExecutionContext {
  return {
    getClass: () => class TestController {},
    getHandler: () => function testHandler() {},
    getType: () => type,
    switchToHttp: () => ({ getRequest: () => request })
  } as unknown as ExecutionContext
}

/** targetRequest creates one protected canonical route fixture with an exact authenticated subject. */
function targetRequest(overrides: Partial<TestRequest> = {}): TestRequest {
  return {
    method: 'GET',
    params: { tenantId: 'tenant_a' },
    route: { path: '/api/v1/resources/tenants/:tenantId/items' },
    user: { scopeLevel: 'TENANT', tenantId: 'tenant_a' },
    ...overrides
  }
}

/** createGuard returns the production guard with optional public-route reflection. */
function createGuard(isPublic = false): TenantTargetBindingGuard {
  return new TenantTargetBindingGuard({
    getAllAndOverride: jest.fn((key: string) => (key === IS_PUBLIC_KEY ? isPublic : undefined))
  } as unknown as Reflector)
}

/** expectHttpStatus asserts OES exceptions preserve the frozen HTTP status contract. */
async function expectHttpStatus(promise: Promise<unknown>, status: number): Promise<void> {
  const error = await promise.catch((caught) => caught)
  expect((error as { getHttpStatus?: () => number }).getHttpStatus?.()).toBe(status)
}

/** runBeforeContinuations proves an early denial prevents every later security and business stage. */
async function runBeforeContinuations(
  guard: TenantTargetBindingGuard,
  request: TestRequest,
  continuations: jest.Mock[]
): Promise<void> {
  if (await guard.canActivate(createContext(request))) {
    continuations.forEach((continuation) => continuation())
  }
}

/** TenantTargetBindingGuard tests lock automatic recognition and request-private handoff. */
describe('TenantTargetBindingGuard', () => {
  it('ignores routes without the exact canonical :tenantId parameter even when client fields exist', async () => {
    const request = targetRequest({
      body: { tenantId: 'body_tenant' },
      params: { tenantIdentifier: 'path_tenant' },
      query: { tenantId: 'query_tenant' },
      route: { path: '/api/v1/resources/tenants/:tenantIdentifier/items' }
    })

    await expect(createGuard().canActivate(createContext(request))).resolves.toBe(true)
    expect(() => getVerifiedTenantTarget(request)).toThrow()
  })

  it('leaves a public canonical route outside protected binding', async () => {
    const request = targetRequest({ user: undefined })

    await expect(createGuard(true).canActivate(createContext(request))).resolves.toBe(true)
    expect(() => getVerifiedTenantTarget(request)).toThrow()
  })

  it.each(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])(
    'automatically binds an exact TENANT target for %s without route metadata',
    async (method) => {
      const request = targetRequest({ method })

      await expect(createGuard().canActivate(createContext(request))).resolves.toBe(true)
      expect(getVerifiedTenantTarget(request)).toBe('tenant_a')
    }
  )

  it.each([undefined, '', '   ', 'tenant@a', ' tenant_a '])(
    'returns 400 for a malformed or non-canonical matched target %p',
    async (tenantId) => {
      await expectHttpStatus(
        createGuard().canActivate(createContext(targetRequest({ params: { tenantId } }))),
        400
      )
    }
  )

  it('parses the canonical path target before evaluating an invalid authenticated context', async () => {
    await expectHttpStatus(
      createGuard().canActivate(
        createContext(
          targetRequest({
            params: { tenantId: ' tenant_a ' },
            user: { scopeLevel: 'TENANT', tenantId: undefined }
          })
        )
      ),
      400
    )
  })

  it('returns 401 for conflicting authenticated TENANT projections', async () => {
    await expectHttpStatus(
      createGuard().canActivate(
        createContext(
          targetRequest({
            user: { scopeLevel: 'TENANT', tenantId: 'tenant_a', tid: 'tenant_b' }
          })
        )
      ),
      401
    )
  })

  it.each([undefined, '', '   ', 'tenant@a', ' tenant_a '])(
    'returns 401 for a malformed or non-canonical TENANT subject %p',
    async (tenantId) => {
      await expectHttpStatus(
        createGuard().canActivate(
          createContext(targetRequest({ user: { scopeLevel: 'TENANT', tenantId } }))
        ),
        401
      )
    }
  )

  it('returns 403 on TENANT mismatch before Permission, handler, downstream or side effect', async () => {
    const continuations = [jest.fn(), jest.fn(), jest.fn(), jest.fn()]

    await expectHttpStatus(
      runBeforeContinuations(
        createGuard(),
        targetRequest({ params: { tenantId: 'tenant_b' } }),
        continuations
      ),
      403
    )
    continuations.forEach((continuation) => expect(continuation).not.toHaveBeenCalled())
  })

  it('creates a verified target for a tenantless SYSTEM subject on a non-Site target route', async () => {
    const request = targetRequest({ user: { scopeLevel: 'SYSTEM' } })

    await expect(createGuard().canActivate(createContext(request))).resolves.toBe(true)
    expect(getVerifiedTenantTarget(request)).toBe('tenant_a')
  })

  it.each(['tenant_a', '', '   ', null])(
    'returns 401 for a SYSTEM subject carrying tenant identity %p',
    async (tenantId) => {
      await expectHttpStatus(
        createGuard().canActivate(
          createContext(targetRequest({ user: { scopeLevel: 'SYSTEM', tenantId } }))
        ),
        401
      )
    }
  )

  it.each(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])(
    'preserves the exact Site Management P1 SYSTEM deny for %s before every later stage',
    async (method) => {
      const continuations = [jest.fn(), jest.fn(), jest.fn(), jest.fn(), jest.fn()]
      const request = targetRequest({
        method,
        route: { path: '/api/v1/site-management/tenants/:tenantId/sites/:siteId' },
        user: { scopeLevel: 'SYSTEM' }
      })

      await expectHttpStatus(runBeforeContinuations(createGuard(), request, continuations), 403)
      continuations.forEach((continuation) => expect(continuation).not.toHaveBeenCalled())
      expect(() => getVerifiedTenantTarget(request)).toThrow()
    }
  )

  it('does not widen the Site P1 exception to a similarly named route', async () => {
    const request = targetRequest({
      route: { path: '/api/v1/site-management-preview/tenants/:tenantId/sites' },
      user: { scopeLevel: 'SYSTEM' }
    })

    await expect(createGuard().canActivate(createContext(request))).resolves.toBe(true)
    expect(getVerifiedTenantTarget(request)).toBe('tenant_a')
  })

  it('does not widen the Site P1 exception to a nested non-Site route', async () => {
    const request = targetRequest({
      route: { path: '/api/v1/admin/site-management/tenants/:tenantId/sites' },
      user: { scopeLevel: 'SYSTEM' }
    })

    await expect(createGuard().canActivate(createContext(request))).resolves.toBe(true)
    expect(getVerifiedTenantTarget(request)).toBe('tenant_a')
  })

  it.each([
    ['query', { query: { tenantId: 'tenant_a' } }],
    ['body', { body: { tenantId: 'tenant_a' } }],
    ['query and body', { query: { tenantId: 'tenant_a' }, body: { tenantId: 'tenant_a' } }]
  ])(
    'accepts a matching legacy %s duplicate without making it authoritative',
    async (_label, extra) => {
      const request = targetRequest(extra)

      await expect(createGuard().canActivate(createContext(request))).resolves.toBe(true)
      expect(getVerifiedTenantTarget(request)).toBe('tenant_a')
    }
  )

  it.each([
    ['query mismatch', { query: { tenantId: 'tenant_b' } }],
    ['body mismatch', { body: { tenantId: 'tenant_b' } }],
    ['query array', { query: { tenantId: ['tenant_a'] } }],
    ['body whitespace', { body: { tenantId: ' tenant_a ' } }]
  ])('returns 400 for a %s before later stages', async (_label, extra) => {
    await expectHttpStatus(createGuard().canActivate(createContext(targetRequest(extra))), 400)
  })

  it('returns 400 without executing a duplicate tenantId accessor', async () => {
    const accessor = jest.fn(() => 'tenant_a')
    const query = Object.defineProperty({}, 'tenantId', { get: accessor })

    await expectHttpStatus(createGuard().canActivate(createContext(targetRequest({ query }))), 400)
    expect(accessor).not.toHaveBeenCalled()
  })

  it('returns 401 for a missing, unknown or non-canonical session scope', async () => {
    for (const scopeLevel of [undefined, 'UNKNOWN', ' tenant ']) {
      await expectHttpStatus(
        createGuard().canActivate(
          createContext(targetRequest({ user: { scopeLevel, tenantId: 'tenant_a' } }))
        ),
        401
      )
    }
  })

  it('preserves identifier case and never folds the target', async () => {
    await expectHttpStatus(
      createGuard().canActivate(
        createContext(
          targetRequest({
            params: { tenantId: 'Tenant_A' },
            user: { scopeLevel: 'TENANT', tenantId: 'tenant_a' }
          })
        )
      ),
      403
    )

    const request = targetRequest({
      params: { tenantId: 'Tenant_A' },
      user: { scopeLevel: 'TENANT', tenantId: 'Tenant_A' }
    })
    await createGuard().canActivate(createContext(request))
    expect(getVerifiedTenantTarget(request)).toBe('Tenant_A')
  })

  it('keeps the carrier outside enumerable and symbol request properties and rejects overwrite', async () => {
    const request = targetRequest()
    const keysBefore = Reflect.ownKeys(request)
    const guard = createGuard()

    await guard.canActivate(createContext(request))
    expect(Reflect.ownKeys(request)).toEqual(keysBefore)
    expect(getVerifiedTenantTarget(request)).toBe('tenant_a')
    await expectHttpStatus(guard.canActivate(createContext(request)), 403)
    expect(getVerifiedTenantTarget(request)).toBe('tenant_a')
  })

  it('keeps verified targets isolated across concurrent requests', async () => {
    const requestA = targetRequest()
    const requestB = targetRequest({
      params: { tenantId: 'tenant_b' },
      user: { scopeLevel: 'TENANT', tenantId: 'tenant_b' }
    })
    const guard = createGuard()

    await Promise.all([
      guard.canActivate(createContext(requestA)),
      guard.canActivate(createContext(requestB))
    ])
    expect(getVerifiedTenantTarget(requestA)).toBe('tenant_a')
    expect(getVerifiedTenantTarget(requestB)).toBe('tenant_b')
  })

  it('fails closed when a matched tenant param loses canonical route provenance', async () => {
    await expectHttpStatus(
      createGuard().canActivate(createContext(targetRequest({ route: undefined }))),
      403
    )
  })

  it('fails closed when the carrier is read without a successful guard', () => {
    expect(() => getVerifiedTenantTarget({})).toThrow()
  })

  it('does not apply the HTTP-only binding algorithm to a non-HTTP context', async () => {
    await expect(createGuard().canActivate(createContext({}, 'rpc'))).resolves.toBe(true)
  })
})
