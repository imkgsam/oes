import { createHash } from 'crypto'
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

function createPartyRegistrationIdempotencyRepositoryMock() {
  return {
    findByKey: jest.fn(),
    saveCompleted: jest.fn()
  }
}

function hashFingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
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

  it('registerPersonParty / when tenantId is omitted / should create only the canonical person party', async () => {
    const partyRepository = createPartyRepositoryMock()
    const tenantPartyRepository = createTenantPartyRepositoryMock()
    const identifierRepository = createPartyIdentifierRepositoryMock()

    identifierRepository.findStrongMatch.mockResolvedValue(null)
    partyRepository.createPersonParty.mockResolvedValue({
      id: 'party-person-1',
      type: PartyType.PERSON,
      canonicalName: 'Platform Operator',
      displayName: 'Platform Operator',
      status: 'ACTIVE'
    })

    const service = new PartyRegistrationService(
      partyRepository as never,
      tenantPartyRepository as never,
      identifierRepository as never
    )

    const result = await service.registerPersonParty({
      tenantId: '',
      canonicalName: 'Platform Operator',
      identifiers: []
    })

    expect(result).toMatchObject({
      party: {
        id: 'party-person-1'
      }
    })
    expect(result.tenantParty).toBeUndefined()

    expect(tenantPartyRepository.create).not.toHaveBeenCalled()
  })

  it('registerOrganizationParty / when idempotency key already completed / should return the recorded result without duplicate writes', async () => {
    const partyRepository = createPartyRepositoryMock()
    const tenantPartyRepository = createTenantPartyRepositoryMock()
    const identifierRepository = createPartyIdentifierRepositoryMock()
    const idempotencyRepository = createPartyRegistrationIdempotencyRepositoryMock()

    idempotencyRepository.findByKey.mockResolvedValue({
      idempotencyKey: 'tenant-onboarding-1:organization-party',
      requestHash: hashFingerprint({
        operation: 'REGISTER_ORGANIZATION_PARTY',
        fingerprintSource: {
          tenantId: 'tenant-1',
          canonicalName: 'ACME Corporation',
          registeredCountry: 'US',
          localDisplayName: '',
          localCode: '',
          identifiers: []
        }
      }),
      operation: 'REGISTER_ORGANIZATION_PARTY',
      party: {
        id: 'party-1',
        type: PartyType.ORGANIZATION,
        canonicalName: 'ACME Corporation',
        displayName: 'ACME Corporation',
        status: 'ACTIVE'
      },
      tenantParty: {
        id: 'tenant-party-1',
        tenantId: 'tenant-1',
        partyId: 'party-1',
        status: 'ACTIVE'
      },
      matchResult: 'CREATED'
    })

    const service = new PartyRegistrationService(
      partyRepository as never,
      tenantPartyRepository as never,
      identifierRepository as never,
      idempotencyRepository as never
    )

    const result = await service.registerOrganizationParty({
      tenantId: 'tenant-1',
      canonicalName: 'ACME Corporation',
      registeredCountry: 'US',
      identifiers: [],
      idempotencyKey: 'tenant-onboarding-1:organization-party'
    } as never)

    expect(result).toMatchObject({
      party: {
        id: 'party-1'
      },
      tenantParty: {
        id: 'tenant-party-1'
      },
      matchResult: 'CREATED'
    })
    expect(partyRepository.createOrganizationParty).not.toHaveBeenCalled()
    expect(tenantPartyRepository.create).not.toHaveBeenCalled()
    expect(idempotencyRepository.saveCompleted).not.toHaveBeenCalled()
  })
})
