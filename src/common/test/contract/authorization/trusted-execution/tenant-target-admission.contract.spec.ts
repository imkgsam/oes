import type { VerifiedExecutionToken, VerifiedWorkloadIdentity } from '../../../../src/authorization/trusted-execution/execution-token-verifier'
import {
  admitTenantTargetSelector,
  createSystemTenantTargetMethodDeclaration,
  createTenantTargetMethodDeclaration,
  parseTenantTargetSelector,
  type TenantTargetAdmissionInput
} from '../../../../src/authorization/trusted-execution/tenant-target-admission'

const GATEWAY = 'spiffe://local.oes.internal/ns/oes/sa/api-gateway'
const OTHER_WORKLOAD = 'spiffe://local.oes.internal/ns/oes/sa/other-service'
const CODE = 'tenant_org.tenant.target'
const THUMBPRINT = 'A'.repeat(43)
const OTHER_THUMBPRINT = 'B'.repeat(43)

/** Builds an immutable-looking verified projection without adding target-selector authority. */
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

/** Builds the verified direct-workload projection paired with the token fixture. */
function workload(overrides: Partial<VerifiedWorkloadIdentity> = {}): VerifiedWorkloadIdentity {
  return { spiffeId: GATEWAY, certificateThumbprint: THUMBPRINT, ...overrides }
}

const tenantDeclaration = () => createTenantTargetMethodDeclaration({ selectorField: 'tenant_id' })
const systemDeclaration = () =>
  createSystemTenantTargetMethodDeclaration({
    selectorField: 'tenant_id',
    gatewayWorkloadIdentity: GATEWAY,
    permissionCode: CODE
  })

/** Produces one fully authorized target admission input with an observable audit callback. */
function input(overrides: Partial<TenantTargetAdmissionInput> = {}): TenantTargetAdmissionInput {
  return {
    verifiedExecutionToken: token(),
    verifiedWorkloadIdentity: workload(),
    declaration: tenantDeclaration(),
    selector: 'Tenant-A',
    bindAudit: jest.fn(async () => true),
    ...overrides
  }
}

/** Asserts the repository's stable 403 ACCESS_DENIED application exception. */
async function expectAccessDenied(operation: Promise<unknown>): Promise<void> {
  await expect(operation).rejects.toMatchObject({
    definition: { code: 'APP_AUTH_002' }
  })
  await expect(operation).rejects.toMatchObject({
    definition: { rpcStatus: 7 }
  })
}

/** Asserts declaration/parser construction rejects through the same stable application exception. */
function expectSynchronousAccessDenied(operation: () => unknown): void {
  try {
    operation()
    throw new Error('expected ACCESS_DENIED')
  } catch (error) {
    expect(error).toMatchObject({ definition: { code: 'APP_AUTH_002', rpcStatus: 7 } })
  }
}

describe('tenant target admission declarations and selector parser', () => {
  it('preserves every exact canonical selector byte, including case, at the 128-byte limit', () => {
    const upperAndLower = 'Tenant-Aa:01.v2'
    const maximum = `A${'x'.repeat(127)}`
    expect(parseTenantTargetSelector(upperAndLower)).toBe(upperAndLower)
    expect(parseTenantTargetSelector(maximum)).toBe(maximum)
  })

  it.each([
    undefined,
    null,
    1,
    {},
    '',
    ' tenant-A',
    'tenant-A ',
    'tenant A',
    '*',
    'tenant/*',
    '_tenant',
    `A${'x'.repeat(128)}`
  ])('rejects a malformed, padded, wildcard, lossy, or non-string selector: %p', (selector) => {
    expectSynchronousAccessDenied(() => parseTenantTargetSelector(selector))
  })

  it('creates exact immutable ordinary and dedicated method declarations', () => {
    const ordinary = tenantDeclaration()
    const dedicated = systemDeclaration()

    expect(ordinary).toEqual({
      kind: 'TENANT_SYSTEM_DENY',
      selectorField: 'tenant_id',
      tenantAuthority: 'TOKEN_TENANT_EQUALITY',
      systemAuthority: 'DENY'
    })
    expect(dedicated).toEqual({
      kind: 'SYSTEM_TARGET',
      selectorField: 'tenant_id',
      tenantAuthority: 'TOKEN_TENANT_EQUALITY',
      systemAuthority: 'DEDICATED',
      gatewayWorkloadIdentity: GATEWAY,
      permissionCode: CODE,
      range: 'ALL'
    })
    expect(Object.isFrozen(ordinary)).toBe(true)
    expect(Object.isFrozen(dedicated)).toBe(true)
  })

  it.each([
    () => createTenantTargetMethodDeclaration({ selectorField: ' tenant_id' }),
    () => createTenantTargetMethodDeclaration({ selectorField: 'tenant-id' }),
    () =>
      createSystemTenantTargetMethodDeclaration({
        selectorField: 'tenant_id',
        gatewayWorkloadIdentity: `${GATEWAY}*`,
        permissionCode: CODE
      }),
    () =>
      createSystemTenantTargetMethodDeclaration({
        selectorField: 'tenant_id',
        gatewayWorkloadIdentity: GATEWAY,
        permissionCode: ' Tenant_Org.Target'
      })
  ])('rejects invalid declaration authority instead of normalizing it', (build) => {
    expectSynchronousAccessDenied(build)
  })
})

describe('tenant target selector admission', () => {
  it('admits exact TENANT equality on an ordinary declaration only after audit succeeds', async () => {
    const bindAudit = jest.fn(async (decision) => {
      expect(Object.isFrozen(decision)).toBe(true)
      return true
    })
    const decision = await admitTenantTargetSelector(input({ bindAudit }))

    expect(decision).toEqual({
      selector: 'Tenant-A',
      selectorField: 'tenant_id',
      subjectScope: 'TENANT',
      subject: 'account:user-1',
      subjectTenantId: 'Tenant-A',
      tokenId: 'token-1',
      workloadIdentity: GATEWAY,
      declarationKind: 'TENANT_SYSTEM_DENY'
    })
    expect(Object.isFrozen(decision)).toBe(true)
    expect(bindAudit).toHaveBeenCalledTimes(1)
  })

  it('admits exact TENANT equality on a dedicated declaration without using SYSTEM authority', async () => {
    const bindAudit = jest.fn(async () => true)
    const decision = await admitTenantTargetSelector(
      input({ declaration: systemDeclaration(), bindAudit })
    )
    expect(decision.subjectScope).toBe('TENANT')
    expect(decision).not.toHaveProperty('permissionCode')
    expect(decision).not.toHaveProperty('range')
  })

  it('rejects a TENANT mismatch byte-for-byte, including case, before audit', async () => {
    const bindAudit = jest.fn(async () => true)
    await expectAccessDenied(admitTenantTargetSelector(input({ selector: 'tenant-A', bindAudit })))
    expect(bindAudit).not.toHaveBeenCalled()
  })

  it('rejects SYSTEM on an ordinary explicit-deny declaration before audit', async () => {
    const bindAudit = jest.fn(async () => true)
    const systemToken = token({ tenantId: undefined })
    delete (systemToken as { tenantId?: string }).tenantId
    await expectAccessDenied(
      admitTenantTargetSelector(input({ verifiedExecutionToken: systemToken, bindAudit }))
    )
    expect(bindAudit).not.toHaveBeenCalled()
  })

  it('admits tenantless SYSTEM only for the exact Gateway, same Code, and current ALL range', async () => {
    const systemToken = token({ tenantId: undefined })
    delete (systemToken as { tenantId?: string }).tenantId
    const bindAudit = jest.fn(async () => true)
    const decision = await admitTenantTargetSelector(
      input({
        verifiedExecutionToken: systemToken,
        declaration: systemDeclaration(),
        selector: 'Target-02',
        bindAudit
      })
    )

    expect(decision).toEqual({
      selector: 'Target-02',
      selectorField: 'tenant_id',
      subjectScope: 'SYSTEM',
      subject: 'account:user-1',
      tokenId: 'token-1',
      workloadIdentity: GATEWAY,
      declarationKind: 'SYSTEM_TARGET',
      permissionCode: CODE,
      range: 'ALL'
    })
    expect(bindAudit).toHaveBeenCalledWith(decision)
  })

  it.each([
    {
      label: 'wrong verified workload',
      tokenOverrides: { clientId: OTHER_WORKLOAD },
      workloadOverrides: { spiffeId: OTHER_WORKLOAD },
      declaration: systemDeclaration()
    },
    {
      label: 'missing same canonical Code',
      tokenOverrides: { permissionCodes: ['tenant_org.tenant.read'] },
      declaration: systemDeclaration()
    },
    {
      label: 'ambiguous additional Code',
      tokenOverrides: {
        permissionCodes: ['tenant_org.tenant.read', 'tenant_org.tenant.target']
      },
      declaration: systemDeclaration()
    },
    {
      label: 'range mismatch',
      tokenOverrides: {},
      declaration: { ...systemDeclaration(), range: 'TENANT_SET' }
    }
  ])(
    'rejects SYSTEM $label before audit',
    async ({ tokenOverrides, workloadOverrides, declaration }) => {
      const systemToken = token({ tenantId: undefined, ...tokenOverrides })
      delete (systemToken as { tenantId?: string }).tenantId
      const bindAudit = jest.fn(async () => true)
      await expectAccessDenied(
        admitTenantTargetSelector(
          input({
            verifiedExecutionToken: systemToken,
            verifiedWorkloadIdentity: workload(workloadOverrides),
            declaration: declaration as never,
            bindAudit
          })
        )
      )
      expect(bindAudit).not.toHaveBeenCalled()
    }
  )

  it.each([
    {
      label: 'token/workload client provenance mismatch',
      overrides: { verifiedWorkloadIdentity: workload({ spiffeId: OTHER_WORKLOAD }) }
    },
    {
      label: 'token/workload certificate provenance mismatch',
      overrides: {
        verifiedWorkloadIdentity: workload({ certificateThumbprint: OTHER_THUMBPRINT })
      }
    },
    {
      label: 'unknown scope from an explicitly undefined tenant projection',
      overrides: { verifiedExecutionToken: token({ tenantId: undefined }) }
    },
    {
      label: 'ambiguous wildcard tenant projection',
      overrides: { verifiedExecutionToken: token({ tenantId: '*' }) }
    },
    { label: 'missing declaration', overrides: { declaration: undefined as never } },
    { label: 'missing token context', overrides: { verifiedExecutionToken: undefined as never } },
    {
      label: 'missing workload context',
      overrides: { verifiedWorkloadIdentity: undefined as never }
    },
    { label: 'missing audit binding', overrides: { bindAudit: undefined as never } }
  ])('fails closed for $label', async ({ overrides }) => {
    await expectAccessDenied(admitTenantTargetSelector(input(overrides)))
  })

  it('rejects fabricated declarations with extra authority fields before audit', async () => {
    const bindAudit = jest.fn(async () => true)
    await expectAccessDenied(
      admitTenantTargetSelector(
        input({
          declaration: { ...tenantDeclaration(), gatewayTargetable: true } as never,
          bindAudit
        })
      )
    )
    expect(bindAudit).not.toHaveBeenCalled()
  })

  it.each([
    {
      label: 'mutable metadata',
      declaration: { ...tenantDeclaration() }
    },
    {
      label: 'prototype-backed metadata',
      declaration: Object.freeze(
        Object.assign(Object.create({ inheritedAuthority: true }), tenantDeclaration())
      )
    },
    {
      label: 'accessor-backed metadata',
      declaration: Object.freeze(
        Object.defineProperty(
          {
            kind: 'TENANT_SYSTEM_DENY',
            tenantAuthority: 'TOKEN_TENANT_EQUALITY',
            systemAuthority: 'DENY'
          },
          'selectorField',
          { enumerable: true, get: () => 'tenant_id' }
        )
      )
    }
  ])('rejects $label as ambiguous declaration provenance', async ({ declaration }) => {
    const bindAudit = jest.fn(async () => true)
    await expectAccessDenied(
      admitTenantTargetSelector(input({ declaration: declaration as never, bindAudit }))
    )
    expect(bindAudit).not.toHaveBeenCalled()
  })

  it.each([
    ['false', jest.fn(async () => false)],
    ['throw', jest.fn(async () => Promise.reject(new Error('audit unavailable')))]
  ])(
    'does not return an admitted result when audit binding returns %s',
    async (_label, bindAudit) => {
      let returned = false
      await expectAccessDenied(
        admitTenantTargetSelector(input({ bindAudit })).then(() => {
          returned = true
        })
      )
      expect(returned).toBe(false)
      expect(bindAudit).toHaveBeenCalledTimes(1)
    }
  )

  it('does not mutate token/workload authority or introduce credential, STS, metadata, or cache fields', async () => {
    const verifiedToken = token()
    const verifiedWorkload = workload()
    const tokenKeys = Object.keys(verifiedToken)
    const workloadKeys = Object.keys(verifiedWorkload)
    const decision = await admitTenantTargetSelector(
      input({ verifiedExecutionToken: verifiedToken, verifiedWorkloadIdentity: verifiedWorkload })
    )

    expect(Object.keys(verifiedToken)).toEqual(tokenKeys)
    expect(Object.keys(verifiedWorkload)).toEqual(workloadKeys)
    expect(verifiedToken).not.toHaveProperty('targetTenantId')
    expect(verifiedToken).not.toHaveProperty('target_tenant_id')
    expect(verifiedWorkload).not.toHaveProperty('selector')
    expect(decision).not.toHaveProperty('accessToken')
    expect(decision).not.toHaveProperty('certificateThumbprint')
    expect(JSON.stringify(decision)).not.toContain('Bearer')
  })
})
