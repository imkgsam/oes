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
        registration: jest.fn(() => ({ registerTenantParty }))
      } as any,
      { createMetadata: jest.fn(async () => ({ trusted: true })) } as any,
      { getContext: jest.fn(() => ({ requestId: 'request-1', traceId: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01' })) } as any
    )
    adapter.onModuleInit()

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
        type: 'ORGANIZATION',
        legalName: 'Beta Inc.',
        displayName: 'Beta Inc.',
        registeredCountry: 'US'
      }),
      { trusted: true }
    )
    expect(registerTenantParty.mock.calls[0][0]).not.toHaveProperty('tenantId')
    expect(registerTenantParty.mock.calls[0][0]).not.toHaveProperty('canonicalName')
  })
})
