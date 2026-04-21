import { BadRequestException } from '@nestjs/common'
import { PartyMergeService } from '../../src/application/services/party-merge.service'

function createPartyRepositoryMock() {
  return {
    findById: jest.fn(),
    mergeParties: jest.fn()
  }
}

describe('PartyMergeService', () => {
  it('mergeParties / when survivor is included in merged list / should throw BadRequestException', async () => {
    const partyRepository = createPartyRepositoryMock()
    const service = new PartyMergeService(partyRepository as never)

    await expect(
      service.mergeParties({
        survivorPartyId: 'party-1',
        mergedPartyIds: ['party-1', 'party-2']
      })
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('mergeParties / should return merge result from repository', async () => {
    const partyRepository = createPartyRepositoryMock()
    partyRepository.mergeParties.mockResolvedValue({
      survivorParty: { id: 'party-1', status: 'ACTIVE' },
      mergedParties: [{ id: 'party-2', status: 'MERGED' }]
    })

    const service = new PartyMergeService(partyRepository as never)

    const result = await service.mergeParties({
      survivorPartyId: 'party-1',
      mergedPartyIds: ['party-2']
    })

    expect(result).toEqual(
      expect.objectContaining({
        survivorParty: expect.objectContaining({ id: 'party-1' }),
        mergedParties: [expect.objectContaining({ id: 'party-2', status: 'MERGED' })]
      })
    )
  })
})
