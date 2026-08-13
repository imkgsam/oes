import { of } from 'rxjs'
import { PARTY_QUERY_SERVICE_NAME } from '@oes/common/generated/party_service'
import { PartyQueryGrpcAdapter } from '../../auth-bff/infrastructure/downstream/party-service/party-query-grpc.adapter'

/** Evidence for the registered Party caller path: tenant authority is excluded from the wire request. */
describe('Party dedicated caller evidence', () => {
  it('keeps tenant scope out of the Party request body while forwarding trusted metadata', async () => {
    const getTenantPartyById = jest.fn().mockReturnValue(of({ tenantParty: undefined }))
    const client = {
      getService: jest.fn((name: string) => {
        expect(name).toBe(PARTY_QUERY_SERVICE_NAME)
        return { getTenantPartyById }
      })
    }
    const metadata = { createOperatorScopedMetadata: jest.fn(() => ({ trusted: true })) }
    const adapter = new PartyQueryGrpcAdapter(client as never, metadata as never)
    adapter.onModuleInit()

    await adapter.getTenantPartyById('tenant-1', 'tenant-party-1', {
      requestId: 'request-1',
      traceId: 'trace-1',
      user: { holderId: 'operator-1', tenantId: 'tenant-1' }
    } as never)

    expect(getTenantPartyById).toHaveBeenCalledWith(
      { tenantPartyId: 'tenant-party-1' },
      { trusted: true }
    )
  })
})
