import { randomUUID } from 'node:crypto'
import { PrismaSupplierOfferingRepository } from '../../src/infrastructure/repositories/prisma/prisma-supplier-offering.repository'
import { PrismaSupplierProfileRepository } from '../../src/infrastructure/repositories/prisma/prisma-supplier-profile.repository'
import { PrismaSupplierContactRepository } from '../../src/infrastructure/repositories/prisma/prisma-supplier-contact.repository'
import { PrismaSupplierAddressRepository } from '../../src/infrastructure/repositories/prisma/prisma-supplier-address.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import {
  SupplierOfferingRecord,
  SupplierOfferingStatus,
  SupplierProfileRecord,
  SupplierAddressRecord,
  SupplierContactRecord,
  SupplierPartyBindingStatus,
  SupplierStatus
} from '../../src/domain/models/srm-records'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

/** buildSupplierProfileRecord creates one tenant-scoped SRM supplier profile aggregate for Prisma round-trip tests. */
function buildSupplierProfileRecord(input: {
  tenantId: string
  supplierNo: string
  displayName: string
  status?: SupplierStatus
  tenantPartyId?: string
}): SupplierProfileRecord {
  return {
    id: randomUUID(),
    supplierNo: input.supplierNo,
    tenantId: input.tenantId,
    displayName: input.displayName,
    status: input.status ?? SupplierStatus.ACTIVE,
    supplierCategory: 'EXPORT',
    tags: [`${input.tenantId}-tag`],
    partyBinding: input.tenantPartyId
      ? {
          supplierPartyBindingId: randomUUID(),
          supplierId: '',
          tenantId: input.tenantId,
          tenantPartyId: input.tenantPartyId,
          bindingStatus: SupplierPartyBindingStatus.ACTIVE,
          partyDisplayName: `${input.displayName} Party`
        }
      : null
  }
}

/** buildSupplierContactRecord creates one SRM business-contact record for repository tests. */
function buildSupplierContactRecord(tenantId: string, supplierId: string): SupplierContactRecord {
  return {
    supplierContactId: randomUUID(),
    tenantId,
    supplierId,
    displayName: `${tenantId} Alice`,
    roleTitle: 'Procurement Manager',
    email: `${tenantId}@example.com`,
    phone: '+86-21-1000-0000',
    isPrimaryContact: true,
    isActive: true
  }
}

/** buildSupplierAddressRecord creates one SRM business-address record for repository tests. */
function buildSupplierAddressRecord(tenantId: string, supplierId: string): SupplierAddressRecord {
  return {
    supplierAddressId: randomUUID(),
    tenantId,
    supplierId,
    label: 'HQ',
    countryCode: 'CN',
    region: 'Shanghai',
    locality: 'Pudong',
    addressLine1: '88 Century Ave',
    addressLine2: 'Tower A',
    postalCode: '200120',
    isPrimaryAddress: true,
    isActive: true
  }
}

/** buildSupplierOfferingRecord creates one tenant-scoped supplier-item supplyability fact for Prisma round-trip tests. */
function buildSupplierOfferingRecord(tenantId: string, supplierId: string, itemId: string): SupplierOfferingRecord {
  return {
    supplierOfferingId: randomUUID(),
    tenantId,
    supplierId,
    itemId,
    itemCode: 'RM-001',
    itemName: 'Raw Material',
    status: SupplierOfferingStatus.ACTIVE
  }
}

/** parseSupplierProfileNoValue converts one CA-#### summary into its numeric sequence value for repository assertions. */
function parseSupplierProfileNoValue(supplierNo: string): number {
  const match = supplierNo.match(/^CA-(\d+)$/)
  if (!match) {
    throw new Error(`Unexpected supplierNo format: ${supplierNo}`)
  }

  return Number(match[1])
}

/** formatSupplierProfileNo renders one numeric sequence value into the frozen CA-#### summary shape. */
function formatSupplierProfileNo(value: number): string {
  return `CA-${String(value).padStart(4, '0')}`
}

describe('Prisma SRM repositories L2', () => {
  let prisma: PrismaService
  let profileRepository: PrismaSupplierProfileRepository
  let contactRepository: PrismaSupplierContactRepository
  let addressRepository: PrismaSupplierAddressRepository
  let offeringRepository: PrismaSupplierOfferingRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    profileRepository = new PrismaSupplierProfileRepository(prisma)
    contactRepository = new PrismaSupplierContactRepository(prisma)
    addressRepository = new PrismaSupplierAddressRepository(prisma)
    offeringRepository = new PrismaSupplierOfferingRepository(prisma)
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
    await cleanupByPrefix(prisma, prefix)
  })

  afterEach(async () => {
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it('supplier profile repository / should persist bindings and enforce supplier-directory filters in query reads', async () => {
    const tenantId = `${prefix}_tenant`
    const firstNumber = await profileRepository.nextSupplierProfileNo(tenantId)
    const secondNumber = await profileRepository.nextSupplierProfileNo(tenantId)
    const thirdNumber = await profileRepository.nextSupplierProfileNo(tenantId)
    const active = buildSupplierProfileRecord({
      tenantId,
      supplierNo: firstNumber,
      displayName: `${prefix} Active`,
      tenantPartyId: `${prefix}_party_1`
    })
    active.partyBinding!.supplierId = active.id

    const blocked = buildSupplierProfileRecord({
      tenantId,
      supplierNo: secondNumber,
      displayName: `${prefix} Blocked`,
      status: SupplierStatus.INACTIVE,
      tenantPartyId: `${prefix}_party_2`
    })
    blocked.partyBinding!.supplierId = blocked.id

    const unbound = buildSupplierProfileRecord({
      tenantId,
      supplierNo: thirdNumber,
      displayName: `${prefix} Unbound`,
      status: SupplierStatus.INACTIVE
    })

    expect(parseSupplierProfileNoValue(secondNumber)).toBe(parseSupplierProfileNoValue(firstNumber) + 1)
    expect(parseSupplierProfileNoValue(thirdNumber)).toBe(parseSupplierProfileNoValue(secondNumber) + 1)

    await profileRepository.save(active)
    await profileRepository.save(blocked)
    await profileRepository.save(unbound)

    const found = await profileRepository.findById(tenantId, active.id)
    const search = await profileRepository.search({
      tenantId,
      keyword: prefix,
      status: SupplierStatus.ACTIVE,
      page: 1,
      pageSize: 20
    })
    const filteredByParty = await profileRepository.search({
      tenantId,
      tenantPartyId: `${prefix}_party_1`,
      page: 1,
      pageSize: 20
    })

    expect(found).toEqual(active)
    expect(search.total).toBe(1)
    expect(search.items).toEqual([active])
    expect(filteredByParty.items).toEqual([active])
  })

  it('supplier profile repository / should reject duplicate tenant-party bindings inside one tenant at the database boundary', async () => {
    const tenantId = `${prefix}_tenant`
    const tenantPartyId = `${prefix}_party_1`
    const first = buildSupplierProfileRecord({
      tenantId,
      supplierNo: 'CA-0010',
      displayName: `${prefix} First`,
      tenantPartyId
    })
    first.partyBinding!.supplierId = first.id

    const second = buildSupplierProfileRecord({
      tenantId,
      supplierNo: 'CA-0011',
      displayName: `${prefix} Second`,
      tenantPartyId
    })
    second.partyBinding!.supplierId = second.id

    await profileRepository.save(first)

    await expect(profileRepository.save(second)).rejects.toMatchObject({
      definition: {
        code: 'SRM_004'
      }
    })
  })

  it('supplier profile repository / should calibrate the next number from the highest persisted supplierNo when counters are behind', async () => {
    const tenantId = `${prefix}_tenant`
    const externalTenantId = `${prefix}_external_tenant`
    const currentNumber = await profileRepository.nextSupplierProfileNo(tenantId)
    const seededValue = parseSupplierProfileNoValue(currentNumber) + 1000
    const seeded = buildSupplierProfileRecord({
      tenantId,
      supplierNo: formatSupplierProfileNo(seededValue),
      displayName: `${prefix} Seeded High Number`
    })

    await profileRepository.save(seeded)

    const nextSupplierProfileNo = await profileRepository.nextSupplierProfileNo(externalTenantId)

    expect(nextSupplierProfileNo).toBe(formatSupplierProfileNo(seededValue + 1))
  })

  it('supplier profile repository / should translate duplicate supplierNo writes into SRM_ALREADY_EXISTS instead of leaking Prisma P2002', async () => {
    const first = buildSupplierProfileRecord({
      tenantId: `${prefix}_tenant_first`,
      supplierNo: 'CA-1999999999',
      displayName: `${prefix} First Duplicate`
    })
    const second = buildSupplierProfileRecord({
      tenantId: `${prefix}_tenant_second`,
      supplierNo: 'CA-1999999999',
      displayName: `${prefix} Second Duplicate`
    })

    await profileRepository.save(first)

    await expect(profileRepository.save(second)).rejects.toMatchObject({
      definition: {
        code: 'SRM_004'
      }
    })
  })

  it('supplier contact and address repositories / should upsert SRM relationship records under the owning supplier', async () => {
    const tenantId = `${prefix}_tenant`
    const profile = buildSupplierProfileRecord({
      tenantId,
      supplierNo: 'CA-0007',
      displayName: `${prefix} Contact Supplier`
    })
    await profileRepository.save(profile)

    const contact = buildSupplierContactRecord(tenantId, profile.id)
    const address = buildSupplierAddressRecord(tenantId, profile.id)

    await contactRepository.save(contact)
    await addressRepository.save(address)

    await contactRepository.save({
      ...contact,
      displayName: `${tenantId} Alice Updated`,
      roleTitle: 'VP Procurement',
      isPrimaryContact: false
    })
    await addressRepository.save({
      ...address,
      label: 'Regional HQ',
      locality: 'Minhang',
      isPrimaryAddress: false
    })

    const contacts = await contactRepository.listBySupplierProfileId(tenantId, profile.id)
    const addresses = await addressRepository.listBySupplierProfileId(tenantId, profile.id)

    expect(contacts).toEqual([
      {
        ...contact,
        displayName: `${tenantId} Alice Updated`,
        roleTitle: 'VP Procurement',
        isPrimaryContact: false
      }
    ])
    expect(addresses).toEqual([
      {
        ...address,
        label: 'Regional HQ',
        locality: 'Minhang',
        isPrimaryAddress: false
      }
    ])
  })

  it('supplier offering repository / should persist one supplierId + itemId fact and list it from both supplier and item read paths', async () => {
    const tenantId = `${prefix}_tenant`
    const profile = buildSupplierProfileRecord({
      tenantId,
      supplierNo: 'CA-0020',
      displayName: `${prefix} Offering Supplier`
    })
    await profileRepository.save(profile)

    const itemId = randomUUID()
    const createdOffering = buildSupplierOfferingRecord(tenantId, profile.id, itemId)
    await offeringRepository.save(createdOffering)
    await offeringRepository.save({
      ...createdOffering,
      itemName: 'Raw Material Updated',
      status: SupplierOfferingStatus.INACTIVE
    })

    const found = await offeringRepository.findById(tenantId, createdOffering.supplierOfferingId)
    const bySupplier = await offeringRepository.listBySupplierId(tenantId, profile.id, undefined, 1, 20)
    const byItem = await offeringRepository.listByItemId(tenantId, itemId, undefined, 1, 20)

    expect(found).toEqual({
      ...createdOffering,
      itemName: 'Raw Material Updated',
      status: SupplierOfferingStatus.INACTIVE
    })
    expect(bySupplier.items).toEqual([found])
    expect(byItem.items).toEqual([found])
  })
})
