import { ExecutionContext, ServiceUnavailableException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '@oes/common/auth'
import {
  GatewayPermissionGuard,
  RequirePermissions,
  REQUIRE_PERMISSIONS_METADATA_KEY
} from '@oes/common/authorization'
import { of, throwError } from 'rxjs'

const TENANT_CODE = 'fixture.tenant.read'
const SYSTEM_CODE = 'fixture.system.read'
const DUAL_CODE = 'fixture.dual.read'
const DENIED_CODE = 'fixture.denied.read'
const UNKNOWN_CODE = 'fixture.unknown.read'

type GuardFixtureOptions = {
  decisions?: Record<string, unknown | 'throw'>
  definitions?: Record<string, unknown>
  isPublic?: boolean
  requiredPermissions?: unknown
}

type ContinuationSpies = {
  downstream: jest.Mock
  handler: jest.Mock
  sideEffect: jest.Mock
}

/** Builds the HTTP execution context observed by the global Gateway guard. */
function createContext(
  user?: Record<string, unknown>,
  routePath = '/api/v1/resources',
  pathTenantId = 'path-target-tenant'
): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class TestController {},
    switchToHttp: () => ({
      getRequest: () => ({
        params: { tenantId: pathTenantId },
        route: { path: routePath },
        user
      })
    })
  } as unknown as ExecutionContext
}

/** Creates one guard with deterministic canonical-definition and Permission RPC fixtures. */
function createGuard(options: GuardFixtureOptions = {}) {
  const internalMetadata = { internal: 'metadata' }
  const metadataFactory = {
    create: jest.fn().mockResolvedValue(internalMetadata)
  }
  const definitions =
    options.definitions ??
    ({
      [TENANT_CODE]: ['TENANT'],
      [SYSTEM_CODE]: ['SYSTEM'],
      [DUAL_CODE]: ['TENANT', 'SYSTEM'],
      [DENIED_CODE]: ['TENANT']
    } satisfies Record<string, unknown>)
  const decisions =
    options.decisions ??
    ({
      [TENANT_CODE]: { allowed: true },
      [SYSTEM_CODE]: { allowed: true },
      [DUAL_CODE]: { allowed: true },
      [DENIED_CODE]: { allowed: false }
    } satisfies Record<string, unknown>)
  const checkPermission = jest.fn().mockImplementation(({ permissionCode }) => {
    const decision = decisions[permissionCode]
    return decision === 'throw'
      ? throwError(() => new Error('permission upstream unavailable'))
      : of(decision)
  })
  const guard = new GatewayPermissionGuard(
    {
      getService: jest.fn().mockReturnValue({ checkPermission })
    } as any,
    {
      getAllAndOverride: jest.fn().mockImplementation((metadataKey: string) => {
        if (metadataKey === IS_PUBLIC_KEY) return options.isPublic
        if (metadataKey === REQUIRE_PERMISSIONS_METADATA_KEY) {
          return options.requiredPermissions
        }
        return undefined
      })
    } as unknown as Reflector,
    { warn: jest.fn() } as any,
    metadataFactory as any
  )

  ;(guard as any).resolvePermissionDefinition = jest.fn().mockImplementation((code: string) => {
    if (!Object.prototype.hasOwnProperty.call(definitions, code)) return undefined
    return { allowedScopeLevels: definitions[code] }
  })
  guard.onModuleInit()
  return { checkPermission, guard, internalMetadata, metadataFactory }
}

/** Runs the guard before fixture continuations so rejections prove zero later calls. */
async function runGuardThenContinuation(
  guard: GatewayPermissionGuard,
  context: ExecutionContext,
  continuation: ContinuationSpies
): Promise<boolean> {
  const allowed = await guard.canActivate(context)
  if (!allowed) return false
  continuation.handler()
  continuation.downstream()
  continuation.sideEffect()
  return true
}

/** Creates handler, downstream and side-effect spies for ordering assertions. */
function createContinuation(): ContinuationSpies {
  return {
    handler: jest.fn(),
    downstream: jest.fn(),
    sideEffect: jest.fn()
  }
}

/** Asserts a decision dependency failure preserves the required HTTP 503 status. */
async function expectServiceUnavailable(action: Promise<unknown>) {
  const error = await action.catch((caught) => caught)
  expect(error).toBeInstanceOf(ServiceUnavailableException)
  expect((error as ServiceUnavailableException).getStatus()).toBe(503)
}

describe('GatewayPermissionGuard', () => {
  it('writes the unified route permission metadata shape', () => {
    class TestController {
      @RequirePermissions({ all: [TENANT_CODE] })
      read() {}
    }

    const reflector = new Reflector()
    expect(reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, TestController.prototype.read)).toEqual({
      all: [TENANT_CODE]
    })
  })

  it('denies a protected tenant-target route with no route Code before every continuation', async () => {
    const { guard, checkPermission } = createGuard()
    const continuation = createContinuation()

    await expect(
      runGuardThenContinuation(
        guard,
        createContext(
          { holderId: 'account-1', scopeLevel: 'TENANT', tenantId: 'subject-tenant' },
          '/api/v1/tenants/:tenantId/items'
        ),
        continuation
      )
    ).resolves.toBe(false)
    expect(checkPermission).not.toHaveBeenCalled()
    expect(continuation.handler).not.toHaveBeenCalled()
    expect(continuation.downstream).not.toHaveBeenCalled()
    expect(continuation.sideEffect).not.toHaveBeenCalled()
  })

  it('preserves public and authenticated self-service routes without a route Code', async () => {
    const publicFixture = createGuard({ isPublic: true })
    const selfServiceFixture = createGuard()

    await expect(
      publicFixture.guard.canActivate(
        createContext(undefined, '/api/v1/public/tenants/:tenantId/profile')
      )
    ).resolves.toBe(true)
    await expect(
      selfServiceFixture.guard.canActivate(
        createContext({ holderId: 'account-1', scopeLevel: 'TENANT', tenantId: 'tenant-1' })
      )
    ).resolves.toBe(true)
    expect(publicFixture.checkPermission).not.toHaveBeenCalled()
    expect(selfServiceFixture.checkPermission).not.toHaveBeenCalled()
  })

  it('admits TENANT scope and sends only the authenticated subject tenant to Permission', async () => {
    const { guard, checkPermission, internalMetadata } = createGuard({
      requiredPermissions: { all: [TENANT_CODE] }
    })

    await expect(
      guard.canActivate(
        createContext(
          {
            holderId: 'account-holder-id',
            id: 'fallback-id',
            scopeLevel: 'TENANT',
            tenantId: 'subject-tenant'
          },
          '/api/v1/tenants/:tenantId/items',
          'different-path-target'
        )
      )
    ).resolves.toBe(true)
    expect(checkPermission).toHaveBeenCalledWith(
      {
        accountId: 'account-holder-id',
        permissionCode: TENANT_CODE,
        tenantId: 'subject-tenant'
      },
      internalMetadata
    )
  })

  it('admits SYSTEM scope only without a subject tenant and never sends a tenant selector', async () => {
    const valid = createGuard({ requiredPermissions: { all: [SYSTEM_CODE] } })
    const invalid = createGuard({ requiredPermissions: { all: [SYSTEM_CODE] } })

    await expect(
      valid.guard.canActivate(createContext({ aid: 'account-1', scopeLevel: 'SYSTEM' }))
    ).resolves.toBe(true)
    expect(valid.checkPermission).toHaveBeenCalledWith(
      { accountId: 'account-1', permissionCode: SYSTEM_CODE },
      valid.internalMetadata
    )

    await expect(
      invalid.guard.canActivate(
        createContext({ aid: 'account-1', scopeLevel: 'SYSTEM', tenantId: 'tenant-1' })
      )
    ).resolves.toBe(false)
    expect(invalid.checkPermission).not.toHaveBeenCalled()
  })

  it.each([
    ['TENANT', { tenantId: 'tenant-1' }],
    ['SYSTEM', {}]
  ] as const)(
    'admits dual-scope metadata for canonical %s sessions',
    async (scopeLevel, identity) => {
      const { guard } = createGuard({ requiredPermissions: { all: [DUAL_CODE] } })

      await expect(
        guard.canActivate(createContext({ id: 'account-1', scopeLevel, ...identity }))
      ).resolves.toBe(true)
    }
  )

  it('denies an unknown Code set before any Permission call, including any mode', async () => {
    const unknownOnly = createGuard({ requiredPermissions: { all: [UNKNOWN_CODE] } })
    const mixedAny = createGuard({ requiredPermissions: { any: [UNKNOWN_CODE, TENANT_CODE] } })
    const user = { id: 'account-1', scopeLevel: 'TENANT', tenantId: 'tenant-1' }

    await expect(unknownOnly.guard.canActivate(createContext(user))).resolves.toBe(false)
    await expect(mixedAny.guard.canActivate(createContext(user))).resolves.toBe(false)
    expect(unknownOnly.checkPermission).not.toHaveBeenCalled()
    expect(mixedAny.checkPermission).not.toHaveBeenCalled()
  })

  it('keeps scope text exact and denies invalid subject shapes before Permission', async () => {
    const lowercase = createGuard({ requiredPermissions: { all: [TENANT_CODE] } })
    const missingTenant = createGuard({ requiredPermissions: { all: [TENANT_CODE] } })
    const unknownScope = createGuard({ requiredPermissions: { all: [DUAL_CODE] } })

    await expect(
      lowercase.guard.canActivate(
        createContext({ id: 'account-1', scopeLevel: 'tenant', tenantId: 'tenant-1' })
      )
    ).resolves.toBe(false)
    await expect(
      missingTenant.guard.canActivate(createContext({ id: 'account-1', scopeLevel: 'TENANT' }))
    ).resolves.toBe(false)
    await expect(
      unknownScope.guard.canActivate(
        createContext({ id: 'account-1', scopeLevel: 'ORGANIZATION', tenantId: 'tenant-1' })
      )
    ).resolves.toBe(false)
    expect(lowercase.checkPermission).not.toHaveBeenCalled()
    expect(missingTenant.checkPermission).not.toHaveBeenCalled()
    expect(unknownScope.checkPermission).not.toHaveBeenCalled()
  })

  it('calls Permission for a resolvable scope-excluded Code and returns 403-equivalent false', async () => {
    const { guard, checkPermission } = createGuard({
      requiredPermissions: { all: [SYSTEM_CODE] }
    })

    await expect(
      guard.canActivate(
        createContext({ id: 'account-1', scopeLevel: 'TENANT', tenantId: 'tenant-1' })
      )
    ).resolves.toBe(false)
    expect(checkPermission).toHaveBeenCalledTimes(1)
  })

  it('preserves all and any grant semantics after validating the complete Code set', async () => {
    const allAllowed = createGuard({
      requiredPermissions: { all: [TENANT_CODE, DUAL_CODE] }
    })
    const allDenied = createGuard({
      requiredPermissions: { all: [TENANT_CODE, DENIED_CODE] }
    })
    const anyAllowed = createGuard({
      requiredPermissions: { any: [DENIED_CODE, TENANT_CODE] }
    })
    const anyDenied = createGuard({
      decisions: { [DENIED_CODE]: { allowed: false }, [TENANT_CODE]: { allowed: false } },
      requiredPermissions: { any: [DENIED_CODE, TENANT_CODE] }
    })
    const user = { id: 'account-1', scopeLevel: 'TENANT', tenantId: 'tenant-1' }

    await expect(allAllowed.guard.canActivate(createContext(user))).resolves.toBe(true)
    await expect(allDenied.guard.canActivate(createContext(user))).resolves.toBe(false)
    await expect(anyAllowed.guard.canActivate(createContext(user))).resolves.toBe(true)
    await expect(anyDenied.guard.canActivate(createContext(user))).resolves.toBe(false)
    expect(allAllowed.checkPermission).toHaveBeenCalledTimes(2)
    expect(allDenied.checkPermission).toHaveBeenCalledTimes(2)
    expect(anyAllowed.checkPermission).toHaveBeenCalledTimes(2)
    expect(anyDenied.checkPermission).toHaveBeenCalledTimes(2)
  })

  it('stops denied grants before handler, downstream and side effect', async () => {
    const { guard } = createGuard({ requiredPermissions: { all: [DENIED_CODE] } })
    const continuation = createContinuation()

    await expect(
      runGuardThenContinuation(
        guard,
        createContext({ id: 'account-1', scopeLevel: 'TENANT', tenantId: 'tenant-1' }),
        continuation
      )
    ).resolves.toBe(false)
    expect(continuation.handler).not.toHaveBeenCalled()
    expect(continuation.downstream).not.toHaveBeenCalled()
    expect(continuation.sideEffect).not.toHaveBeenCalled()
  })

  it.each([undefined, null, {}, { allowed: 'true' }, { allowed: 1 }])(
    'maps malformed Permission response %p to 503 before continuation',
    async (response) => {
      const { guard } = createGuard({
        decisions: { [TENANT_CODE]: response },
        requiredPermissions: { all: [TENANT_CODE] }
      })
      const continuation = createContinuation()

      await expectServiceUnavailable(
        runGuardThenContinuation(
          guard,
          createContext({ id: 'account-1', scopeLevel: 'TENANT', tenantId: 'tenant-1' }),
          continuation
        )
      )
      expect(continuation.handler).not.toHaveBeenCalled()
      expect(continuation.downstream).not.toHaveBeenCalled()
      expect(continuation.sideEffect).not.toHaveBeenCalled()
    }
  )

  it('maps unavailable Permission to 503 before handler, downstream and side effect', async () => {
    const { guard } = createGuard({
      decisions: { [TENANT_CODE]: 'throw' },
      requiredPermissions: { all: [TENANT_CODE] }
    })
    const continuation = createContinuation()

    await expectServiceUnavailable(
      runGuardThenContinuation(
        guard,
        createContext({ id: 'account-1', scopeLevel: 'TENANT', tenantId: 'tenant-1' }),
        continuation
      )
    )
    expect(continuation.handler).not.toHaveBeenCalled()
    expect(continuation.downstream).not.toHaveBeenCalled()
    expect(continuation.sideEffect).not.toHaveBeenCalled()
  })

  it.each([undefined, [], ['TENANT', 'TENANT'], ['ORGANIZATION']])(
    'maps malformed static scope metadata %p to 503 before Permission',
    async (allowedScopeLevels) => {
      const { guard, checkPermission } = createGuard({
        definitions: { [TENANT_CODE]: allowedScopeLevels },
        requiredPermissions: { all: [TENANT_CODE] }
      })

      await expectServiceUnavailable(
        guard.canActivate(
          createContext({ id: 'account-1', scopeLevel: 'TENANT', tenantId: 'tenant-1' })
        )
      )
      expect(checkPermission).not.toHaveBeenCalled()
    }
  )
})
