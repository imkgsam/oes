import { MODULE_METADATA } from '@nestjs/common/constants'
import { SYMBOLS } from '../common/constants'
import { IdentityManagementModule } from '../modules/identity-management/identity-management.module'
import { IdentityTrustedExecutionModule } from '../modules/identity-trusted-execution.module'

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

  it('imports the local trusted execution module and no generic foundation transport', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, IdentityManagementModule) ?? []
    expect(imports).toEqual(expect.arrayContaining([IdentityTrustedExecutionModule]))
    expect(JSON.stringify(imports)).not.toContain('GrpcTransportModule')
  })
})
