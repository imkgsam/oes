import {
  CrmAccountLifecycleStage,
  CrmAccountProfileItemRecord,
  CrmAccountProfileItemStatus,
  CrmAccountProfileItemType,
  CrmAccountRecord,
  CrmAccountRecordStatus,
  CrmAccountTypeHint,
  CrmPriority,
  CrmSourceRecord
} from '../../src/domain/models/crm-records'
import {
  CrmAccountDuplicateCandidate,
  CrmAccountRepository,
  CrmDuplicateSearchInput,
  ListCrmAccountsInput
} from '../../src/domain/repositories/crm-account.repository'
import { GetCrmAccountHandler } from '../../src/application/queries/get-crm-account.handler'
import { GetCrmAccountQuery } from '../../src/application/queries/get-crm-account.query'
import { ListCrmAccountsHandler } from '../../src/application/queries/list-crm-accounts.handler'
import { ListCrmAccountsQuery } from '../../src/application/queries/list-crm-accounts.query'
import { ListSourceRecordsHandler } from '../../src/application/queries/list-source-records.handler'
import { ListSourceRecordsQuery } from '../../src/application/queries/list-source-records.query'

const leadAccount: CrmAccountRecord = {
  id: 'crm-account-1',
  tenantId: 'tenant-1',
  tenantPartyId: null,
  recordStatus: CrmAccountRecordStatus.ACTIVE,
  lifecycleStage: CrmAccountLifecycleStage.LEAD,
  partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
  displayName: 'Northline Bathworks',
  leadCompanyName: 'Northline Bathworks LLC',
  leadPersonName: null,
  leadDomain: 'northline.example',
  leadEmail: 'sourcing@northline.example',
  leadPhone: null,
  leadWhatsapp: null,
  leadCountry: 'US',
  leadIdentifiers: [],
  ownerAccountId: 'sales-1',
  priority: CrmPriority.A,
  lastActivityAt: null,
  nextFollowUpAt: null,
  createdBy: 'sales-1'
}

const primarySource: CrmSourceRecord = {
  id: 'source-1',
  tenantId: 'tenant-1',
  crmAccountId: 'crm-account-1',
  sourceType: 'WEB_RESEARCH',
  sourceName: 'Website research',
  capturedAt: new Date('2026-06-24T08:00:00.000Z'),
  capturedByAccountId: 'sales-1',
  externalReference: 'https://northline.example',
  rawPayload: { url: 'https://northline.example' },
  note: 'Found during research',
  isPrimary: true
}

const accountProfileItem: CrmAccountProfileItemRecord = {
  id: 'profile-item-1',
  tenantId: 'tenant-1',
  crmAccountId: 'crm-account-1',
  itemType: CrmAccountProfileItemType.DOMAIN,
  normalizedValue: 'northline.example',
  rawValue: 'https://northline.example',
  label: 'official site',
  role: 'official',
  status: CrmAccountProfileItemStatus.ACTIVE
}

/** FakeCrmAccountRepository supports P1 query tests with deterministic account data. */
class FakeCrmAccountRepository implements CrmAccountRepository {
  readonly listInputs: ListCrmAccountsInput[] = []
  readonly sourceRecordInputs: Array<{ tenantId: string; accountId: string }> = []

  async findAccountById(tenantId: string, accountId: string): Promise<CrmAccountRecord | null> {
    return tenantId === leadAccount.tenantId && accountId === leadAccount.id ? leadAccount : null
  }

  async findActiveFormalByTenantPartyId(): Promise<CrmAccountRecord | null> {
    return null
  }

  async listAccounts(input: ListCrmAccountsInput) {
    this.listInputs.push(input)
    return {
      items: [leadAccount],
      total: 1,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20
    }
  }

  async saveAccount(account: CrmAccountRecord): Promise<CrmAccountRecord> {
    return account
  }

  async addSourceRecord(source: CrmSourceRecord): Promise<CrmSourceRecord> {
    return source
  }

  async listSourceRecords(tenantId: string, accountId: string): Promise<CrmSourceRecord[]> {
    this.sourceRecordInputs.push({ tenantId, accountId })
    return tenantId === primarySource.tenantId && accountId === primarySource.crmAccountId
      ? [primarySource]
      : []
  }

  async listAccountProfileItems(tenantId: string, accountId: string) {
    return tenantId === accountProfileItem.tenantId && accountId === accountProfileItem.crmAccountId
      ? [accountProfileItem]
      : []
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

  async findDuplicateCandidates(
    _input: CrmDuplicateSearchInput
  ): Promise<CrmAccountDuplicateCandidate[]> {
    return []
  }
}

describe('CRM P1 query use cases L1', () => {
  it('ListCrmAccounts / should forward tenant filters and return a paged P1 account result', async () => {
    const repository = new FakeCrmAccountRepository()
    const handler = new ListCrmAccountsHandler(repository)

    const result = await handler.execute(
      new ListCrmAccountsQuery({
        tenantId: 'tenant-1',
        keyword: 'northline',
        lifecycleStage: CrmAccountLifecycleStage.LEAD,
        recordStatus: CrmAccountRecordStatus.ACTIVE,
        ownerAccountId: 'sales-1',
        page: 2,
        pageSize: 10
      })
    )

    expect(repository.listInputs).toEqual([
      {
        tenantId: 'tenant-1',
        keyword: 'northline',
        lifecycleStage: CrmAccountLifecycleStage.LEAD,
        recordStatus: CrmAccountRecordStatus.ACTIVE,
        ownerAccountId: 'sales-1',
        page: 2,
        pageSize: 10
      }
    ])
    expect(result).toEqual({
      crmAccounts: [{ ...leadAccount, profileItems: [accountProfileItem] }],
      total: 1,
      page: 2,
      pageSize: 10
    })
  })

  it('GetCrmAccount / should return one tenant-scoped P1 account or null', async () => {
    const repository = new FakeCrmAccountRepository()
    const handler = new GetCrmAccountHandler(repository)

    await expect(
      handler.execute(new GetCrmAccountQuery('tenant-1', 'crm-account-1'))
    ).resolves.toEqual({
      crmAccount: { ...leadAccount, profileItems: [accountProfileItem] }
    })
    await expect(
      handler.execute(new GetCrmAccountQuery('tenant-2', 'crm-account-1'))
    ).resolves.toEqual({
      crmAccount: null
    })
  })

  it('ListSourceRecords / should return source records inside the tenant boundary', async () => {
    const repository = new FakeCrmAccountRepository()
    const handler = new ListSourceRecordsHandler(repository)

    await expect(
      handler.execute(new ListSourceRecordsQuery('tenant-1', 'crm-account-1'))
    ).resolves.toEqual({
      sourceRecords: [primarySource]
    })
    await expect(
      handler.execute(new ListSourceRecordsQuery('tenant-2', 'crm-account-1'))
    ).resolves.toEqual({
      sourceRecords: []
    })

    expect(repository.sourceRecordInputs).toEqual([
      { tenantId: 'tenant-1', accountId: 'crm-account-1' },
      { tenantId: 'tenant-2', accountId: 'crm-account-1' }
    ])
  })
})
