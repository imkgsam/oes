import { Metadata } from '@grpc/grpc-js'
import { Reflector } from '@nestjs/core'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  getRpcAuthorizationModeDeclaration,
  WMS_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
import { WmsManagementGrpcController } from '../../src/interfaces/grpc/wms-management.grpc.controller'
import { WmsQueryGrpcController } from '../../src/interfaces/grpc/wms-query.grpc.controller'
import { WmsRpcContextValidator } from '../../src/interfaces/grpc/wms-rpc-context.validator'
import {
  WMS_AUDIENCE,
  WmsTrustedBusinessExecutionGuard
} from '../../src/modules/wms-trusted-execution.module'

const queryCodes = {
  getWarehouse: WMS_MANAGEMENT_PERMISSION_CODES.READ_WAREHOUSE,
  listWarehouses: WMS_MANAGEMENT_PERMISSION_CODES.READ_WAREHOUSE,
  getLocation: WMS_MANAGEMENT_PERMISSION_CODES.READ_LOCATION,
  listLocations: WMS_MANAGEMENT_PERMISSION_CODES.READ_LOCATION,
  getReceipt: WMS_MANAGEMENT_PERMISSION_CODES.READ_RECEIPT,
  searchReceipts: WMS_MANAGEMENT_PERMISSION_CODES.READ_RECEIPT,
  getReceiptLine: WMS_MANAGEMENT_PERMISSION_CODES.READ_RECEIPT,
  searchReceiptLines: WMS_MANAGEMENT_PERMISSION_CODES.READ_RECEIPT,
  searchStockLedgerEntries: WMS_MANAGEMENT_PERMISSION_CODES.READ_INVENTORY,
  getInventoryBalance: WMS_MANAGEMENT_PERMISSION_CODES.READ_INVENTORY,
  searchInventoryBalances: WMS_MANAGEMENT_PERMISSION_CODES.READ_INVENTORY
} as const
const managementMethods = [
  'createReceiptDraft',
  'addOrReplaceReceiptLines',
  'postReceipt',
  'cancelReceiptDraft'
] as const
const thumbprint = 'A'.repeat(43)
const mainSource = readFileSync(join(__dirname, '../../src/main.ts'), 'utf8')

/** Locks all 15 WMS RPCs to the frozen token-only HUMAN/WEB/Gateway matrix. */
describe('WMS trusted gRPC security matrix L3', () => {
  it('declares all 15 RPCs as exact HUMAN/WEB BUSINESS methods using five Codes', () => {
    const entries = [
      ...Object.entries(queryCodes).map(
        (entry) => [WmsQueryGrpcController.prototype, ...entry] as const
      ),
      ...managementMethods.map(
        (method) =>
          [
            WmsManagementGrpcController.prototype,
            method,
            WMS_MANAGEMENT_PERMISSION_CODES.MANAGE_RECEIPT
          ] as const
      )
    ]
    expect(entries).toHaveLength(15)
    expect(new Set(entries.map((entry) => entry[2]))).toEqual(
      new Set([
        'wms.warehouse.read',
        'wms.location.read',
        'wms.receipt.read',
        'wms.receipt.manage',
        'wms.inventory.read'
      ])
    )
    for (const [prototype, method, code] of entries) {
      expect(getRpcAuthorizationModeDeclaration(prototype, method)).toEqual({
        mode: 'BUSINESS',
        permissions: { all: [code] },
        principalType: 'HUMAN',
        sessionTerminals: ['WEB']
      })
    }
  })

  it('installs token-only guard and context validator on both controller classes', () => {
    for (const controller of [WmsQueryGrpcController, WmsManagementGrpcController]) {
      expect(Reflect.getMetadata('__guards__', controller)).toEqual(
        expect.arrayContaining([WmsTrustedBusinessExecutionGuard, WmsRpcContextValidator])
      )
    }
  })

  it('boots WMS with deployment-owned mTLS server credentials', () => {
    expect(mainSource).toContain('credentials: createGrpcServerCredentials()')
  })

  it('admits exact Gateway HUMAN/WEB authority and derives verified tenant context', async () => {
    const result = await runBusiness()
    expect(new WmsRpcContextValidator().canActivate(result.context)).toBe(true)
    expect(WmsRpcContextValidator.assertQueryContext(result.body).tenantId).toBe('tenant-1')
    expect(result.body).not.toHaveProperty('tenantId')
  })

  it.each([
    ['MACHINE principal', { principalType: 'MACHINE' }],
    ['DELEGATED principal', { principalType: 'DELEGATED' }],
    ['non-WEB terminal', { sessionTerminal: 'PDA' }],
    ['missing terminal', { sessionTerminal: undefined }],
    ['missing session', { sessionId: undefined }],
    ['missing tenant', { tenantId: undefined }],
    ['SYSTEM tenant', { tenantId: 'SYSTEM' }],
    ['wildcard tenant', { tenantId: '*' }],
    ['wrong audience', { audience: 'urn:oes:service:other-service' }],
    ['wrong cnf', { certificateThumbprint: 'B'.repeat(43) }],
    ['expired token', { expiresAt: 1 }],
    ['non-Gateway workload', { clientId: 'spiffe://oes/wms-service' }],
    [
      'unexpected actor',
      { actor: { sub: 'machine', principal_type: 'MACHINE', scope_level: 'SYSTEM' } }
    ],
    ['missing Code', { permissionCodes: [] }],
    ['wrong Code', { permissionCodes: ['wms.receipt.manage'] }]
  ])('rejects BUSINESS %s', async (_label, overrides) => {
    await expect(runBusiness(overrides)).rejects.toThrow()
  })

  it('rejects missing bearer and every retired body or metadata authority injection', async () => {
    await expect(runBusiness({}, {}, false)).rejects.toThrow()
    for (const body of [
      { tenantId: 'attacker' },
      { tenant_id: 'attacker' },
      { orgId: 'attacker' },
      { operatorContext: {} },
      { traceContext: {} },
      { auditContext: {} }
    ]) {
      const result = await runBusiness({}, body)
      expect(() => new WmsRpcContextValidator().canActivate(result.context)).toThrow()
    }
  })
})

/** Executes WMS's actual BUSINESS guard against one target-token fixture. */
async function runBusiness(
  overrides: Record<string, unknown> = {},
  body: Record<string, unknown> = {},
  includeBearer = true
) {
  const metadata = baseMetadata(includeBearer)
  const verified = targetToken(queryCodes.getWarehouse, overrides)
  const workloadIdentity = {
    spiffeId: verified.clientId as string,
    certificateThumbprint: thumbprint
  }
  const context = executionContext(
    WmsQueryGrpcController,
    WmsQueryGrpcController.prototype.getWarehouse,
    body,
    metadata,
    workloadIdentity
  )
  await new WmsTrustedBusinessExecutionGuard(
    new Reflector(),
    strictVerifier(verified) as never,
    { getVerifiedWorkloadIdentity: jest.fn().mockResolvedValue(workloadIdentity) } as never,
    WMS_AUDIENCE
  ).canActivate(context)
  return { context, body }
}

/** Creates the target-bound HUMAN token fixture consumed by the WMS guard. */
function targetToken(code: string, overrides: Record<string, unknown>) {
  return {
    issuer: 'https://auth.example',
    audience: WMS_AUDIENCE,
    subject: 'human-1',
    principalType: 'HUMAN',
    clientId: 'spiffe://oes/api-gateway',
    tenantId: 'tenant-1',
    orgId: 'org-1',
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

/** Mimics Common's audience, workload, cnf, time, session, and tenant verification. */
function strictVerifier(verified: ReturnType<typeof targetToken>) {
  return {
    verify: jest.fn(async (input) => {
      if (
        verified.audience !== input.targetAudience ||
        verified.certificateThumbprint !== input.workloadIdentity.certificateThumbprint ||
        verified.clientId !== input.workloadIdentity.spiffeId ||
        !verified.sessionId ||
        !verified.tenantId ||
        verified.tenantId === '*' ||
        verified.tenantId === 'SYSTEM' ||
        Number(verified.expiresAt) <= Math.floor(Date.now() / 1000)
      )
        throw new Error('invalid WMS target token')
      return verified
    })
  }
}

/** Builds the only ordinary correlation metadata retained after authority retirement. */
function baseMetadata(includeBearer: boolean): Metadata {
  const metadata = new Metadata()
  if (includeBearer) metadata.set('authorization', 'Bearer target.execution.token')
  metadata.set('x-request-id', 'request-1')
  metadata.set('x-trace-id', 'trace-1')
  metadata.set('traceparent', '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01')
  return metadata
}

/** Creates the Nest RPC context consumed by Common and WMS guards. */
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
