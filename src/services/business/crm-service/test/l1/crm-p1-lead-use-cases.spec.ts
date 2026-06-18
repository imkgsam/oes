import { randomUUID } from 'node:crypto'
import { CreateLeadCommand } from '../../src/application/commands/create-lead.command'
import { CreateLeadHandler } from '../../src/application/commands/create-lead.handler'
import { CheckLeadDuplicateHandler } from '../../src/application/queries/check-lead-duplicate.handler'
import { CheckLeadDuplicateQuery } from '../../src/application/queries/check-lead-duplicate.query'
import {
  CrmAccountLifecycleStage,
  CrmAccountRecord,
  CrmAccountRecordStatus,
  CrmAccountTypeHint,
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
  readonly sources: CrmSourceRecord[] = []
  readonly duplicateCandidates: CrmAccountDuplicateCandidate[] = []

  async findAccountById(tenantId: string, accountId: string): Promise<CrmAccountRecord | null> {
    return this.accounts.find((account) => account.tenantId === tenantId && account.id === accountId) ?? null
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
    this.accounts.push(account)
    return account
  }

  async addSourceRecord(source: CrmSourceRecord): Promise<CrmSourceRecord> {
    this.sources.push(source)
    return source
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
    checkLeadDuplicate,
    createLead: new CreateLeadHandler(repository, checkLeadDuplicate)
  }
}

describe('CRM P1 lead use cases L1', () => {
  it('CreateLead / should create ACTIVE LEAD with primary source without tenantParty binding', async () => {
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
        ownerAccountId: 'sales-1',
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
    expect(harness.repository.accounts).toHaveLength(1)
    expect(harness.repository.sources).toEqual([
      expect.objectContaining({
        crmAccountId: result.account?.id,
        sourceType: CrmSourceType.WEB_RESEARCH,
        isPrimary: true
      })
    ])
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
        ownerAccountId: 'sales-1',
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
})
