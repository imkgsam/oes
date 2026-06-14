import { randomUUID } from 'node:crypto'
import { ConvertLeadToProspectCustomerCommand } from '../../src/application/commands/convert-lead-to-prospect-customer.command'
import { ConvertLeadToProspectCustomerHandler } from '../../src/application/commands/convert-lead-to-prospect-customer.handler'
import {
  TenantPartyResolutionPort,
  TenantPartyResolutionResultType
} from '../../src/application/ports/tenant-party-resolution.port'
import {
  CrmAccountLifecycleStage,
  CrmAccountRecord,
  CrmAccountRecordStatus,
  CrmAccountTypeHint,
  CrmLeadConversionResultType,
  CrmPriority,
  CrmSourceRecord
} from '../../src/domain/models/crm-records'
import {
  CrmAccountDuplicateCandidate,
  CrmAccountRepository,
  CrmDuplicateSearchInput
} from '../../src/domain/repositories/crm-account.repository'

/** FakeCrmAccountRepository supports conversion tests with deterministic CRM account state. */
class FakeCrmAccountRepository implements CrmAccountRepository {
  readonly accounts = new Map<string, CrmAccountRecord>()
  readonly sources: CrmSourceRecord[] = []

  async saveAccount(account: CrmAccountRecord): Promise<CrmAccountRecord> {
    this.accounts.set(`${account.tenantId}:${account.id}`, account)
    return account
  }

  async findAccountById(tenantId: string, accountId: string): Promise<CrmAccountRecord | null> {
    return this.accounts.get(`${tenantId}:${accountId}`) ?? null
  }

  async findActiveFormalByTenantPartyId(
    tenantId: string,
    tenantPartyId: string
  ): Promise<CrmAccountRecord | null> {
    return (
      [...this.accounts.values()].find(
        (account) =>
          account.tenantId === tenantId &&
          account.tenantPartyId === tenantPartyId &&
          account.recordStatus === CrmAccountRecordStatus.ACTIVE &&
          [CrmAccountLifecycleStage.PROSPECT_CUSTOMER, CrmAccountLifecycleStage.CUSTOMER].includes(
            account.lifecycleStage
          )
      ) ?? null
    )
  }

  async listAccounts() {
    const items = [...this.accounts.values()]
    return {
      items,
      total: items.length,
      page: 1,
      pageSize: items.length || 20
    }
  }

  async addSourceRecord(source: CrmSourceRecord): Promise<CrmSourceRecord> {
    this.sources.push(source)
    return source
  }

  async findDuplicateCandidates(_input: CrmDuplicateSearchInput): Promise<CrmAccountDuplicateCandidate[]> {
    return []
  }
}

/** FakeTenantPartyResolutionPort records Party calls while returning scripted resolution results. */
class FakeTenantPartyResolutionPort implements TenantPartyResolutionPort {
  resolveCalls = 0
  registerCalls = 0
  nextResult = {
    resultType: TenantPartyResolutionResultType.NO_MATCH,
    candidates: [],
    matchedFields: []
  }
  nextRegisteredTenantPartyId = 'party-created'

  async resolveTenantPartyForConsumer() {
    this.resolveCalls += 1
    return this.nextResult
  }

  async registerTenantParty() {
    this.registerCalls += 1
    return {
      tenantPartyId: this.nextRegisteredTenantPartyId,
      displayName: 'Created Party'
    }
  }
}

function createLead(overrides: Partial<CrmAccountRecord> = {}): CrmAccountRecord {
  return {
    id: randomUUID(),
    tenantId: 'tenant-1',
    tenantPartyId: null,
    recordStatus: CrmAccountRecordStatus.ACTIVE,
    lifecycleStage: CrmAccountLifecycleStage.LEAD,
    partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
    displayName: 'Acme Importers',
    leadCompanyName: 'Acme Importers Ltd',
    leadPersonName: null,
    leadDomain: 'acme.example',
    leadEmail: 'buyer@acme.example',
    leadPhone: null,
    leadWhatsapp: null,
    leadCountry: 'US',
    leadIdentifiers: [],
    ownerAccountId: 'sales-1',
    priority: CrmPriority.A,
    lastActivityAt: null,
    nextFollowUpAt: null,
    createdBy: 'sales-1',
    ...overrides
  }
}

function createHarness() {
  const repository = new FakeCrmAccountRepository()
  const partyResolution = new FakeTenantPartyResolutionPort()
  return {
    repository,
    partyResolution,
    convertLead: new ConvertLeadToProspectCustomerHandler(repository, partyResolution)
  }
}

describe('CRM P1 lead conversion use case L1', () => {
  it('ConvertLeadToProspectCustomer / should not call Party when formalization info is insufficient', async () => {
    const harness = createHarness()
    const lead = createLead({
      displayName: '',
      leadCompanyName: null,
      leadDomain: null,
      leadEmail: null,
      leadPhone: null,
      leadWhatsapp: null,
      leadCountry: null,
      leadIdentifiers: []
    })
    await harness.repository.saveAccount(lead)

    const result = await harness.convertLead.execute(
      new ConvertLeadToProspectCustomerCommand({
        tenantId: lead.tenantId,
        crmAccountId: lead.id,
        operatorAccountId: 'sales-1'
      })
    )

    expect(result.resultType).toBe(CrmLeadConversionResultType.INSUFFICIENT_INFO)
    expect(harness.partyResolution.resolveCalls).toBe(0)
    expect(await harness.repository.findAccountById(lead.tenantId, lead.id)).toEqual(lead)
  })

  it('ConvertLeadToProspectCustomer / should auto-bind exact Party match and formalize the lead', async () => {
    const harness = createHarness()
    const lead = createLead()
    await harness.repository.saveAccount(lead)
    harness.partyResolution.nextResult = {
      resultType: TenantPartyResolutionResultType.EXACT_MATCH,
      tenantPartyId: 'party-1',
      candidates: [],
      matchedFields: ['leadDomain']
    }

    const result = await harness.convertLead.execute(
      new ConvertLeadToProspectCustomerCommand({
        tenantId: lead.tenantId,
        crmAccountId: lead.id,
        operatorAccountId: 'sales-1'
      })
    )

    expect(result.resultType).toBe(CrmLeadConversionResultType.CONVERTED)
    expect(result.account).toEqual(
      expect.objectContaining({
        id: lead.id,
        tenantPartyId: 'party-1',
        lifecycleStage: CrmAccountLifecycleStage.PROSPECT_CUSTOMER
      })
    )
  })

  it('ConvertLeadToProspectCustomer / should return existing account when matched Party is already bound', async () => {
    const harness = createHarness()
    const lead = createLead()
    const existing = createLead({
      id: randomUUID(),
      tenantPartyId: 'party-1',
      lifecycleStage: CrmAccountLifecycleStage.PROSPECT_CUSTOMER
    })
    await harness.repository.saveAccount(lead)
    await harness.repository.saveAccount(existing)
    harness.partyResolution.nextResult = {
      resultType: TenantPartyResolutionResultType.EXACT_MATCH,
      tenantPartyId: 'party-1',
      candidates: [],
      matchedFields: ['leadDomain']
    }

    const result = await harness.convertLead.execute(
      new ConvertLeadToProspectCustomerCommand({
        tenantId: lead.tenantId,
        crmAccountId: lead.id,
        operatorAccountId: 'sales-1'
      })
    )

    expect(result.resultType).toBe(CrmLeadConversionResultType.EXISTING_CRM_ACCOUNT_FOUND)
    expect(result.existingCrmAccountId).toBe(existing.id)
    expect(await harness.repository.findAccountById(lead.tenantId, lead.id)).toEqual(lead)
  })

  it('ConvertLeadToProspectCustomer / should create TenantParty on no match and formalize the lead', async () => {
    const harness = createHarness()
    const lead = createLead()
    await harness.repository.saveAccount(lead)
    harness.partyResolution.nextRegisteredTenantPartyId = 'party-created-1'

    const result = await harness.convertLead.execute(
      new ConvertLeadToProspectCustomerCommand({
        tenantId: lead.tenantId,
        crmAccountId: lead.id,
        operatorAccountId: 'sales-1'
      })
    )

    expect(result.resultType).toBe(CrmLeadConversionResultType.CONVERTED)
    expect(harness.partyResolution.registerCalls).toBe(1)
    expect(result.account?.tenantPartyId).toBe('party-created-1')
  })

  it('ConvertLeadToProspectCustomer / should require user choice for non-exact Party candidates', async () => {
    const harness = createHarness()
    const lead = createLead()
    await harness.repository.saveAccount(lead)
    harness.partyResolution.nextResult = {
      resultType: TenantPartyResolutionResultType.CANDIDATES_FOUND,
      candidates: [
        {
          tenantPartyId: 'candidate-1',
          displayName: 'Acme Candidate',
          confidence: 0.82,
          matchedFields: ['leadDomain'],
          conflictFlags: []
        }
      ],
      matchedFields: ['leadDomain']
    }

    const result = await harness.convertLead.execute(
      new ConvertLeadToProspectCustomerCommand({
        tenantId: lead.tenantId,
        crmAccountId: lead.id,
        operatorAccountId: 'sales-1'
      })
    )

    expect(result.resultType).toBe(CrmLeadConversionResultType.USER_CHOICE_REQUIRED)
    expect(result.candidates).toEqual([
      expect.objectContaining({
        tenantPartyId: 'candidate-1'
      })
    ])
    expect(await harness.repository.findAccountById(lead.tenantId, lead.id)).toEqual(lead)
  })
})
