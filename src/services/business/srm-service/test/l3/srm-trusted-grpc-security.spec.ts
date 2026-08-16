import { Metadata } from '@grpc/grpc-js'
import { Reflector } from '@nestjs/core'
import {
  getRpcAuthorizationModeDeclaration,
  SRM_INTERNAL_PERMISSION_CODES,
  SRM_MANAGEMENT_PERMISSION_CODES,
  TrustedExecutionGuard
} from '@oes/common/authorization'
import { SupplierManagementGrpcController } from '../../src/interfaces/grpc/supplier-management.grpc.controller'
import { SupplierQueryGrpcController } from '../../src/interfaces/grpc/supplier-query.grpc.controller'
import { SrmInternalQueryGrpcController } from '../../src/interfaces/grpc/srm-internal-query.grpc.controller'
import { SupplierRpcContextValidator } from '../../src/interfaces/grpc/supplier-rpc-context.validator'
import {
  SRM_INTERNAL_WORKLOAD_ALLOWLIST,
  SrmTrustedInternalExecutionGuard
} from '../../src/modules/srm-trusted-execution.module'

const queryCodes = {
  getSupplier: SRM_MANAGEMENT_PERMISSION_CODES.VIEW_SUPPLIER_DETAIL,
  searchSuppliers: SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_PROFILE,
  listSupplierContacts: SRM_MANAGEMENT_PERMISSION_CODES.VIEW_SUPPLIER_DETAIL,
  listSupplierAddresses: SRM_MANAGEMENT_PERMISSION_CODES.VIEW_SUPPLIER_DETAIL,
  listSupplierOfferingsBySupplier:
    SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_OFFERINGS_BY_SUPPLIER,
  listSupplierOfferingsByItem: SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_OFFERINGS_BY_ITEM
} as const
const managementCodes = {
  createSupplierProfile: SRM_MANAGEMENT_PERMISSION_CODES.CREATE_SUPPLIER_PROFILE,
  updateSupplierProfileBasics: SRM_MANAGEMENT_PERMISSION_CODES.UPDATE_SUPPLIER_PROFILE_BASICS,
  bindSupplierToTenantParty: SRM_MANAGEMENT_PERMISSION_CODES.BIND_SUPPLIER_TO_TENANT_PARTY,
  upsertSupplierContact: SRM_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_CONTACT,
  upsertSupplierAddress: SRM_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_ADDRESS,
  upsertSupplierOffering: SRM_MANAGEMENT_PERMISSION_CODES.UPSERT_SUPPLIER_OFFERING,
  changeSupplierStatus: SRM_MANAGEMENT_PERMISSION_CODES.CHANGE_SUPPLIER_STATUS
} as const
const internalCodes = {
  resolveActiveSupplier: SRM_INTERNAL_PERMISSION_CODES.RESOLVE_ACTIVE_SUPPLIER,
  resolveActiveSupplierOffering: SRM_INTERNAL_PERMISSION_CODES.RESOLVE_ACTIVE_SUPPLIER_OFFERING
} as const
const audience = 'urn:oes:service:srm-service'
const thumbprint = 'A'.repeat(43)

/** Locks all 15 SRM RPCs to the frozen token-only execution matrix. */
describe('SRM trusted gRPC security matrix L3', () => {
  it('declares all 13 existing RPCs as exact HUMAN/WEB BUSINESS methods', () => {
    const entries = [
      ...Object.entries(queryCodes).map(
        (entry) => [SupplierQueryGrpcController.prototype, ...entry] as const
      ),
      ...Object.entries(managementCodes).map(
        (entry) => [SupplierManagementGrpcController.prototype, ...entry] as const
      )
    ]
    expect(entries).toHaveLength(13)
    for (const [prototype, method, code] of entries) {
      expect(getRpcAuthorizationModeDeclaration(prototype, method)).toEqual({
        mode: 'BUSINESS',
        permissions: { all: [code] },
        principalType: 'HUMAN',
        sessionTerminals: ['WEB']
      })
    }
  })

  it('declares exactly two HUMAN_OBO INTERNAL methods for procurement-service', () => {
    for (const [method, code] of Object.entries(internalCodes)) {
      expect(
        getRpcAuthorizationModeDeclaration(SrmInternalQueryGrpcController.prototype, method)
      ).toEqual({ mode: 'INTERNAL', permissions: { all: [code] } })
    }
    expect(SRM_INTERNAL_WORKLOAD_ALLOWLIST).toEqual({
      [SRM_INTERNAL_PERMISSION_CODES.RESOLVE_ACTIVE_SUPPLIER]: ['procurement-service'],
      [SRM_INTERNAL_PERMISSION_CODES.RESOLVE_ACTIVE_SUPPLIER_OFFERING]: ['procurement-service']
    })
  })

  it('installs token-only guards on all three controller classes', () => {
    expect(Reflect.getMetadata('__guards__', SupplierQueryGrpcController)).toEqual(
      expect.arrayContaining([TrustedExecutionGuard, SupplierRpcContextValidator])
    )
    expect(Reflect.getMetadata('__guards__', SupplierManagementGrpcController)).toEqual(
      expect.arrayContaining([TrustedExecutionGuard, SupplierRpcContextValidator])
    )
    expect(Reflect.getMetadata('__guards__', SrmInternalQueryGrpcController)).toEqual(
      expect.arrayContaining([SrmTrustedInternalExecutionGuard, SupplierRpcContextValidator])
    )
  })

  it('admits exact BUSINESS HUMAN/WEB authority and derives tenant from the verified token', async () => {
    const result = await runBusiness('searchSuppliers')
    expect(new SupplierRpcContextValidator().canActivate(result.context)).toBe(true)
    expect(result.body).toMatchObject({ tenantId: 'tenant-1' })
    expect(result.verifier.verify).toHaveBeenCalledWith({
      token: 'target.execution.token',
      targetAudience: audience,
      workloadIdentity: {
        spiffeId: 'spiffe://oes/api-gateway',
        certificateThumbprint: thumbprint
      }
    })
  })

  it.each([
    ['MACHINE principal', { principalType: 'MACHINE' }],
    ['DELEGATED principal', { principalType: 'DELEGATED' }],
    ['non-WEB terminal', { sessionTerminal: 'PDA' }],
    ['missing session terminal', { sessionTerminal: undefined }],
    ['missing session id', { sessionId: undefined }],
    ['missing tenant', { tenantId: undefined }],
    ['wrong audience', { audience: 'urn:oes:service:other-service' }],
    ['wrong cnf binding', { certificateThumbprint: 'B'.repeat(43) }],
    ['missing Code', { permissionCodes: [] }],
    ['wrong Code', { permissionCodes: ['srm.supplier_profile.create'] }]
  ])('rejects BUSINESS %s before controller execution', async (_label, overrides) => {
    await expect(runBusiness('searchSuppliers', overrides)).rejects.toThrow()
  })

  it('rejects missing bearer and every retired body-authority spoof', async () => {
    await expect(runBusiness('searchSuppliers', {}, {}, false)).rejects.toThrow()
    for (const body of [
      { tenantId: 'attacker' },
      { tenant_id: 'attacker' },
      { operatorContext: {} },
      { traceContext: {} },
      { auditContext: {} }
    ]) {
      const result = await runBusiness('searchSuppliers', {}, body)
      expect(() => new SupplierRpcContextValidator().canActivate(result.context)).toThrow()
    }
  })

  it('admits exact Procurement HUMAN_OBO actor/workload/Code and derives exact tenant', async () => {
    const result = await runInternal('resolveActiveSupplier')
    expect(new SupplierRpcContextValidator().canActivate(result.context)).toBe(true)
    expect(result.body).toMatchObject({ supplierId: 'supplier-1', tenantId: 'tenant-1' })
  })

  it.each([
    ['direct HUMAN without actor', { actor: undefined }],
    ['pure MACHINE root', { principalType: 'MACHINE', actor: undefined }],
    ['DELEGATED execution', { principalType: 'DELEGATED' }],
    [
      'TENANT MACHINE actor',
      { actor: { sub: 'machine-procurement', principal_type: 'MACHINE', scope_level: 'TENANT' } }
    ],
    [
      'nested actor chain',
      {
        actor: {
          sub: 'machine-procurement',
          principal_type: 'MACHINE',
          scope_level: 'SYSTEM',
          act: {}
        }
      }
    ],
    ['unknown workload', { clientId: 'spiffe://oes/wms-service' }],
    ['malformed workload', { clientId: 'procurement-service' }],
    ['wildcard tenant', { tenantId: '*' }],
    ['missing Code', { permissionCodes: [] }]
  ])('rejects INTERNAL %s before controller execution', async (_label, overrides) => {
    await expect(runInternal('resolveActiveSupplier', overrides)).rejects.toThrow()
  })
})

/** Executes SRM's actual BUSINESS guard against a verifier-shaped target token. */
async function runBusiness(
  method: keyof typeof queryCodes,
  overrides: Record<string, unknown> = {},
  body: Record<string, unknown> = {},
  includeBearer = true
) {
  const metadata = new Metadata()
  if (includeBearer) metadata.set('authorization', 'Bearer target.execution.token')
  metadata.set('x-request-id', 'request-1')
  metadata.set('x-trace-id', 'trace-1')
  metadata.set('traceparent', '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01')
  const verified = businessToken(queryCodes[method], overrides)
  const workloadIdentity = {
    spiffeId: 'spiffe://oes/api-gateway',
    certificateThumbprint: thumbprint
  }
  const verifier = strictVerifier(verified)
  const context = executionContext(
    SupplierQueryGrpcController,
    SupplierQueryGrpcController.prototype[method],
    body,
    metadata,
    workloadIdentity
  )
  await new TrustedExecutionGuard(
    new Reflector(),
    verifier as never,
    { getVerifiedWorkloadIdentity: jest.fn().mockResolvedValue(workloadIdentity) } as never,
    audience
  ).canActivate(context)
  return { context, body, verifier }
}

/** Executes SRM's actual INTERNAL guard against one exact Procurement OBO target token. */
async function runInternal(
  method: keyof typeof internalCodes,
  overrides: Record<string, unknown> = {},
  body: Record<string, unknown> = { supplierId: 'supplier-1' }
) {
  const metadata = new Metadata()
  metadata.set('authorization', 'Bearer target.execution.token')
  metadata.set('x-request-id', 'request-1')
  metadata.set('x-trace-id', 'trace-1')
  metadata.set('traceparent', '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01')
  const verified = businessToken(internalCodes[method], {
    clientId: 'spiffe://oes/procurement-service',
    actor: {
      sub: 'machine-procurement',
      principal_type: 'MACHINE',
      scope_level: 'SYSTEM'
    },
    ...overrides
  })
  const workloadIdentity = {
    spiffeId: verified.clientId,
    certificateThumbprint: thumbprint
  }
  const verifier = strictVerifier(verified)
  const context = executionContext(
    SrmInternalQueryGrpcController,
    SrmInternalQueryGrpcController.prototype[method],
    body,
    metadata,
    workloadIdentity
  )
  await new SrmTrustedInternalExecutionGuard(
    new Reflector(),
    verifier as never,
    { getVerifiedWorkloadIdentity: jest.fn().mockResolvedValue(workloadIdentity) } as never,
    audience
  ).canActivate(context)
  return { context, body, verifier }
}

/** Creates the immutable target-token facts consumed by the shared guards. */
function businessToken(code: string, overrides: Record<string, unknown>) {
  return {
    issuer: 'https://auth.example',
    audience,
    subject: 'human-1',
    principalType: 'HUMAN',
    clientId: 'spiffe://oes/api-gateway',
    tenantId: 'tenant-1',
    permissionCodes: [code],
    tokenId: 'token-1',
    issuedAt: 1,
    notBefore: 1,
    expiresAt: 9999999999,
    certificateThumbprint: thumbprint,
    sessionId: 'session-1',
    sessionTerminal: 'WEB',
    ...overrides
  }
}

/** Mimics the already unit-tested Common verifier's audience and cnf checks for SRM guard composition. */
function strictVerifier(verified: ReturnType<typeof businessToken>) {
  return {
    verify: jest.fn(async (input) => {
      if (
        verified.audience !== input.targetAudience ||
        verified.certificateThumbprint !== input.workloadIdentity.certificateThumbprint ||
        verified.clientId !== input.workloadIdentity.spiffeId ||
        !verified.sessionId ||
        !verified.tenantId ||
        verified.tenantId === '*'
      ) {
        throw new Error('invalid SRM target token')
      }
      return verified
    })
  }
}

/** Creates the Nest RPC execution context consumed by both Common and SRM guards. */
function executionContext(
  controller: object,
  handler: unknown,
  body: object,
  metadata: Metadata,
  workloadIdentity: { spiffeId: string; certificateThumbprint: string }
) {
  return {
    switchToRpc: () => ({ getData: () => body, getContext: () => metadata }),
    getHandler: () => handler,
    getClass: () => controller,
    getArgByIndex: () => ({ workloadIdentity })
  } as never
}
