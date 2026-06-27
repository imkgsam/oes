import { GetCrmAccountQuery } from '../../src/application/queries/get-crm-account.query'
import { ListCrmAccountsQuery } from '../../src/application/queries/list-crm-accounts.query'
import { ListSourceRecordsQuery } from '../../src/application/queries/list-source-records.query'
import {
  CrmAccountLifecycleStage,
  CrmAccountRecordStatus,
  CrmAccountTypeHint,
  CrmPriority,
  CrmSourceType
} from '../../src/domain/models/crm-records'
import { CustomerQueryGrpcController } from '../../src/interfaces/grpc/customer-query.grpc.controller'

const crmAccount = {
  id: 'crm-account-1',
  tenantId: 'tenant-1',
  tenantPartyId: '',
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

const queryContext = {
  tenantId: 'tenant-1',
  operatorContext: {
    operatorId: 'operator-1',
    operatorType: 'HUMAN',
    orgId: 'org-1'
  },
  traceContext: {
    traceId: 'trace-1',
    requestId: 'request-1'
  }
}

const sourceRecord = {
  id: 'source-1',
  tenantId: 'tenant-1',
  crmAccountId: 'crm-account-1',
  sourceType: CrmSourceType.WEB_RESEARCH,
  sourceName: 'Research page',
  capturedAt: new Date('2026-06-24T08:00:00.000Z'),
  capturedByAccountId: 'sales-1',
  externalReference: 'https://northline.example',
  rawPayload: { url: 'https://northline.example' },
  note: 'Found through research',
  isPrimary: true,
  createdAt: new Date('2026-06-24T08:01:00.000Z'),
  updatedAt: new Date('2026-06-24T08:02:00.000Z')
}

function createController(result: unknown) {
  const queryBus = {
    execute: jest.fn().mockResolvedValue(result)
  }
  return {
    controller: new CustomerQueryGrpcController(queryBus as never),
    queryBus
  }
}

describe('crm-service P1 query gRPC controller L3', () => {
  it('ListCrmAccounts / should map P1 filters and render P1 account page', async () => {
    const harness = createController({
      crmAccounts: [crmAccount],
      total: 1,
      page: 2,
      pageSize: 10
    })

    const response = await harness.controller.listCrmAccounts({
      ...queryContext,
      keyword: 'northline',
      lifecycleStage: 'LEAD',
      recordStatus: 'ACTIVE',
      ownerAccountId: 'sales-1',
      page: 2,
      pageSize: 10
    })

    expect(harness.queryBus.execute).toHaveBeenCalledWith(expect.any(ListCrmAccountsQuery))
    expect(harness.queryBus.execute.mock.calls[0][0]).toMatchObject({
      input: {
        tenantId: 'tenant-1',
        keyword: 'northline',
        lifecycleStage: CrmAccountLifecycleStage.LEAD,
        recordStatus: CrmAccountRecordStatus.ACTIVE,
        ownerAccountId: 'sales-1',
        page: 2,
        pageSize: 10
      }
    })
    expect(response).toEqual({
      crmAccounts: [
        expect.objectContaining({
          crmAccountId: 'crm-account-1',
          lifecycleStage: 'LEAD',
          recordStatus: 'ACTIVE'
        })
      ],
      total: 1,
      page: 2,
      pageSize: 10
    })
  })

  it('ListCrmAccounts / should preserve archived record status filters', async () => {
    const harness = createController({
      crmAccounts: [],
      total: 0,
      page: 1,
      pageSize: 20
    })

    await harness.controller.listCrmAccounts({
      ...queryContext,
      ownerAccountId: 'sales-1',
      recordStatus: 'ARCHIVED',
      page: 1,
      pageSize: 20
    })

    expect(harness.queryBus.execute.mock.calls[0][0]).toMatchObject({
      input: {
        ownerAccountId: 'sales-1',
        recordStatus: CrmAccountRecordStatus.ARCHIVED
      }
    })
  })

  it('GetCrmAccount / should map id and render one P1 account', async () => {
    const harness = createController({
      crmAccount
    })

    const response = await harness.controller.getCrmAccount({
      ...queryContext,
      crmAccountId: 'crm-account-1'
    })

    expect(harness.queryBus.execute).toHaveBeenCalledWith(expect.any(GetCrmAccountQuery))
    expect(harness.queryBus.execute.mock.calls[0][0]).toMatchObject({
      tenantId: 'tenant-1',
      crmAccountId: 'crm-account-1'
    })
    expect(response).toEqual({
      crmAccount: expect.objectContaining({
        crmAccountId: 'crm-account-1',
        displayName: 'Northline Bathworks'
      })
    })
  })

  it('ListSourceRecords / should map account id and render source evidence', async () => {
    const harness = createController({
      sourceRecords: [sourceRecord]
    })

    const response = await harness.controller.listSourceRecords({
      ...queryContext,
      crmAccountId: 'crm-account-1'
    })

    expect(harness.queryBus.execute).toHaveBeenCalledWith(expect.any(ListSourceRecordsQuery))
    expect(harness.queryBus.execute.mock.calls[0][0]).toMatchObject({
      tenantId: 'tenant-1',
      crmAccountId: 'crm-account-1'
    })
    expect(response).toEqual({
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
  })
})
