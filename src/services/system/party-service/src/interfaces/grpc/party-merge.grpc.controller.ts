import { Controller } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import {
  MergePartiesRequest,
  MergePartiesResponse,
  PartyMergeServiceController,
  PartyMergeServiceControllerMethods
} from '@oes/common/generated/party_service'
import { PartyMergeService } from '../../application/services'

/** PartyMergeGrpcController exposes the guarded canonical-party merge contract over gRPC. */
@Controller()
@PartyMergeServiceControllerMethods()
export class PartyMergeGrpcController implements PartyMergeServiceController {
  constructor(private readonly partyMergeService: PartyMergeService) {}

  async mergeParties(request: MergePartiesRequest, _metadata?: Metadata): Promise<MergePartiesResponse> {
    const result = await this.partyMergeService.mergeParties({
      survivorPartyId: request.survivorPartyId ?? '',
      mergedPartyIds: request.mergedPartyIds ?? [],
      reason: request.reason ?? undefined
    })

    return {
      survivorParty: {
        id: result.survivorParty.id,
        type: result.survivorParty.type,
        status: result.survivorParty.status,
        legalName: result.survivorParty.legalName
      },
      mergedParties: result.mergedParties.map((party) => ({
        id: party.id,
        type: party.type,
        status: String(party.status),
        legalName: party.legalName
      }))
    }
  }
}
