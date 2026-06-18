import { PartyQueryService } from '../../src/application/services'
import { PartyQueryGrpcController } from '../../src/interfaces/grpc/party-query.grpc.controller'

function createPartyQueryServiceMock() {
  return {
    getTenantPartyById: jest.fn(),
    resolveTenantPartyByIdentifier: jest.fn(),
    resolveTenantPartyForConsumer: jest.fn(),
    searchTenantPartyCandidates: jest.fn()
  }
}

describe('PartyQueryGrpcController L3', () => {
  it('gRPC 搜索租户主体候选 / 当请求包含 partyType 和 identifiers 时 / 应完整映射查询条件并返回候选', async () => {
    const service = createPartyQueryServiceMock()
    const controller = new PartyQueryGrpcController(service as unknown as PartyQueryService)

    service.searchTenantPartyCandidates.mockResolvedValue([
      {
        tenantParty: {
          id: 'tenant-party-1',
          tenantId: 'tenant-1',
          type: 'ORGANIZATION',
          status: 'ACTIVE',
          legalName: 'Acme Legal'
        },
        confidence: 0.88,
        matchSignals: ['name', 'identifier']
      }
    ])

    const result = await controller.searchTenantPartyCandidates({
      tenantId: 'tenant-1',
      keyword: 'Acme',
      partyType: 'ORGANIZATION',
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

    expect(service.searchTenantPartyCandidates).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      keyword: 'Acme',
      partyType: 'ORGANIZATION',
      registeredCountry: 'CN',
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
      candidates: [
        {
          tenantParty: {
            id: 'tenant-party-1',
            tenantId: 'tenant-1',
            type: 'ORGANIZATION',
            status: 'ACTIVE',
            legalName: 'Acme Legal',
            displayName: '',
            localCode: '',
            registeredCountry: ''
          },
          confidence: 0.88,
          matchSignals: ['name', 'identifier']
        }
      ]
    })
  })

  it('gRPC 标识解析 / 当 rawValue 为空时 / 应回退为 normalizedValue 并标记 strong match', async () => {
    const service = createPartyQueryServiceMock()
    const controller = new PartyQueryGrpcController(service as unknown as PartyQueryService)

    service.resolveTenantPartyByIdentifier.mockResolvedValue({
      id: 'tenant-party-2',
      tenantId: 'tenant-1',
      type: 'PERSON',
      status: 'ACTIVE',
      legalName: 'Zhang San'
    })

    const result = await controller.resolveTenantPartyByIdentifier({
      tenantId: 'tenant-1',
      identifierType: 'PASSPORT',
      normalizedValue: 'P123456',
      issuerCountryOrRegion: 'CN'
    } as any)

    expect(service.resolveTenantPartyByIdentifier).toHaveBeenCalledWith('tenant-1', {
      identifierType: 'PASSPORT',
      normalizedValue: 'P123456',
      rawValue: 'P123456',
      issuerCountryOrRegion: 'CN'
    })
    expect(result).toEqual({
      matchType: 'STRONG_MATCH',
      tenantParty: {
        id: 'tenant-party-2',
        tenantId: 'tenant-1',
        type: 'PERSON',
        status: 'ACTIVE',
        legalName: 'Zhang San',
        displayName: '',
        localCode: '',
        registeredCountry: ''
      }
    })
  })

  it('gRPC 消费方主体解析 / 当请求包含强标识和联系 evidence 时 / 应映射正式 resolution 结果', async () => {
    const service = createPartyQueryServiceMock()
    const controller = new PartyQueryGrpcController(service as unknown as PartyQueryService)

    service.resolveTenantPartyForConsumer.mockResolvedValue({
      result: 'EXACT_MATCH',
      tenantParty: {
        id: 'tenant-party-3',
        tenantId: 'tenant-1',
        type: 'ORGANIZATION',
        status: 'ACTIVE',
        legalName: 'Foshan Basin Trading'
      },
      candidates: [],
      matchedFields: ['identifier:VAT_NO']
    })

    const result = await (controller as any).resolveTenantPartyForConsumer({
      tenantId: 'tenant-1',
      typeHint: 'ORGANIZATION',
      name: 'Foshan Basin Trading',
      country: 'CN',
      domain: 'basin.example',
      email: 'sales@basin.example',
      phone: '+86 757 8842 1930',
      whatsapp: '+86 139 2847 1000',
      identifiers: [
        {
          identifierType: 'VAT_NO',
          normalizedValue: 'cn-vat-001',
          rawValue: 'CN VAT 001',
          issuerCountryOrRegion: 'CN'
        }
      ]
    })

    expect(service.resolveTenantPartyForConsumer).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      typeHint: 'ORGANIZATION',
      name: 'Foshan Basin Trading',
      country: 'CN',
      domain: 'basin.example',
      email: 'sales@basin.example',
      phone: '+86 757 8842 1930',
      whatsapp: '+86 139 2847 1000',
      identifiers: [
        {
          identifierType: 'VAT_NO',
          normalizedValue: 'cn-vat-001',
          rawValue: 'CN VAT 001',
          issuerCountryOrRegion: 'CN'
        }
      ]
    })
    expect(result).toEqual({
      result: 'EXACT_MATCH',
      tenantParty: {
        id: 'tenant-party-3',
        tenantId: 'tenant-1',
        type: 'ORGANIZATION',
        status: 'ACTIVE',
        legalName: 'Foshan Basin Trading',
        displayName: '',
        localCode: '',
        registeredCountry: ''
      },
      candidates: [],
      matchedFields: ['identifier:VAT_NO']
    })
  })
})
