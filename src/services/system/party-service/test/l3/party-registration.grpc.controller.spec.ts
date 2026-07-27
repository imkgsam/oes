import { PartyRegistrationService } from '../../src/application/services'
import { PartyRegistrationGrpcController } from '../../src/interfaces/grpc/party-registration.grpc.controller'

function createPartyRegistrationServiceMock() {
  return {
    registerTenantParty: jest.fn(),
    deactivateTenantParty: jest.fn()
  }
}

describe('PartyRegistrationGrpcController L3', () => {
  it('gRPC 注册租户组织主体 / 当请求合法时 / 应映射为应用服务输入并返回不含 partyId 的响应', async () => {
    const service = createPartyRegistrationServiceMock()
    const controller = new PartyRegistrationGrpcController(service as unknown as PartyRegistrationService)

    service.registerTenantParty.mockResolvedValue({
      tenantParty: {
        id: 'tenant-party-1',
        tenantId: 'tenant-1',
        type: 'ORGANIZATION',
        status: 'ACTIVE',
        legalName: 'Acme Legal',
        displayName: 'Acme Local',
        localCode: 'ACME-001',
        registeredCountry: 'CN'
      },
      matchResult: 'CREATED'
    })

    const result = await controller.registerTenantParty({
      tenantId: 'tenant-1',
      type: 'ORGANIZATION',
      legalName: 'Acme Legal',
      displayName: 'Acme Local',
      localCode: 'ACME-001',
      registeredCountry: 'CN',
      identifiers: [
        {
          identifierType: 'BUSINESS_REG_NO',
          normalizedValue: 'cn-acme-001',
          rawValue: 'CN-ACME-001',
          issuerCountryOrRegion: 'CN'
        }
      ],
      profileItems: [
        {
          itemType: 'DOMAIN',
          normalizedValue: 'acme.example',
          rawValue: 'https://acme.example',
          role: 'PRIMARY'
        }
      ]
    } as any)

    expect(service.registerTenantParty).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      type: 'ORGANIZATION',
      legalName: 'Acme Legal',
      registeredCountry: 'CN',
      displayName: 'Acme Local',
      localCode: 'ACME-001',
      identifiers: [
        {
          identifierType: 'BUSINESS_REG_NO',
          normalizedValue: 'cn-acme-001',
          rawValue: 'CN-ACME-001',
          issuerCountryOrRegion: 'CN'
        }
      ],
      profileItems: [
        {
          itemType: 'DOMAIN',
          normalizedValue: 'acme.example',
          rawValue: 'https://acme.example',
          label: undefined,
          role: 'PRIMARY',
          status: undefined
        }
      ],
      idempotencyKey: undefined
    })
    expect(result).toEqual({
      tenantParty: {
        id: 'tenant-party-1',
        tenantId: 'tenant-1',
        type: 'ORGANIZATION',
        status: 'ACTIVE',
        legalName: 'Acme Legal',
        displayName: 'Acme Local',
        localCode: 'ACME-001',
        registeredCountry: 'CN'
      },
      matchResult: 'CREATED'
    })
    expect(result.tenantParty).not.toHaveProperty('partyId')
  })

  it('gRPC 停用租户主体 / 当请求合法时 / 应映射 tenant scoped lifecycle 输入', async () => {
    const service = createPartyRegistrationServiceMock()
    const controller = new PartyRegistrationGrpcController(service as unknown as PartyRegistrationService)

    service.deactivateTenantParty.mockResolvedValue({
      id: 'tenant-party-2',
      tenantId: 'tenant-2',
      type: 'PERSON',
      status: 'INACTIVE',
      legalName: 'Zhang San'
    })

    const result = await controller.deactivateTenantParty({
      tenantId: 'tenant-2',
      tenantPartyId: 'tenant-party-2',
      reason: 'duplicate local subject'
    } as any)

    expect(service.deactivateTenantParty).toHaveBeenCalledWith({
      tenantId: 'tenant-2',
      tenantPartyId: 'tenant-party-2',
      reason: 'duplicate local subject'
    })
    expect(result.tenantParty?.status).toBe('INACTIVE')
  })
})
