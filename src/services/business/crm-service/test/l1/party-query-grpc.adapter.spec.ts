import { of } from 'rxjs'
import {
  PARTY_QUERY_SERVICE_NAME,
  PARTY_REGISTRATION_SERVICE_NAME
} from '@oes/common/generated/party_service'
import { PartyQueryGrpcAdapter } from '../../src/infrastructure/adapters/party-query-grpc.adapter'

// Verifies the CRM-to-Party anti-corruption adapter sends a complete tenant-scoped registration payload.
describe('PartyQueryGrpcAdapter', () => {
  it('registerTenantParty / should use the CRM formalization name as both legalName and displayName', async () => {
    const registerTenantParty = jest.fn().mockReturnValue(
      of({
        tenantParty: {
          id: 'tenant-party-1',
          displayName: 'Northline Bathworks'
        }
      })
    )
    const adapter = new PartyQueryGrpcAdapter(
      {
        getService: jest.fn((serviceName: string) => {
          if (serviceName === PARTY_REGISTRATION_SERVICE_NAME) {
            return { registerTenantParty }
          }
          if (serviceName === PARTY_QUERY_SERVICE_NAME) {
            return {}
          }
          throw new Error(`Unexpected service ${serviceName}`)
        })
      } as never,
      {
        createInternalCallMetadata: jest.fn(() => ({}))
      } as never,
      {
        getContext: jest.fn(() => ({ requestId: 'request-1', traceId: 'trace-1' }))
      } as never
    )
    adapter.onModuleInit()

    await adapter.registerTenantParty({
      tenantId: 'tenant-1',
      typeHint: 'ORGANIZATION',
      displayName: 'Northline Bathworks',
      country: 'US',
      identifiers: [
        {
          identifierType: 'BUSINESS_REG_NO',
          normalizedValue: 'US-NORTHLINE-1',
          rawValue: 'US-NORTHLINE-1',
          issuerCountryOrRegion: 'US'
        }
      ],
      contactPoints: [
        {
          contactPointType: 'DOMAIN',
          normalizedValue: 'northline.example'
        }
      ]
    })

    expect(registerTenantParty).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Northline Bathworks',
        legalName: 'Northline Bathworks'
      }),
      expect.anything()
    )
  })
})
