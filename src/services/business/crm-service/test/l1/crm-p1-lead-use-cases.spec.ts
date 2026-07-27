import { randomUUID } from 'node:crypto'
import { ArchiveCrmAccountCommand } from '../../src/application/commands/archive-crm-account.command'
import { ArchiveCrmAccountHandler } from '../../src/application/commands/archive-crm-account.handler'
import { ClaimCrmAccountCommand } from '../../src/application/commands/claim-crm-account.command'
import { ClaimCrmAccountHandler } from '../../src/application/commands/claim-crm-account.handler'
import { CreateDraftLeadCommand } from '../../src/application/commands/create-draft-lead.command'
import { CreateDraftLeadHandler } from '../../src/application/commands/create-draft-lead.handler'
import { CreateLeadCommand } from '../../src/application/commands/create-lead.command'
import { CreateLeadHandler } from '../../src/application/commands/create-lead.handler'
import { DeleteDraftLeadCommand } from '../../src/application/commands/delete-draft-lead.command'
import { DeleteDraftLeadHandler } from '../../src/application/commands/delete-draft-lead.handler'
import { ReleaseCrmAccountCommand } from '../../src/application/commands/release-crm-account.command'
import { ReleaseCrmAccountHandler } from '../../src/application/commands/release-crm-account.handler'
import { SubmitDraftLeadCommand } from '../../src/application/commands/submit-draft-lead.command'
import { SubmitDraftLeadHandler } from '../../src/application/commands/submit-draft-lead.handler'
import { UpdateCrmAccountIdentifiersCommand } from '../../src/application/commands/update-crm-account-identifiers.command'
import { UpdateCrmAccountIdentifiersHandler } from '../../src/application/commands/update-crm-account-identifiers.handler'
import { CheckLeadDuplicateHandler } from '../../src/application/queries/check-lead-duplicate.handler'
import { CheckLeadDuplicateQuery } from '../../src/application/queries/check-lead-duplicate.query'
import {
  CrmAccountLifecycleStage,
  CrmAccountProfileItemRecord,
  CrmAccountProfileItemStatus,
  CrmAccountProfileItemType,
  CrmAccountRecord,
  CrmAccountRecordStatus,
  CrmAccountTypeHint,
  CrmArchiveReason,
  CrmLeadAssignmentIntent,
  CrmLeadCreateResultType,
  CrmLeadDuplicateResultType,
  CrmPriority,
  CrmSourceRecord,
  CrmSourceType
} from '../../src/domain/models/crm-records'
import {
  CrmAccountDuplicateCandidate,
  CrmAccountRepository
} from '../../src/domain/repositories/crm-account.repository'

/** FakeCrmAccountRepository stores CRM P1 records in memory so L1 tests focus on application rules. */
class FakeCrmAccountRepository implements CrmAccountRepository {
  readonly accounts: CrmAccountRecord[] = []
  readonly profileItems: CrmAccountProfileItemRecord[] = []
  readonly sources: CrmSourceRecord[] = []
  readonly duplicateCandidates: CrmAccountDuplicateCandidate[] = []

  async findAccountById(tenantId: string, accountId: string): Promise<CrmAccountRecord | null> {
    return (
      this.accounts.find((account) => account.tenantId === tenantId && account.id === accountId) ??
      null
    )
  }

  async findActiveFormalByTenantPartyId(): Promise<CrmAccountRecord | null> {
    return null
  }

  async listAccounts() {
    return {
      items: this.accounts,
      total: this.accounts.length,
      page: 1,
      pageSize: this.accounts.length || 20
    }
  }

  async saveAccount(account: CrmAccountRecord): Promise<CrmAccountRecord> {
    const existingIndex = this.accounts.findIndex(
      (existing) => existing.id === account.id && existing.tenantId === account.tenantId
    )
    if (existingIndex >= 0) {
      this.accounts[existingIndex] = account
    } else {
      this.accounts.push(account)
    }
    return account
  }

  async addSourceRecord(source: CrmSourceRecord): Promise<CrmSourceRecord> {
    this.sources.push(source)
    return source
  }

  async listSourceRecords(tenantId: string, accountId: string): Promise<CrmSourceRecord[]> {
    return this.sources.filter(
      (source) => source.tenantId === tenantId && source.crmAccountId === accountId
    )
  }

  async addAccountProfileItem(
    profileItem: CrmAccountProfileItemRecord
  ): Promise<CrmAccountProfileItemRecord> {
    this.profileItems.push(profileItem)
    return profileItem
  }

  async replaceAccountProfileItems(
    tenantId: string,
    accountId: string,
    profileItems: CrmAccountProfileItemRecord[]
  ): Promise<CrmAccountProfileItemRecord[]> {
    for (let index = this.profileItems.length - 1; index >= 0; index -= 1) {
      if (
        this.profileItems[index].tenantId === tenantId &&
        this.profileItems[index].crmAccountId === accountId
      ) {
        this.profileItems.splice(index, 1)
      }
    }
    this.profileItems.push(...profileItems)
    return profileItems
  }

  async listAccountProfileItems(
    tenantId: string,
    accountId: string
  ): Promise<CrmAccountProfileItemRecord[]> {
    return this.profileItems.filter(
      (profileItem) =>
        profileItem.tenantId === tenantId &&
        profileItem.crmAccountId === accountId &&
        profileItem.status === CrmAccountProfileItemStatus.ACTIVE
    )
  }

  async deleteDraftAccount(tenantId: string, accountId: string): Promise<boolean> {
    const existingIndex = this.accounts.findIndex(
      (account) =>
        account.tenantId === tenantId &&
        account.id === accountId &&
        account.recordStatus === CrmAccountRecordStatus.DRAFT
    )
    if (existingIndex < 0) {
      return false
    }
    this.accounts.splice(existingIndex, 1)
    for (let index = this.sources.length - 1; index >= 0; index -= 1) {
      if (
        this.sources[index].tenantId === tenantId &&
        this.sources[index].crmAccountId === accountId
      ) {
        this.sources.splice(index, 1)
      }
    }
    return true
  }

  async findDuplicateCandidates(): Promise<CrmAccountDuplicateCandidate[]> {
    return this.duplicateCandidates
  }
}

function createHarness() {
  const repository = new FakeCrmAccountRepository()
  const checkLeadDuplicate = new CheckLeadDuplicateHandler(repository)
  return {
    repository,
    archiveCrmAccount: new ArchiveCrmAccountHandler(repository),
    checkLeadDuplicate,
    claimCrmAccount: new ClaimCrmAccountHandler(repository),
    createDraftLead: new CreateDraftLeadHandler(repository),
    createLead: new CreateLeadHandler(repository, checkLeadDuplicate),
    deleteDraftLead: new DeleteDraftLeadHandler(repository),
    releaseCrmAccount: new ReleaseCrmAccountHandler(repository),
    submitDraftLead: new SubmitDraftLeadHandler(repository, checkLeadDuplicate),
    updateCrmAccountIdentifiers: new UpdateCrmAccountIdentifiersHandler(repository)
  }
}

/** buildAccountRecord creates a tenant-scoped CRM account fixture with explicit override points. */
function buildAccountRecord(overrides: Partial<CrmAccountRecord> = {}): CrmAccountRecord {
  return {
    id: 'crm-account-1',
    tenantId: 'tenant-1',
    tenantPartyId: null,
    recordStatus: CrmAccountRecordStatus.ACTIVE,
    lifecycleStage: CrmAccountLifecycleStage.LEAD,
    partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
    displayName: 'Fixture CRM Account',
    leadCompanyName: null,
    leadPersonName: null,
    leadDomain: 'fixture.example',
    leadEmail: null,
    leadPhone: null,
    leadWhatsapp: null,
    leadCountry: 'US',
    leadIdentifiers: [],
    ownerAccountId: null,
    priority: CrmPriority.B,
    lastActivityAt: null,
    nextFollowUpAt: null,
    createdBy: 'sales-1',
    ...overrides
  }
}

describe('CRM P1 lead use cases L1', () => {
  it('UpdateCrmAccountIdentifiers / should replace strong identifiers on active Leads', async () => {
    const harness = createHarness()
    harness.repository.accounts.push(
      buildAccountRecord({
        id: 'lead-identifier-1',
        lifecycleStage: CrmAccountLifecycleStage.LEAD,
        ownerAccountId: 'sales-1',
        recordStatus: CrmAccountRecordStatus.ACTIVE
      })
    )

    const result = await harness.updateCrmAccountIdentifiers.execute(
      new UpdateCrmAccountIdentifiersCommand({
        tenantId: 'tenant-1',
        crmAccountId: 'lead-identifier-1',
        operatorAccountId: 'sales-1',
        leadIdentifiers: [
          {
            identifierType: 'VAT_NO',
            issuerCountryOrRegion: 'US',
            normalizedValue: 'US-91-4432102',
            rawValue: '91-4432102'
          }
        ]
      })
    )

    expect(result.account.leadIdentifiers).toEqual([
      {
        identifierType: 'VAT_NO',
        issuerCountryOrRegion: 'US',
        normalizedValue: 'US-91-4432102',
        rawValue: '91-4432102'
      }
    ])
    expect(harness.repository.accounts[0]?.leadIdentifiers).toEqual(result.account.leadIdentifiers)
  })

  it('UpdateCrmAccountIdentifiers / should reject identifier-bound Prospect Customer identifier changes', async () => {
    const harness = createHarness()
    harness.repository.accounts.push(
      buildAccountRecord({
        id: 'pc-identifier-locked-1',
        tenantPartyId: 'tenant-party-1',
        lifecycleStage: CrmAccountLifecycleStage.PROSPECT_CUSTOMER,
        leadIdentifiers: [
          {
            identifierType: 'VAT_NO',
            issuerCountryOrRegion: 'US',
            normalizedValue: 'US-91-4432102',
            rawValue: '91-4432102'
          }
        ],
        recordStatus: CrmAccountRecordStatus.ACTIVE
      })
    )

    await expect(
      harness.updateCrmAccountIdentifiers.execute(
        new UpdateCrmAccountIdentifiersCommand({
          tenantId: 'tenant-1',
          crmAccountId: 'pc-identifier-locked-1',
          operatorAccountId: 'sales-1',
          leadIdentifiers: [
            {
              identifierType: 'VAT_NO',
              issuerCountryOrRegion: 'US',
              normalizedValue: 'US-00-0000000',
              rawValue: '00-0000000'
            }
          ]
        })
      )
    ).rejects.toThrow('Identifier-bound prospect customer identifiers are immutable')

    expect(harness.repository.accounts[0]?.leadIdentifiers).toEqual([
      {
        identifierType: 'VAT_NO',
        issuerCountryOrRegion: 'US',
        normalizedValue: 'US-91-4432102',
        rawValue: '91-4432102'
      }
    ])
  })

  it('ArchiveCrmAccount / should archive active Lead with required archive reason', async () => {
    const harness = createHarness()
    harness.repository.accounts.push(
      buildAccountRecord({
        id: 'lead-archive-1',
        lifecycleStage: CrmAccountLifecycleStage.LEAD,
        ownerAccountId: 'sales-1',
        recordStatus: CrmAccountRecordStatus.ACTIVE
      })
    )

    const result = await harness.archiveCrmAccount.execute(
      new ArchiveCrmAccountCommand({
        tenantId: 'tenant-1',
        crmAccountId: 'lead-archive-1',
        operatorAccountId: 'sales-manager-1',
        archiveReason: CrmArchiveReason.NON_TARGET_ACCOUNT
      })
    )

    expect(result.account).toEqual(
      expect.objectContaining({
        id: 'lead-archive-1',
        lifecycleStage: CrmAccountLifecycleStage.LEAD,
        recordStatus: CrmAccountRecordStatus.ARCHIVED,
        archiveReason: CrmArchiveReason.NON_TARGET_ACCOUNT,
        ownerAccountId: 'sales-1'
      })
    )
    expect(result.account.archivedAt).toBeInstanceOf(Date)
    expect(harness.repository.accounts[0]).toEqual(result.account)
  })

  it('ArchiveCrmAccount / should preserve competitor as the CRM-owned reason for peer-company leads', async () => {
    const harness = createHarness()
    harness.repository.accounts.push(
      buildAccountRecord({
        id: 'competitor-lead-archive-1',
        lifecycleStage: CrmAccountLifecycleStage.LEAD,
        ownerAccountId: 'sales-1',
        recordStatus: CrmAccountRecordStatus.ACTIVE
      })
    )

    const result = await harness.archiveCrmAccount.execute(
      new ArchiveCrmAccountCommand({
        tenantId: 'tenant-1',
        crmAccountId: 'competitor-lead-archive-1',
        operatorAccountId: 'sales-manager-1',
        archiveReason: CrmArchiveReason.COMPETITOR
      })
    )

    expect(result.account).toEqual(
      expect.objectContaining({
        id: 'competitor-lead-archive-1',
        lifecycleStage: CrmAccountLifecycleStage.LEAD,
        recordStatus: CrmAccountRecordStatus.ARCHIVED,
        ownerAccountId: 'sales-1'
      })
    )
    expect(result.account.archiveReason).toBe('COMPETITOR')
    expect(result.account.archivedAt).toBeInstanceOf(Date)
  })

  it('ArchiveCrmAccount / should archive active Prospect Customer with required archive reason', async () => {
    const harness = createHarness()
    harness.repository.accounts.push(
      buildAccountRecord({
        id: 'pc-archive-1',
        lifecycleStage: CrmAccountLifecycleStage.PROSPECT_CUSTOMER,
        tenantPartyId: 'tenant-party-1',
        recordStatus: CrmAccountRecordStatus.ACTIVE
      })
    )

    const result = await harness.archiveCrmAccount.execute(
      new ArchiveCrmAccountCommand({
        tenantId: 'tenant-1',
        crmAccountId: 'pc-archive-1',
        operatorAccountId: 'sales-manager-1',
        archiveReason: CrmArchiveReason.LOW_VALUE
      })
    )

    expect(result.account).toEqual(
      expect.objectContaining({
        id: 'pc-archive-1',
        lifecycleStage: CrmAccountLifecycleStage.PROSPECT_CUSTOMER,
        recordStatus: CrmAccountRecordStatus.ARCHIVED,
        archiveReason: CrmArchiveReason.LOW_VALUE,
        tenantPartyId: 'tenant-party-1'
      })
    )
  })

  it('ArchiveCrmAccount / should reject Customer archive in this feature slice', async () => {
    const harness = createHarness()
    harness.repository.accounts.push(
      buildAccountRecord({
        id: 'customer-archive-1',
        lifecycleStage: CrmAccountLifecycleStage.CUSTOMER,
        tenantPartyId: 'tenant-party-customer-1',
        recordStatus: CrmAccountRecordStatus.ACTIVE
      })
    )

    await expect(
      harness.archiveCrmAccount.execute(
        new ArchiveCrmAccountCommand({
          tenantId: 'tenant-1',
          crmAccountId: 'customer-archive-1',
          operatorAccountId: 'sales-manager-1',
          archiveReason: CrmArchiveReason.NO_FIT
        })
      )
    ).rejects.toThrow(/Only active leads and prospect customers can be archived/)

    expect(harness.repository.accounts[0].recordStatus).toBe(CrmAccountRecordStatus.ACTIVE)
    expect(harness.repository.accounts[0].archivedAt).toBeUndefined()
  })

  it('CreateLead / should default manually created ACTIVE LEAD ownership to the current operator', async () => {
    const harness = createHarness()

    const result = await harness.createLead.execute(
      new CreateLeadCommand({
        tenantId: 'tenant-1',
        operatorAccountId: 'sales-1',
        displayName: 'Acme Importers',
        partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
        leadCompanyName: 'Acme Importers Ltd',
        leadEmail: 'buyer@acme.example',
        leadDomain: 'acme.example',
        leadCountry: 'US',
        leadIdentifiers: [],
        priority: CrmPriority.A,
        nextFollowUpAt: new Date('2026-06-20T08:00:00.000Z'),
        source: {
          sourceType: CrmSourceType.WEB_RESEARCH,
          sourceName: 'Browser research',
          capturedAt: new Date('2026-06-14T09:00:00.000Z'),
          capturedByAccountId: 'sales-1',
          externalReference: 'research-001',
          rawPayload: { url: 'https://acme.example' },
          note: 'Found from market research'
        }
      })
    )

    expect(result.resultType).toBe(CrmLeadCreateResultType.CREATED)
    expect(result.account).toEqual(
      expect.objectContaining({
        tenantId: 'tenant-1',
        tenantPartyId: null,
        recordStatus: CrmAccountRecordStatus.ACTIVE,
        lifecycleStage: CrmAccountLifecycleStage.LEAD,
        displayName: 'Acme Importers'
      })
    )
    expect(result.account?.ownerAccountId).toBe('sales-1')

    const claimed = await harness.createLead.execute(
      new CreateLeadCommand({
        tenantId: 'tenant-1',
        operatorAccountId: 'sales-1',
        displayName: 'Claimed Lead',
        partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
        leadDomain: 'claimed.example',
        leadIdentifiers: [],
        priority: CrmPriority.A,
        source: {
          sourceType: CrmSourceType.WEB_RESEARCH,
          capturedAt: new Date('2026-06-14T09:00:00.000Z'),
          capturedByAccountId: 'sales-1'
        }
      })
    )
    expect(claimed.account?.ownerAccountId).toBe('sales-1')

    const explicitlyOwned = await harness.createLead.execute(
      new CreateLeadCommand({
        tenantId: 'tenant-1',
        operatorAccountId: 'sales-1',
        displayName: 'Assigned Lead',
        partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
        leadDomain: 'assigned.example',
        leadIdentifiers: [],
        ownerAccountId: 'sales-2',
        claimForCurrentUser: false,
        priority: CrmPriority.B,
        source: {
          sourceType: CrmSourceType.WEB_RESEARCH,
          capturedAt: new Date('2026-06-14T09:00:00.000Z'),
          capturedByAccountId: 'sales-1'
        }
      })
    )
    expect(explicitlyOwned.account?.ownerAccountId).toBe('sales-2')
    expect(harness.repository.accounts).toHaveLength(3)
    expect(harness.repository.sources[0]).toEqual(expect.objectContaining({ isPrimary: true }))
  })

  it('CreateLead / should persist account-level profile items without treating them as contact data', async () => {
    const harness = createHarness()

    const result = await harness.createLead.execute(
      new CreateLeadCommand({
        tenantId: 'tenant-1',
        operatorAccountId: 'sales-1',
        displayName: 'Toto Group',
        partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
        leadCompanyName: 'Toto Group',
        leadDomain: 'toto.com',
        leadEmail: 'sales@toto.com',
        leadIdentifiers: [],
        profileItems: [
          {
            itemType: CrmAccountProfileItemType.DOMAIN,
            normalizedValue: 'toto.com',
            rawValue: 'https://www.toto.com',
            label: 'global site',
            role: 'official'
          },
          {
            itemType: CrmAccountProfileItemType.DOMAIN,
            normalizedValue: 'totousa.com',
            rawValue: 'https://www.totousa.com',
            label: 'usa site',
            role: 'regional'
          },
          {
            itemType: CrmAccountProfileItemType.EMAIL,
            normalizedValue: 'sales@toto.com',
            rawValue: 'sales@toto.com'
          }
        ],
        priority: CrmPriority.A,
        source: {
          sourceType: CrmSourceType.WEB_RESEARCH,
          capturedAt: new Date('2026-06-14T09:00:00.000Z'),
          capturedByAccountId: 'sales-1'
        }
      })
    )

    expect(result.resultType).toBe(CrmLeadCreateResultType.CREATED)
    expect(harness.repository.profileItems).toEqual([
      expect.objectContaining({
        tenantId: 'tenant-1',
        crmAccountId: result.account?.id,
        itemType: CrmAccountProfileItemType.DOMAIN,
        normalizedValue: 'toto.com',
        rawValue: 'https://www.toto.com',
        label: 'global site',
        role: 'official',
        status: CrmAccountProfileItemStatus.ACTIVE
      }),
      expect.objectContaining({
        tenantId: 'tenant-1',
        crmAccountId: result.account?.id,
        itemType: CrmAccountProfileItemType.DOMAIN,
        normalizedValue: 'totousa.com',
        rawValue: 'https://www.totousa.com',
        label: 'usa site',
        role: 'regional',
        status: CrmAccountProfileItemStatus.ACTIVE
      }),
      expect.objectContaining({
        tenantId: 'tenant-1',
        crmAccountId: result.account?.id,
        itemType: CrmAccountProfileItemType.EMAIL,
        normalizedValue: 'sales@toto.com',
        rawValue: 'sales@toto.com',
        status: CrmAccountProfileItemStatus.ACTIVE
      })
    ])
    expect(result.account?.leadDomain).toBe('toto.com')
    expect(result.account?.leadEmail).toBe('sales@toto.com')
  })

  it('CreateLead / should leave owner empty only when Pool assignment is explicit', async () => {
    const harness = createHarness()

    const result = await harness.createLead.execute(
      new CreateLeadCommand({
        tenantId: 'tenant-1',
        operatorAccountId: 'sales-1',
        displayName: 'Website Form Lead',
        partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
        leadDomain: 'website-form.example',
        leadIdentifiers: [],
        assignmentIntent: CrmLeadAssignmentIntent.POOL,
        priority: CrmPriority.C,
        source: {
          sourceType: CrmSourceType.WEBSITE_FORM,
          capturedAt: new Date('2026-06-20T08:00:00.000Z')
        }
      })
    )

    expect(result.account?.ownerAccountId).toBeNull()
  })

  it('ReleaseCrmAccount / should clear owner so active leads return to Pool', async () => {
    const harness = createHarness()
    harness.repository.accounts.push({
      id: 'crm-account-1',
      tenantId: 'tenant-1',
      tenantPartyId: null,
      recordStatus: CrmAccountRecordStatus.ACTIVE,
      lifecycleStage: CrmAccountLifecycleStage.LEAD,
      partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
      displayName: 'Released Lead',
      leadCompanyName: null,
      leadPersonName: null,
      leadDomain: 'released.example',
      leadEmail: null,
      leadPhone: null,
      leadWhatsapp: null,
      leadCountry: 'US',
      leadIdentifiers: [],
      ownerAccountId: 'sales-1',
      priority: CrmPriority.B,
      lastActivityAt: null,
      nextFollowUpAt: null,
      createdBy: 'sales-1'
    })

    const result = await harness.releaseCrmAccount.execute(
      new ReleaseCrmAccountCommand({
        tenantId: 'tenant-1',
        crmAccountId: 'crm-account-1',
        operatorAccountId: 'sales-manager-1'
      })
    )

    expect(result.account.ownerAccountId).toBeNull()
    expect(harness.repository.accounts[0].ownerAccountId).toBeNull()
  })

  it('CheckLeadDuplicate / should classify high-confidence owner states without calling Party', async () => {
    const harness = createHarness()
    harness.repository.duplicateCandidates.push({
      crmAccountId: randomUUID(),
      tenantId: 'tenant-1',
      displayName: 'Owned Acme',
      ownerAccountId: 'sales-1',
      recordStatus: CrmAccountRecordStatus.ACTIVE,
      lifecycleStage: CrmAccountLifecycleStage.LEAD,
      matchedFields: ['leadEmail'],
      confidence: 'HIGH'
    })

    const result = await harness.checkLeadDuplicate.execute(
      new CheckLeadDuplicateQuery({
        tenantId: 'tenant-1',
        operatorAccountId: 'sales-1',
        leadEmail: 'buyer@acme.example'
      })
    )

    expect(result.resultType).toBe(CrmLeadDuplicateResultType.OWNED_DUPLICATE)
    expect(result.candidates).toEqual([
      expect.objectContaining({
        displayName: 'Owned Acme',
        matchedFields: ['leadEmail']
      })
    ])
  })

  it('CreateLead / should block high-confidence duplicates owned by another account', async () => {
    const harness = createHarness()
    harness.repository.duplicateCandidates.push({
      crmAccountId: randomUUID(),
      tenantId: 'tenant-1',
      displayName: 'Restricted Acme',
      ownerAccountId: 'sales-2',
      recordStatus: CrmAccountRecordStatus.ACTIVE,
      lifecycleStage: CrmAccountLifecycleStage.LEAD,
      matchedFields: ['leadDomain'],
      confidence: 'HIGH'
    })

    const result = await harness.createLead.execute(
      new CreateLeadCommand({
        tenantId: 'tenant-1',
        operatorAccountId: 'sales-1',
        displayName: 'Acme Importers',
        partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
        leadDomain: 'acme.example',
        leadIdentifiers: [],
        claimForCurrentUser: true,
        priority: CrmPriority.B,
        source: {
          sourceType: CrmSourceType.WEB_RESEARCH,
          capturedAt: new Date('2026-06-14T09:00:00.000Z'),
          capturedByAccountId: 'sales-1'
        }
      })
    )

    expect(result.resultType).toBe(CrmLeadCreateResultType.BLOCKED_BY_RESTRICTED_DUPLICATE)
    expect(result.account).toBeNull()
    expect(harness.repository.accounts).toHaveLength(0)
    expect(harness.repository.sources).toHaveLength(0)
  })

  it('CreateDraftLead and SubmitDraftLead / should keep source records and activate under the submitter by default', async () => {
    const harness = createHarness()
    const draft = await harness.createDraftLead.execute(
      new CreateDraftLeadCommand({
        tenantId: 'tenant-1',
        operatorAccountId: 'sales-1',
        displayName: 'Draft Lead',
        partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
        leadDomain: 'draft.example',
        leadCountry: 'US',
        leadIdentifiers: [],
        priority: CrmPriority.B,
        source: {
          sourceType: CrmSourceType.WEB_RESEARCH,
          capturedAt: new Date('2026-06-18T08:00:00.000Z'),
          capturedByAccountId: 'sales-1'
        }
      })
    )

    expect(draft.account).toEqual(
      expect.objectContaining({
        recordStatus: CrmAccountRecordStatus.DRAFT,
        lifecycleStage: CrmAccountLifecycleStage.LEAD,
        ownerAccountId: null,
        createdBy: 'sales-1'
      })
    )
    expect(harness.repository.sources).toHaveLength(1)

    const submitted = await harness.submitDraftLead.execute(
      new SubmitDraftLeadCommand({
        tenantId: 'tenant-1',
        crmAccountId: draft.account.id,
        operatorAccountId: 'sales-1',
        source: {
          sourceType: CrmSourceType.OTHER
        }
      })
    )

    expect(submitted.resultType).toBe(CrmLeadCreateResultType.CREATED)
    expect(submitted.account).toEqual(
      expect.objectContaining({
        recordStatus: CrmAccountRecordStatus.ACTIVE,
        lifecycleStage: CrmAccountLifecycleStage.LEAD,
        ownerAccountId: 'sales-1'
      })
    )
    expect(harness.repository.sources).toHaveLength(1)
  })

  it('SubmitDraftLead / should submit to Pool only when Pool assignment is explicit', async () => {
    const harness = createHarness()
    const draft = await harness.createDraftLead.execute(
      new CreateDraftLeadCommand({
        tenantId: 'tenant-1',
        operatorAccountId: 'sales-1',
        displayName: 'Pool Draft Lead',
        partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
        leadDomain: 'pool-draft.example',
        leadIdentifiers: [],
        priority: CrmPriority.C,
        source: {
          sourceType: CrmSourceType.WEBSITE_FORM,
          capturedAt: new Date('2026-06-20T08:00:00.000Z')
        }
      })
    )

    const submitted = await harness.submitDraftLead.execute(
      new SubmitDraftLeadCommand({
        tenantId: 'tenant-1',
        crmAccountId: draft.account.id,
        operatorAccountId: 'sales-1',
        assignmentIntent: CrmLeadAssignmentIntent.POOL
      })
    )

    expect(submitted.account?.ownerAccountId).toBeNull()
  })

  it('DeleteDraftLead / should hard delete only draft leads and their source records', async () => {
    const harness = createHarness()
    harness.repository.accounts.push({
      id: 'draft-1',
      tenantId: 'tenant-1',
      tenantPartyId: null,
      recordStatus: CrmAccountRecordStatus.DRAFT,
      lifecycleStage: CrmAccountLifecycleStage.LEAD,
      partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
      displayName: 'Draft Lead',
      leadCompanyName: null,
      leadPersonName: null,
      leadDomain: 'draft.example',
      leadEmail: null,
      leadPhone: null,
      leadWhatsapp: null,
      leadCountry: 'US',
      leadIdentifiers: [],
      ownerAccountId: null,
      priority: CrmPriority.B,
      lastActivityAt: null,
      nextFollowUpAt: null,
      createdBy: 'sales-1'
    })
    harness.repository.sources.push({
      id: 'source-1',
      tenantId: 'tenant-1',
      crmAccountId: 'draft-1',
      sourceType: CrmSourceType.WEB_RESEARCH,
      capturedAt: new Date('2026-06-18T08:00:00.000Z'),
      capturedByAccountId: 'sales-1',
      isPrimary: true
    })
    harness.repository.accounts.push({
      id: 'active-1',
      tenantId: 'tenant-1',
      tenantPartyId: null,
      recordStatus: CrmAccountRecordStatus.ACTIVE,
      lifecycleStage: CrmAccountLifecycleStage.LEAD,
      partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
      displayName: 'Active Lead',
      leadCompanyName: null,
      leadPersonName: null,
      leadDomain: 'active.example',
      leadEmail: null,
      leadPhone: null,
      leadWhatsapp: null,
      leadCountry: 'US',
      leadIdentifiers: [],
      ownerAccountId: 'sales-1',
      priority: CrmPriority.B,
      lastActivityAt: null,
      nextFollowUpAt: null,
      createdBy: 'sales-1'
    })

    const result = await harness.deleteDraftLead.execute(
      new DeleteDraftLeadCommand({
        tenantId: 'tenant-1',
        crmAccountId: 'draft-1',
        operatorAccountId: 'sales-1'
      })
    )

    expect(result).toEqual({ deleted: true, crmAccountId: 'draft-1' })
    expect(harness.repository.accounts.map((account) => account.id)).toEqual(['active-1'])
    expect(harness.repository.sources).toHaveLength(0)
  })

  it('ClaimCrmAccount / should assign current operator to ownerless Pool records', async () => {
    const harness = createHarness()
    harness.repository.accounts.push({
      id: 'pool-1',
      tenantId: 'tenant-1',
      tenantPartyId: null,
      recordStatus: CrmAccountRecordStatus.ACTIVE,
      lifecycleStage: CrmAccountLifecycleStage.LEAD,
      partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
      displayName: 'Pool Lead',
      leadCompanyName: null,
      leadPersonName: null,
      leadDomain: 'pool.example',
      leadEmail: null,
      leadPhone: null,
      leadWhatsapp: null,
      leadCountry: 'US',
      leadIdentifiers: [],
      ownerAccountId: null,
      priority: CrmPriority.B,
      lastActivityAt: null,
      nextFollowUpAt: null,
      createdBy: 'system'
    })

    const result = await harness.claimCrmAccount.execute(
      new ClaimCrmAccountCommand({
        tenantId: 'tenant-1',
        crmAccountId: 'pool-1',
        operatorAccountId: 'sales-1'
      })
    )

    expect(result.account).toEqual(
      expect.objectContaining({
        id: 'pool-1',
        recordStatus: CrmAccountRecordStatus.ACTIVE,
        ownerAccountId: 'sales-1'
      })
    )
    expect(harness.repository.accounts[0]).toEqual(result.account)
  })
})
