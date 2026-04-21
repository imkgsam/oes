import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { MergePartiesInput, PARTY_REPOSITORY, PartyRepository } from '../../domain/repositories'

/** PartyMergeService owns the guarded merge flow for duplicate canonical party records. */
@Injectable()
export class PartyMergeService {
  constructor(
    @Inject(PARTY_REPOSITORY)
    private readonly partyRepository: PartyRepository
  ) {}

  async mergeParties(input: MergePartiesInput) {
    if (input.mergedPartyIds.length === 0) {
      throw new BadRequestException('mergedPartyIds must not be empty')
    }

    if (input.mergedPartyIds.includes(input.survivorPartyId)) {
      throw new BadRequestException('survivorPartyId must not appear in mergedPartyIds')
    }

    return this.partyRepository.mergeParties(input)
  }
}
