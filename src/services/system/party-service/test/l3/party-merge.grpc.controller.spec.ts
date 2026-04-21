import { PartyMergeService } from '../../src/application/services'
import { PartyMergeGrpcController } from '../../src/interfaces/grpc/party-merge.grpc.controller'

function createPartyMergeServiceMock() {
  return {
    mergeParties: jest.fn()
  }
}

describe('PartyMergeGrpcController L3', () => {
  it('gRPC 合并主体 / 当请求合法时 / 应映射 merge 输入并返回字符串化状态', async () => {
    const service = createPartyMergeServiceMock()
    const controller = new PartyMergeGrpcController(service as unknown as PartyMergeService)

    service.mergeParties.mockResolvedValue({
      survivorParty: {
        id: 'party-survivor',
        type: 'ORGANIZATION',
        status: 'ACTIVE',
        canonicalName: 'Acme Parent',
        displayName: null
      },
      mergedParties: [
        {
          id: 'party-duplicate',
          type: 'ORGANIZATION',
          status: 'MERGED',
          canonicalName: 'Acme Duplicate',
          displayName: null
        }
      ]
    })

    const result = await controller.mergeParties({
      survivorPartyId: 'party-survivor',
      mergedPartyIds: ['party-duplicate'],
      reason: 'duplicate canonical party'
    } as any)

    expect(service.mergeParties).toHaveBeenCalledWith({
      survivorPartyId: 'party-survivor',
      mergedPartyIds: ['party-duplicate'],
      reason: 'duplicate canonical party'
    })
    expect(result).toEqual({
      survivorParty: {
        id: 'party-survivor',
        type: 'ORGANIZATION',
        status: 'ACTIVE',
        canonicalName: 'Acme Parent',
        displayName: ''
      },
      mergedParties: [
        {
          id: 'party-duplicate',
          type: 'ORGANIZATION',
          status: 'MERGED',
          canonicalName: 'Acme Duplicate',
          displayName: ''
        }
      ]
    })
  })
})
