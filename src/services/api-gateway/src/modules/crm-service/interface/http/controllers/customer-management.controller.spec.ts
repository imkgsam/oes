import { Reflector } from '@nestjs/core'
import {
  CRM_MANAGEMENT_PERMISSION_CODES,
  REQUIRE_PERMISSIONS_METADATA_KEY
} from '@oes/common/authorization'
import { CustomerManagementController } from './customer-management.controller'

// Verifies the customer-management gateway controller exposes only the CRM P1 BFF surface.
describe('CustomerManagementController', () => {
  const customerManagementService = {
    archiveCrmAccount: jest.fn(),
    convertLeadToProspectCustomer: jest.fn(),
    createLead: jest.fn(),
    getCrmAccount: jest.fn(),
    listCrmAccounts: jest.fn(),
    restoreCrmAccount: jest.fn()
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
        CustomerManagementController.prototype.createLead
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.CREATE_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.convertLeadToProspectCustomer
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.CONVERT_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.archiveCrmAccount
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.ARCHIVE_CRM_ACCOUNT] })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.restoreCrmAccount
      )
    ).toEqual({ all: [CRM_MANAGEMENT_PERMISSION_CODES.ARCHIVE_CRM_ACCOUNT] })
  })

  it('forwards CRM P1 list, detail, lead creation, and conversion requests', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }

    customerManagementService.listCrmAccounts.mockResolvedValue({
      crmAccounts: [],
      page: 1,
      pageSize: 20,
      total: 0
    })
    customerManagementService.getCrmAccount.mockResolvedValue({
      crmAccountId: 'crm-account-1'
    })
    customerManagementService.createLead.mockResolvedValue({
      resultType: 'CREATED',
      crmAccount: { crmAccountId: 'crm-account-1' },
      duplicateResult: { resultType: 'NO_DUPLICATE', candidates: [] }
    })
    customerManagementService.convertLeadToProspectCustomer.mockResolvedValue({
      resultType: 'CONVERTED',
      crmAccount: { crmAccountId: 'crm-account-1', tenantPartyId: 'tenant-party-1' },
      candidates: [],
      existingCrmAccountId: ''
    })
    customerManagementService.archiveCrmAccount.mockResolvedValue({
      crmAccountId: 'crm-account-1',
      recordStatus: 'ARCHIVED'
    })
    customerManagementService.restoreCrmAccount.mockResolvedValue({
      crmAccountId: 'crm-account-1',
      recordStatus: 'ACTIVE'
    })

    await controller.listCrmAccounts(
      'tenant-1',
      {
        keyword: 'acme',
        lifecycleStage: 'LEAD',
        ownerAccountId: 'account-1',
        page: 1,
        pageSize: 20,
        recordStatus: 'ACTIVE'
      } as any,
      source as any
    )
    await controller.getCrmAccountP1('tenant-1', 'crm-account-1', source as any)
    await controller.createLead(
      'tenant-1',
      {
        displayName: 'Acme Importers',
        partyTypeHint: 'ORGANIZATION',
        leadCompanyName: 'Acme Importers Ltd',
        leadDomain: 'acme.example',
        priority: 'A',
        sourceType: 'WEB_RESEARCH'
      } as any,
      source as any
    )
    await controller.convertLeadToProspectCustomer('tenant-1', 'crm-account-1', source as any)
    await controller.archiveCrmAccount('tenant-1', 'crm-account-1', source as any)
    await controller.restoreCrmAccount('tenant-1', 'crm-account-1', source as any)

    expect(customerManagementService.listCrmAccounts).toHaveBeenCalledWith(
      'tenant-1',
      {
        keyword: 'acme',
        lifecycleStage: 'LEAD',
        ownerAccountId: 'account-1',
        page: 1,
        pageSize: 20,
        recordStatus: 'ACTIVE'
      },
      source
    )
    expect(customerManagementService.getCrmAccount).toHaveBeenCalledWith(
      'tenant-1',
      'crm-account-1',
      source
    )
    expect(customerManagementService.createLead).toHaveBeenCalledWith(
      'tenant-1',
      {
        displayName: 'Acme Importers',
        partyTypeHint: 'ORGANIZATION',
        leadCompanyName: 'Acme Importers Ltd',
        leadDomain: 'acme.example',
        priority: 'A',
        sourceType: 'WEB_RESEARCH'
      },
      source
    )
    expect(customerManagementService.convertLeadToProspectCustomer).toHaveBeenCalledWith(
      'tenant-1',
      'crm-account-1',
      source
    )
    expect(customerManagementService.archiveCrmAccount).toHaveBeenCalledWith(
      'tenant-1',
      'crm-account-1',
      source
    )
    expect(customerManagementService.restoreCrmAccount).toHaveBeenCalledWith(
      'tenant-1',
      'crm-account-1',
      source
    )
  })
})
