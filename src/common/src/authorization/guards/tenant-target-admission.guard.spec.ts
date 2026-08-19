import 'reflect-metadata'
import { Metadata } from '@grpc/grpc-js'
import type {
  RpcAuthorizationModeDeclaration,
  VerifiedExecutionToken,
  VerifiedWorkloadIdentity
} from '../trusted-execution'
import {
  createSystemTenantTargetMethodDeclaration,
  createTenantTargetMethodDeclaration,
  RPC_AUTHORIZATION_MODE_METADATA_KEY
} from '../trusted-execution'
import { attachVerifiedExecution, getAuthenticatedGrpcRequestContext } from '../utils'
import { bindTrustedExecutionAdmissionEvidence } from './trusted-execution-admission-evidence'
import { TrustedExecutionGuard } from './trusted-execution.guard'
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
const OTHER_CODE = 'tenant_org.tenant.read'
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

/** Builds one immutable trusted BUSINESS declaration for the exact Code fixture. */
function businessDeclaration(...codes: readonly string[]): RpcAuthorizationModeDeclaration {
  return Object.freeze({
    mode: 'BUSINESS',
    permissions: Object.freeze({ all: Object.freeze([...codes]) })
  })
}

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
    readonly bindTrustedEvidence?: boolean
    readonly rpcAuthorizationDeclaration?: RpcAuthorizationModeDeclaration
    readonly evidenceRequestId?: unknown
    readonly evidenceTraceId?: unknown
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
    getHandler: jest.fn(() => handler),
    getClass: jest.fn(() => class TargetController {}),
    switchToRpc: jest.fn(() => ({ getData: () => data }))
  }
  const publicContext = getAuthenticatedGrpcRequestContext(data)
  if (
    options.bindTrustedEvidence !== false &&
    publicContext?.verifiedExecutionToken !== undefined &&
    publicContext.verifiedWorkloadIdentity !== undefined
  ) {
    const requestId = Object.prototype.hasOwnProperty.call(options, 'evidenceRequestId')
      ? options.evidenceRequestId
      : 'request-1'
    const traceId = Object.prototype.hasOwnProperty.call(options, 'evidenceTraceId')
      ? options.evidenceTraceId
      : 'trace-1'
    bindTrustedExecutionAdmissionEvidence(data, {
      handler,
      authorizationDeclaration: options.rpcAuthorizationDeclaration ?? businessDeclaration(CODE),
      verifiedExecutionToken: publicContext.verifiedExecutionToken,
      verifiedWorkloadIdentity: publicContext.verifiedWorkloadIdentity,
      requestId: requestId as string,
      ...(traceId === undefined ? {} : { traceId: traceId as string })
    })
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
    const dedicatedAuthorization = Reflect.getMetadata(
      RPC_AUTHORIZATION_MODE_METADATA_KEY,
      TargetController.prototype.dedicated
    )
    expect(ordinary).toEqual(tenantDeclaration())
    expect(dedicated).toEqual(systemDeclaration())
    expect(dedicatedAuthorization).toEqual(businessDeclaration(CODE))
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

  it('composes the real trusted guard and target guard on one dedicated SYSTEM handler', async () => {
    class TargetController {
      @DeclareSystemTenantTargetRpc({
        selectorField: 'tenantId',
        gatewayWorkloadIdentity: GATEWAY,
        permissionCode: CODE
      })
      dedicated(): void {}
    }

    const handler = TargetController.prototype.dedicated
    const targetAuthorization = Reflect.getMetadata(TENANT_TARGET_ADMISSION_METADATA_KEY, handler)
    const rpcAuthorization = Reflect.getMetadata(RPC_AUTHORIZATION_MODE_METADATA_KEY, handler)
    const metadata = new Metadata()
    metadata.set('authorization', 'Bearer e30.e30.e30')
    metadata.set('x-request-id', 'request-integrated')
    metadata.set('x-trace-id', 'trace-integrated')
    metadata.set('traceparent', '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01')
    const systemToken = token({ tenantId: undefined })
    delete (systemToken as { tenantId?: string }).tenantId
    const data: Record<string, unknown> = { tenantId: 'Target-Integrated' }
    const context = {
      getType: jest.fn(() => 'rpc'),
      getHandler: jest.fn(() => handler),
      getClass: jest.fn(() => TargetController),
      getArgByIndex: jest.fn(() => ({ getAuthContext: jest.fn() })),
      switchToRpc: jest.fn(() => ({ getContext: () => metadata, getData: () => data }))
    }
    const trustedGuard = new TrustedExecutionGuard(
      { getAllAndOverride: jest.fn(() => rpcAuthorization) } as never,
      { verify: jest.fn(async () => systemToken) } as never,
      { getVerifiedWorkloadIdentity: jest.fn(async () => workload()) } as never,
      token().audience
    )
    const binder = { bind: jest.fn(async () => true) }
    const targetGuard = new TenantTargetAdmissionGuard(
      { getAllAndOverride: jest.fn(() => targetAuthorization) } as never,
      binder
    )

    await expect(trustedGuard.canActivate(context as never)).resolves.toBe(true)
    await expect(targetGuard.canActivate(context as never)).resolves.toBe(true)
    expect(requireAdmittedTenantTarget(data)).toMatchObject({
      selector: 'Target-Integrated',
      subjectScope: 'SYSTEM',
      permissionCode: CODE,
      range: 'ALL'
    })
    expect(binder.bind).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'request-integrated',
        traceId: 'trace-integrated'
      })
    )
  })

  it.each([
    ['conflicting BUSINESS Code', businessDeclaration(OTHER_CODE)],
    ['multiple BUSINESS Codes', businessDeclaration(OTHER_CODE, CODE)],
    [
      'SELF_SERVICE mode',
      Object.freeze({
        mode: 'SELF_SERVICE',
        allowDelegated: true
      }) as RpcAuthorizationModeDeclaration
    ],
    [
      'INTERNAL mode',
      Object.freeze({
        mode: 'INTERNAL',
        permissions: Object.freeze({ all: Object.freeze([CODE]) })
      }) as RpcAuthorizationModeDeclaration
    ]
  ])('rejects dedicated SYSTEM with %s before audit', async (_label, rpcDeclaration) => {
    const systemToken = token({ tenantId: undefined })
    delete (systemToken as { tenantId?: string }).tenantId
    const binder = { bind: jest.fn(async () => true) }
    const fixture = guardFixture(systemDeclaration(), verifiedData('Target-B', systemToken), {
      binder,
      rpcAuthorizationDeclaration: rpcDeclaration
    })
    await expectDenied(fixture)
    expect(binder.bind).not.toHaveBeenCalled()
  })

  it('rejects an ambiguous multi-Code SYSTEM token before audit', async () => {
    const systemToken = token({
      tenantId: undefined,
      permissionCodes: [OTHER_CODE, CODE]
    })
    delete (systemToken as { tenantId?: string }).tenantId
    const binder = { bind: jest.fn(async () => true) }
    const fixture = guardFixture(systemDeclaration(), verifiedData('Target-B', systemToken), {
      binder
    })
    await expectDenied(fixture)
    expect(binder.bind).not.toHaveBeenCalled()
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
    await expectDenied(guardFixture(tenantDeclaration(), data, { bindTrustedEvidence: false }))
  })

  it('rejects public attachVerifiedExecution without private trusted-guard evidence', async () => {
    await expectDenied(
      guardFixture(tenantDeclaration(), verifiedData(), { bindTrustedEvidence: false })
    )
  })

  it('rejects replacement of the public verified carrier after trusted admission', async () => {
    const data = verifiedData()
    const fixture = guardFixture(tenantDeclaration(), data)
    const publicContext = getAuthenticatedGrpcRequestContext(data) as Record<string, unknown>
    publicContext.verifiedExecutionToken = token({ tokenId: 'replacement-token' })

    await expectDenied(fixture)
  })

  it('rejects handler crossover after trusted admission', async () => {
    const fixture = guardFixture(tenantDeclaration(), verifiedData())
    fixture.context.getHandler.mockReturnValue(jest.fn(() => 'other-handler'))

    await expectDenied(fixture)
  })

  it('rejects in-place mutation of stamped token or workload evidence', async () => {
    const tokenValue = token()
    const workloadValue = workload()
    const tokenData = verifiedData('Tenant-A', tokenValue, workloadValue)
    const tokenFixture = guardFixture(tenantDeclaration(), tokenData)
    ;(tokenValue.permissionCodes as string[])[0] = OTHER_CODE
    await expectDenied(tokenFixture)

    const secondToken = token()
    const secondWorkload = workload()
    const workloadData = verifiedData('Tenant-A', secondToken, secondWorkload)
    const workloadFixture = guardFixture(tenantDeclaration(), workloadData)
    ;(secondWorkload as { spiffeId: string }).spiffeId = OTHER_WORKLOAD
    await expectDenied(workloadFixture)
  })

  it('keeps concurrent request evidence isolated and rejects carrier crossover', async () => {
    const firstData = verifiedData('Tenant-A', token({ tokenId: 'token-a' }))
    const secondData = verifiedData('Tenant-A', token({ tokenId: 'token-b' }))
    const firstFixture = guardFixture(tenantDeclaration(), firstData)
    const secondFixture = guardFixture(tenantDeclaration(), secondData)
    const firstContext = firstData.__oesOperatorContext
    firstData.__oesOperatorContext = secondData.__oesOperatorContext
    secondData.__oesOperatorContext = firstContext

    await expectDenied(firstFixture)
    await expectDenied(secondFixture)
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
    const binder = { bind: jest.fn(async () => true) }
    const correlationInput = correlation as Record<string, unknown>
    const fixture = guardFixture(tenantDeclaration(), data, {
      binder,
      ...(Object.prototype.hasOwnProperty.call(correlationInput, 'requestId')
        ? { evidenceRequestId: correlationInput.requestId }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(correlationInput, 'traceId')
        ? { evidenceTraceId: correlationInput.traceId }
        : {})
    })
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
