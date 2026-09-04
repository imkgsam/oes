import { Reflector } from '@nestjs/core'
import {
  CRM_MANAGEMENT_PERMISSION_CODES,
  REQUIRE_PERMISSIONS_METADATA_KEY
} from '@oes/common/authorization'
import { CustomerManagementController } from '../../../../../../../src/modules/crm-service/interface/http/controllers/customer-management.controller'

// Verifies the customer-management gateway controller exposes only the CRM P1 account workflow surface.
describe('CustomerManagementController', () => {
  const customerManagementService = {
    archiveCrmAccount: jest.fn(),
    checkLeadDuplicate: jest.fn(),
    claimCrmAccount: jest.fn(),
    convertLeadToProspectCustomer: jest.fn(),
    createDraftLead: jest.fn(),
    createLead: jest.fn(),
    deleteDraftLead: jest.fn(),
    getCrmAccount: jest.fn(),
    listSourceRecords: jest.fn(),
    listCrmAccounts: jest.fn(),
    releaseCrmAccount: jest.fn(),
    submitDraftLead: jest.fn(),
    updateCrmAccountIdentifiers: jest.fn(),
    updateDraftLead: jest.fn()
  }

  const controller = new CustomerManagementController(customerManagementService as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('declares permissions on the CRM P1 endpoints', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.listCrmAccounts
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.getCrmAccountP1
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.listSourceRecords
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.checkLeadDuplicate
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.READ_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.createLead
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.createDraftLead
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.updateDraftLead
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.submitDraftLead
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.deleteDraftLead
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.claimCrmAccount
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.CLAIM_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.releaseCrmAccount
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.RELEASE_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.archiveCrmAccount
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.MANAGE_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.updateCrmAccountIdentifiers
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.UPDATE_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.convertLeadToProspectCustomer
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.CONVERT_CRM_ACCOUNT] })
  })

  it('forwards CRM P1 account workflow requests', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }
    const leadBody = {
      displayName: 'Acme Importers',
      partyTypeHint: 'ORGANIZATION',
      leadLegalName: 'Acme Importers Incorporated',
      leadCompanyName: 'Acme Importers Ltd',
      leadDomain: 'acme.example',
      priority: 'A',
      sourceType: 'WEB_RESEARCH'
    } as any

    customerManagementService.listCrmAccounts.mockResolvedValue({
      crmAccounts: [],
      page: 1,
      pageSize: 20,
      total: 0
    })
    customerManagementService.getCrmAccount.mockResolvedValue({ crmAccountId: 'crm-account-1' })
    customerManagementService.listSourceRecords.mockResolvedValue({ sourceRecords: [] })
    customerManagementService.createLead.mockResolvedValue({
      resultType: 'CREATED',
      crmAccount: { crmAccountId: 'crm-account-1' },
      duplicateResult: { resultType: 'NO_DUPLICATE', candidates: [] }
    })
    customerManagementService.createDraftLead.mockResolvedValue({ crmAccountId: 'draft-1' })
    customerManagementService.updateDraftLead.mockResolvedValue({ crmAccountId: 'draft-1' })
    customerManagementService.submitDraftLead.mockResolvedValue({
      resultType: 'CREATED',
      crmAccount: { crmAccountId: 'draft-1' },
      duplicateResult: { resultType: 'NO_DUPLICATE', candidates: [] }
    })
    customerManagementService.deleteDraftLead.mockResolvedValue({
      deleted: true,
      crmAccountId: 'draft-1'
    })
    customerManagementService.claimCrmAccount.mockResolvedValue({ crmAccountId: 'pool-1' })
    customerManagementService.releaseCrmAccount.mockResolvedValue({ crmAccountId: 'owned-1' })
    customerManagementService.archiveCrmAccount.mockResolvedValue({
      archiveReason: 'NON_TARGET_ACCOUNT',
      crmAccountId: 'archived-1',
      recordStatus: 'ARCHIVED'
    })
    customerManagementService.updateCrmAccountIdentifiers.mockResolvedValue({
      crmAccountId: 'crm-account-1',
      leadIdentifiers: [
        {
          identifierType: 'VAT_NO',
          issuerCountryOrRegion: 'US',
          normalizedValue: 'US-91-4432102',
          rawValue: '91-4432102'
        }
      ]
    })
    customerManagementService.checkLeadDuplicate.mockResolvedValue({
      duplicateResult: { resultType: 'NO_DUPLICATE', candidates: [] }
    })
    customerManagementService.convertLeadToProspectCustomer.mockResolvedValue({
      resultType: 'CONVERTED',
      crmAccount: { crmAccountId: 'crm-account-1', tenantPartyId: 'tenant-party-1' },
      candidates: [],
      existingCrmAccountId: ''
    })

    await controller.listCrmAccounts(
      'tenant-1',
      {
        keyword: 'acme',
        lifecycleStages: ['LEAD', 'PROSPECT_CUSTOMER'],
        ownerless: true,
        page: 1,
        pageSize: 20,
        recordStatus: 'ACTIVE'
      } as any,
      source as any
    )
    await controller.getCrmAccountP1('tenant-1', 'crm-account-1', source as any)
    await controller.listSourceRecords('tenant-1', 'crm-account-1', source as any)
    await controller.checkLeadDuplicate('tenant-1', { leadEmail: 'buyer@acme.example' }, source as any)
    await controller.createLead('tenant-1', leadBody, source as any)
    await controller.createDraftLead('tenant-1', leadBody, source as any)
    await controller.updateDraftLead('tenant-1', 'draft-1', leadBody, source as any)
    await controller.submitDraftLead('tenant-1', 'draft-1', { claimForCurrentUser: true }, source as any)
    await controller.deleteDraftLead('tenant-1', 'draft-1', source as any)
    await controller.claimCrmAccount('tenant-1', 'pool-1', source as any)
    await controller.releaseCrmAccount('tenant-1', 'owned-1', source as any)
    await controller.archiveCrmAccount(
      'tenant-1',
      'archived-1',
      { archiveReason: 'NON_TARGET_ACCOUNT' } as any,
      source as any
    )
    await controller.updateCrmAccountIdentifiers(
      'tenant-1',
      'crm-account-1',
      {
        leadIdentifiers: [
          {
            identifierType: 'VAT_NO',
            issuerCountryOrRegion: 'US',
            normalizedValue: 'US-91-4432102',
            rawValue: '91-4432102'
          }
        ]
      } as any,
      source as any
    )
    await controller.convertLeadToProspectCustomer(
      'tenant-1',
      'crm-account-1',
      { legalName: 'Acme Importers Incorporated' },
      source as any
    )

    expect(customerManagementService.listCrmAccounts).toHaveBeenCalledWith(
      'tenant-1',
      {
        keyword: 'acme',
        lifecycleStage: undefined,
        lifecycleStages: ['LEAD', 'PROSPECT_CUSTOMER'],
        ownerAccountId: undefined,
        createdBy: undefined,
        ownerless: true,
        page: 1,
        pageSize: 20,
        recordStatus: 'ACTIVE'
      },
      source
    )
    expect(customerManagementService.listSourceRecords).toHaveBeenCalledWith(
      'tenant-1',
      'crm-account-1',
      source
    )
    expect(customerManagementService.createDraftLead).toHaveBeenCalledWith('tenant-1', leadBody, source)
    expect(customerManagementService.updateDraftLead).toHaveBeenCalledWith(
      'tenant-1',
      'draft-1',
      leadBody,
      source
    )
    expect(customerManagementService.submitDraftLead).toHaveBeenCalledWith(
      'tenant-1',
      'draft-1',
      { claimForCurrentUser: true },
      source
    )
    expect(customerManagementService.claimCrmAccount).toHaveBeenCalledWith(
      'tenant-1',
      'pool-1',
      source
    )
    expect(customerManagementService.releaseCrmAccount).toHaveBeenCalledWith(
      'tenant-1',
      'owned-1',
      source
    )
    expect(customerManagementService.archiveCrmAccount).toHaveBeenCalledWith(
      'tenant-1',
      'archived-1',
      { archiveReason: 'NON_TARGET_ACCOUNT' },
      source
    )
    expect(customerManagementService.updateCrmAccountIdentifiers).toHaveBeenCalledWith(
      'tenant-1',
      'crm-account-1',
      {
        leadIdentifiers: [
          {
            identifierType: 'VAT_NO',
            issuerCountryOrRegion: 'US',
            normalizedValue: 'US-91-4432102',
            rawValue: '91-4432102'
          }
        ]
      },
      source
    )
    expect(customerManagementService.convertLeadToProspectCustomer).toHaveBeenCalledWith(
      'tenant-1',
      'crm-account-1',
      { legalName: 'Acme Importers Incorporated' },
      source
    )
  })
})
