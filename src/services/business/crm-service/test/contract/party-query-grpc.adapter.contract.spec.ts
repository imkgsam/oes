import { of } from 'rxjs'
import {
  PARTY_QUERY_SERVICE_NAME,
  PARTY_REGISTRATION_SERVICE_NAME
} from '@oes/common/generated/party_service'
import { PartyQueryGrpcAdapter } from '../../src/infrastructure/adapters/party-query-grpc.adapter'

// Verifies the CRM-to-Party anti-corruption adapter sends a complete tenant-scoped registration payload.
describe('PartyQueryGrpcAdapter', () => {
  it('registerTenantParty / should send CRM legal name separately from display name', async () => {
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
        query: jest.fn(() => ({})),
        registration: jest.fn(() => ({ registerTenantParty }))
      } as never,
      {
        createMetadata: jest.fn(async () => ({}))
      } as never,
      {
        getContext: jest.fn(() => ({ requestId: 'request-1', traceId: 'trace-1' }))
      } as never
    )
    adapter.onModuleInit()

    await adapter.registerTenantParty({
      tenantId: 'tenant-1',
      typeHint: 'ORGANIZATION',
      legalName: 'Northline Bathworks Incorporated',
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
      profileItems: [
        {
          itemType: 'DOMAIN',
          normalizedValue: 'northline.example',
          rawValue: 'https://northline.example',
          role: 'PRIMARY'
        }
      ]
    })

    expect(registerTenantParty).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Northline Bathworks',
        legalName: 'Northline Bathworks Incorporated',
        profileItems: [
          expect.objectContaining({
            itemType: 'DOMAIN',
            normalizedValue: 'northline.example',
            rawValue: 'https://northline.example',
            role: 'PRIMARY',
            status: 'ASSERTED'
          })
        ]
      }),
      expect.anything()
    )
  })
})
