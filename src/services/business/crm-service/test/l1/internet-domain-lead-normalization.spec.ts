import { CreateDraftLeadCommand } from '../../src/application/commands/create-draft-lead.command'
import { CreateDraftLeadHandler } from '../../src/application/commands/create-draft-lead.handler'
import { UpdateDraftLeadCommand } from '../../src/application/commands/update-draft-lead.command'
import { UpdateDraftLeadHandler } from '../../src/application/commands/update-draft-lead.handler'
import { CheckLeadDuplicateHandler } from '../../src/application/queries/check-lead-duplicate.handler'
import { CheckLeadDuplicateQuery } from '../../src/application/queries/check-lead-duplicate.query'
import {
  CrmAccountLifecycleStage,
  CrmAccountRecord,
  CrmAccountRecordStatus,
  CrmAccountTypeHint,
  CrmPriority,
  CrmSourceRecord
} from '../../src/domain/models/crm-records'
import {
  CrmAccountRepository,
  CrmDuplicateSearchInput
} from '../../src/domain/repositories/crm-account.repository'

/** FakeCrmAccountRepository captures CRM account writes and duplicate searches for domain-normalization tests. */
class FakeCrmAccountRepository implements CrmAccountRepository {
  readonly accounts: CrmAccountRecord[] = []
  readonly sources: CrmSourceRecord[] = []
  duplicateSearchInput: CrmDuplicateSearchInput | null = null

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
      (existing) => existing.tenantId === account.tenantId && existing.id === account.id
    )
    if (existingIndex >= 0) {
      this.accounts[existingIndex] = account
      return account
    }

    this.accounts.push(account)
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

  async listAccountProfileItems() {
    return []
  }

  async addAccountProfileItem(profileItem: any): Promise<any> {
    return profileItem
  }

  async replaceAccountProfileItems(): Promise<any[]> {
    return []
  }

  async deleteDraftAccount(): Promise<boolean> {
    return false
  }

  async findDuplicateCandidates(input: CrmDuplicateSearchInput) {
    this.duplicateSearchInput = input
    return []
  }
}

/** createDraftAccount builds one mutable DRAFT + LEAD record for update handler tests. */
function createDraftAccount(overrides: Partial<CrmAccountRecord> = {}): CrmAccountRecord {
  return {
    id: 'draft-1',
    tenantId: 'tenant-1',
    tenantPartyId: null,
    recordStatus: CrmAccountRecordStatus.DRAFT,
    lifecycleStage: CrmAccountLifecycleStage.LEAD,
    partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
    displayName: 'Vintage Tub Draft',
    leadCompanyName: null,
    leadPersonName: null,
    leadDomain: null,
    leadEmail: null,
    leadPhone: null,
    leadWhatsapp: null,
    leadCountry: null,
    leadIdentifiers: [],
    ownerAccountId: null,
    priority: CrmPriority.B,
    lastActivityAt: null,
    nextFollowUpAt: null,
    createdBy: 'sales-1',
    ...overrides
  }
}

describe('CRM Lead InternetDomain normalization L1', () => {
  it('CreateDraftLead / should persist canonical leadDomain from URL input', async () => {
    const repository = new FakeCrmAccountRepository()
    const handler = new CreateDraftLeadHandler(repository)

    const result = await handler.execute(
      new CreateDraftLeadCommand({
        tenantId: 'tenant-1',
        operatorAccountId: 'sales-1',
        displayName: 'Vintage Tub',
        partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
        leadDomain: 'https://www.vintagetub.com/products?id=1',
        leadIdentifiers: [],
        priority: CrmPriority.B
      })
    )

    expect(result.account.leadDomain).toBe('vintagetub.com')
    expect(repository.accounts[0].leadDomain).toBe('vintagetub.com')
  })

  it('UpdateDraftLead / should persist canonical leadDomain from www hostname input', async () => {
    const repository = new FakeCrmAccountRepository()
    repository.accounts.push(createDraftAccount())
    const handler = new UpdateDraftLeadHandler(repository)

    const result = await handler.execute(
      new UpdateDraftLeadCommand({
        tenantId: 'tenant-1',
        crmAccountId: 'draft-1',
        operatorAccountId: 'sales-1',
        displayName: 'Vintage Tub',
        partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
        leadDomain: 'www.vintagetub.com',
        leadIdentifiers: [],
        priority: CrmPriority.B
      })
    )

    expect(result.account.leadDomain).toBe('vintagetub.com')
    expect(repository.accounts[0].leadDomain).toBe('vintagetub.com')
  })

  it('CheckLeadDuplicate / should query duplicate candidates with canonical leadDomain', async () => {
    const repository = new FakeCrmAccountRepository()
    const handler = new CheckLeadDuplicateHandler(repository)

    await handler.execute(
      new CheckLeadDuplicateQuery({
        tenantId: 'tenant-1',
        operatorAccountId: 'sales-1',
        leadDomain: 'www.vintagetub.com'
      })
    )

    expect(repository.duplicateSearchInput?.leadDomain).toBe('vintagetub.com')
  })
})
