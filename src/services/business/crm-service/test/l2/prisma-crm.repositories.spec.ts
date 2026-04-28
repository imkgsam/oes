import { randomUUID } from 'node:crypto'
import { PrismaCustomerAccountRepository } from '../../src/infrastructure/repositories/prisma/prisma-customer-account.repository'
import { PrismaCustomerContactRepository } from '../../src/infrastructure/repositories/prisma/prisma-customer-contact.repository'
import { PrismaCustomerAddressRepository } from '../../src/infrastructure/repositories/prisma/prisma-customer-address.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import {
  CustomerAccountRecord,
  CustomerAddressRecord,
  CustomerContactRecord,
  CustomerPartyBindingStatus,
  CustomerStatus
} from '../../src/domain/models/crm-records'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

/** buildCustomerAccountRecord creates one tenant-scoped CRM account aggregate for Prisma round-trip tests. */
function buildCustomerAccountRecord(input: {
  tenantId: string
  customerAccountNo: string
  displayName: string
  status?: CustomerStatus
  tenantPartyId?: string
}): CustomerAccountRecord {
  return {
    id: randomUUID(),
    customerAccountNo: input.customerAccountNo,
    tenantId: input.tenantId,
    displayName: input.displayName,
    status: input.status ?? CustomerStatus.ACTIVE_CUSTOMER,
    customerCategory: 'EXPORT',
    tags: [`${input.tenantId}-tag`],
    primaryBinding: input.tenantPartyId
      ? {
          customerPartyBindingId: randomUUID(),
          customerAccountId: '',
          tenantId: input.tenantId,
          tenantPartyId: input.tenantPartyId,
          bindingStatus: CustomerPartyBindingStatus.ACTIVE_PRIMARY,
          partyDisplayName: `${input.displayName} Party`
        }
      : null
  }
}

/** buildCustomerContactRecord creates one CRM business-contact record for repository tests. */
function buildCustomerContactRecord(tenantId: string, customerAccountId: string): CustomerContactRecord {
  return {
    customerContactId: randomUUID(),
    tenantId,
    customerAccountId,
    displayName: `${tenantId} Alice`,
    roleTitle: 'Procurement Manager',
    email: `${tenantId}@example.com`,
    phone: '+86-21-1000-0000',
    isPrimaryContact: true,
    isActive: true
  }
}

/** buildCustomerAddressRecord creates one CRM business-address record for repository tests. */
function buildCustomerAddressRecord(tenantId: string, customerAccountId: string): CustomerAddressRecord {
  return {
    customerAddressId: randomUUID(),
    tenantId,
    customerAccountId,
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

/** parseCustomerAccountNoValue converts one CA-#### summary into its numeric sequence value for repository assertions. */
function parseCustomerAccountNoValue(customerAccountNo: string): number {
  const match = customerAccountNo.match(/^CA-(\d+)$/)
  if (!match) {
    throw new Error(`Unexpected customerAccountNo format: ${customerAccountNo}`)
  }

  return Number(match[1])
}

/** formatCustomerAccountNo renders one numeric sequence value into the frozen CA-#### summary shape. */
function formatCustomerAccountNo(value: number): string {
  return `CA-${String(value).padStart(4, '0')}`
}

describe('Prisma CRM repositories L2', () => {
  let prisma: PrismaService
  let accountRepository: PrismaCustomerAccountRepository
  let contactRepository: PrismaCustomerContactRepository
  let addressRepository: PrismaCustomerAddressRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    accountRepository = new PrismaCustomerAccountRepository(prisma)
    contactRepository = new PrismaCustomerContactRepository(prisma)
    addressRepository = new PrismaCustomerAddressRepository(prisma)
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

  it('customer account repository / should persist bindings and enforce selectable-customer filters in query reads', async () => {
    const tenantId = `${prefix}_tenant`
    const firstNumber = await accountRepository.nextCustomerAccountNo(tenantId)
    const secondNumber = await accountRepository.nextCustomerAccountNo(tenantId)
    const thirdNumber = await accountRepository.nextCustomerAccountNo(tenantId)
    const active = buildCustomerAccountRecord({
      tenantId,
      customerAccountNo: firstNumber,
      displayName: `${prefix} Active`,
      tenantPartyId: `${prefix}_party_1`
    })
    active.primaryBinding!.customerAccountId = active.id

    const blocked = buildCustomerAccountRecord({
      tenantId,
      customerAccountNo: secondNumber,
      displayName: `${prefix} Blocked`,
      status: CustomerStatus.BLOCKED,
      tenantPartyId: `${prefix}_party_2`
    })
    blocked.primaryBinding!.customerAccountId = blocked.id

    const unbound = buildCustomerAccountRecord({
      tenantId,
      customerAccountNo: thirdNumber,
      displayName: `${prefix} Unbound`
    })

    expect(parseCustomerAccountNoValue(secondNumber)).toBe(parseCustomerAccountNoValue(firstNumber) + 1)
    expect(parseCustomerAccountNoValue(thirdNumber)).toBe(parseCustomerAccountNoValue(secondNumber) + 1)

    await accountRepository.save(active)
    await accountRepository.save(blocked)
    await accountRepository.save(unbound)

    const found = await accountRepository.findById(tenantId, active.id)
    const selectable = await accountRepository.searchSelectable({
      tenantId,
      keyword: prefix,
      page: 1,
      pageSize: 20
    })
    const search = await accountRepository.search({
      tenantId,
      primaryTenantPartyId: `${prefix}_party_1`,
      page: 1,
      pageSize: 20
    })

    expect(found).toEqual(active)
    expect(selectable.total).toBe(1)
    expect(selectable.items.map((item) => item.customerAccountId)).toEqual([active.id])
    expect(search.items).toEqual([active])
  })

  it('customer account repository / should reject duplicate tenant-party bindings inside one tenant at the database boundary', async () => {
    const tenantId = `${prefix}_tenant`
    const tenantPartyId = `${prefix}_party_1`
    const first = buildCustomerAccountRecord({
      tenantId,
      customerAccountNo: 'CA-0010',
      displayName: `${prefix} First`,
      tenantPartyId
    })
    first.primaryBinding!.customerAccountId = first.id

    const second = buildCustomerAccountRecord({
      tenantId,
      customerAccountNo: 'CA-0011',
      displayName: `${prefix} Second`,
      tenantPartyId
    })
    second.primaryBinding!.customerAccountId = second.id

    await accountRepository.save(first)

    await expect(accountRepository.save(second)).rejects.toMatchObject({
      definition: {
        code: 'CRM_004'
      }
    })
  })

  it('customer account repository / should calibrate the next number from the highest persisted customerAccountNo when counters are behind', async () => {
    const tenantId = `${prefix}_tenant`
    const externalTenantId = `${prefix}_external_tenant`
    const currentNumber = await accountRepository.nextCustomerAccountNo(tenantId)
    const seededValue = parseCustomerAccountNoValue(currentNumber) + 1000
    const seeded = buildCustomerAccountRecord({
      tenantId,
      customerAccountNo: formatCustomerAccountNo(seededValue),
      displayName: `${prefix} Seeded High Number`
    })

    await accountRepository.save(seeded)

    const nextCustomerAccountNo = await accountRepository.nextCustomerAccountNo(externalTenantId)

    expect(nextCustomerAccountNo).toBe(formatCustomerAccountNo(seededValue + 1))
  })

  it('customer account repository / should translate duplicate customerAccountNo writes into CRM_ALREADY_EXISTS instead of leaking Prisma P2002', async () => {
    const first = buildCustomerAccountRecord({
      tenantId: `${prefix}_tenant_first`,
      customerAccountNo: 'CA-1999999999',
      displayName: `${prefix} First Duplicate`
    })
    const second = buildCustomerAccountRecord({
      tenantId: `${prefix}_tenant_second`,
      customerAccountNo: 'CA-1999999999',
      displayName: `${prefix} Second Duplicate`
    })

    await accountRepository.save(first)

    await expect(accountRepository.save(second)).rejects.toMatchObject({
      definition: {
        code: 'CRM_004'
      }
    })
  })

  it('customer contact and address repositories / should upsert CRM relationship records under the owning account', async () => {
    const tenantId = `${prefix}_tenant`
    const account = buildCustomerAccountRecord({
      tenantId,
      customerAccountNo: 'CA-0007',
      displayName: `${prefix} Contact Account`
    })
    await accountRepository.save(account)

    const contact = buildCustomerContactRecord(tenantId, account.id)
    const address = buildCustomerAddressRecord(tenantId, account.id)

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

    const contacts = await contactRepository.listByCustomerAccountId(tenantId, account.id)
    const addresses = await addressRepository.listByCustomerAccountId(tenantId, account.id)

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
})
