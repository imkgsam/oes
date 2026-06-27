import { ForbiddenException } from '@nestjs/common'
import { CustomerManagementService } from './customer-management.service'

// Verifies the gateway customer-management service maps the CRM P1 account workflow and enforces tenant/claim scope.
describe('CustomerManagementService', () => {
  const customerQueryAdapter = {
    checkLeadDuplicate: jest.fn(),
    getCrmAccount: jest.fn(),
    listCrmAccounts: jest.fn(),
    listSourceRecords: jest.fn()
  }
  const customerManagementAdapter = {
    archiveCrmAccount: jest.fn(),
    claimCrmAccount: jest.fn(),
    convertLeadToProspectCustomer: jest.fn(),
    createDraftLead: jest.fn(),
    createLead: jest.fn(),
    deleteDraftLead: jest.fn(),
    releaseCrmAccount: jest.fn(),
    submitDraftLead: jest.fn(),
    updateDraftLead: jest.fn()
  }
  const identityQueryAdapter = {
    getAccountById: jest.fn()
  }

  const service = new CustomerManagementService(
    customerQueryAdapter as any,
    customerManagementAdapter as any,
    identityQueryAdapter as any
  )

  beforeEach(() => {
    jest.clearAllMocks()
    identityQueryAdapter.getAccountById.mockResolvedValue({
      account: { displayName: '陈双鹏' }
    })
  })

  it('rejects tenant-scoped operators when they request another tenant CRM account list', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    await expect(
      service.listCrmAccounts('tenant-2', { page: 1, pageSize: 20 }, source as any)
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(customerQueryAdapter.listCrmAccounts).not.toHaveBeenCalled()
  })

  it('maps list, detail, and duplicate queries into the CRM P1 BFF model', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', permissions: [], scopeLevel: 'TENANT', tid: 'tenant-1' }
    }
    const crmAccount = buildCrmAccount({
      archiveReason: 'NON_TARGET_ACCOUNT',
      archivedAt: '2026-06-23T00:00:00.000Z',
      crmAccountId: 'crm-account-1',
      createdBy: 'account-creator',
      ownerAccountId: 'account-owner'
    })
    identityQueryAdapter.getAccountById.mockImplementation(async (accountId: string) => ({
      account: {
        displayName: accountId === 'account-creator' ? '林晓雯' : '陈双鹏'
      }
    }))

    customerQueryAdapter.listCrmAccounts.mockResolvedValue({
      crmAccounts: [crmAccount],
      total: 1,
      page: 1,
      pageSize: 20
    })
    customerQueryAdapter.getCrmAccount.mockResolvedValue({ crmAccount })
    customerQueryAdapter.listSourceRecords.mockResolvedValue({
      sourceRecords: [
        {
          sourceRecordId: 'source-1',
          crmAccountId: 'crm-account-1',
          sourceType: 'WEB_RESEARCH',
          sourceName: 'Research page',
          capturedAt: '2026-06-24T08:00:00.000Z',
          capturedByAccountId: 'sales-1',
          externalReference: 'https://northline.example',
          rawPayloadJson: '{"url":"https://northline.example"}',
          note: 'Found through research',
          isPrimary: true,
          createdAt: '2026-06-24T08:01:00.000Z',
          updatedAt: '2026-06-24T08:02:00.000Z'
        }
      ]
    })
    customerQueryAdapter.checkLeadDuplicate.mockResolvedValue({
      duplicateResult: {
        resultType: 'CLAIMABLE_EXISTING',
        candidates: [{ ...crmAccount, matchedFields: ['leadEmail'], confidence: 'HIGH' }]
      }
    })

    await expect(
      service.listCrmAccounts(
        'tenant-1',
        {
          createdBy: 'account-1',
          keyword: 'northline',
          lifecycleStages: ['LEAD', 'PROSPECT_CUSTOMER'],
          ownerless: true,
          page: 1,
          pageSize: 20,
          recordStatus: 'ACTIVE'
        },
        source as any
      )
    ).resolves.toEqual({
      crmAccounts: [
        expect.objectContaining({
          crmAccountId: 'crm-account-1',
          archiveReason: 'NON_TARGET_ACCOUNT',
          archivedAt: '2026-06-23T00:00:00.000Z',
          createdBy: 'account-creator',
          createdByDisplayName: '林晓雯',
          ownerAccountId: 'account-owner',
          ownerDisplayName: '陈双鹏'
        })
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
    await expect(
      service.getCrmAccount('tenant-1', 'crm-account-1', source as any)
    ).resolves.toEqual(
      expect.objectContaining({
        crmAccountId: 'crm-account-1',
        archiveReason: 'NON_TARGET_ACCOUNT',
        archivedAt: '2026-06-23T00:00:00.000Z',
        createdBy: 'account-creator',
        createdByDisplayName: '林晓雯',
        ownerAccountId: 'account-owner',
        ownerDisplayName: '陈双鹏'
      })
    )
    await expect(
      service.listSourceRecords('tenant-1', 'crm-account-1', source as any)
    ).resolves.toEqual({
      sourceRecords: [
        {
          sourceRecordId: 'source-1',
          crmAccountId: 'crm-account-1',
          sourceType: 'WEB_RESEARCH',
          sourceName: 'Research page',
          capturedAt: '2026-06-24T08:00:00.000Z',
          capturedByAccountId: 'sales-1',
          capturedByDisplayName: '陈双鹏',
          externalReference: 'https://northline.example',
          rawPayload: { url: 'https://northline.example' },
          note: 'Found through research',
          isPrimary: true,
          createdAt: '2026-06-24T08:01:00.000Z',
          updatedAt: '2026-06-24T08:02:00.000Z'
        }
      ]
    })
    await expect(
      service.checkLeadDuplicate(
        'tenant-1',
        { leadEmail: 'sourcing@northline.example' },
        source as any
      )
    ).resolves.toEqual({
      duplicateResult: {
        resultType: 'CLAIMABLE_EXISTING',
        candidates: [expect.objectContaining({ crmAccountId: 'crm-account-1' })]
      }
    })

    expect(customerQueryAdapter.listCrmAccounts).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        createdBy: 'account-1',
        keyword: 'northline',
        lifecycleStage: undefined,
        lifecycleStages: ['LEAD', 'PROSPECT_CUSTOMER'],
        recordStatus: 'ACTIVE',
        ownerAccountId: undefined,
        ownerless: true,
        page: 1,
        pageSize: 20
      },
      source
    )
    expect(customerQueryAdapter.checkLeadDuplicate).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        displayName: undefined,
        leadCompanyName: undefined,
        leadPersonName: undefined,
        leadDomain: undefined,
        leadEmail: 'sourcing@northline.example',
        leadPhone: undefined,
        leadWhatsapp: undefined,
        leadCountry: undefined,
        leadIdentifiers: []
      },
      source
    )
    expect(customerQueryAdapter.listSourceRecords).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        crmAccountId: 'crm-account-1'
      },
      source
    )
    expect(identityQueryAdapter.getAccountById).toHaveBeenCalledWith('account-owner', source)
    expect(identityQueryAdapter.getAccountById).toHaveBeenCalledWith('sales-1', source)
  })

  it('maps draft, active lead, claim, archive, and conversion commands', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: {
        aid: 'account-1',
        permissions: ['crm.account.claim', 'crm.account.manage'],
        scopeLevel: 'TENANT',
        tid: 'tenant-1'
      }
    }

    customerManagementAdapter.createDraftLead.mockResolvedValue({
      crmAccount: buildCrmAccount({ recordStatus: 'DRAFT', ownerAccountId: '' })
    })
    customerManagementAdapter.updateDraftLead.mockResolvedValue({
      crmAccount: buildCrmAccount({ recordStatus: 'DRAFT', displayName: 'Acme Updated' })
    })
    customerManagementAdapter.submitDraftLead.mockResolvedValue({
      resultType: 'CREATED',
      crmAccount: buildCrmAccount({ ownerAccountId: 'account-1' }),
      duplicateResult: { resultType: 'NO_DUPLICATE', candidates: [] }
    })
    customerManagementAdapter.createLead.mockResolvedValue({
      resultType: 'CREATED',
      crmAccount: buildCrmAccount({ ownerAccountId: 'account-1' }),
      duplicateResult: { resultType: 'NO_DUPLICATE', candidates: [] }
    })
    customerManagementAdapter.claimCrmAccount.mockResolvedValue({
      crmAccount: buildCrmAccount({ ownerAccountId: 'account-1' })
    })
    customerManagementAdapter.releaseCrmAccount.mockResolvedValue({
      crmAccount: buildCrmAccount({ ownerAccountId: '' })
    })
    customerManagementAdapter.archiveCrmAccount.mockResolvedValue({
      crmAccount: buildCrmAccount({
        archiveReason: 'NON_TARGET_ACCOUNT',
        archivedAt: '2026-06-23T00:00:00.000Z',
        recordStatus: 'ARCHIVED'
      })
    })
    customerManagementAdapter.convertLeadToProspectCustomer.mockResolvedValue({
      resultType: 'CONVERTED',
      crmAccount: buildCrmAccount({
        lifecycleStage: 'PROSPECT_CUSTOMER',
        tenantPartyId: 'tenant-party-1'
      }),
      candidates: [],
      existingCrmAccountId: ''
    })
    customerManagementAdapter.deleteDraftLead.mockResolvedValue({
      deleted: true,
      crmAccountId: 'crm-account-1'
    })

    const leadInput = {
      displayName: 'Acme Importers',
      partyTypeHint: 'ORGANIZATION',
      leadCompanyName: 'Acme Importers Ltd',
      leadDomain: 'acme.example',
      leadEmail: 'buyer@acme.example',
      leadCountry: 'US',
      priority: 'A',
      sourceType: 'WEB_RESEARCH',
      sourceName: 'Browser research',
      sourceCapturedAt: '2026-06-14T09:00:00.000Z',
      sourceCapturedByAccountId: 'account-1',
      sourceExternalReference: 'research-001',
      sourceRawPayload: { url: 'https://acme.example' },
      sourceNote: 'Found from market research'
    }

    await expect(service.createDraftLead('tenant-1', leadInput, source as any)).resolves.toEqual(
      expect.objectContaining({ recordStatus: 'DRAFT' })
    )
    await service.updateDraftLead('tenant-1', 'crm-account-1', leadInput, source as any)
    await service.submitDraftLead(
      'tenant-1',
      'crm-account-1',
      { claimForCurrentUser: true, duplicateWarningAcknowledged: true },
      source as any
    )
    await service.createLead(
      'tenant-1',
      { ...leadInput, claimForCurrentUser: true, duplicateWarningAcknowledged: true },
      source as any
    )
    await service.claimCrmAccount('tenant-1', 'crm-account-1', source as any)
    await service.releaseCrmAccount('tenant-1', 'crm-account-1', source as any)
    await expect(
      service.archiveCrmAccount(
        'tenant-1',
        'crm-account-1',
        { archiveReason: 'NON_TARGET_ACCOUNT' },
        source as any
      )
    ).resolves.toEqual(
      expect.objectContaining({
        archiveReason: 'NON_TARGET_ACCOUNT',
        recordStatus: 'ARCHIVED'
      })
    )
    await service.convertLeadToProspectCustomer('tenant-1', 'crm-account-1', source as any)
    await expect(
      service.deleteDraftLead('tenant-1', 'crm-account-1', source as any)
    ).resolves.toEqual({
      deleted: true,
      crmAccountId: 'crm-account-1'
    })

    expect(customerManagementAdapter.createLead).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        ownerAccountId: undefined,
        claimForCurrentUser: true
      }),
      source
    )
    expect(customerManagementAdapter.convertLeadToProspectCustomer).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        crmAccountId: 'crm-account-1',
        allowOwnerlessConversion: true
      },
      source
    )
    expect(customerManagementAdapter.releaseCrmAccount).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        crmAccountId: 'crm-account-1'
      },
      source
    )
    expect(customerManagementAdapter.archiveCrmAccount).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        crmAccountId: 'crm-account-1',
        archiveReason: 'NON_TARGET_ACCOUNT'
      },
      source
    )
  })

  it('maps CRM lead assignment intent from entry context without requiring claim permission for own leads', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: {
        aid: 'account-1',
        permissions: ['crm.account.create'],
        scopeLevel: 'TENANT',
        tid: 'tenant-1'
      }
    }
    const leadInput = {
      displayName: 'Acme Importers',
      leadCountry: 'US',
      partyTypeHint: 'ORGANIZATION',
      priority: 'A',
      sourceType: 'WEB_RESEARCH'
    }

    customerManagementAdapter.createLead.mockResolvedValue({
      resultType: 'CREATED',
      crmAccount: buildCrmAccount({ ownerAccountId: 'account-1' }),
      duplicateResult: { resultType: 'NO_DUPLICATE', candidates: [] }
    })
    customerManagementAdapter.submitDraftLead.mockResolvedValue({
      resultType: 'CREATED',
      crmAccount: buildCrmAccount({ ownerAccountId: 'account-1' }),
      duplicateResult: { resultType: 'NO_DUPLICATE', candidates: [] }
    })

    await service.createLead('tenant-1', leadInput, source as any)
    await service.createLead(
      'tenant-1',
      { ...leadInput, assignmentIntent: 'POOL' },
      source as any
    )
    await service.createLead(
      'tenant-1',
      { ...leadInput, sourceType: 'WEBSITE_FORM' },
      source as any
    )
    await service.createLead(
      'tenant-1',
      { ...leadInput, sourceType: 'BROWSER_EXTENSION' },
      source as any
    )
    await service.submitDraftLead('tenant-1', 'crm-account-1', {}, source as any)
    await service.submitDraftLead(
      'tenant-1',
      'crm-account-1',
      { assignmentIntent: 'POOL' },
      source as any
    )

    expect(customerManagementAdapter.createLead).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ assignmentIntent: 'OWNED_BY_OPERATOR' }),
      source
    )
    expect(customerManagementAdapter.createLead).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ assignmentIntent: 'POOL' }),
      source
    )
    expect(customerManagementAdapter.createLead).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ assignmentIntent: 'POOL', sourceType: 'WEBSITE_FORM' }),
      source
    )
    expect(customerManagementAdapter.createLead).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({ assignmentIntent: 'OWNED_BY_OPERATOR', sourceType: 'BROWSER_EXTENSION' }),
      source
    )
    expect(customerManagementAdapter.submitDraftLead).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ assignmentIntent: 'OWNED_BY_OPERATOR' }),
      source
    )
    expect(customerManagementAdapter.submitDraftLead).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ assignmentIntent: 'POOL' }),
      source
    )
  })

  it('does not require claim permission when active lead creation assigns the operator as owner', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', permissions: [], scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    customerManagementAdapter.createLead.mockResolvedValue({
      resultType: 'CREATED',
      crmAccount: buildCrmAccount({ ownerAccountId: 'account-1' }),
      duplicateResult: { resultType: 'NO_DUPLICATE', candidates: [] }
    })

    await expect(
      service.createLead(
        'tenant-1',
        {
          displayName: 'Acme Importers',
          claimForCurrentUser: true,
          sourceType: 'WEB_RESEARCH'
        },
        source as any
      )
    ).resolves.toEqual(expect.objectContaining({ resultType: 'CREATED' }))

    expect(customerManagementAdapter.createLead).toHaveBeenCalledWith(
      expect.objectContaining({
        assignmentIntent: 'OWNED_BY_OPERATOR',
        claimForCurrentUser: true
      }),
      source
    )
  })
})

/** buildCrmAccount creates a generated CRM account-shaped fixture for BFF mapping tests. */
function buildCrmAccount(overrides: Record<string, unknown> = {}) {
  return {
    crmAccountId: 'crm-account-1',
    tenantId: 'tenant-1',
    tenantPartyId: '',
    recordStatus: 'ACTIVE',
    lifecycleStage: 'LEAD',
    partyTypeHint: 'ORGANIZATION',
    displayName: 'Northline Bathworks',
    leadCompanyName: 'Northline Bathworks LLC',
    leadDomain: 'northline.example',
    leadEmail: 'sourcing@northline.example',
    leadCountry: 'US',
    leadIdentifiers: [],
    ownerAccountId: '',
    priority: 'A',
    createdBy: 'account-1',
    ...overrides
  }
}
