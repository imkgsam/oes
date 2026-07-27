import { PartyQueryService } from '../../src/application/services/party-query.service'
import { PartyType } from '../../src/domain/value-objects'

function createTenantPartyRepositoryMock() {
  return {
    findById: jest.fn(),
    findByTenantAndIdentifier: jest.fn(),
    findCandidates: jest.fn()
  }
}

describe('PartyQueryService', () => {
  it('getTenantPartyById / when tenant party does not exist / should return null', async () => {
    const tenantPartyRepository = createTenantPartyRepositoryMock()
    tenantPartyRepository.findById.mockResolvedValue(null)

    const service = new PartyQueryService(tenantPartyRepository as never)

    await expect(service.getTenantPartyById('tenant-1', 'tenant-party-missing')).resolves.toBeNull()
  })

  it('resolveTenantPartyByIdentifier / should search only within the supplied tenant', async () => {
    const tenantPartyRepository = createTenantPartyRepositoryMock()
    tenantPartyRepository.findByTenantAndIdentifier.mockResolvedValue({
      id: 'tenant-party-1',
      tenantId: 'tenant-1',
      type: PartyType.ORGANIZATION,
      legalName: 'Acme'
    })

    const service = new PartyQueryService(tenantPartyRepository as never)

    const result = await service.resolveTenantPartyByIdentifier('tenant-1', {
      identifierType: 'BUSINESS_REG_NO',
      normalizedValue: 'acme-001',
      rawValue: 'ACME-001',
      issuerCountryOrRegion: 'US'
    })

    expect(tenantPartyRepository.findByTenantAndIdentifier).toHaveBeenCalledWith('tenant-1', [
      {
        identifierType: 'BUSINESS_REG_NO',
        normalizedValue: 'acme-001',
        rawValue: 'ACME-001',
        issuerCountryOrRegion: 'US'
      }
    ])
    expect(result).toMatchObject({
      id: 'tenant-party-1',
      tenantId: 'tenant-1'
    })
  })

  it('searchTenantPartyCandidates / should return tenant party candidates without side effects', async () => {
    const tenantPartyRepository = createTenantPartyRepositoryMock()
    tenantPartyRepository.findCandidates.mockResolvedValue([
      {
        tenantParty: { id: 'tenant-party-1', tenantId: 'tenant-1', legalName: 'Acme' },
        confidence: 0.84,
        matchSignals: ['name']
      }
    ])

    const service = new PartyQueryService(tenantPartyRepository as never)

    const result = await service.searchTenantPartyCandidates({
      tenantId: 'tenant-1',
      keyword: 'Acme'
    })

    expect(result).toEqual([
      expect.objectContaining({
        tenantParty: expect.objectContaining({ id: 'tenant-party-1' }),
        confidence: 0.84
      })
    ])
  })

  it('resolveTenantPartyForConsumer / when one strong identifier matches / should return exact match', async () => {
    const tenantPartyRepository = createTenantPartyRepositoryMock()
    tenantPartyRepository.findByTenantAndIdentifier.mockResolvedValue({
      id: 'tenant-party-1',
      tenantId: 'tenant-1',
      type: PartyType.ORGANIZATION,
      legalName: 'Foshan Basin Trading'
    })
    tenantPartyRepository.findCandidates.mockResolvedValue([])

    const service = new PartyQueryService(tenantPartyRepository as never)

    const result = await service.resolveTenantPartyForConsumer({
      tenantId: 'tenant-1',
      typeHint: PartyType.ORGANIZATION,
      name: 'Foshan Basin Trading',
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
      tenantParty: expect.objectContaining({
        id: 'tenant-party-1',
        tenantId: 'tenant-1'
      }),
      candidates: [],
      matchedFields: ['identifier:VAT_NO']
    })
  })

  it('resolveTenantPartyForConsumer / when strong identifiers point to different parties / should return identity conflict', async () => {
    const tenantPartyRepository = createTenantPartyRepositoryMock()
    tenantPartyRepository.findByTenantAndIdentifier
      .mockResolvedValueOnce({
        id: 'tenant-party-1',
        tenantId: 'tenant-1',
        type: PartyType.ORGANIZATION,
        legalName: 'Foshan Basin Trading'
      })
      .mockResolvedValueOnce({
        id: 'tenant-party-2',
        tenantId: 'tenant-1',
        type: PartyType.ORGANIZATION,
        legalName: 'Foshan Basin Manufacturing'
      })
    tenantPartyRepository.findCandidates.mockResolvedValue([])

    const service = new PartyQueryService(tenantPartyRepository as never)

    const result = await service.resolveTenantPartyForConsumer({
      tenantId: 'tenant-1',
      typeHint: PartyType.ORGANIZATION,
      name: 'Foshan Basin',
      identifiers: [
        {
          identifierType: 'VAT_NO',
          normalizedValue: 'cn-vat-001',
          rawValue: 'CN VAT 001',
          issuerCountryOrRegion: 'CN'
        },
        {
          identifierType: 'BUSINESS_REG_NO',
          normalizedValue: 'cn-reg-002',
          rawValue: 'CN REG 002',
          issuerCountryOrRegion: 'CN'
        }
      ]
    })

    expect(result).toEqual({
      result: 'IDENTITY_CONFLICT',
      tenantParty: null,
      candidates: [
        expect.objectContaining({
          tenantParty: expect.objectContaining({ id: 'tenant-party-1' }),
          conflictFlags: ['STRONG_IDENTIFIER_CONFLICT']
        }),
        expect.objectContaining({
          tenantParty: expect.objectContaining({ id: 'tenant-party-2' }),
          conflictFlags: ['STRONG_IDENTIFIER_CONFLICT']
        })
      ],
      matchedFields: ['identifier:VAT_NO', 'identifier:BUSINESS_REG_NO']
    })
  })

  it('resolveTenantPartyForConsumer / when only weak evidence matches candidates / should require user choice', async () => {
    const tenantPartyRepository = createTenantPartyRepositoryMock()
    tenantPartyRepository.findByTenantAndIdentifier.mockResolvedValue(null)
    tenantPartyRepository.findCandidates.mockResolvedValue([
      {
        tenantParty: {
          id: 'tenant-party-3',
          tenantId: 'tenant-1',
          type: PartyType.ORGANIZATION,
          legalName: 'Basin World Importers'
        },
        confidence: 0.72,
        matchSignals: ['name', 'country']
      }
    ])

    const service = new PartyQueryService(tenantPartyRepository as never)

    const result = await service.resolveTenantPartyForConsumer({
      tenantId: 'tenant-1',
      typeHint: PartyType.ORGANIZATION,
      name: 'Basin World',
      country: 'US'
    })

    expect(result).toEqual({
      result: 'CANDIDATES_FOUND',
      tenantParty: null,
      candidates: [
        expect.objectContaining({
          tenantParty: expect.objectContaining({ id: 'tenant-party-3' }),
          matchedFields: ['name', 'country'],
          confidence: 0.72
        })
      ],
      matchedFields: ['name', 'country']
    })
  })

  it('resolveTenantPartyForConsumer / when domain evidence is supplied / should search Party profile items as weak candidates', async () => {
    const tenantPartyRepository = createTenantPartyRepositoryMock()
    tenantPartyRepository.findByTenantAndIdentifier.mockResolvedValue(null)
    tenantPartyRepository.findCandidates.mockResolvedValue([
      {
        tenantParty: {
          id: 'tenant-party-4',
          tenantId: 'tenant-1',
          type: PartyType.ORGANIZATION,
          legalName: 'Basin Domain Match'
        },
        confidence: 0.9,
        matchSignals: ['domain']
      }
    ])

    const service = new PartyQueryService(tenantPartyRepository as never)

    await service.resolveTenantPartyForConsumer({
      tenantId: 'tenant-1',
      typeHint: PartyType.ORGANIZATION,
      domain: 'basin.example'
    })

    expect(tenantPartyRepository.findCandidates).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      keyword: undefined,
      partyType: PartyType.ORGANIZATION,
      registeredCountry: undefined,
      identifiers: [],
      domain: 'basin.example',
      email: undefined,
      phone: undefined,
      whatsapp: undefined
    })
  })

  it('resolveTenantPartyForConsumer / when no evidence matches / should return no match', async () => {
    const tenantPartyRepository = createTenantPartyRepositoryMock()
    tenantPartyRepository.findByTenantAndIdentifier.mockResolvedValue(null)
    tenantPartyRepository.findCandidates.mockResolvedValue([])

    const service = new PartyQueryService(tenantPartyRepository as never)

    const result = await service.resolveTenantPartyForConsumer({
      tenantId: 'tenant-1',
      typeHint: PartyType.PERSON,
      name: 'Mira Solenne',
      email: 'mira@example.test'
    })

    expect(result).toEqual({
      result: 'NO_MATCH',
      tenantParty: null,
      candidates: [],
      matchedFields: []
    })
  })
})
