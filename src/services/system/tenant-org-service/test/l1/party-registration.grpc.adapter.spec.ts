import { of } from 'rxjs'
import { PartyRegistrationGrpcAdapter } from '../../src/infrastructure/adapters/party-registration.grpc.adapter'

// Verifies tenant-org maps onboarding party registration requests to the current party-service gRPC contract.
describe('PartyRegistrationGrpcAdapter', () => {
  it('sends organization legalName to party-service instead of the removed canonicalName field', async () => {
    const registerOrganizationParty = jest.fn().mockReturnValue(
      of({
        party: { id: 'party-1' },
        tenantParty: { id: 'tenant-party-1' }
      })
    )
    const adapter = new PartyRegistrationGrpcAdapter(
      {
        getService: jest.fn(() => ({ registerOrganizationParty }))
      } as any,
      {} as any,
      {} as any
    )
    adapter.onModuleInit()
    ;(adapter as any).buildMetadata = jest.fn(() => undefined)

    await expect(
      adapter.registerOrganizationParty({
        legalName: 'Beta Inc.',
        registeredCountry: 'US',
        identifiers: [
          {
            identifierType: 'EIN',
            rawValue: '12-3456789',
            normalizedValue: '123456789',
            issuerCountryOrRegion: 'US'
          }
        ],
        idempotencyKey: 'step-1'
      })
    ).resolves.toEqual({ partyId: 'party-1', tenantPartyId: 'tenant-party-1' })

    expect(registerOrganizationParty).toHaveBeenCalledWith(
      expect.objectContaining({
        legalName: 'Beta Inc.',
        localDisplayName: 'Beta Inc.',
        registeredCountry: 'US'
      }),
      undefined
    )
    expect(registerOrganizationParty.mock.calls[0][0]).not.toHaveProperty('canonicalName')
  })
})
