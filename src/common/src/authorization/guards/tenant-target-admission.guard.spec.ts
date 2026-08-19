import 'reflect-metadata'
import type { VerifiedExecutionToken, VerifiedWorkloadIdentity } from '../trusted-execution'
import {
  createSystemTenantTargetMethodDeclaration,
  createTenantTargetMethodDeclaration
} from '../trusted-execution'
import { attachVerifiedExecution } from '../utils'
import {
  DeclareSystemTenantTargetRpc,
  DeclareTenantTargetRpc,
  requireAdmittedTenantTarget,
  TENANT_TARGET_ADMISSION_METADATA_KEY,
  TenantTargetAdmissionGuard,
  type TenantTargetAuditBinder
} from './tenant-target-admission.guard'

const GATEWAY = 'spiffe://local.oes.internal/ns/oes/sa/api-gateway'
const OTHER_WORKLOAD = 'spiffe://local.oes.internal/ns/oes/sa/other-service'
const CODE = 'tenant_org.tenant.target'
const THUMBPRINT = 'A'.repeat(43)

/** Builds one verified target-audience token projection without a target selector claim. */
function token(overrides: Partial<VerifiedExecutionToken> = {}): VerifiedExecutionToken {
  return {
    issuer: 'https://auth.local.oes',
    audience: 'urn:oes:service:tenant-org-service',
    subject: 'account:user-1',
    principalType: 'HUMAN',
    clientId: GATEWAY,
    tenantId: 'Tenant-A',
    permissionCodes: [CODE],
    tokenId: 'token-1',
    issuedAt: 100,
    notBefore: 100,
    expiresAt: 200,
    certificateThumbprint: THUMBPRINT,
    ...overrides
  }
}

/** Builds the direct mTLS workload projection paired with the token fixture. */
function workload(overrides: Partial<VerifiedWorkloadIdentity> = {}): VerifiedWorkloadIdentity {
  return { spiffeId: GATEWAY, certificateThumbprint: THUMBPRINT, ...overrides }
}

const tenantDeclaration = () => createTenantTargetMethodDeclaration({ selectorField: 'tenantId' })
const systemDeclaration = () =>
  createSystemTenantTargetMethodDeclaration({
    selectorField: 'tenantId',
    gatewayWorkloadIdentity: GATEWAY,
    permissionCode: CODE
  })

/** Stamps request data through the same private verified-execution utility used by TrustedExecutionGuard. */
function verifiedData(
  selector: unknown = 'Tenant-A',
  tokenValue: VerifiedExecutionToken = token(),
  workloadValue: VerifiedWorkloadIdentity = workload()
): Record<string, unknown> {
  const data: Record<string, unknown> = { tenantId: selector }
  const attached = attachVerifiedExecution(data, {
    verifiedExecutionToken: tokenValue,
    verifiedWorkloadIdentity: workloadValue
  })
  Object.assign(attached as object, { requestId: 'request-1', traceId: 'trace-1' })
  return data
}

/** Builds one RPC guard context with exact method metadata and request data. */
function guardFixture(
  declaration: unknown,
  data: unknown,
  options: {
    readonly type?: string
    readonly binder?: TenantTargetAuditBinder
  } = {}
) {
  const binder: TenantTargetAuditBinder | undefined = Object.prototype.hasOwnProperty.call(
    options,
    'binder'
  )
    ? options.binder
    : ({ bind: jest.fn(async () => true) } satisfies TenantTargetAuditBinder)
  const reflector = { getAllAndOverride: jest.fn(() => declaration) }
  const handler = jest.fn(() => 'handled')
  const context = {
    getType: jest.fn(() => options.type ?? 'rpc'),
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToRpc: jest.fn(() => ({ getData: () => data }))
  }
  const guard = new TenantTargetAdmissionGuard(reflector as never, binder as never)

  return { binder, context, data, guard, handler }
}

/** Runs the simulated handler only after the guard resolves true. */
async function execute(fixture: ReturnType<typeof guardFixture>): Promise<unknown> {
  if (await fixture.guard.canActivate(fixture.context as never)) {
    return fixture.handler()
  }
  return undefined
}

/** Asserts stable 403 semantics, zero handler access, and no admitted request carrier. */
async function expectDenied(fixture: ReturnType<typeof guardFixture>): Promise<void> {
  await expect(execute(fixture)).rejects.toMatchObject({
    definition: { code: 'APP_AUTH_002', rpcStatus: 7 }
  })
  expect(fixture.handler).not.toHaveBeenCalled()
  expect(() => requireAdmittedTenantTarget(fixture.data)).toThrow(
    'Access denied due to insufficient permissions'
  )
}

describe('target-owned tenant target declarations', () => {
  it('stores immutable ordinary and dedicated declarations outside Gateway metadata', () => {
    class TargetController {
      @DeclareTenantTargetRpc({ selectorField: 'tenantId' })
      ordinary(): void {}

      @DeclareSystemTenantTargetRpc({
        selectorField: 'tenantId',
        gatewayWorkloadIdentity: GATEWAY,
        permissionCode: CODE
      })
      dedicated(): void {}
    }

    const ordinary = Reflect.getMetadata(
      TENANT_TARGET_ADMISSION_METADATA_KEY,
      TargetController.prototype.ordinary
    )
    const dedicated = Reflect.getMetadata(
      TENANT_TARGET_ADMISSION_METADATA_KEY,
      TargetController.prototype.dedicated
    )
    expect(ordinary).toEqual(tenantDeclaration())
    expect(dedicated).toEqual(systemDeclaration())
    expect(Object.isFrozen(ordinary)).toBe(true)
    expect(Object.isFrozen(dedicated)).toBe(true)
    expect(TENANT_TARGET_ADMISSION_METADATA_KEY).not.toContain('gateway:route')
  })
})

describe('TenantTargetAdmissionGuard', () => {
  it('admits exact TENANT equality, binds audit correlation, then exposes one frozen carrier', async () => {
    const binder = { bind: jest.fn(async () => true) }
    const fixture = guardFixture(tenantDeclaration(), verifiedData(), { binder })

    await expect(execute(fixture)).resolves.toBe('handled')
    const admitted = requireAdmittedTenantTarget(fixture.data)
    expect(admitted).toMatchObject({
      selector: 'Tenant-A',
      selectorField: 'tenantId',
      subjectScope: 'TENANT',
      subjectTenantId: 'Tenant-A'
    })
    expect(Object.isFrozen(admitted)).toBe(true)
    expect(binder.bind).toHaveBeenCalledWith({
      decision: admitted,
      requestId: 'request-1',
      traceId: 'trace-1'
    })
    expect(Object.keys(fixture.data)).toEqual(['tenantId', '__oesOperatorContext'])
  })

  it('rejects TENANT selector mismatch before audit and handler access', async () => {
    const binder = { bind: jest.fn(async () => true) }
    const fixture = guardFixture(tenantDeclaration(), verifiedData('tenant-a'), { binder })
    await expectDenied(fixture)
    expect(binder.bind).not.toHaveBeenCalled()
  })

  it('rejects tenantless SYSTEM on an ordinary explicit-deny method', async () => {
    const systemToken = token({ tenantId: undefined })
    delete (systemToken as { tenantId?: string }).tenantId
    const binder = { bind: jest.fn(async () => true) }
    const fixture = guardFixture(tenantDeclaration(), verifiedData('Target-B', systemToken), {
      binder
    })
    await expectDenied(fixture)
    expect(binder.bind).not.toHaveBeenCalled()
  })

  it('admits tenantless SYSTEM only for exact Gateway, same Code, and fixed ALL range', async () => {
    const systemToken = token({ tenantId: undefined })
    delete (systemToken as { tenantId?: string }).tenantId
    const binder = { bind: jest.fn(async () => true) }
    const fixture = guardFixture(systemDeclaration(), verifiedData('Target-B', systemToken), {
      binder
    })

    await expect(execute(fixture)).resolves.toBe('handled')
    expect(requireAdmittedTenantTarget(fixture.data)).toMatchObject({
      selector: 'Target-B',
      subjectScope: 'SYSTEM',
      workloadIdentity: GATEWAY,
      permissionCode: CODE,
      range: 'ALL'
    })
  })

  it.each([
    {
      label: 'workload mismatch',
      tokenValue: (() => {
        const value = token({ tenantId: undefined, clientId: OTHER_WORKLOAD })
        delete (value as { tenantId?: string }).tenantId
        return value
      })(),
      workloadValue: workload({ spiffeId: OTHER_WORKLOAD }),
      declaration: systemDeclaration()
    },
    {
      label: 'Code mismatch',
      tokenValue: (() => {
        const value = token({ tenantId: undefined, permissionCodes: ['tenant_org.tenant.read'] })
        delete (value as { tenantId?: string }).tenantId
        return value
      })(),
      workloadValue: workload(),
      declaration: systemDeclaration()
    },
    {
      label: 'range mismatch',
      tokenValue: (() => {
        const value = token({ tenantId: undefined })
        delete (value as { tenantId?: string }).tenantId
        return value
      })(),
      workloadValue: workload(),
      declaration: Object.freeze({ ...systemDeclaration(), range: 'TENANT_SET' })
    }
  ])('rejects dedicated SYSTEM $label before audit', async (testCase) => {
    const binder = { bind: jest.fn(async () => true) }
    const fixture = guardFixture(
      testCase.declaration,
      verifiedData('Target-B', testCase.tokenValue, testCase.workloadValue),
      { binder }
    )
    await expectDenied(fixture)
    expect(binder.bind).not.toHaveBeenCalled()
  })

  it.each([
    ['non-RPC context', tenantDeclaration(), verifiedData(), { type: 'http' }],
    ['missing declaration', undefined, verifiedData(), {}],
    ['mutable declaration', { ...tenantDeclaration() }, verifiedData(), {}],
    ['missing request context', tenantDeclaration(), { tenantId: 'Tenant-A' }, {}],
    ['invalid request data', tenantDeclaration(), null, {}]
  ])('fails closed for %s', async (_label, declaration, data, options) => {
    await expectDenied(guardFixture(declaration, data, options))
  })

  it('rejects caller-shaped verified context that lacks the private trusted guard stamp', async () => {
    const data = {
      tenantId: 'Tenant-A',
      __oesOperatorContext: {
        verifiedExecutionToken: token(),
        verifiedWorkloadIdentity: workload(),
        requestId: 'request-1',
        traceId: 'trace-1'
      }
    }
    await expectDenied(guardFixture(tenantDeclaration(), data))
  })

  it.each(['inherited', 'accessor', 'duplicate'] as const)(
    'rejects %s selector provenance before audit',
    async (kind) => {
      let data: Record<string, unknown>
      if (kind === 'inherited') {
        data = Object.create({ tenantId: 'Tenant-A' }) as Record<string, unknown>
      } else if (kind === 'accessor') {
        data = {}
        Object.defineProperty(data, 'tenantId', {
          enumerable: true,
          get: () => 'Tenant-A'
        })
      } else {
        data = { tenantId: 'Tenant-A', tenant_id: 'Tenant-A' }
      }
      const attached = attachVerifiedExecution(data, {
        verifiedExecutionToken: token(),
        verifiedWorkloadIdentity: workload()
      })
      Object.assign(attached as object, { requestId: 'request-1', traceId: 'trace-1' })
      const binder = { bind: jest.fn(async () => true) }
      const fixture = guardFixture(tenantDeclaration(), data, { binder })
      await expectDenied(fixture)
      expect(binder.bind).not.toHaveBeenCalled()
    }
  )

  it.each([
    ['request id', { requestId: undefined }],
    ['trace id', { traceId: ' trace-1 ' }]
  ])('rejects missing or invalid %s before audit', async (_label, correlation) => {
    const data = verifiedData()
    Object.assign(data.__oesOperatorContext as object, correlation)
    const binder = { bind: jest.fn(async () => true) }
    const fixture = guardFixture(tenantDeclaration(), data, { binder })
    await expectDenied(fixture)
    expect(binder.bind).not.toHaveBeenCalled()
  })

  it.each([
    ['missing', undefined],
    ['false', { bind: jest.fn(async () => false) }],
    ['throw', { bind: jest.fn(async () => Promise.reject(new Error('audit unavailable'))) }]
  ])('rejects %s audit binding and publishes no carrier', async (_label, binder) => {
    const fixture = guardFixture(tenantDeclaration(), verifiedData(), {
      binder: binder as never
    })
    await expectDenied(fixture)
  })

  it('denies carrier binding failure without running the handler', async () => {
    const data = verifiedData()
    Object.preventExtensions(data)
    const binder = { bind: jest.fn(async () => true) }
    const fixture = guardFixture(tenantDeclaration(), data, { binder })
    await expectDenied(fixture)
    expect(binder.bind).toHaveBeenCalledTimes(1)
  })
})
