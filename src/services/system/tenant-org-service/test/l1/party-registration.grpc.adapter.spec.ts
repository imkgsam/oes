import { of } from 'rxjs'
import { PartyRegistrationGrpcAdapter } from '../../src/infrastructure/adapters/party-registration.grpc.adapter'

// Verifies tenant-org maps onboarding tenant party registration requests to the current party-service gRPC contract.
describe('PartyRegistrationGrpcAdapter', () => {
  it('sends tenant-scoped organization TenantParty registration to party-service', async () => {
    const registerTenantParty = jest.fn().mockReturnValue(
      of({
        tenantParty: { id: 'tenant-party-1' }
      })
    )
    const adapter = new PartyRegistrationGrpcAdapter(
      {
        getService: jest.fn(() => ({ registerTenantParty }))
      } as any,
      {} as any,
      {} as any
    )
    adapter.onModuleInit()
    ;(adapter as any).buildMetadata = jest.fn(() => undefined)

    await expect(
      adapter.registerOrganizationTenantParty({
        tenantId: 'tenant-1',
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
    ).resolves.toEqual({ tenantPartyId: 'tenant-party-1' })

    expect(registerTenantParty).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        type: 'ORGANIZATION',
        legalName: 'Beta Inc.',
        displayName: 'Beta Inc.',
        registeredCountry: 'US'
      }),
      undefined
    )
    expect(registerTenantParty.mock.calls[0][0]).not.toHaveProperty('canonicalName')
  })
})
