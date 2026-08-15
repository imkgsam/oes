import { MODULE_METADATA } from '@nestjs/common/constants'
import { Test } from '@nestjs/testing'
import {
  PermissionGuard,
  PermissionServicePermissionReadAdaptor,
  RoleBasedOperatorPermissionResolver
} from '@oes/common/authorization'
import { createGrpcClientCredentials, GrpcTransportModule } from '@oes/common/transport'
import { AppModule } from '../../src/app.module'
import { HrQueryService } from '../../src/application/services'
import { TENANT_ORG_REFERENCE_PORT } from '../../src/application/ports'
import { TenantOrgGrpcAdapter } from '../../src/infrastructure/adapters/tenant-org-grpc.adapter'
import { HrReferenceModule } from '../../src/infrastructure/modules/hr-reference.module'
import { HrQueryModule } from '../../src/modules/hr-query/hr-query.module'

jest.mock('@oes/common/transport', () => {
  const actual = jest.requireActual('@oes/common/transport')
  const { ChannelCredentials } = jest.requireActual('@grpc/grpc-js')
  return {
    ...actual,
    createGrpcClientCredentials: jest.fn(() => ChannelCredentials.createInsecure())
  }
})

describe('HR query module wiring', () => {
  it('resolves the dedicated mTLS TenantOrg reference without legacy Permission authority', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    expect(moduleRef.get(HrQueryService)).toBeInstanceOf(HrQueryService)
    expect(moduleRef.get(TENANT_ORG_REFERENCE_PORT)).toBeInstanceOf(TenantOrgGrpcAdapter)
    expect(createGrpcClientCredentials).toHaveBeenCalled()

    const providers = [HrQueryModule, HrReferenceModule].flatMap(
      (module) => Reflect.getMetadata(MODULE_METADATA.PROVIDERS, module) ?? []
    )
    expect(providers).not.toEqual(
      expect.arrayContaining([
        PermissionServicePermissionReadAdaptor,
        RoleBasedOperatorPermissionResolver,
        PermissionGuard
      ])
    )

    const imports = [HrQueryModule, HrReferenceModule].flatMap(
      (module) => Reflect.getMetadata(MODULE_METADATA.IMPORTS, module) ?? []
    )
    expect(
      imports.some(
        (entry) => entry === GrpcTransportModule || entry?.module === GrpcTransportModule
      )
    ).toBe(false)

    await moduleRef.close()
  })
})
