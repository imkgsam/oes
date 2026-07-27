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
  readonly profileItems: any[] = []

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

  async listAccountProfileItems(tenantId: string, accountId: string): Promise<any[]> {
    return this.profileItems.filter(
      (item) => item.tenantId === tenantId && item.crmAccountId === accountId
    )
  }

  async addAccountProfileItem(profileItem: any): Promise<any> {
    this.profileItems.push(profileItem)
    return profileItem
  }

  async replaceAccountProfileItems(
    tenantId: string,
    accountId: string,
    profileItems: any[]
  ): Promise<any[]> {
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

  async listSourceRecords(tenantId: string, accountId: string): Promise<CrmSourceRecord[]> {
    return this.sources.filter(
      (source) => source.tenantId === tenantId && source.crmAccountId === accountId
    )
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

/** FakeTenantPartyResolutionPort records Party calls while returning scripted resolution results. */
class FakeTenantPartyResolutionPort implements TenantPartyResolutionPort {
  resolveCalls = 0
  registerCalls = 0
  registerInputs: any[] = []
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

  async registerTenantParty(input: any) {
    this.registerCalls += 1
    this.registerInputs.push(input)
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
    leadLegalName: null,
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

function addActiveDomainProfileItem(
  repository: FakeCrmAccountRepository,
  lead: CrmAccountRecord,
  normalizedValue = lead.leadDomain ?? 'acme.example'
) {
  repository.profileItems.push({
    id: randomUUID(),
    tenantId: lead.tenantId,
    crmAccountId: lead.id,
    itemType: 'DOMAIN',
    normalizedValue,
    rawValue: normalizedValue,
    status: 'ACTIVE'
  })
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
        operatorAccountId: 'sales-1',
        legalName: 'Acme Importers Incorporated'
      })
    )

    expect(result.resultType).toBe(CrmLeadConversionResultType.INSUFFICIENT_INFO)
    expect(harness.partyResolution.resolveCalls).toBe(0)
    expect(await harness.repository.findAccountById(lead.tenantId, lead.id)).toEqual(lead)
  })

  it('ConvertLeadToProspectCustomer / should auto-bind exact Party match and formalize the lead', async () => {
    const harness = createHarness()
    const lead = createLead()
    addActiveDomainProfileItem(harness.repository, lead)
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
        operatorAccountId: 'sales-1',
        legalName: 'Acme Importers Incorporated'
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
    addActiveDomainProfileItem(harness.repository, lead)
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
        operatorAccountId: 'sales-1',
        legalName: 'Toto Ltd'
      })
    )

    expect(result.resultType).toBe(CrmLeadConversionResultType.EXISTING_CRM_ACCOUNT_FOUND)
    expect(result.existingCrmAccountId).toBe(existing.id)
    expect(await harness.repository.findAccountById(lead.tenantId, lead.id)).toEqual(lead)
  })

  it('ConvertLeadToProspectCustomer / should create TenantParty on no match and formalize the lead', async () => {
    const harness = createHarness()
    const lead = createLead()
    addActiveDomainProfileItem(harness.repository, lead)
    await harness.repository.saveAccount(lead)
    harness.partyResolution.nextRegisteredTenantPartyId = 'party-created-1'

    const result = await harness.convertLead.execute(
      new ConvertLeadToProspectCustomerCommand({
        tenantId: lead.tenantId,
        crmAccountId: lead.id,
        operatorAccountId: 'sales-1',
        legalName: 'Acme Importers Incorporated'
      })
    )

    expect(result.resultType).toBe(CrmLeadConversionResultType.CONVERTED)
    expect(harness.partyResolution.registerCalls).toBe(1)
    expect(harness.partyResolution.registerInputs[0]).toMatchObject({
      legalName: 'Acme Importers Incorporated',
      displayName: 'Acme Importers'
    })
    expect(result.account?.leadLegalName).toBe('Acme Importers Incorporated')
    expect(result.account?.tenantPartyId).toBe('party-created-1')
  })

  it('ConvertLeadToProspectCustomer / should require legal name at formalization time', async () => {
    const harness = createHarness()
    const lead = createLead()
    addActiveDomainProfileItem(harness.repository, lead)
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
    expect(harness.partyResolution.registerCalls).toBe(0)
  })

  it('ConvertLeadToProspectCustomer / should not formalize from legacy single-value lead fields without profile items', async () => {
    const harness = createHarness()
    const lead = createLead()
    await harness.repository.saveAccount(lead)

    const result = await harness.convertLead.execute(
      new ConvertLeadToProspectCustomerCommand({
        tenantId: lead.tenantId,
        crmAccountId: lead.id,
        operatorAccountId: 'sales-1',
        legalName: 'Toto Ltd'
      })
    )

    expect(result.resultType).toBe(CrmLeadConversionResultType.INSUFFICIENT_INFO)
    expect(harness.partyResolution.resolveCalls).toBe(0)
    expect(harness.partyResolution.registerCalls).toBe(0)
  })

  it('ConvertLeadToProspectCustomer / should promote account profile items to Party and ignore CRM contacts', async () => {
    const harness = createHarness()
    const lead = createLead({
      leadDomain: null,
      leadEmail: null,
      leadPhone: null,
      leadWhatsapp: null
    })
    harness.repository.profileItems.push(
      {
        id: randomUUID(),
        tenantId: lead.tenantId,
        crmAccountId: lead.id,
        itemType: 'DOMAIN',
        normalizedValue: 'toto.com',
        rawValue: 'https://www.toto.com',
        label: 'global site',
        role: 'PRIMARY',
        status: 'ACTIVE'
      },
      {
        id: randomUUID(),
        tenantId: lead.tenantId,
        crmAccountId: lead.id,
        itemType: 'DOMAIN',
        normalizedValue: 'totousa.com',
        rawValue: 'https://www.totousa.com',
        label: 'US site',
        role: 'REGIONAL',
        status: 'ACTIVE'
      },
      {
        id: randomUUID(),
        tenantId: lead.tenantId,
        crmAccountId: lead.id,
        itemType: 'EMAIL',
        normalizedValue: 'info@toto.com',
        rawValue: 'info@toto.com',
        label: 'general inbox',
        role: 'PRIMARY',
        status: 'ACTIVE'
      }
    )
    await harness.repository.saveAccount(lead)
    harness.partyResolution.nextRegisteredTenantPartyId = 'party-toto'

    const result = await harness.convertLead.execute(
      new ConvertLeadToProspectCustomerCommand({
        tenantId: lead.tenantId,
        crmAccountId: lead.id,
        operatorAccountId: 'sales-1',
        legalName: 'Acme Importers Incorporated'
      })
    )

    expect(result.resultType).toBe(CrmLeadConversionResultType.CONVERTED)
    expect(harness.partyResolution.registerInputs[0]).toEqual(
      expect.objectContaining({
        profileItems: [
          expect.objectContaining({
            itemType: 'DOMAIN',
            normalizedValue: 'toto.com',
            rawValue: 'https://www.toto.com',
            role: 'PRIMARY'
          }),
          expect.objectContaining({
            itemType: 'DOMAIN',
            normalizedValue: 'totousa.com',
            rawValue: 'https://www.totousa.com',
            role: 'REGIONAL'
          }),
          expect.objectContaining({
            itemType: 'EMAIL',
            normalizedValue: 'info@toto.com'
          })
        ]
      })
    )
    expect(harness.partyResolution.registerInputs[0].profileItems).toHaveLength(3)
  })

  it('ConvertLeadToProspectCustomer / should require user choice for non-exact Party candidates', async () => {
    const harness = createHarness()
    const lead = createLead()
    addActiveDomainProfileItem(harness.repository, lead)
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
        operatorAccountId: 'sales-1',
        legalName: 'Acme Importers Incorporated'
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
