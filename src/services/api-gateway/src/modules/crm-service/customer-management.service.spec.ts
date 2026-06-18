import { ForbiddenException } from '@nestjs/common'
import { CustomerManagementService } from './customer-management.service'

// Verifies the gateway customer-management service maps only the CRM P1 BFF surface and enforces tenant scope.
describe('CustomerManagementService', () => {
  const customerQueryAdapter = {
    getCrmAccount: jest.fn(),
    listCrmAccounts: jest.fn()
  }
  const customerManagementAdapter = {
    archiveCrmAccount: jest.fn(),
    convertLeadToProspectCustomer: jest.fn(),
    createLead: jest.fn(),
    restoreCrmAccount: jest.fn()
  }

  const service = new CustomerManagementService(
    customerQueryAdapter as any,
    customerManagementAdapter as any
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects tenant-scoped operators when they request another tenant CRM account list', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    await expect(
      service.listCrmAccounts(
        'tenant-2',
        {
          page: 1,
          pageSize: 20
        },
        source as any
      )
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(customerQueryAdapter.listCrmAccounts).not.toHaveBeenCalled()
  })

  it('maps CRM P1 lead creation, formalization, and archive operations into the BFF model', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    customerManagementAdapter.createLead.mockResolvedValue({
      resultType: 'CREATED',
      crmAccount: {
        crmAccountId: 'crm-account-1',
        tenantId: 'tenant-1',
        tenantPartyId: '',
        recordStatus: 'ACTIVE',
        lifecycleStage: 'LEAD',
        partyTypeHint: 'ORGANIZATION',
        displayName: 'Acme Importers',
        leadCompanyName: 'Acme Importers Ltd',
        leadDomain: 'acme.example',
        leadEmail: 'buyer@acme.example',
        leadCountry: 'US',
        leadIdentifiers: [],
        ownerAccountId: 'account-1',
        priority: 'A',
        createdBy: 'account-1'
      },
      duplicateResult: {
        resultType: 'NO_DUPLICATE',
        candidates: []
      }
    })
    customerManagementAdapter.convertLeadToProspectCustomer.mockResolvedValue({
      resultType: 'CONVERTED',
      crmAccount: {
        crmAccountId: 'crm-account-1',
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-1',
        recordStatus: 'ACTIVE',
        lifecycleStage: 'PROSPECT_CUSTOMER',
        partyTypeHint: 'ORGANIZATION',
        displayName: 'Acme Importers',
        leadCompanyName: 'Acme Importers Ltd',
        leadDomain: 'acme.example',
        leadEmail: 'buyer@acme.example',
        leadCountry: 'US',
        leadIdentifiers: [],
        ownerAccountId: 'account-1',
        priority: 'A',
        createdBy: 'account-1'
      },
      candidates: [],
      existingCrmAccountId: ''
    })
    customerManagementAdapter.archiveCrmAccount.mockResolvedValue({
      crmAccount: {
        crmAccountId: 'crm-account-1',
        tenantId: 'tenant-1',
        tenantPartyId: '',
        recordStatus: 'ARCHIVED',
        lifecycleStage: 'LEAD',
        partyTypeHint: 'ORGANIZATION',
        displayName: 'Acme Importers',
        leadCompanyName: 'Acme Importers Ltd',
        leadDomain: 'acme.example',
        leadEmail: 'buyer@acme.example',
        leadCountry: 'US',
        leadIdentifiers: [],
        ownerAccountId: 'account-1',
        priority: 'A',
        createdBy: 'account-1',
        archivedAt: '2026-06-14T10:00:00.000Z'
      }
    })
    customerManagementAdapter.restoreCrmAccount.mockResolvedValue({
      crmAccount: {
        crmAccountId: 'crm-account-1',
        tenantId: 'tenant-1',
        tenantPartyId: '',
        recordStatus: 'ACTIVE',
        lifecycleStage: 'LEAD',
        partyTypeHint: 'ORGANIZATION',
        displayName: 'Acme Importers',
        leadCompanyName: 'Acme Importers Ltd',
        leadDomain: 'acme.example',
        leadEmail: 'buyer@acme.example',
        leadCountry: 'US',
        leadIdentifiers: [],
        ownerAccountId: 'account-1',
        priority: 'A',
        createdBy: 'account-1',
        archivedAt: ''
      }
    })

    await expect(
      service.createLead(
        'tenant-1',
        {
          displayName: 'Acme Importers',
          partyTypeHint: 'ORGANIZATION',
          leadCompanyName: 'Acme Importers Ltd',
          leadDomain: 'acme.example',
          leadEmail: 'buyer@acme.example',
          leadCountry: 'US',
          ownerAccountId: 'account-1',
          priority: 'A',
          sourceType: 'WEB_RESEARCH',
          sourceName: 'Browser research',
          sourceCapturedAt: '2026-06-14T09:00:00.000Z',
          sourceCapturedByAccountId: 'account-1',
          sourceExternalReference: 'research-001',
          sourceRawPayload: { url: 'https://acme.example' },
          sourceNote: 'Found from market research'
        },
        source as any
      )
    ).resolves.toEqual({
      resultType: 'CREATED',
      crmAccount: expect.objectContaining({
        crmAccountId: 'crm-account-1',
        lifecycleStage: 'LEAD',
        recordStatus: 'ACTIVE'
      }),
      duplicateResult: {
        resultType: 'NO_DUPLICATE',
        candidates: []
      }
    })
    await expect(
      service.convertLeadToProspectCustomer('tenant-1', 'crm-account-1', source as any)
    ).resolves.toEqual({
      resultType: 'CONVERTED',
      crmAccount: expect.objectContaining({
        crmAccountId: 'crm-account-1',
        lifecycleStage: 'PROSPECT_CUSTOMER',
        tenantPartyId: 'tenant-party-1'
      }),
      candidates: [],
      existingCrmAccountId: ''
    })
    await expect(
      service.archiveCrmAccount('tenant-1', 'crm-account-1', source as any)
    ).resolves.toEqual(expect.objectContaining({
      crmAccountId: 'crm-account-1',
      lifecycleStage: 'LEAD',
      recordStatus: 'ARCHIVED',
      archivedAt: '2026-06-14T10:00:00.000Z'
    }))
    await expect(
      service.restoreCrmAccount('tenant-1', 'crm-account-1', source as any)
    ).resolves.toEqual(expect.objectContaining({
      crmAccountId: 'crm-account-1',
      lifecycleStage: 'LEAD',
      recordStatus: 'ACTIVE',
      archivedAt: ''
    }))

    expect(customerManagementAdapter.createLead).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        displayName: 'Acme Importers',
        partyTypeHint: 'ORGANIZATION',
        leadCompanyName: 'Acme Importers Ltd',
        leadPersonName: undefined,
        leadDomain: 'acme.example',
        leadEmail: 'buyer@acme.example',
        leadPhone: undefined,
        leadWhatsapp: undefined,
        leadCountry: 'US',
        leadIdentifiers: [],
        ownerAccountId: 'account-1',
        priority: 'A',
        nextFollowUpAt: undefined,
        duplicateWarningAcknowledged: false,
        sourceType: 'WEB_RESEARCH',
        sourceName: 'Browser research',
        sourceCapturedAt: '2026-06-14T09:00:00.000Z',
        sourceCapturedByAccountId: 'account-1',
        sourceExternalReference: 'research-001',
        sourceRawPayloadJson: '{"url":"https://acme.example"}',
        sourceNote: 'Found from market research'
      },
      source
    )
    expect(customerManagementAdapter.convertLeadToProspectCustomer).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        crmAccountId: 'crm-account-1'
      },
      source
    )
    expect(customerManagementAdapter.archiveCrmAccount).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        crmAccountId: 'crm-account-1'
      },
      source
    )
    expect(customerManagementAdapter.restoreCrmAccount).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        crmAccountId: 'crm-account-1'
      },
      source
    )
  })

  it('maps CRM P1 account list and detail queries into the BFF model', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }
    const crmAccount = {
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
      ownerAccountId: 'account-1',
      priority: 'A',
      createdBy: 'account-1'
    }

    customerQueryAdapter.listCrmAccounts.mockResolvedValue({
      crmAccounts: [crmAccount],
      total: 1,
      page: 1,
      pageSize: 20
    })
    customerQueryAdapter.getCrmAccount.mockResolvedValue({
      crmAccount
    })

    await expect(
      service.listCrmAccounts(
        'tenant-1',
        {
          keyword: 'northline',
          lifecycleStage: 'LEAD',
          ownerAccountId: 'account-1',
          page: 1,
          pageSize: 20,
          recordStatus: 'ACTIVE'
        },
        source as any
      )
    ).resolves.toEqual({
      crmAccounts: [expect.objectContaining({ crmAccountId: 'crm-account-1' })],
      page: 1,
      pageSize: 20,
      total: 1
    })
    await expect(
      service.getCrmAccount('tenant-1', 'crm-account-1', source as any)
    ).resolves.toEqual(expect.objectContaining({ crmAccountId: 'crm-account-1' }))

    expect(customerQueryAdapter.listCrmAccounts).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        keyword: 'northline',
        lifecycleStage: 'LEAD',
        recordStatus: 'ACTIVE',
        ownerAccountId: 'account-1',
        page: 1,
        pageSize: 20
      },
      source
    )
    expect(customerQueryAdapter.getCrmAccount).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        crmAccountId: 'crm-account-1'
      },
      source
    )
  })
})
