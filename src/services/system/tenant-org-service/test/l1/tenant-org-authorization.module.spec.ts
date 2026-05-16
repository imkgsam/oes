import { MODULE_METADATA } from '@nestjs/common/constants'
import {
  OPERATOR_PERMISSION_RESOLVER,
  PermissionGuard,
  PermissionServicePermissionReadAdaptor,
  RoleBasedOperatorPermissionResolver
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { TenantOrgManagementModule } from '../../src/modules/tenant-org-management/tenant-org-management.module'
import { TenantOrgQueryModule } from '../../src/modules/tenant-org-query/tenant-org-query.module'

describe('TenantOrg authorization module wiring', () => {
  it.each([
    ['management', TenantOrgManagementModule],
    ['query', TenantOrgQueryModule]
  ])('binds %s RPC permissions to the role-based operator resolver', (_name, moduleRef) => {
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, moduleRef) ?? []

    expect(providers).toEqual(
      expect.arrayContaining([
        PermissionServicePermissionReadAdaptor,
        RoleBasedOperatorPermissionResolver,
        PermissionGuard,
        expect.objectContaining({
          provide: OPERATOR_PERMISSION_RESOLVER,
          useExisting: RoleBasedOperatorPermissionResolver
        })
      ])
    )
  })

  it.each([
    ['management', TenantOrgManagementModule],
    ['query', TenantOrgQueryModule]
  ])('imports the permission gRPC client for %s RBAC resolution', (_name, moduleRef) => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, moduleRef) ?? []

    expect(imports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          module: GrpcTransportModule
        })
      ])
    )
    expect(JSON.stringify(imports)).toContain(SERVICE_NAMES.PERMISSION)
  })
})
