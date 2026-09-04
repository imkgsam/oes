import { GUARDS_METADATA, MODULE_METADATA } from '@nestjs/common/constants'
import { Test } from '@nestjs/testing'
import {
  getRpcAuthorizationModeDeclaration,
  PermissionGuard,
  PermissionServicePermissionReadAdaptor,
  RoleBasedOperatorPermissionResolver
} from '@oes/common/authorization'
import { GrpcTransportModule } from '@oes/common/transport'
import { AppModule } from '../app.module'
import {
  TenantOrgAuthTrustedGrpcClient,
  TenantOrgHrTrustedGrpcClient,
  TenantOrgIdentityTrustedGrpcClient,
  TenantOrgPermissionTrustedGrpcClient
} from '../infrastructure/adapters/foundation-trusted-grpc.clients'
import { PrismaService } from '../infrastructure/prisma/prisma.service'
import { TenantOrgManagementGrpcController } from '../interfaces/grpc/tenant-org-management.grpc.controller'
import { TenantOrgQueryGrpcController } from '../interfaces/grpc/tenant-org-query.grpc.controller'
import { TenantOrgManagementModule } from '../modules/tenant-org-management/tenant-org-management.module'
import { TenantOrgQueryModule } from '../modules/tenant-org-query/tenant-org-query.module'
import {
  TenantOrgFoundationTrustedExecutionGuard,
  TenantOrgTrustedExecutionModule
} from '../modules/tenant-org-trusted-execution.module'

describe('TenantOrg trusted authorization module wiring', () => {
  it('resolves the trusted guard and all dedicated foundation target clients', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $connect: jest.fn(), $disconnect: jest.fn() })
      .compile()

    expect(moduleRef.get(TenantOrgFoundationTrustedExecutionGuard)).toBeInstanceOf(
      TenantOrgFoundationTrustedExecutionGuard
    )
    expect(moduleRef.get(TenantOrgAuthTrustedGrpcClient)).toBeInstanceOf(
      TenantOrgAuthTrustedGrpcClient
    )
    expect(moduleRef.get(TenantOrgHrTrustedGrpcClient)).toBeInstanceOf(TenantOrgHrTrustedGrpcClient)
    expect(moduleRef.get(TenantOrgIdentityTrustedGrpcClient)).toBeInstanceOf(
      TenantOrgIdentityTrustedGrpcClient
    )
    expect(moduleRef.get(TenantOrgPermissionTrustedGrpcClient)).toBeInstanceOf(
      TenantOrgPermissionTrustedGrpcClient
    )

    await moduleRef.close()
  })

  it.each([
    ['management', TenantOrgManagementGrpcController],
    ['query', TenantOrgQueryGrpcController]
  ] as const)('binds %s RPC declarations to the trusted ET guard', (_name, controller) => {
    expect(Reflect.getMetadata(GUARDS_METADATA, controller)).toEqual(
      expect.arrayContaining([TenantOrgFoundationTrustedExecutionGuard])
    )
  })

  it.each([
    ['management', 'createTenant', 'tenant_org.tenant.create', TenantOrgManagementGrpcController],
    [
      'management',
      'updateTenantProfile',
      'tenant_org.tenant.update_profile',
      TenantOrgManagementGrpcController
    ],
    [
      'management',
      'createOrgUnit',
      'tenant_org.org_unit.create',
      TenantOrgManagementGrpcController
    ],
    [
      'management',
      'archiveOrgUnit',
      'tenant_org.org_unit.archive',
      TenantOrgManagementGrpcController
    ],
    ['query', 'getTenantById', 'tenant_org.tenant.get_by_id', TenantOrgQueryGrpcController],
    ['query', 'listTenants', 'tenant_org.tenant.list', TenantOrgQueryGrpcController],
    [
      'query',
      'getOrgTreeByTenantId',
      'tenant_org.org_unit.list_tree',
      TenantOrgQueryGrpcController
    ],
    ['query', 'getOrgUnitById', 'tenant_org.org_unit.get_by_id', TenantOrgQueryGrpcController]
  ] as const)('declares %s.%s as exact BUSINESS Code %s', (_name, method, code, controller) => {
    expect(businessCode(controller.prototype, method)).toBe(code)
  })

  it('contains no local Permission resolver or generic gRPC registration', () => {
    const modules = [TenantOrgManagementModule, TenantOrgQueryModule]
    const providers = modules.flatMap(
      (module) => Reflect.getMetadata(MODULE_METADATA.PROVIDERS, module) ?? []
    )
    expect(providers).not.toEqual(
      expect.arrayContaining([
        PermissionServicePermissionReadAdaptor,
        RoleBasedOperatorPermissionResolver,
        PermissionGuard
      ])
    )

    const imports = modules.flatMap(
      (module) => Reflect.getMetadata(MODULE_METADATA.IMPORTS, module) ?? []
    )
    expect(
      imports.some(
        (entry) => entry === GrpcTransportModule || entry?.module === GrpcTransportModule
      )
    ).toBe(false)
    expect(Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule)).toEqual(
      expect.arrayContaining([TenantOrgTrustedExecutionModule])
    )
  })
})

/** Reads one exact Code only from a frozen BUSINESS execution declaration. */
function businessCode(prototype: object, method: string): string | undefined {
  const declaration = getRpcAuthorizationModeDeclaration(prototype, method)
  expect(declaration?.mode).toBe('BUSINESS')
  return declaration?.mode === 'BUSINESS' && 'all' in declaration.permissions
    ? declaration.permissions.all[0]
    : undefined
}
