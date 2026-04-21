import { MODULE_METADATA } from '@nestjs/common/constants'
import {
  OPERATOR_PERMISSION_RESOLVER,
  PermissionGuard
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { SYMBOLS } from '../../src/common/constants'
import { IdentityManagementModule } from '../../src/modules/identity-management/identity-management.module'

describe('IdentityManagementModule', () => {
  it('registers the user repository required by account creation commands', () => {
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, IdentityManagementModule) ?? []

    expect(providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provide: SYMBOLS.REPO.USER
        })
      ])
    )
  })

  it('binds the management permission guard to the role-based operator resolver locally', () => {
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, IdentityManagementModule) ?? []

    expect(providers).toEqual(
      expect.arrayContaining([
        PermissionGuard,
        expect.objectContaining({
          provide: OPERATOR_PERMISSION_RESOLVER
        })
      ])
    )
  })

  it('imports the permission gRPC client required by the role-based resolver', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, IdentityManagementModule) ?? []

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
