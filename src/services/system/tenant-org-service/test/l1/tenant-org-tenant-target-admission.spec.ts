import { GUARDS_METADATA } from '@nestjs/common/constants'
import { Test } from '@nestjs/testing'
import {
  getRpcAuthorizationModeDeclaration,
  TENANT_TARGET_ADMISSION_METADATA_KEY,
  TENANT_TARGET_AUDIT_BINDER,
  type TenantTargetAuditBinding
} from '@oes/common/authorization'
import { TenantOrgTenantTargetAuditBinder } from '../../src/infrastructure/audit/tenant-target-admission-audit.binder'
import { TenantOrgManagementGrpcController } from '../../src/interfaces/grpc/tenant-org-management.grpc.controller'
import { TenantOrgQueryGrpcController } from '../../src/interfaces/grpc/tenant-org-query.grpc.controller'
import {
  TENANT_ORG_GATEWAY_SPIFFE_ID,
  TenantOrgTrustedExecutionModule
} from '../../src/modules/tenant-org-trusted-execution.module'
import {
  TENANT_ORG_MACHINE_TARGET_METADATA_KEY,
  TenantOrgTenantTargetAdmissionGuard
} from '../../src/modules/tenant-org-tenant-target-admission.guard'
import { admitTenantTargetRequest } from '../helpers/tenant-target-admission'

const SYSTEM_TARGETS = [
  [TenantOrgQueryGrpcController, 'getTenantById', 'tenant_org.tenant.get_by_id'],
  [TenantOrgQueryGrpcController, 'getOrgTreeByTenantId', 'tenant_org.org_unit.list_tree'],
  [TenantOrgQueryGrpcController, 'getOrgUnitById', 'tenant_org.org_unit.get_by_id'],
  [TenantOrgQueryGrpcController, 'validateOrgReference', 'tenant_org.org_unit.list_tree'],
  [TenantOrgQueryGrpcController, 'getOrgReferenceSummary', 'tenant_org.org_unit.list_tree'],
  [TenantOrgQueryGrpcController, 'listAncestorOrgUnits', 'tenant_org.org_unit.list_tree'],
  [TenantOrgQueryGrpcController, 'listDescendantOrgUnits', 'tenant_org.org_unit.list_tree'],
  [TenantOrgManagementGrpcController, 'updateTenantProfile', 'tenant_org.tenant.update_profile'],
  [TenantOrgManagementGrpcController, 'suspendTenant', 'tenant_org.tenant.update_status'],
  [TenantOrgManagementGrpcController, 'reactivateTenant', 'tenant_org.tenant.update_status'],
  [TenantOrgManagementGrpcController, 'archiveTenant', 'tenant_org.tenant.update_status']
] as const

const TENANT_ONLY_TARGETS = [
  [TenantOrgManagementGrpcController, 'createOrgUnit', 'tenant_org.org_unit.create'],
  [TenantOrgManagementGrpcController, 'updateOrgUnit', 'tenant_org.org_unit.update'],
  [TenantOrgManagementGrpcController, 'moveOrgUnit', 'tenant_org.org_unit.update'],
  [TenantOrgManagementGrpcController, 'archiveOrgUnit', 'tenant_org.org_unit.archive']
] as const

/** Creates the query application double used to prove guard-before-application ordering. */
function queryService() {
  return {
    getTenantById: jest.fn(async () => undefined),
    listTenants: jest.fn(),
    getOrgTreeByTenantId: jest.fn(),
    getOrgUnitById: jest.fn(),
    validateOrgReference: jest.fn(),
    getOrgReferenceSummary: jest.fn(),
    listAncestorOrgUnits: jest.fn(),
    listDescendantOrgUnits: jest.fn()
  }
}

/** Creates the management application double used to prove zero mutation on denied admission. */
function managementService() {
  return {
    createTenant: jest.fn(),
    updateTenantProfile: jest.fn(),
    suspendTenant: jest.fn(),
    reactivateTenant: jest.fn(),
    archiveTenant: jest.fn(),
    createOrgUnit: jest.fn(),
    updateOrgUnit: jest.fn(),
    moveOrgUnit: jest.fn(),
    archiveOrgUnit: jest.fn()
  }
}

describe('Tenant Org tenant-target adoption', () => {
  it('resolves the exact target guard and audit binder through the Tenant Org module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TenantOrgTrustedExecutionModule]
    }).compile()

    expect(moduleRef.get(TenantOrgTenantTargetAdmissionGuard)).toBeDefined()
    expect(moduleRef.get(TENANT_TARGET_AUDIT_BINDER)).toBeInstanceOf(
      TenantOrgTenantTargetAuditBinder
    )
    await moduleRef.close()
  })

  it.each(SYSTEM_TARGETS)(
    'declares %p.%s as exact dedicated SYSTEM target for %s',
    (controller, method, code) => {
      expect(targetDeclaration(controller, method)).toEqual({
        kind: 'SYSTEM_TARGET',
        selectorField: 'tenantId',
        tenantAuthority: 'TOKEN_TENANT_EQUALITY',
        systemAuthority: 'DEDICATED',
        gatewayWorkloadIdentity: TENANT_ORG_GATEWAY_SPIFFE_ID,
        permissionCode: code,
        range: 'ALL'
      })
      expect(businessCode(controller, method)).toBe(code)
      expect(methodGuards(controller, method)).toEqual(
        expect.arrayContaining([TenantOrgTenantTargetAdmissionGuard])
      )
    }
  )

  it.each(TENANT_ONLY_TARGETS)(
    'declares %p.%s as exact ordinary tenant target for %s',
    (controller, method, code) => {
      expect(targetDeclaration(controller, method)).toEqual({
        kind: 'TENANT_SYSTEM_DENY',
        selectorField: 'tenantId',
        tenantAuthority: 'TOKEN_TENANT_EQUALITY',
        systemAuthority: 'DENY'
      })
      expect(businessCode(controller, method)).toBe(code)
      expect(methodGuards(controller, method)).toEqual(
        expect.arrayContaining([TenantOrgTenantTargetAdmissionGuard])
      )
    }
  )

  it('admits exact TENANT equality and keeps the private admitted selector authoritative', async () => {
    const service = queryService()
    const controller = new TenantOrgQueryGrpcController(service as never)
    const request = { tenantId: 'Tenant-Exact' }

    await admitTenantTargetRequest(TenantOrgQueryGrpcController, 'getTenantById', request)
    request.tenantId = 'Tenant-Tampered-After-Admission'
    await controller.getTenantById(request)

    expect(service.getTenantById).toHaveBeenCalledWith('Tenant-Exact')
  })

  it('admits tenantless SYSTEM only on an exact dedicated Gateway/Code declaration', async () => {
    const service = queryService()
    const controller = new TenantOrgQueryGrpcController(service as never)
    const request = { tenantId: 'Tenant-System-Target' }

    await admitTenantTargetRequest(TenantOrgQueryGrpcController, 'getTenantById', request, {
      subjectScope: 'SYSTEM'
    })
    await controller.getTenantById(request)

    expect(service.getTenantById).toHaveBeenCalledWith('Tenant-System-Target')
  })

  it.each([
    [
      'auth-service lifecycle read',
      'getTenantById',
      'tenant_org.tenant.get_by_id',
      'spiffe://local.oes.internal/ns/oes/sa/auth-service'
    ],
    [
      'public-entry-service tenant read',
      'getTenantById',
      'tenant_org.tenant.get_by_id',
      'spiffe://local.oes.internal/ns/oes/sa/public-entry-service'
    ],
    [
      'public-entry-service org reference read',
      'getOrgReferenceSummary',
      'tenant_org.org_unit.list_tree',
      'spiffe://local.oes.internal/ns/oes/sa/public-entry-service'
    ]
  ] as const)(
    'preserves the exact %s MACHINE tenant-target exception',
    async (_label, method, code, workloadIdentity) => {
      const service = queryService()
      const controller = new TenantOrgQueryGrpcController(service as never)
      const request = { tenantId: 'Tenant-Machine', orgUnitId: 'org-1' }

      await admitTenantTargetRequest(TenantOrgQueryGrpcController, method, request, {
        principalType: 'MACHINE',
        subjectScope: 'SYSTEM',
        permissionCodes: [code],
        workloadIdentity
      })
      await (controller[method] as (input: typeof request) => Promise<unknown>).call(
        controller,
        request
      )

      expect(service[method]).toHaveBeenCalled()
    }
  )

  it('rejects a MACHINE workload on an undeclared Tenant Org target method', async () => {
    const binder = { bind: jest.fn(async () => true) }

    await expect(
      admitTenantTargetRequest(
        TenantOrgQueryGrpcController,
        'getOrgTreeByTenantId',
        { tenantId: 'Tenant-Machine' },
        {
          principalType: 'MACHINE',
          subjectScope: 'SYSTEM',
          workloadIdentity: 'spiffe://local.oes.internal/ns/oes/sa/public-entry-service',
          binder
        }
      )
    ).rejects.toMatchObject({ definition: { code: 'APP_AUTH_002', rpcStatus: 7 } })
    expect(binder.bind).not.toHaveBeenCalled()
  })

  it.each([
    {
      label: 'SYSTEM HUMAN from a non-Gateway workload',
      principalType: 'HUMAN' as const,
      permissionCodes: ['tenant_org.tenant.get_by_id'],
      workloadIdentity: 'spiffe://local.oes.internal/ns/oes/sa/auth-service',
      expected: { definition: { code: 'APP_AUTH_002', rpcStatus: 7 } }
    },
    {
      label: 'allowlisted MACHINE with a mismatched Code',
      principalType: 'MACHINE' as const,
      permissionCodes: ['tenant_org.org_unit.list_tree'],
      workloadIdentity: 'spiffe://local.oes.internal/ns/oes/sa/auth-service',
      expected: { definition: { code: 'APP_AUTH_002', rpcStatus: 7 } }
    },
    {
      label: 'unlisted MACHINE workload',
      principalType: 'MACHINE' as const,
      permissionCodes: ['tenant_org.tenant.get_by_id'],
      workloadIdentity: 'spiffe://local.oes.internal/ns/oes/sa/identity-service',
      expected: { status: 403 }
    }
  ])('rejects $label before target audit binding', async (fixture) => {
    const binder = { bind: jest.fn(async () => true) }

    await expect(
      admitTenantTargetRequest(
        TenantOrgQueryGrpcController,
        'getTenantById',
        { tenantId: 'Tenant-System-Target' },
        {
          principalType: fixture.principalType,
          subjectScope: 'SYSTEM',
          permissionCodes: fixture.permissionCodes,
          workloadIdentity: fixture.workloadIdentity,
          binder
        }
      )
    ).rejects.toMatchObject(fixture.expected)
    expect(binder.bind).not.toHaveBeenCalled()
  })

  it.each([
    {
      label: 'TENANT selector mismatch',
      controller: TenantOrgQueryGrpcController,
      method: 'getTenantById',
      request: { tenantId: 'Tenant-Target' },
      options: { subjectTenantId: 'Tenant-Subject' }
    },
    {
      label: 'malformed selector',
      controller: TenantOrgQueryGrpcController,
      method: 'getTenantById',
      request: { tenantId: ' Tenant-Target ' },
      options: { subjectTenantId: ' Tenant-Target ' }
    },
    {
      label: 'SYSTEM on ordinary org mutation',
      controller: TenantOrgManagementGrpcController,
      method: 'createOrgUnit',
      request: { tenantId: 'Tenant-Target' },
      options: { subjectScope: 'SYSTEM' as const }
    },
    {
      label: 'dedicated SYSTEM Code mismatch',
      controller: TenantOrgQueryGrpcController,
      method: 'getTenantById',
      request: { tenantId: 'Tenant-Target' },
      options: {
        subjectScope: 'SYSTEM' as const,
        permissionCodes: ['tenant_org.org_unit.list_tree']
      }
    }
  ])('rejects $label before audit or application side effects', async (fixture) => {
    const binder = { bind: jest.fn(async () => true) }

    await expect(
      admitTenantTargetRequest(fixture.controller, fixture.method, fixture.request, {
        ...fixture.options,
        binder
      })
    ).rejects.toMatchObject({ definition: { code: 'APP_AUTH_002', rpcStatus: 7 } })
    expect(binder.bind).not.toHaveBeenCalled()
  })

  it('rejects audit binding failure and never reaches the mutation application service', async () => {
    const service = managementService()
    const controller = new TenantOrgManagementGrpcController(service as never, {} as never)
    const request = { tenantId: 'Tenant-Exact', orgUnitId: 'org-1' }
    const binder = { bind: jest.fn(async () => false) }

    await expect(
      admitTenantTargetRequest(TenantOrgManagementGrpcController, 'archiveOrgUnit', request, {
        binder
      }).then(() => controller.archiveOrgUnit(request))
    ).rejects.toMatchObject({ definition: { code: 'APP_AUTH_002', rpcStatus: 7 } })
    expect(binder.bind).toHaveBeenCalledTimes(1)
    expect(service.archiveOrgUnit).not.toHaveBeenCalled()
  })

  it('stops an ordinary SYSTEM mutation before its application boundary', async () => {
    const service = managementService()
    const controller = new TenantOrgManagementGrpcController(service as never, {} as never)
    const request = { tenantId: 'Tenant-System-Target', name: 'New Org' }

    await expect(
      admitTenantTargetRequest(TenantOrgManagementGrpcController, 'createOrgUnit', request, {
        subjectScope: 'SYSTEM'
      }).then(() => controller.createOrgUnit(request as never))
    ).rejects.toMatchObject({ definition: { code: 'APP_AUTH_002', rpcStatus: 7 } })
    expect(service.createOrgUnit).not.toHaveBeenCalled()
  })

  it('writes credential-free correlated target admission evidence', () => {
    const binder = new TenantOrgTenantTargetAuditBinder()
    const log = jest.fn()
    ;(binder as unknown as { logger: { log: typeof log } }).logger = { log }
    const input: TenantTargetAuditBinding = Object.freeze({
      requestId: 'request-1',
      traceId: 'trace-1',
      decision: Object.freeze({
        selector: 'Tenant-Audit',
        selectorField: 'tenantId',
        subjectScope: 'SYSTEM',
        subject: 'account:operator-1',
        tokenId: 'token-decision-ref',
        workloadIdentity: TENANT_ORG_GATEWAY_SPIFFE_ID,
        declarationKind: 'SYSTEM_TARGET',
        permissionCode: 'tenant_org.tenant.get_by_id',
        range: 'ALL'
      })
    })

    expect(binder.bind(input)).toBe(true)
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'TENANT_TARGET_ADMITTED',
        requestId: 'request-1',
        traceId: 'trace-1',
        reauthorizedTenantSelector: 'Tenant-Audit',
        declarationKind: 'SYSTEM_TARGET',
        permissionCode: 'tenant_org.tenant.get_by_id',
        range: 'ALL'
      })
    )
    const serialized = JSON.stringify(log.mock.calls[0][0])
    expect(serialized).not.toMatch(/Bearer|certificateThumbprint|targetTenantId|target_tenant_id/)
  })

  it('keeps MACHINE exception declarations exact and method-owned', () => {
    expect(machineDeclaration(TenantOrgQueryGrpcController, 'getTenantById')).toEqual({
      selectorField: 'tenantId',
      permissionCode: 'tenant_org.tenant.get_by_id',
      workloads: ['auth-service', 'public-entry-service']
    })
    expect(machineDeclaration(TenantOrgQueryGrpcController, 'getOrgReferenceSummary')).toEqual({
      selectorField: 'tenantId',
      permissionCode: 'tenant_org.org_unit.list_tree',
      workloads: ['public-entry-service']
    })
    expect(machineDeclaration(TenantOrgQueryGrpcController, 'getOrgTreeByTenantId')).toBeUndefined()
  })
})

/** Reads immutable target declaration metadata from one controller handler. */
function targetDeclaration(controller: Function, method: string): unknown {
  return Reflect.getMetadata(
    TENANT_TARGET_ADMISSION_METADATA_KEY,
    (controller.prototype as Record<string, unknown>)[method]
  )
}

/** Reads the exact target-owned MACHINE exception declaration for one existing RPC. */
function machineDeclaration(controller: Function, method: string): unknown {
  return Reflect.getMetadata(
    TENANT_ORG_MACHINE_TARGET_METADATA_KEY,
    (controller.prototype as Record<string, unknown>)[method]
  )
}

/** Reads the exact singleton BUSINESS Code bound to one target handler. */
function businessCode(controller: Function, method: string): string | undefined {
  const declaration = getRpcAuthorizationModeDeclaration(controller.prototype, method)
  return declaration?.mode === 'BUSINESS' && 'all' in declaration.permissions
    ? declaration.permissions.all[0]
    : undefined
}

/** Reads method-scoped guard metadata without merging the class trusted guard. */
function methodGuards(controller: Function, method: string): readonly unknown[] {
  return (
    Reflect.getMetadata(
      GUARDS_METADATA,
      (controller.prototype as Record<string, unknown>)[method]
    ) ?? []
  )
}
