import { GUARDS_METADATA } from '@nestjs/common/constants'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import {
  getRpcAuthorizationModeDeclaration,
  type TenantTargetAuditBinding
} from '@oes/common/authorization'
import { TenantOrgTenantTargetAuditBinder } from '../infrastructure/audit/tenant-target-admission-audit.binder'
import { TenantOrgManagementGrpcController } from '../interfaces/grpc/tenant-org-management.grpc.controller'
import { TenantOrgQueryGrpcController } from '../interfaces/grpc/tenant-org-query.grpc.controller'
import { TenantOrgTrustedExecutionModule } from '../modules/tenant-org-trusted-execution.module'
import {
  TENANT_ORG_TARGET_METHOD_METADATA_KEY,
  TenantOrgTargetWorkloadRegistry,
  TenantOrgTenantTargetAdmissionGuard
} from '../modules/tenant-org-tenant-target-admission.guard'
import {
  admitTenantTargetRequest,
  TEST_TENANT_ORG_AUTH_SPIFFE_ID,
  TEST_TENANT_ORG_GATEWAY_SPIFFE_ID,
  TEST_TENANT_ORG_PUBLIC_ENTRY_SPIFFE_ID,
  type TenantOrgTargetAuditFixture
} from '../../test/helpers/tenant-target-admission'

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

const INTERNAL_SYSTEM_TARGETS = [
  [
    TenantOrgQueryGrpcController,
    'resolvePublicBusinessCardOrganization',
    'tenant_org.internal.public_business_card_organization.resolve'
  ]
] as const

/** Creates the query application double used to prove guard-before-application ordering. */
function queryService() {
  return {
    getTenantById: jest.fn(async () => undefined),
    resolvePublicBusinessCardOrganization: jest.fn(async () => ({ available: false })),
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

/** Creates a capturing target audit sink with configurable success binding. */
function auditBinder(admitted = true): TenantOrgTargetAuditFixture {
  return {
    bindAdmitted: jest.fn(() => admitted),
    bindDenied: jest.fn(() => true)
  }
}

describe('Tenant Org tenant-target adoption', () => {
  it('resolves the exact target guard and audit binder through the Tenant Org module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TenantOrgTrustedExecutionModule]
    }).compile()

    expect(moduleRef.get(TenantOrgTenantTargetAdmissionGuard)).toBeDefined()
    expect(moduleRef.get(TenantOrgTenantTargetAuditBinder)).toBeDefined()
    expect(moduleRef.get(TenantOrgTargetWorkloadRegistry)).toBeDefined()
    await moduleRef.close()
  })

  it('resolves deployment workload identities at DI construction time and fails closed in production', () => {
    const exact = new TenantOrgTargetWorkloadRegistry(
      new ConfigService({
        NODE_ENV: 'production',
        TENANT_ORG_GATEWAY_SPIFFE_ID: 'spiffe://prod.oes/ns/oes/sa/api-gateway',
        TENANT_ORG_AUTH_SPIFFE_ID: 'spiffe://prod.oes/ns/oes/sa/auth-service',
        TENANT_ORG_PUBLIC_ENTRY_SPIFFE_ID: 'spiffe://prod.oes/ns/oes/sa/public-entry-service'
      })
    )
    expect(exact.get('TENANT_ORG_GATEWAY_SPIFFE_ID')).toBe(
      'spiffe://prod.oes/ns/oes/sa/api-gateway'
    )
    expect(
      () =>
        new TenantOrgTargetWorkloadRegistry({
          get: (key: string) => (key === 'NODE_ENV' ? 'production' : undefined)
        } as ConfigService)
    ).toThrow('TenantOrg api-gateway SPIFFE identity is required')
  })

  it.each(SYSTEM_TARGETS)(
    'declares %p.%s as exact dedicated SYSTEM target for %s',
    (controller, method, code) => {
      expect(targetDeclaration(controller, method)).toEqual({
        kind: 'TENANT_ORG_SYSTEM_TARGET',
        methodReference: targetMethodReference(controller, method),
        selectorField: 'tenantId',
        tenantAuthority: 'TOKEN_TENANT_EQUALITY',
        systemAuthority: 'DEDICATED',
        gatewayWorkloadConfigKey: 'TENANT_ORG_GATEWAY_SPIFFE_ID',
        machineWorkloadConfigKeys: machineWorkloadConfigKeys(controller, method),
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
        kind: 'TENANT_ORG_TENANT_SYSTEM_DENY',
        methodReference: targetMethodReference(controller, method),
        selectorField: 'tenantId',
        tenantAuthority: 'TOKEN_TENANT_EQUALITY',
        systemAuthority: 'DENY',
        permissionCode: code
      })
      expect(businessCode(controller, method)).toBe(code)
      expect(methodGuards(controller, method)).toEqual(
        expect.arrayContaining([TenantOrgTenantTargetAdmissionGuard])
      )
    }
  )

  it.each(INTERNAL_SYSTEM_TARGETS)(
    'declares %p.%s as exact dedicated INTERNAL SYSTEM target for %s',
    (controller, method, code) => {
      expect(targetDeclaration(controller, method)).toEqual({
        kind: 'TENANT_ORG_SYSTEM_TARGET',
        methodReference: targetMethodReference(controller, method),
        selectorField: 'tenantId',
        tenantAuthority: 'TOKEN_TENANT_EQUALITY',
        systemAuthority: 'DEDICATED',
        gatewayWorkloadConfigKey: 'TENANT_ORG_GATEWAY_SPIFFE_ID',
        machineWorkloadConfigKeys: ['TENANT_ORG_PUBLIC_ENTRY_SPIFFE_ID'],
        permissionCode: code,
        range: 'ALL'
      })
      expect(getRpcAuthorizationModeDeclaration(controller.prototype, method)).toEqual({
        mode: 'INTERNAL',
        permissions: { all: [code] }
      })
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
      TEST_TENANT_ORG_AUTH_SPIFFE_ID
    ],
    [
      'public-entry-service owner-fact read',
      'resolvePublicBusinessCardOrganization',
      'tenant_org.internal.public_business_card_organization.resolve',
      TEST_TENANT_ORG_PUBLIC_ENTRY_SPIFFE_ID
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

  it.each([
    ['getTenantById', 'tenant_org.tenant.get_by_id'],
    ['getOrgReferenceSummary', 'tenant_org.org_unit.list_tree']
  ] as const)(
    'rejects the removed public-entry-service BUSINESS exception on %s',
    async (method, code) => {
      await expect(
        admitTenantTargetRequest(
          TenantOrgQueryGrpcController,
          method,
          { tenantId: 'Tenant-Machine', orgUnitId: 'org-1' },
          {
            principalType: 'MACHINE',
            subjectScope: 'SYSTEM',
            permissionCodes: [code],
            workloadIdentity: TEST_TENANT_ORG_PUBLIC_ENTRY_SPIFFE_ID
          }
        )
      ).rejects.toMatchObject({ definition: { code: 'APP_AUTH_002', rpcStatus: 7 } })
    }
  )

  it('rejects a MACHINE workload on an undeclared Tenant Org target method', async () => {
    const binder = auditBinder()

    await expect(
      admitTenantTargetRequest(
        TenantOrgQueryGrpcController,
        'getOrgTreeByTenantId',
        { tenantId: 'Tenant-Machine' },
        {
          principalType: 'MACHINE',
          subjectScope: 'SYSTEM',
          workloadIdentity: TEST_TENANT_ORG_PUBLIC_ENTRY_SPIFFE_ID,
          binder
        }
      )
    ).rejects.toMatchObject({ definition: { code: 'APP_AUTH_002', rpcStatus: 7 } })
    expect(binder.bindAdmitted).not.toHaveBeenCalled()
    expect(binder.bindDenied).toHaveBeenCalledWith(
      expect.objectContaining({
        methodReference: 'tenant-org-service/TenantOrgQueryService/GetOrgTreeByTenantId',
        stage: 'TARGET_METHOD_AUTHORITY',
        stableReason: 'WORKLOAD_OR_CODE_MISMATCH'
      })
    )
  })

  it.each([
    {
      label: 'SYSTEM HUMAN from a non-Gateway workload',
      principalType: 'HUMAN' as const,
      permissionCodes: ['tenant_org.tenant.get_by_id'],
      workloadIdentity: 'spiffe://local.oes.internal/ns/oes/sa/auth-service',
      expected: { definition: { code: 'APP_AUTH_002', rpcStatus: 7 } },
      audit: {
        stage: 'TARGET_METHOD_AUTHORITY',
        stableReason: 'WORKLOAD_OR_CODE_MISMATCH'
      }
    },
    {
      label: 'allowlisted MACHINE with a mismatched Code',
      principalType: 'MACHINE' as const,
      permissionCodes: ['tenant_org.org_unit.list_tree'],
      workloadIdentity: TEST_TENANT_ORG_AUTH_SPIFFE_ID,
      expected: { definition: { code: 'APP_AUTH_002', rpcStatus: 7 } },
      audit: { stage: 'TRUSTED_EXECUTION', stableReason: 'TRUSTED_EXECUTION_DENIED' }
    },
    {
      label: 'unlisted MACHINE workload',
      principalType: 'MACHINE' as const,
      permissionCodes: ['tenant_org.tenant.get_by_id'],
      workloadIdentity: 'spiffe://local.oes.internal/ns/oes/sa/identity-service',
      expected: { status: 403 },
      audit: { stage: 'TRUSTED_EXECUTION', stableReason: 'TRUSTED_EXECUTION_DENIED' }
    }
  ])('rejects $label before admitted audit/handler and records denial', async (fixture) => {
    const binder = auditBinder()

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
    expect(binder.bindAdmitted).not.toHaveBeenCalled()
    expect(binder.bindDenied).toHaveBeenCalledWith(
      expect.objectContaining({
        methodReference: 'tenant-org-service/TenantOrgQueryService/GetTenantById',
        ...fixture.audit
      })
    )
  })

  it.each([
    'spiffe://other.oes.internal/ns/oes/sa/auth-service',
    'spiffe://local.oes.internal/ns/rogue/sa/auth-service'
  ])('rejects and audits non-exact MACHINE identity %s before handler access', async (identity) => {
    const binder = auditBinder()

    await expect(
      admitTenantTargetRequest(
        TenantOrgQueryGrpcController,
        'getTenantById',
        { tenantId: 'Tenant-System-Target' },
        {
          principalType: 'MACHINE',
          subjectScope: 'SYSTEM',
          permissionCodes: ['tenant_org.tenant.get_by_id'],
          workloadIdentity: identity,
          binder
        }
      )
    ).rejects.toMatchObject({ definition: { code: 'APP_AUTH_002', rpcStatus: 7 } })
    expect(binder.bindAdmitted).not.toHaveBeenCalled()
    expect(binder.bindDenied).toHaveBeenCalledWith(
      expect.objectContaining({
        methodReference: 'tenant-org-service/TenantOrgQueryService/GetTenantById',
        requestId: 'request-tenant-target-1',
        traceId: 'trace-tenant-target-1',
        stage: 'TARGET_METHOD_AUTHORITY',
        stableReason: 'WORKLOAD_OR_CODE_MISMATCH'
      })
    )
  })

  it.each([
    {
      label: 'TENANT selector mismatch',
      controller: TenantOrgQueryGrpcController,
      method: 'getTenantById',
      request: { tenantId: 'Tenant-Target' },
      options: { subjectTenantId: 'Tenant-Subject' },
      audit: {
        stage: 'TARGET_SELECTOR_ADMISSION',
        stableReason: 'SELECTOR_SCOPE_MISMATCH'
      }
    },
    {
      label: 'malformed selector',
      controller: TenantOrgQueryGrpcController,
      method: 'getTenantById',
      request: { tenantId: ' Tenant-Target ' },
      options: { subjectTenantId: 'Tenant-Target' },
      audit: { stage: 'TARGET_SELECTOR_ADMISSION', stableReason: 'SELECTOR_INVALID' }
    },
    {
      label: 'SYSTEM on ordinary org mutation',
      controller: TenantOrgManagementGrpcController,
      method: 'createOrgUnit',
      request: { tenantId: 'Tenant-Target' },
      options: { subjectScope: 'SYSTEM' as const },
      audit: {
        stage: 'TARGET_METHOD_AUTHORITY',
        stableReason: 'WORKLOAD_OR_CODE_MISMATCH'
      }
    },
    {
      label: 'dedicated SYSTEM Code mismatch',
      controller: TenantOrgQueryGrpcController,
      method: 'getTenantById',
      request: { tenantId: 'Tenant-Target' },
      options: {
        subjectScope: 'SYSTEM' as const,
        permissionCodes: ['tenant_org.org_unit.list_tree']
      },
      audit: { stage: 'TRUSTED_EXECUTION', stableReason: 'TRUSTED_EXECUTION_DENIED' }
    }
  ])('rejects $label before application side effects and records denial', async (fixture) => {
    const binder = auditBinder()

    await expect(
      admitTenantTargetRequest(fixture.controller, fixture.method, fixture.request, {
        ...fixture.options,
        binder
      })
    ).rejects.toMatchObject({ definition: { code: 'APP_AUTH_002', rpcStatus: 7 } })
    expect(binder.bindAdmitted).not.toHaveBeenCalled()
    expect(binder.bindDenied).toHaveBeenCalledWith(
      expect.objectContaining({
        methodReference: targetMethodReference(fixture.controller, fixture.method),
        ...fixture.audit
      })
    )
  })

  it('rejects audit binding failure and never reaches the mutation application service', async () => {
    const service = managementService()
    const controller = new TenantOrgManagementGrpcController(service as never, {} as never)
    const request = { tenantId: 'Tenant-Exact', orgUnitId: 'org-1' }
    const binder = auditBinder(false)

    await expect(
      admitTenantTargetRequest(TenantOrgManagementGrpcController, 'archiveOrgUnit', request, {
        binder
      }).then(() => controller.archiveOrgUnit(request))
    ).rejects.toMatchObject({ definition: { code: 'APP_AUTH_002', rpcStatus: 7 } })
    expect(binder.bindAdmitted).toHaveBeenCalledTimes(1)
    expect(binder.bindDenied).toHaveBeenCalledWith(
      expect.objectContaining({
        methodReference: 'tenant-org-service/TenantOrgManagementService/ArchiveOrgUnit',
        stage: 'TARGET_AUDIT_BINDING',
        stableReason: 'AUDIT_BINDING_FAILED'
      })
    )
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
    ;(binder as unknown as { logger: { log: typeof log; warn: jest.Mock } }).logger = {
      log,
      warn: jest.fn()
    }
    const input: TenantTargetAuditBinding = Object.freeze({
      requestId: 'request-1',
      traceId: 'trace-1',
      decision: Object.freeze({
        selector: 'Tenant-Audit',
        selectorField: 'tenantId',
        subjectScope: 'SYSTEM',
        subject: 'account:operator-1',
        tokenId: 'token-decision-ref',
        workloadIdentity: TEST_TENANT_ORG_GATEWAY_SPIFFE_ID,
        declarationKind: 'SYSTEM_TARGET',
        permissionCode: 'tenant_org.tenant.get_by_id',
        range: 'ALL'
      })
    })

    expect(
      binder.bindAdmitted('tenant-org-service/TenantOrgQueryService/GetTenantById', input)
    ).toBe(true)
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'TENANT_TARGET_ADMISSION',
        result: 'SUCCEEDED',
        stage: 'TARGET_SELECTOR_ADMISSION',
        stableReason: 'ADMITTED',
        targetMethodReference: 'tenant-org-service/TenantOrgQueryService/GetTenantById',
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

  it('writes credential-free denied evidence with exact method, stage and stable reason', () => {
    const binder = new TenantOrgTenantTargetAuditBinder()
    const warn = jest.fn()
    ;(binder as unknown as { logger: { log: jest.Mock; warn: typeof warn } }).logger = {
      log: jest.fn(),
      warn
    }

    expect(
      binder.bindDenied({
        methodReference: 'tenant-org-service/TenantOrgManagementService/CreateOrgUnit',
        requestId: 'request-denied-1',
        traceId: 'trace-denied-1',
        stage: 'TARGET_METHOD_AUTHORITY',
        stableReason: 'WORKLOAD_OR_CODE_MISMATCH'
      })
    ).toBe(true)
    expect(warn).toHaveBeenCalledWith({
      eventType: 'TENANT_TARGET_ADMISSION',
      result: 'DENIED',
      service: 'tenant-org-service',
      module: 'tenant-target-admission',
      targetMethodReference: 'tenant-org-service/TenantOrgManagementService/CreateOrgUnit',
      requestId: 'request-denied-1',
      traceId: 'trace-denied-1',
      stage: 'TARGET_METHOD_AUTHORITY',
      stableReason: 'WORKLOAD_OR_CODE_MISMATCH'
    })
    expect(JSON.stringify(warn.mock.calls[0][0])).not.toMatch(
      /Bearer|certificateThumbprint|tenantId|selector/
    )
  })
})

/** Reads immutable target declaration metadata from one controller handler. */
function targetDeclaration(controller: Function, method: string): unknown {
  return Reflect.getMetadata(
    TENANT_ORG_TARGET_METHOD_METADATA_KEY,
    (controller.prototype as Record<string, unknown>)[method]
  )
}

/** Returns the frozen protobuf method reference owned by one controller target handler. */
function targetMethodReference(controller: Function, method: string): string {
  const service =
    controller === TenantOrgQueryGrpcController
      ? 'TenantOrgQueryService'
      : 'TenantOrgManagementService'
  return `tenant-org-service/${service}/${method.charAt(0).toUpperCase()}${method.slice(1)}`
}

/** Returns the exact runtime workload config slots allowed for frozen MACHINE reads. */
function machineWorkloadConfigKeys(controller: Function, method: string): readonly string[] {
  if (controller !== TenantOrgQueryGrpcController) return []
  if (method === 'getTenantById') {
    return ['TENANT_ORG_AUTH_SPIFFE_ID']
  }
  return []
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
