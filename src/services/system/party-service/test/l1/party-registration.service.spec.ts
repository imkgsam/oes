import { createHash } from 'crypto'
import { BadRequestException } from '@nestjs/common'
import { PartyRegistrationService } from '../../src/application/services/party-registration.service'
import { PartyType } from '../../src/domain/value-objects'

function createTenantPartyRepositoryMock() {
  return {
    findById: jest.fn(),
    findByTenantIdentifier: jest.fn(),
    findByTenantAndIdentifier: jest.fn(),
    create: jest.fn(),
    deactivate: jest.fn()
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
  it('registerTenantParty / when legal name is empty / should throw BadRequestException', async () => {
    const tenantPartyRepository = createTenantPartyRepositoryMock()

    const service = new PartyRegistrationService(
      tenantPartyRepository as never
    )

    await expect(
      service.registerTenantParty({
        tenantId: 'tenant-1',
        type: PartyType.ORGANIZATION,
        legalName: '   ',
        registeredCountry: 'CN',
        identifiers: []
      })
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('registerTenantParty / when same tenant already owns identifier / should reuse the tenant party', async () => {
    const tenantPartyRepository = createTenantPartyRepositoryMock()

    tenantPartyRepository.findByTenantAndIdentifier.mockResolvedValue({
      id: 'tp-1',
      tenantId: 'tenant-1',
      type: PartyType.ORGANIZATION,
      legalName: 'Existing Acme'
    })

    const service = new PartyRegistrationService(
      tenantPartyRepository as never
    )

    const result = await service.registerTenantParty({
        tenantId: 'tenant-1',
        type: PartyType.ORGANIZATION,
        legalName: 'ACME Corporation',
        identifiers: [
          {
            identifierType: 'BUSINESS_REG_NO',
            normalizedValue: 'US-ACME-001',
            rawValue: 'US-ACME-001',
            issuerCountryOrRegion: 'US'
          }
        ]
      })

    expect(result).toMatchObject({
      tenantParty: {
        id: 'tp-1',
        tenantId: 'tenant-1',
        type: PartyType.ORGANIZATION
      },
      matchResult: 'STRONG_MATCH_REUSED'
    })
    expect(tenantPartyRepository.create).not.toHaveBeenCalled()
  })

  it('registerTenantParty / when same identifier exists in another tenant / should create a separate tenant party', async () => {
    const tenantPartyRepository = createTenantPartyRepositoryMock()

    tenantPartyRepository.findByTenantAndIdentifier.mockResolvedValue(null)
    tenantPartyRepository.create.mockResolvedValue({
      id: 'tenant-party-1',
      tenantId: 'tenant-1',
      type: PartyType.ORGANIZATION,
      legalName: 'ACME Corporation',
      status: 'ACTIVE'
    })

    const service = new PartyRegistrationService(
      tenantPartyRepository as never
    )

    const result = await service.registerTenantParty({
      tenantId: 'tenant-1',
      type: PartyType.ORGANIZATION,
      legalName: 'ACME Corporation',
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

    expect(tenantPartyRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        type: PartyType.ORGANIZATION,
        legalName: 'ACME Corporation',
        contactPoints: []
      })
    )
    expect(result).toMatchObject({
      tenantParty: {
        id: 'tenant-party-1',
        tenantId: 'tenant-1',
        type: PartyType.ORGANIZATION
      },
      matchResult: 'CREATED'
    })
    expect(result.tenantParty).not.toHaveProperty('partyId')
  })

  it('registerTenantParty / when tenantId is omitted / should reject because tenant party is always tenant scoped', async () => {
    const tenantPartyRepository = createTenantPartyRepositoryMock()

    const service = new PartyRegistrationService(tenantPartyRepository as never)

    await expect(
      service.registerTenantParty({
        tenantId: '',
        type: PartyType.PERSON,
        legalName: 'Platform Operator',
        identifiers: []
      })
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(tenantPartyRepository.create).not.toHaveBeenCalled()
  })

  it('registerTenantParty / when idempotency key already completed / should return recorded tenant party without duplicate writes', async () => {
    const tenantPartyRepository = createTenantPartyRepositoryMock()
    const idempotencyRepository = createPartyRegistrationIdempotencyRepositoryMock()

    idempotencyRepository.findByKey.mockResolvedValue({
      idempotencyKey: 'tenant-onboarding-1:organization-party',
      requestHash: hashFingerprint({
        operation: 'REGISTER_TENANT_PARTY',
        fingerprintSource: {
          tenantId: 'tenant-1',
          type: PartyType.ORGANIZATION,
          legalName: 'ACME Corporation',
          registeredCountry: 'US',
          displayName: '',
          localCode: '',
          identifiers: [],
          contactPoints: []
        }
      }),
      operation: 'REGISTER_TENANT_PARTY',
      tenantParty: {
        id: 'tenant-party-1',
        tenantId: 'tenant-1',
        type: PartyType.ORGANIZATION,
        legalName: 'ACME Corporation',
        status: 'ACTIVE'
      },
      matchResult: 'CREATED'
    })

    const service = new PartyRegistrationService(
      tenantPartyRepository as never,
      idempotencyRepository as never
    )

    const result = await service.registerTenantParty({
      tenantId: 'tenant-1',
      type: PartyType.ORGANIZATION,
      legalName: 'ACME Corporation',
      registeredCountry: 'US',
      identifiers: [],
      idempotencyKey: 'tenant-onboarding-1:organization-party'
    })

    expect(result).toMatchObject({
      tenantParty: {
        id: 'tenant-party-1'
      },
      matchResult: 'CREATED'
    })
    expect(tenantPartyRepository.create).not.toHaveBeenCalled()
    expect(idempotencyRepository.saveCompleted).not.toHaveBeenCalled()
  })

  it('registerTenantParty / when contact points are supplied / should persist them with the created tenant party', async () => {
    const tenantPartyRepository = createTenantPartyRepositoryMock()

    tenantPartyRepository.findByTenantAndIdentifier.mockResolvedValue(null)
    tenantPartyRepository.create.mockResolvedValue({
      id: 'tenant-party-3',
      tenantId: 'tenant-1',
      type: PartyType.ORGANIZATION,
      legalName: 'Basin World Importers',
      status: 'ACTIVE'
    })

    const service = new PartyRegistrationService(tenantPartyRepository as never)

    await service.registerTenantParty({
      tenantId: 'tenant-1',
      type: PartyType.ORGANIZATION,
      legalName: 'Basin World Importers',
      identifiers: [],
      contactPoints: [
        {
          contactPointType: 'DOMAIN',
          normalizedValue: 'basin.example',
          rawValue: 'https://basin.example'
        }
      ]
    })

    expect(tenantPartyRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        contactPoints: [
          {
            contactPointType: 'DOMAIN',
            normalizedValue: 'basin.example',
            rawValue: 'https://basin.example'
          }
        ]
      })
    )
  })
})
