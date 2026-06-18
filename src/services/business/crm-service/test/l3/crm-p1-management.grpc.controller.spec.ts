import { CreateLeadCommand } from '../../src/application/commands/create-lead.command'
import { ConvertLeadToProspectCustomerCommand } from '../../src/application/commands/convert-lead-to-prospect-customer.command'
import {
  CrmAccountLifecycleStage,
  CrmAccountRecord,
  CrmAccountRecordStatus,
  CrmAccountTypeHint,
  CrmLeadConversionResultType,
  CrmLeadCreateResultType,
  CrmPriority,
  CrmSourceType
} from '../../src/domain/models/crm-records'
import { CustomerManagementGrpcController } from '../../src/interfaces/grpc/customer-management.grpc.controller'

function createCrmAccount(overrides: Partial<CrmAccountRecord> = {}): CrmAccountRecord {
  return {
    id: 'crm-account-1',
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
    ownerAccountId: 'operator-1',
    priority: CrmPriority.A,
    lastActivityAt: null,
    nextFollowUpAt: null,
    createdBy: 'operator-1',
    ...overrides
  }
}

function createController(result: unknown) {
  const commandBus = {
    execute: jest.fn().mockResolvedValue(result)
  }
  const auditService = {
    recordCommand: jest.fn((_metadata, callback) => callback())
  }

  return {
    controller: new CustomerManagementGrpcController(commandBus as never, auditService as never) as never as {
      createLead(request: Record<string, unknown>): Promise<unknown>
      convertLeadToProspectCustomer(request: Record<string, unknown>): Promise<unknown>
    },
    commandBus,
    auditService
  }
}

const managementContext = {
  tenantId: 'tenant-1',
  operatorContext: {
    operatorId: 'operator-1',
    operatorType: 'HUMAN',
    orgId: 'org-1'
  },
  traceContext: {
    traceId: 'trace-1',
    requestId: 'request-1'
  },
  auditContext: {
    auditId: 'audit-1',
    reason: 'crm p1 operation',
    source: 'crm-workspace'
  }
}

describe('crm-service P1 management gRPC controller L3', () => {
  it('CreateLead / should map request to CreateLeadCommand and render P1 account response', async () => {
    const account = createCrmAccount()
    const harness = createController({
      resultType: CrmLeadCreateResultType.CREATED,
      account,
      duplicateResult: {
        resultType: 'NO_DUPLICATE',
        candidates: []
      }
    })

    const response = await harness.controller.createLead({
      ...managementContext,
      displayName: 'Acme Importers',
      partyTypeHint: 'ORGANIZATION',
      leadCompanyName: 'Acme Importers Ltd',
      leadDomain: 'acme.example',
      leadEmail: 'buyer@acme.example',
      leadCountry: 'US',
      ownerAccountId: 'operator-1',
      priority: 'A',
      sourceType: 'WEB_RESEARCH',
      sourceName: 'Browser research',
      sourceCapturedAt: '2026-06-14T09:00:00.000Z',
      sourceCapturedByAccountId: 'operator-1',
      sourceExternalReference: 'research-001',
      sourceRawPayloadJson: '{"url":"https://acme.example"}',
      sourceNote: 'Found from market research'
    })

    expect(harness.commandBus.execute).toHaveBeenCalledWith(expect.any(CreateLeadCommand))
    expect(harness.commandBus.execute.mock.calls[0][0]).toMatchObject({
      props: expect.objectContaining({
        tenantId: 'tenant-1',
        operatorAccountId: 'operator-1',
        displayName: 'Acme Importers',
        partyTypeHint: CrmAccountTypeHint.ORGANIZATION,
        priority: CrmPriority.A,
        source: expect.objectContaining({
          sourceType: CrmSourceType.WEB_RESEARCH,
          externalReference: 'research-001',
          rawPayload: { url: 'https://acme.example' }
        })
      })
    })
    expect(response).toEqual({
      resultType: 'CREATED',
      crmAccount: expect.objectContaining({
        crmAccountId: 'crm-account-1',
        tenantId: 'tenant-1',
        lifecycleStage: 'LEAD',
        recordStatus: 'ACTIVE',
        priority: 'A'
      }),
      duplicateResult: expect.objectContaining({
        resultType: 'NO_DUPLICATE'
      })
    })
    expect(harness.auditService.recordCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        commandName: 'CreateLead',
        resourceType: 'crm_account'
      }),
      expect.any(Function)
    )
  })

  it('ConvertLeadToProspectCustomer / should map request to command and render conversion result', async () => {
    const account = createCrmAccount({
      tenantPartyId: 'tenant-party-1',
      lifecycleStage: CrmAccountLifecycleStage.PROSPECT_CUSTOMER
    })
    const harness = createController({
      resultType: CrmLeadConversionResultType.CONVERTED,
      account,
      candidates: []
    })

    const response = await harness.controller.convertLeadToProspectCustomer({
      ...managementContext,
      crmAccountId: 'crm-account-1'
    })

    expect(harness.commandBus.execute).toHaveBeenCalledWith(expect.any(ConvertLeadToProspectCustomerCommand))
    expect(harness.commandBus.execute.mock.calls[0][0]).toMatchObject({
      props: {
        tenantId: 'tenant-1',
        crmAccountId: 'crm-account-1',
        operatorAccountId: 'operator-1'
      }
    })
    expect(response).toEqual({
      resultType: 'CONVERTED',
      crmAccount: expect.objectContaining({
        crmAccountId: 'crm-account-1',
        tenantPartyId: 'tenant-party-1',
        lifecycleStage: 'PROSPECT_CUSTOMER'
      }),
      candidates: [],
      existingCrmAccountId: ''
    })
  })
})
