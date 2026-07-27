import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  RequireTenantTargetBinding,
  TENANT_TARGET_BINDING_METADATA_KEY
} from './tenant-target-binding.decorator'
import { TenantTargetBindingGuard } from './tenant-target-binding.guard'
import { VerifiedTenantTarget } from './tenant-target-binding.types'
import {
  getVerifiedTenantTarget,
  VERIFIED_TENANT_TARGET_REQUEST_KEY
} from './verified-tenant-target.request'

type TestRequest = {
  params?: Record<string, unknown>
  user?: Record<string, unknown>
  [VERIFIED_TENANT_TARGET_REQUEST_KEY]?: VerifiedTenantTarget
}

type ContextTargets = {
  controller: Function
  handler: Function
}

/** createContext builds the minimal HTTP execution context consumed by the tenant-target guard. */
function createContext(
  request: TestRequest,
  type: string = 'http',
  targets?: ContextTargets
): ExecutionContext {
  return {
    getClass: () => targets?.controller ?? class TestController {},
    getHandler: () => targets?.handler ?? function testHandler() {},
    getType: () => type,
    switchToHttp: () => ({ getRequest: () => request })
  } as unknown as ExecutionContext
}

/** expectHttpStatus asserts OES exceptions preserve the frozen HTTP status contract. */
async function expectHttpStatus(promise: Promise<unknown>, status: number): Promise<void> {
  try {
    await promise
    throw new Error(`expected HTTP ${status}`)
  } catch (error) {
    expect((error as { getHttpStatus?: () => number }).getHttpStatus?.()).toBe(status)
  }
}

/** createGuard returns a guard whose reflector exposes the requested route metadata. */
function createGuard(metadata?: unknown): TenantTargetBindingGuard {
  return new TenantTargetBindingGuard({
    getAllAndOverride: jest.fn(() => metadata)
  } as unknown as Reflector)
}

/** expectMalformedOverrideDenied verifies real handler metadata cannot bypass the marked class boundary. */
async function expectMalformedOverrideDenied(override: unknown): Promise<void> {
  @RequireTenantTargetBinding()
  class MarkedController {
    /** handler represents the protected application entry reached only after all guards pass. */
    handler(): void {}
  }

  const handler = MarkedController.prototype.handler
  Reflect.defineMetadata(TENANT_TARGET_BINDING_METADATA_KEY, override, handler)
  const permission = jest.fn()
  const applicationHandler = jest.fn()
  const downstream = jest.fn()
  const guard = new TenantTargetBindingGuard(new Reflector())
  const context = createContext(
    {
      params: { tenantId: 'tenant_a' },
      user: { scopeLevel: 'TENANT', tenantId: 'tenant_a' }
    },
    'http',
    { controller: MarkedController, handler }
  )

  try {
    if (await guard.canActivate(context)) {
      permission()
      applicationHandler()
      downstream()
    }
    throw new Error('expected malformed tenant-target metadata to be denied')
  } catch (error) {
    expect((error as { getHttpStatus?: () => number }).getHttpStatus?.()).toBe(403)
  }

  expect(permission).not.toHaveBeenCalled()
  expect(applicationHandler).not.toHaveBeenCalled()
  expect(downstream).not.toHaveBeenCalled()
}

/** TenantTargetBindingGuard unit tests lock fail-closed binding independently of controllers and permissions. */
describe('TenantTargetBindingGuard', () => {
  const metadata = { pathParam: 'tenantId', systemPolicy: 'DENY' as const }

  it('writes explicit fail-closed route metadata with tenantId defaults', () => {
    @RequireTenantTargetBinding()
    class TestController {}

    expect(new Reflector().get(TENANT_TARGET_BINDING_METADATA_KEY, TestController)).toEqual(
      metadata
    )
  })

  it('fails fast when route metadata tries to enable SYSTEM or names a blank path param', () => {
    expect(() => RequireTenantTargetBinding({ pathParam: '   ' })).toThrow(/path param/i)
    expect(() => RequireTenantTargetBinding({ systemPolicy: 'ALLOW' } as never)).toThrow(/system/i)
  })

  it('does not affect a genuinely unmarked class and handler', async () => {
    class UnmarkedController {
      /** handler represents an unmarked route with no tenant-target metadata. */
      handler(): void {}
    }

    const request: TestRequest = {
      params: { tenantId: 'tenant_b' },
      user: { scopeLevel: 'TENANT', tenantId: 'tenant_a' }
    }
    const guard = new TenantTargetBindingGuard(new Reflector())

    await expect(
      guard.canActivate(
        createContext(request, 'http', {
          controller: UnmarkedController,
          handler: UnmarkedController.prototype.handler
        })
      )
    ).resolves.toBe(true)
    expect(request[VERIFIED_TENANT_TARGET_REQUEST_KEY]).toBeUndefined()
  })

  it.each([
    ['null', null],
    ['false', false],
    ['primitive', 'malformed'],
    ['array', []],
    ['Symbol pathParam', { pathParam: Symbol('tenantId'), systemPolicy: 'DENY' }],
    ['unknown policy', { pathParam: 'tenantId', systemPolicy: 'ALLOW' }]
  ])('returns 403 when handler %s metadata overrides a marked class', async (_label, override) => {
    await expectMalformedOverrideDenied(override)
  })

  it('returns 403 without downstream execution when handler metadata is a revoked Proxy', async () => {
    const { proxy, revoke } = Proxy.revocable(metadata, {})
    revoke()

    await expectMalformedOverrideDenied(proxy)
  })

  it('returns 403 without executing metadata accessors', async () => {
    const pathParamGetter = jest.fn(() => 'tenantId')
    const systemPolicyGetter = jest.fn(() => 'DENY')
    const override = Object.defineProperties(
      {},
      {
        pathParam: { get: pathParamGetter },
        systemPolicy: { get: systemPolicyGetter }
      }
    )

    await expectMalformedOverrideDenied(override)
    expect(pathParamGetter).not.toHaveBeenCalled()
    expect(systemPolicyGetter).not.toHaveBeenCalled()
  })

  it('returns 403 when required metadata fields are inherited instead of owned', async () => {
    const override = Object.create(metadata) as object

    await expectMalformedOverrideDenied(override)
  })

  it.each([{ tenantId: undefined }, { tenantId: '   ' }, { tenantId: 'tenant@a' }])(
    'returns 401 for an invalid TENANT session context %#',
    async (user) => {
      await expectHttpStatus(
        createGuard(metadata).canActivate(
          createContext({
            params: { tenantId: 'tenant_a' },
            user: { scopeLevel: 'TENANT', ...user }
          })
        ),
        401
      )
    }
  )

  it.each([undefined, '', '   ', 'tenant@a'])(
    'returns 400 for invalid matched target %p',
    async (target) => {
      await expectHttpStatus(
        createGuard(metadata).canActivate(
          createContext({
            params: { tenantId: target },
            user: { scopeLevel: 'TENANT', tenantId: 'tenant_a' }
          })
        ),
        400
      )
    }
  )

  it('returns 403 on tenant mismatch even when org matches the target', async () => {
    await expectHttpStatus(
      createGuard(metadata).canActivate(
        createContext({
          params: { tenantId: 'tenant_b' },
          user: { scopeLevel: 'TENANT', tenantId: 'tenant_a', orgId: 'tenant_b' }
        })
      ),
      403
    )
  })

  it('returns 403 for SYSTEM under the Site Management P1 policy', async () => {
    await expectHttpStatus(
      createGuard(metadata).canActivate(
        createContext({
          params: { tenantId: 'tenant_a' },
          user: { scopeLevel: 'SYSTEM' }
        })
      ),
      403
    )
  })

  it('returns 401 for missing or unknown session scope', async () => {
    await expectHttpStatus(
      createGuard(metadata).canActivate(
        createContext({ params: { tenantId: 'tenant_a' }, user: { tenantId: 'tenant_a' } })
      ),
      401
    )
    await expectHttpStatus(
      createGuard(metadata).canActivate(
        createContext({
          params: { tenantId: 'tenant_a' },
          user: { scopeLevel: 'UNKNOWN', tenantId: 'tenant_a' }
        })
      ),
      401
    )
  })

  it('normalizes matching session and path tenants into the request-scoped verified target', async () => {
    const request: TestRequest = {
      params: { tenantId: ' tenant_a ' },
      user: { scopeLevel: ' tenant ', tenantId: ' tenant_a ' }
    }

    await expect(createGuard(metadata).canActivate(createContext(request))).resolves.toBe(true)
    expect(getVerifiedTenantTarget(request)).toBe('tenant_a')
    expect(request.params).toEqual({ tenantId: ' tenant_a ' })
  })

  it('keeps verified targets isolated across concurrent request objects', async () => {
    const requestA: TestRequest = {
      params: { tenantId: 'tenant_a' },
      user: { scopeLevel: 'TENANT', tenantId: 'tenant_a' }
    }
    const requestB: TestRequest = {
      params: { tenantId: 'tenant_b' },
      user: { scopeLevel: 'TENANT', tenantId: 'tenant_b' }
    }
    const guard = createGuard(metadata)

    await Promise.all([
      guard.canActivate(createContext(requestA)),
      guard.canActivate(createContext(requestB))
    ])

    expect(getVerifiedTenantTarget(requestA)).toBe('tenant_a')
    expect(getVerifiedTenantTarget(requestB)).toBe('tenant_b')
  })

  it('does not fold tenant identifier case during comparison or verification', async () => {
    await expectHttpStatus(
      createGuard(metadata).canActivate(
        createContext({
          params: { tenantId: 'tenant_a' },
          user: { scopeLevel: 'TENANT', tenantId: 'Tenant_A' }
        })
      ),
      403
    )

    const matchingRequest: TestRequest = {
      params: { tenantId: 'Tenant_A' },
      user: { scopeLevel: 'TENANT', tenantId: 'Tenant_A' }
    }
    await createGuard(metadata).canActivate(createContext(matchingRequest))
    expect(getVerifiedTenantTarget(matchingRequest)).toBe('Tenant_A')
  })

  it.each(['ténant_a', 'te\u0301nant_a'])(
    'returns 400 for Unicode or decomposed tenant path input %p',
    async (target) => {
      await expectHttpStatus(
        createGuard(metadata).canActivate(
          createContext({
            params: { tenantId: target },
            user: { scopeLevel: 'TENANT', tenantId: 'tenant_a' }
          })
        ),
        400
      )
    }
  )

  it.each(['ténant_a', 'te\u0301nant_a'])(
    'returns 401 for Unicode or decomposed tenant session input %p',
    async (tenantId) => {
      await expectHttpStatus(
        createGuard(metadata).canActivate(
          createContext({
            params: { tenantId: 'tenant_a' },
            user: { scopeLevel: 'TENANT', tenantId }
          })
        ),
        401
      )
    }
  )

  it('fails closed for malformed metadata and marked non-HTTP contexts', async () => {
    await expectHttpStatus(
      createGuard({ pathParam: 'tenantId', systemPolicy: 'ALLOW' }).canActivate(
        createContext({
          params: { tenantId: 'tenant_a' },
          user: { scopeLevel: 'TENANT', tenantId: 'tenant_a' }
        })
      ),
      403
    )
    await expect(createGuard(metadata).canActivate(createContext({}, 'rpc'))).resolves.toBe(false)
  })

  it('fails closed when verified target is read without a successful guard', () => {
    expect(() => getVerifiedTenantTarget({})).toThrow()
  })
})
