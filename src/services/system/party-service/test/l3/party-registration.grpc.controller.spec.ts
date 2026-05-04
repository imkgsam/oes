import { PartyRegistrationService } from '../../src/application/services'
import { PartyRegistrationGrpcController } from '../../src/interfaces/grpc/party-registration.grpc.controller'

function createPartyRegistrationServiceMock() {
  return {
    registerPersonParty: jest.fn(),
    registerOrganizationParty: jest.fn(),
    bindExistingPartyToTenant: jest.fn(),
    deactivateTenantParty: jest.fn()
  }
}

describe('PartyRegistrationGrpcController L3', () => {
  it('gRPC 注册组织主体 / 当请求合法时 / 应映射为应用服务输入并返回标准响应', async () => {
    const service = createPartyRegistrationServiceMock()
    const controller = new PartyRegistrationGrpcController(service as unknown as PartyRegistrationService)

    service.registerOrganizationParty.mockResolvedValue({
      party: {
        id: 'party-1',
        type: 'ORGANIZATION',
        status: 'ACTIVE',
        legalName: 'Acme Legal'
      },
      tenantParty: {
        id: 'tenant-party-1',
        tenantId: 'tenant-1',
        partyId: 'party-1',
        localDisplayName: null,
        localCode: null,
        status: 'ACTIVE'
      },
      matchResult: 'CREATED'
    })

    const result = await controller.registerOrganizationParty({
      tenantId: 'tenant-1',
      legalName: 'Acme Legal',
      localDisplayName: 'Acme Local',
      localCode: 'ACME-001',
      registeredCountry: 'CN',
      identifiers: [
        {
          identifierType: 'BUSINESS_REG_NO',
          normalizedValue: 'cn-acme-001',
          rawValue: 'CN-ACME-001',
          issuerCountryOrRegion: 'CN'
        }
      ]
    } as any)

    expect(service.registerOrganizationParty).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      legalName: 'Acme Legal',
      registeredCountry: 'CN',
      localDisplayName: 'Acme Local',
      localCode: 'ACME-001',
      identifiers: [
        {
          identifierType: 'BUSINESS_REG_NO',
          normalizedValue: 'cn-acme-001',
          rawValue: 'CN-ACME-001',
          issuerCountryOrRegion: 'CN'
        }
      ]
    })
    expect(result).toEqual({
      party: {
        id: 'party-1',
        type: 'ORGANIZATION',
        status: 'ACTIVE',
        legalName: 'Acme Legal'
      },
      tenantParty: {
        id: 'tenant-party-1',
        tenantId: 'tenant-1',
        partyId: 'party-1',
        localDisplayName: '',
        localCode: '',
        status: 'ACTIVE'
      },
      matchResult: 'CREATED'
    })
  })

  it('gRPC 绑定已有主体 / 当请求包含 tags 时 / 应完整映射到租户绑定输入', async () => {
    const service = createPartyRegistrationServiceMock()
    const controller = new PartyRegistrationGrpcController(service as unknown as PartyRegistrationService)

    service.bindExistingPartyToTenant.mockResolvedValue({
      party: {
        id: 'party-2',
        type: 'ORGANIZATION',
        status: 'ACTIVE',
        legalName: 'Bound Party'
      },
      tenantParty: {
        id: 'tenant-party-2',
        tenantId: 'tenant-2',
        partyId: 'party-2',
        localDisplayName: 'Local Bound Party',
        localCode: 'BOUND-002',
        status: 'ACTIVE'
      }
    })

    const result = await controller.bindExistingPartyToTenant({
      tenantId: 'tenant-2',
      partyId: 'party-2',
      localDisplayName: 'Local Bound Party',
      localCode: 'BOUND-002',
      tags: ['supplier', 'preferred']
    } as any)

    expect(service.bindExistingPartyToTenant).toHaveBeenCalledWith({
      tenantId: 'tenant-2',
      partyId: 'party-2',
      localDisplayName: 'Local Bound Party',
      localCode: 'BOUND-002',
      tags: ['supplier', 'preferred']
    })
    expect(result.tenantParty.status).toBe('ACTIVE')
  })
})
