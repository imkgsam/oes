import { PartyQueryService } from '../../src/application/services'
import { PartyQueryGrpcController } from '../../src/interfaces/grpc/party-query.grpc.controller'

function createPartyQueryServiceMock() {
  return {
    getPartyById: jest.fn(),
    getTenantPartyById: jest.fn(),
    resolvePartyByIdentifier: jest.fn(),
    searchPartyCandidates: jest.fn(),
    listPartyRelationships: jest.fn()
  }
}

describe('PartyQueryGrpcController L3', () => {
  it('gRPC 搜索主体候选 / 当请求包含 partyType 和 identifiers 时 / 应完整映射查询条件并返回候选', async () => {
    const service = createPartyQueryServiceMock()
    const controller = new PartyQueryGrpcController(service as unknown as PartyQueryService)

    service.searchPartyCandidates.mockResolvedValue([
      {
        party: {
          id: 'party-1',
          type: 'ORGANIZATION',
          status: 'ACTIVE',
          canonicalName: 'Acme Legal',
          displayName: null
        },
        confidence: 0.88,
        matchSignals: ['name', 'identifier']
      }
    ])

    const result = await controller.searchPartyCandidates({
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

    expect(service.searchPartyCandidates).toHaveBeenCalledWith({
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
          party: {
            id: 'party-1',
            type: 'ORGANIZATION',
            status: 'ACTIVE',
            canonicalName: 'Acme Legal',
            displayName: ''
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

    service.resolvePartyByIdentifier.mockResolvedValue({
      id: 'party-2',
      type: 'PERSON',
      status: 'ACTIVE',
      canonicalName: 'Zhang San',
      displayName: 'Zhang San'
    })

    const result = await controller.resolvePartyByIdentifier({
      identifierType: 'PASSPORT',
      normalizedValue: 'P123456',
      issuerCountryOrRegion: 'CN'
    } as any)

    expect(service.resolvePartyByIdentifier).toHaveBeenCalledWith({
      identifierType: 'PASSPORT',
      normalizedValue: 'P123456',
      rawValue: 'P123456',
      issuerCountryOrRegion: 'CN'
    })
    expect(result).toEqual({
      matchType: 'STRONG_MATCH',
      party: {
        id: 'party-2',
        type: 'PERSON',
        status: 'ACTIVE',
        canonicalName: 'Zhang San',
        displayName: 'Zhang San'
      }
    })
  })
})
