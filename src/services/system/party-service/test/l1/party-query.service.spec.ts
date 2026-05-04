import { PartyQueryService } from '../../src/application/services/party-query.service'

function createPartyRepositoryMock() {
  return {
    findById: jest.fn(),
    findCandidates: jest.fn(),
    findRelationships: jest.fn(),
    resolveByIdentifier: jest.fn()
  }
}

function createTenantPartyRepositoryMock() {
  return {
    findById: jest.fn()
  }
}

describe('PartyQueryService', () => {
  it('getPartyById / when party does not exist / should return null', async () => {
    const partyRepository = createPartyRepositoryMock()
    const tenantPartyRepository = createTenantPartyRepositoryMock()
    partyRepository.findById.mockResolvedValue(null)

    const service = new PartyQueryService(partyRepository as never, tenantPartyRepository as never)

    await expect(service.getPartyById('party-missing')).resolves.toBeNull()
  })

  it('searchPartyCandidates / should return candidates without creating bindings or merges', async () => {
    const partyRepository = createPartyRepositoryMock()
    const tenantPartyRepository = createTenantPartyRepositoryMock()
    partyRepository.findCandidates.mockResolvedValue([
      {
        party: { id: 'party-1', legalName: 'Acme' },
        confidence: 0.84,
        matchSignals: ['name']
      }
    ])

    const service = new PartyQueryService(partyRepository as never, tenantPartyRepository as never)

    const result = await service.searchPartyCandidates({
      tenantId: 'tenant-1',
      keyword: 'Acme'
    })

    expect(result).toEqual([
      expect.objectContaining({
        party: expect.objectContaining({ id: 'party-1' }),
        confidence: 0.84
      })
    ])
  })
})
