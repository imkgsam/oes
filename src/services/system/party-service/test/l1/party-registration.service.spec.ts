import { ConflictException, BadRequestException } from '@nestjs/common'
import { PartyRegistrationService } from '../../src/application/services/party-registration.service'
import {
  PARTY_IDENTIFIER_REPOSITORY,
  PARTY_REPOSITORY,
  TENANT_PARTY_REPOSITORY
} from '../../src/domain/repositories'
import { PartyType } from '../../src/domain/value-objects'

function createPartyRepositoryMock() {
  return {
    findById: jest.fn(),
    findByCanonicalName: jest.fn(),
    findByIdentifier: jest.fn(),
    createPersonParty: jest.fn(),
    createOrganizationParty: jest.fn(),
    markMerged: jest.fn()
  }
}

function createTenantPartyRepositoryMock() {
  return {
    findById: jest.fn(),
    findByTenantAndPartyId: jest.fn(),
    create: jest.fn(),
    deactivate: jest.fn()
  }
}

function createPartyIdentifierRepositoryMock() {
  return {
    createMany: jest.fn(),
    findStrongMatch: jest.fn()
  }
}

describe('PartyRegistrationService', () => {
  it('registerOrganizationParty / when canonical name is empty / should throw BadRequestException', async () => {
    const partyRepository = createPartyRepositoryMock()
    const tenantPartyRepository = createTenantPartyRepositoryMock()
    const identifierRepository = createPartyIdentifierRepositoryMock()

    const service = new PartyRegistrationService(
      partyRepository as never,
      tenantPartyRepository as never,
      identifierRepository as never
    )

    await expect(
      service.registerOrganizationParty({
        tenantId: 'tenant-1',
        canonicalName: '   ',
        registeredCountry: 'CN',
        identifiers: []
      })
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('bindExistingPartyToTenant / when tenant already bound same party / should throw ConflictException', async () => {
    const partyRepository = createPartyRepositoryMock()
    const tenantPartyRepository = createTenantPartyRepositoryMock()
    const identifierRepository = createPartyIdentifierRepositoryMock()

    tenantPartyRepository.findByTenantAndPartyId.mockResolvedValue({
      id: 'tp-1',
      tenantId: 'tenant-1',
      partyId: 'party-1'
    })

    const service = new PartyRegistrationService(
      partyRepository as never,
      tenantPartyRepository as never,
      identifierRepository as never
    )

    await expect(
      service.bindExistingPartyToTenant({
        tenantId: 'tenant-1',
        partyId: 'party-1'
      })
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('registerOrganizationParty / when identifier strong-match finds existing party / should not create duplicate canonical party', async () => {
    const partyRepository = createPartyRepositoryMock()
    const tenantPartyRepository = createTenantPartyRepositoryMock()
    const identifierRepository = createPartyIdentifierRepositoryMock()

    identifierRepository.findStrongMatch.mockResolvedValue({
      id: 'party-existing',
      type: PartyType.ORGANIZATION
    })
    tenantPartyRepository.findByTenantAndPartyId.mockResolvedValue(null)
    tenantPartyRepository.create.mockResolvedValue({
      id: 'tenant-party-1',
      tenantId: 'tenant-1',
      partyId: 'party-existing'
    })

    const service = new PartyRegistrationService(
      partyRepository as never,
      tenantPartyRepository as never,
      identifierRepository as never
    )

    await service.registerOrganizationParty({
      tenantId: 'tenant-1',
      canonicalName: 'ACME Corporation',
      registeredCountry: 'US',
      identifiers: [
        {
          identifierType: 'BUSINESS_REG_NO',
          normalizedValue: 'US-ACME-001',
          rawValue: 'US-ACME-001',
          issuerCountryOrRegion: 'US'
        }
      ]
    })

    expect(partyRepository.createOrganizationParty).not.toHaveBeenCalled()
    expect(tenantPartyRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        partyId: 'party-existing'
      })
    )
  })
})
