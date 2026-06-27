import { randomUUID } from 'node:crypto'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import {
  CrmActivityCreatedByType,
  CrmActivityDirection,
  CrmActivityType,
  CrmAccountLifecycleStage,
  CrmAccountRecordStatus,
  CrmAccountTypeHint,
  CrmActivityVisibility,
  CrmArchiveReason,
  CrmOpportunityStage,
  CrmOpportunityStatus,
  CrmPriority,
  CrmSourceType
} from '../../src/domain/models/crm-records'
import { PrismaCrmAccountRepository } from '../../src/infrastructure/repositories/prisma/prisma-crm-account.repository'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

describe('Prisma CRM P1 repositories L2', () => {
  let prisma: PrismaService
  let accountRepository: PrismaCrmAccountRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    accountRepository = new PrismaCrmAccountRepository(prisma)
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

  it('CrmAccount P1 / should persist one active lead with primary source under tenant isolation', async () => {
    const accountId = randomUUID()
    const sourceId = randomUUID()
    const newerSourceId = randomUUID()
    const olderSourceId = randomUUID()
    const tenantId = `${prefix}_tenant`

    await accountRepository.saveAccount({
      id: accountId,
      tenantId,
      tenantPartyId: null,
      recordStatus: CrmAccountRecordStatus.ACTIVE,
      lifecycleStage: CrmAccountLifecycleStage.LEAD,
      partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
      displayName: `${prefix} Basin Importers`,
      leadCompanyName: `${prefix} Basin Importers Ltd`,
      leadPersonName: null,
      leadDomain: `${prefix}.basin.example`,
      leadEmail: `sales@${prefix}.basin.example`,
      leadPhone: null,
      leadWhatsapp: null,
      leadCountry: 'US',
      leadIdentifiers: [
        {
          identifierType: 'VAT_NO',
          normalizedValue: `${prefix}-vat-001`,
          rawValue: `${prefix} VAT 001`,
          issuerCountryOrRegion: 'US'
        }
      ],
      ownerAccountId: `${prefix}_sales`,
      priority: CrmPriority.A,
      lastActivityAt: null,
      nextFollowUpAt: new Date('2026-06-20T08:00:00.000Z'),
      createdBy: `${prefix}_sales`
    })
    await accountRepository.addSourceRecord({
      id: sourceId,
      tenantId,
      crmAccountId: accountId,
      sourceType: CrmSourceType.EXHIBITION_SCAN,
      sourceName: 'KBIS 2026 booth scan',
      capturedAt: new Date('2026-06-14T09:00:00.000Z'),
      capturedByAccountId: `${prefix}_sales`,
      externalReference: `${prefix}-scan-001`,
      rawPayload: { badgeId: `${prefix}-B442` },
      note: 'Asked about ceramic basins',
      isPrimary: true
    })
    await accountRepository.addSourceRecord({
      id: newerSourceId,
      tenantId,
      crmAccountId: accountId,
      sourceType: CrmSourceType.WEB_RESEARCH,
      sourceName: 'Follow-up website research',
      capturedAt: new Date('2026-06-15T09:00:00.000Z'),
      capturedByAccountId: `${prefix}_sales`,
      externalReference: `${prefix}-research-001`,
      rawPayload: { url: `https://${prefix}.basin.example` },
      note: 'Newer non-primary evidence',
      isPrimary: false
    })
    await accountRepository.addSourceRecord({
      id: olderSourceId,
      tenantId,
      crmAccountId: accountId,
      sourceType: CrmSourceType.IMPORTED_LIST,
      sourceName: 'Legacy import',
      capturedAt: new Date('2026-06-13T09:00:00.000Z'),
      capturedByAccountId: `${prefix}_sales`,
      externalReference: `${prefix}-import-001`,
      rawPayload: { row: 12 },
      note: 'Older non-primary evidence',
      isPrimary: false
    })

    const found = await accountRepository.findAccountById(tenantId, accountId)
    const sources = await accountRepository.listSourceRecords(tenantId, accountId)
    const otherTenant = await accountRepository.findAccountById(`${prefix}_other_tenant`, accountId)

    expect(found).toEqual(
      expect.objectContaining({
        id: accountId,
        tenantId,
        recordStatus: CrmAccountRecordStatus.ACTIVE,
        lifecycleStage: CrmAccountLifecycleStage.LEAD,
        tenantPartyId: null,
        priority: CrmPriority.A
      })
    )
    expect(found?.leadIdentifiers).toEqual([
      {
        identifierType: 'VAT_NO',
        normalizedValue: `${prefix}-vat-001`,
        rawValue: `${prefix} VAT 001`,
        issuerCountryOrRegion: 'US'
      }
    ])
    expect(sources).toEqual([
      expect.objectContaining({
        id: sourceId,
        crmAccountId: accountId,
        sourceType: CrmSourceType.EXHIBITION_SCAN,
        isPrimary: true
      }),
      expect.objectContaining({
        id: newerSourceId,
        isPrimary: false
      }),
      expect.objectContaining({
        id: olderSourceId,
        isPrimary: false
      })
    ])
    expect(otherTenant).toBeNull()
  })

  it('CrmAccount P1 / should normalize legacy identifiers while explicit archived lists return only archived accounts', async () => {
    const activeAccountId = randomUUID()
    const archivedAccountId = randomUUID()
    const tenantId = `${prefix}_tenant`

    await prisma.getExecutionClient().crmAccount.create({
      data: {
        id: activeAccountId,
        tenantId,
        recordStatus: CrmAccountRecordStatus.ACTIVE,
        lifecycleStage: CrmAccountLifecycleStage.LEAD,
        partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
        displayName: `${prefix} Active Legacy Lead`,
        leadCompanyName: `${prefix} Active Legacy Lead Ltd`,
        leadCountry: 'US',
        leadIdentifiers: { legacyIdentifier: `${prefix}-legacy-active` },
        ownerAccountId: `${prefix}_sales`,
        priority: CrmPriority.C,
        createdBy: `${prefix}_sales`
      }
    })
    await prisma.getExecutionClient().crmAccount.create({
      data: {
        id: archivedAccountId,
        tenantId,
        recordStatus: CrmAccountRecordStatus.ARCHIVED,
        lifecycleStage: CrmAccountLifecycleStage.LEAD,
        partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
        displayName: `${prefix} Archived Legacy Lead`,
        leadCompanyName: `${prefix} Archived Legacy Lead Ltd`,
        leadCountry: 'US',
        leadIdentifiers: { legacyIdentifier: `${prefix}-legacy` },
        ownerAccountId: `${prefix}_sales`,
        priority: CrmPriority.C,
        createdBy: `${prefix}_sales`,
        archivedAt: new Date('2026-06-18T08:00:00.000Z')
      }
    })

    const listed = await accountRepository.listAccounts({
      tenantId,
      page: 1,
      pageSize: 20
    })

    expect(listed.items).toEqual([
      expect.objectContaining({
        id: activeAccountId,
        leadIdentifiers: []
      })
    ])
    expect(listed.items).not.toEqual([
      expect.objectContaining({
        id: archivedAccountId
      })
    ])

    const archivedFilter = await accountRepository.listAccounts({
      tenantId,
      recordStatus: CrmAccountRecordStatus.ARCHIVED,
      page: 1,
      pageSize: 20
    })

    expect(archivedFilter.items).toEqual([
      expect.objectContaining({
        id: archivedAccountId,
        leadIdentifiers: [],
        recordStatus: CrmAccountRecordStatus.ARCHIVED
      })
    ])
    expect(archivedFilter.items).not.toEqual([
      expect.objectContaining({
        id: activeAccountId
      })
    ])
  })

  it('CrmAccount P1 / should persist archive reason for archived Lead records', async () => {
    const accountId = randomUUID()
    const tenantId = `${prefix}_tenant`

    await accountRepository.saveAccount({
      id: accountId,
      tenantId,
      tenantPartyId: null,
      recordStatus: CrmAccountRecordStatus.ARCHIVED,
      lifecycleStage: CrmAccountLifecycleStage.LEAD,
      partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
      displayName: `${prefix} Archived Non Target Lead`,
      leadCompanyName: `${prefix} Kohler`,
      leadPersonName: null,
      leadDomain: `${prefix}.kohler.example`,
      leadEmail: null,
      leadPhone: null,
      leadWhatsapp: null,
      leadCountry: 'US',
      leadIdentifiers: [],
      ownerAccountId: `${prefix}_sales`,
      priority: CrmPriority.C,
      lastActivityAt: null,
      nextFollowUpAt: null,
      createdBy: `${prefix}_sales`,
      archivedAt: new Date('2026-06-23T08:00:00.000Z'),
      archiveReason: CrmArchiveReason.NON_TARGET_ACCOUNT
    })

    const found = await accountRepository.findAccountById(tenantId, accountId)

    expect(found).toEqual(
      expect.objectContaining({
        id: accountId,
        recordStatus: CrmAccountRecordStatus.ARCHIVED,
        archivedAt: new Date('2026-06-23T08:00:00.000Z'),
        archiveReason: CrmArchiveReason.NON_TARGET_ACCOUNT
      })
    )
  })

  it('CrmAccount P1 / should reject a second active formal account bound to the same tenant party', async () => {
    const tenantId = `${prefix}_tenant`
    const tenantPartyId = `${prefix}_tenant_party`

    await accountRepository.saveAccount({
      id: randomUUID(),
      tenantId,
      tenantPartyId,
      recordStatus: CrmAccountRecordStatus.ACTIVE,
      lifecycleStage: CrmAccountLifecycleStage.PROSPECT_CUSTOMER,
      partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
      displayName: `${prefix} Existing Customer`,
      leadCompanyName: `${prefix} Existing Customer Ltd`,
      leadPersonName: null,
      leadDomain: null,
      leadEmail: null,
      leadPhone: null,
      leadWhatsapp: null,
      leadCountry: 'US',
      leadIdentifiers: [],
      ownerAccountId: `${prefix}_owner_a`,
      priority: CrmPriority.B,
      lastActivityAt: null,
      nextFollowUpAt: null,
      createdBy: `${prefix}_owner_a`
    })

    await expect(
      accountRepository.saveAccount({
        id: randomUUID(),
        tenantId,
        tenantPartyId,
        recordStatus: CrmAccountRecordStatus.ACTIVE,
        lifecycleStage: CrmAccountLifecycleStage.PROSPECT_CUSTOMER,
        partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
        displayName: `${prefix} Duplicate Customer`,
        leadCompanyName: `${prefix} Duplicate Customer Ltd`,
        leadPersonName: null,
        leadDomain: null,
        leadEmail: null,
        leadPhone: null,
        leadWhatsapp: null,
        leadCountry: 'US',
        leadIdentifiers: [],
        ownerAccountId: `${prefix}_owner_b`,
        priority: CrmPriority.C,
        lastActivityAt: null,
        nextFollowUpAt: null,
        createdBy: `${prefix}_owner_b`
      })
    ).rejects.toThrow(/tenantPartyId is already bound/)
  })

  it('CrmAccount P1 / should persist contact activity and opportunity for one formal account', async () => {
    const tenantId = `${prefix}_tenant`
    const accountId = randomUUID()
    const contactId = randomUUID()
    const activityId = randomUUID()
    const opportunityId = randomUUID()

    await accountRepository.saveAccount({
      id: accountId,
      tenantId,
      tenantPartyId: `${prefix}_tenant_party`,
      recordStatus: CrmAccountRecordStatus.ACTIVE,
      lifecycleStage: CrmAccountLifecycleStage.PROSPECT_CUSTOMER,
      partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
      displayName: `${prefix} Formal Account`,
      leadCompanyName: `${prefix} Formal Account Ltd`,
      leadPersonName: null,
      leadDomain: `${prefix}.formal.example`,
      leadEmail: `sales@${prefix}.formal.example`,
      leadPhone: null,
      leadWhatsapp: null,
      leadCountry: 'US',
      leadIdentifiers: [],
      ownerAccountId: `${prefix}_sales`,
      priority: CrmPriority.A,
      lastActivityAt: null,
      nextFollowUpAt: null,
      createdBy: `${prefix}_sales`
    })

    await accountRepository.addContact({
      id: contactId,
      tenantId,
      crmAccountId: accountId,
      personTenantPartyId: null,
      name: `${prefix} Jane Buyer`,
      title: 'Purchasing Manager',
      department: 'Procurement',
      email: `jane@${prefix}.formal.example`,
      phone: '+1-555-0100',
      whatsapp: null,
      linkedin: null,
      isPrimary: true,
      note: 'Prefers email follow-up',
      createdBy: `${prefix}_sales`
    })
    await accountRepository.addActivity({
      id: activityId,
      tenantId,
      crmAccountId: accountId,
      opportunityId: null,
      contactId,
      activityType: CrmActivityType.EMAIL,
      direction: CrmActivityDirection.OUTBOUND,
      subject: 'Sent product catalogue',
      content: 'Shared basin catalogue after exhibition discussion.',
      occurredAt: new Date('2026-06-15T10:00:00.000Z'),
      createdByAccountId: `${prefix}_sales`,
      createdByType: CrmActivityCreatedByType.USER,
      externalProvider: null,
      externalReference: null,
      metadata: { channel: 'email' },
      visibility: CrmActivityVisibility.TEAM
    })
    await accountRepository.saveOpportunity({
      id: opportunityId,
      tenantId,
      crmAccountId: accountId,
      ownerAccountId: `${prefix}_sales`,
      name: `${prefix} Hotel basin project`,
      stage: CrmOpportunityStage.QUOTING,
      status: CrmOpportunityStatus.OPEN,
      estimatedAmount: '12500.50',
      currency: 'USD',
      expectedCloseDate: new Date('2026-08-01T00:00:00.000Z'),
      openedAt: new Date('2026-06-15T11:00:00.000Z'),
      closedAt: null,
      closeReason: null,
      closeNote: null,
      createdBy: `${prefix}_sales`
    })

    await expect(
      accountRepository.saveOpportunity({
        id: randomUUID(),
        tenantId,
        crmAccountId: randomUUID(),
        ownerAccountId: `${prefix}_sales`,
        name: `${prefix} Invalid detached opportunity`,
        stage: CrmOpportunityStage.NEW,
        status: CrmOpportunityStatus.OPEN,
        estimatedAmount: null,
        currency: 'USD',
        expectedCloseDate: null,
        openedAt: new Date('2026-06-15T11:00:00.000Z'),
        closedAt: null,
        closeReason: null,
        closeNote: null,
        createdBy: `${prefix}_sales`
      })
    ).rejects.toThrow(/formal CrmAccount/)

    const contacts = await accountRepository.listContacts(tenantId, accountId)
    const activities = await accountRepository.listActivities(tenantId, accountId)
    const opportunities = await accountRepository.listOpportunities(tenantId, accountId)

    expect(contacts).toEqual([
      expect.objectContaining({
        id: contactId,
        name: `${prefix} Jane Buyer`,
        isPrimary: true
      })
    ])
    expect(activities).toEqual([
      expect.objectContaining({
        id: activityId,
        activityType: CrmActivityType.EMAIL,
        contactId
      })
    ])
    expect(opportunities).toEqual([
      expect.objectContaining({
        id: opportunityId,
        stage: CrmOpportunityStage.QUOTING,
        status: CrmOpportunityStatus.OPEN,
        estimatedAmount: '12500.50'
      })
    ])
  })

  it('CrmAccount P1 / should find high-confidence duplicate candidates from lead evidence', async () => {
    const tenantId = `${prefix}_tenant`
    const accountId = randomUUID()

    await accountRepository.saveAccount({
      id: accountId,
      tenantId,
      tenantPartyId: null,
      recordStatus: CrmAccountRecordStatus.ACTIVE,
      lifecycleStage: CrmAccountLifecycleStage.LEAD,
      partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
      displayName: `${prefix} Duplicate Evidence`,
      leadCompanyName: `${prefix} Duplicate Evidence Ltd`,
      leadPersonName: null,
      leadDomain: `${prefix}.duplicate.example`,
      leadEmail: `buyer@${prefix}.duplicate.example`,
      leadPhone: '+1-555-0999',
      leadWhatsapp: null,
      leadCountry: 'US',
      leadIdentifiers: [
        {
          identifierType: 'VAT_NO',
          normalizedValue: `${prefix}-vat-duplicate`,
          rawValue: `${prefix} VAT DUP`,
          issuerCountryOrRegion: 'US'
        }
      ],
      ownerAccountId: null,
      priority: CrmPriority.B,
      lastActivityAt: null,
      nextFollowUpAt: null,
      createdBy: `${prefix}_sales`
    })

    const candidates = await accountRepository.findDuplicateCandidates({
      tenantId,
      leadEmail: `buyer@${prefix}.duplicate.example`,
      leadDomain: `${prefix}.duplicate.example`,
      leadIdentifiers: [
        {
          identifierType: 'VAT_NO',
          normalizedValue: `${prefix}-vat-duplicate`,
          issuerCountryOrRegion: 'US'
        }
      ]
    })

    expect(candidates).toEqual([
      expect.objectContaining({
        crmAccountId: accountId,
        displayName: `${prefix} Duplicate Evidence`,
        confidence: 'HIGH',
        matchedFields: expect.arrayContaining(['leadEmail', 'leadDomain', 'leadIdentifiers'])
      })
    ])
  })

  it('CrmAccount P1 / should find archived duplicate candidates for read-only CRM recognition', async () => {
    const tenantId = `${prefix}_tenant`
    const accountId = randomUUID()

    await accountRepository.saveAccount({
      id: accountId,
      tenantId,
      tenantPartyId: null,
      recordStatus: CrmAccountRecordStatus.ARCHIVED,
      lifecycleStage: CrmAccountLifecycleStage.LEAD,
      partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
      displayName: `${prefix} Kohler`,
      leadCompanyName: `${prefix} Kohler`,
      leadPersonName: null,
      leadDomain: `${prefix}.kohler.example`,
      leadEmail: null,
      leadPhone: null,
      leadWhatsapp: null,
      leadCountry: 'US',
      leadIdentifiers: [],
      ownerAccountId: `${prefix}_sales`,
      priority: CrmPriority.C,
      lastActivityAt: null,
      nextFollowUpAt: null,
      createdBy: `${prefix}_sales`,
      archivedAt: new Date('2026-06-23T08:00:00.000Z'),
      archiveReason: CrmArchiveReason.NON_TARGET_ACCOUNT
    })

    const candidates = await accountRepository.findDuplicateCandidates({
      tenantId,
      leadDomain: `${prefix}.kohler.example`
    })

    expect(candidates).toEqual([
      expect.objectContaining({
        crmAccountId: accountId,
        displayName: `${prefix} Kohler`,
        confidence: 'HIGH',
        matchedFields: ['leadDomain'],
        recordStatus: CrmAccountRecordStatus.ARCHIVED
      })
    ])
  })

  it('CrmAccount P1 / should canonicalize lead domain when saving CRM account records', async () => {
    const tenantId = `${prefix}_tenant`
    const accountId = randomUUID()

    await accountRepository.saveAccount({
      id: accountId,
      tenantId,
      tenantPartyId: null,
      recordStatus: CrmAccountRecordStatus.ACTIVE,
      lifecycleStage: CrmAccountLifecycleStage.LEAD,
      partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
      displayName: `${prefix} Canonical Save Domain`,
      leadCompanyName: null,
      leadPersonName: null,
      leadDomain: 'https://www.vintagetub.com/products?id=1',
      leadEmail: null,
      leadPhone: null,
      leadWhatsapp: null,
      leadCountry: 'US',
      leadIdentifiers: [],
      ownerAccountId: null,
      priority: CrmPriority.B,
      lastActivityAt: null,
      nextFollowUpAt: null,
      createdBy: `${prefix}_sales`
    })

    const found = await accountRepository.findAccountById(tenantId, accountId)

    expect(found?.leadDomain).toBe('vintagetub.com')
  })

  it('CrmAccount P1 / should match canonical lead domains against historical www lead domains', async () => {
    const tenantId = `${prefix}_tenant`
    const wwwAccountId = randomUUID()
    const canonicalAccountId = randomUUID()

    await accountRepository.saveAccount({
      id: wwwAccountId,
      tenantId,
      tenantPartyId: null,
      recordStatus: CrmAccountRecordStatus.ACTIVE,
      lifecycleStage: CrmAccountLifecycleStage.LEAD,
      partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
      displayName: `${prefix} Historical Www Domain`,
      leadCompanyName: null,
      leadPersonName: null,
      leadDomain: 'www.vintagetub.com',
      leadEmail: null,
      leadPhone: null,
      leadWhatsapp: null,
      leadCountry: 'US',
      leadIdentifiers: [],
      ownerAccountId: null,
      priority: CrmPriority.B,
      lastActivityAt: null,
      nextFollowUpAt: null,
      createdBy: `${prefix}_sales`
    })
    await accountRepository.saveAccount({
      id: canonicalAccountId,
      tenantId,
      tenantPartyId: null,
      recordStatus: CrmAccountRecordStatus.ACTIVE,
      lifecycleStage: CrmAccountLifecycleStage.LEAD,
      partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
      displayName: `${prefix} Canonical Domain`,
      leadCompanyName: null,
      leadPersonName: null,
      leadDomain: 'vintagetub.com',
      leadEmail: null,
      leadPhone: null,
      leadWhatsapp: null,
      leadCountry: 'US',
      leadIdentifiers: [],
      ownerAccountId: null,
      priority: CrmPriority.B,
      lastActivityAt: null,
      nextFollowUpAt: null,
      createdBy: `${prefix}_sales`
    })

    const canonicalInputCandidates = await accountRepository.findDuplicateCandidates({
      tenantId,
      leadDomain: 'vintagetub.com'
    })
    const wwwInputCandidates = await accountRepository.findDuplicateCandidates({
      tenantId,
      leadDomain: 'www.vintagetub.com'
    })

    expect(canonicalInputCandidates.map((candidate) => candidate.crmAccountId)).toEqual(
      expect.arrayContaining([wwwAccountId, canonicalAccountId])
    )
    expect(wwwInputCandidates.map((candidate) => candidate.crmAccountId)).toEqual(
      expect.arrayContaining([wwwAccountId, canonicalAccountId])
    )
  })

  it('CrmAccount P1 / should list tenant accounts by lifecycle and status filters', async () => {
    const tenantId = `${prefix}_tenant`
    const leadId = randomUUID()
    const prospectId = randomUUID()

    await accountRepository.saveAccount({
      id: leadId,
      tenantId,
      tenantPartyId: null,
      recordStatus: CrmAccountRecordStatus.ACTIVE,
      lifecycleStage: CrmAccountLifecycleStage.LEAD,
      partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
      displayName: `${prefix} Lead Account`,
      leadCompanyName: `${prefix} Lead Account Ltd`,
      leadPersonName: null,
      leadDomain: `${prefix}.lead.example`,
      leadEmail: null,
      leadPhone: null,
      leadWhatsapp: null,
      leadCountry: 'US',
      leadIdentifiers: [],
      ownerAccountId: `${prefix}_sales`,
      priority: CrmPriority.A,
      lastActivityAt: null,
      nextFollowUpAt: null,
      createdBy: `${prefix}_sales`
    })
    await accountRepository.saveAccount({
      id: prospectId,
      tenantId,
      tenantPartyId: `${prefix}_party`,
      recordStatus: CrmAccountRecordStatus.ACTIVE,
      lifecycleStage: CrmAccountLifecycleStage.PROSPECT_CUSTOMER,
      partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
      displayName: `${prefix} Prospect Account`,
      leadCompanyName: `${prefix} Prospect Account Ltd`,
      leadPersonName: null,
      leadDomain: `${prefix}.prospect.example`,
      leadEmail: null,
      leadPhone: null,
      leadWhatsapp: null,
      leadCountry: 'US',
      leadIdentifiers: [],
      ownerAccountId: `${prefix}_sales`,
      priority: CrmPriority.B,
      lastActivityAt: null,
      nextFollowUpAt: null,
      createdBy: `${prefix}_sales`
    })

    const result = await accountRepository.listAccounts({
      tenantId,
      lifecycleStage: CrmAccountLifecycleStage.LEAD,
      recordStatus: CrmAccountRecordStatus.ACTIVE,
      page: 1,
      pageSize: 20
    })

    expect(result).toEqual({
      items: [
        expect.objectContaining({
          id: leadId,
          displayName: `${prefix} Lead Account`,
          lifecycleStage: CrmAccountLifecycleStage.LEAD
        })
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
  })
})
