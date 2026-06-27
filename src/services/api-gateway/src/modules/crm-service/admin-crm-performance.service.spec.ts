import { ForbiddenException } from '@nestjs/common'
import { AdminCrmPerformanceService } from './admin-crm-performance.service'

describe('AdminCrmPerformanceService', () => {
  const customerManagementService = {
    listCrmAccounts: jest.fn(),
    listSourceRecords: jest.fn()
  }

  const service = new AdminCrmPerformanceService(customerManagementService as any)

  const source = {
    requestId: 'req-1',
    traceId: 'trace-1',
    user: { aid: 'admin-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('builds an employee performance overview from CRM accounts and source records without fabricating unavailable metrics', async () => {
    customerManagementService.listCrmAccounts.mockResolvedValue({
      crmAccounts: [
        buildAccount({
          crmAccountId: 'crm-1',
          createdAt: '2026-06-24T08:00:00.000Z',
          createdBy: 'sales-1',
          createdByDisplayName: 'Mira Tan',
          ownerAccountId: 'sales-1',
          ownerDisplayName: 'Mira Tan'
        }),
        buildAccount({
          crmAccountId: 'crm-2',
          createdAt: '2026-06-24T09:00:00.000Z',
          createdBy: 'sales-2',
          createdByDisplayName: 'Daniel Ibarra',
          ownerAccountId: 'sales-2',
          ownerDisplayName: 'Daniel Ibarra'
        }),
        buildAccount({
          crmAccountId: 'crm-3',
          createdAt: '2026-06-24T10:00:00.000Z',
          createdBy: 'sales-1',
          createdByDisplayName: 'Mira Tan',
          lifecycleStage: 'CUSTOMER',
          ownerAccountId: 'sales-1',
          ownerDisplayName: 'Mira Tan'
        })
      ],
      page: 1,
      pageSize: 100,
      total: 3
    })
    customerManagementService.listSourceRecords.mockImplementation(async (_tenantId: string, crmAccountId: string) => ({
      sourceRecords: crmAccountId === 'crm-1'
        ? [
            buildSource({
              crmAccountId,
              sourceRecordId: 'source-1',
              sourceType: 'BROWSER_EXTENSION',
              capturedAt: '2026-06-24T08:10:00.000Z',
              capturedByAccountId: 'sales-1',
              capturedByDisplayName: 'Mira Tan'
            }),
            buildSource({
              crmAccountId,
              sourceRecordId: 'source-2',
              sourceType: 'WEB_RESEARCH',
              capturedAt: '2026-06-24T08:20:00.000Z',
              capturedByAccountId: 'sales-1',
              capturedByDisplayName: 'Mira Tan'
            })
          ]
        : [
            buildSource({
              crmAccountId,
              sourceRecordId: `source-${crmAccountId}`,
              sourceType: 'IMPORTED_LIST',
              capturedAt: '2026-06-24T09:20:00.000Z',
              capturedByAccountId: crmAccountId === 'crm-2' ? 'sales-2' : 'sales-1',
              capturedByDisplayName: crmAccountId === 'crm-2' ? 'Daniel Ibarra' : 'Mira Tan'
            })
          ]
    }))

    await expect(
      service.getOverview({ employeeAccountId: 'sales-1', period: 'LAST_7_DAYS' }, source as any)
    ).resolves.toEqual(
      expect.objectContaining({
        selectedEmployee: expect.objectContaining({
          accountId: 'sales-1',
          displayName: 'Mira Tan'
        }),
        employees: expect.arrayContaining([
          expect.objectContaining({ accountId: 'sales-1', displayName: 'Mira Tan', newLeadCount: 1 }),
          expect.objectContaining({ accountId: 'sales-2', displayName: 'Daniel Ibarra', newLeadCount: 1 })
        ]),
        overview: expect.arrayContaining([
          expect.objectContaining({ key: 'newLeads', value: 1, unavailable: false }),
          expect.objectContaining({ key: 'browserExtensionRecognitions', value: 1, unavailable: false }),
          expect.objectContaining({ key: 'duplicateBlocks', unavailable: true }),
          expect.objectContaining({ key: 'followUpCompletionRate', unavailable: true })
        ]),
        sourceBreakdown: [
          expect.objectContaining({ sourceType: 'BROWSER_EXTENSION', count: 1 }),
          expect.objectContaining({ sourceType: 'IMPORTED_LIST', count: 1 }),
          expect.objectContaining({ sourceType: 'WEB_RESEARCH', count: 1 })
        ],
        unavailableMetrics: expect.arrayContaining([
          expect.objectContaining({ key: 'duplicateBlocks' }),
          expect.objectContaining({ key: 'followUpCompletionRate' })
        ])
      })
    )

    expect(customerManagementService.listCrmAccounts).toHaveBeenCalledWith(
      'tenant-1',
      { page: 1, pageSize: 100 },
      source
    )
    expect(customerManagementService.listSourceRecords).toHaveBeenCalledTimes(3)
  })

  it('uses the current operator as the default employee when the query does not select one', async () => {
    customerManagementService.listCrmAccounts.mockResolvedValue({
      crmAccounts: [
        buildAccount({
          createdBy: 'admin-1',
          createdByDisplayName: 'Current Admin',
          ownerAccountId: 'admin-1',
          ownerDisplayName: 'Current Admin'
        })
      ],
      page: 1,
      pageSize: 100,
      total: 1
    })
    customerManagementService.listSourceRecords.mockResolvedValue({ sourceRecords: [] })

    const result = await service.getOverview({}, source as any)

    expect(result.selectedEmployee.accountId).toBe('admin-1')
  })

  it('rejects requests without tenant context', async () => {
    await expect(service.getOverview({}, { user: { aid: 'admin-1' } } as any)).rejects.toBeInstanceOf(
      ForbiddenException
    )
  })
})

function buildAccount(overrides: Record<string, unknown> = {}) {
  return {
    archiveReason: '',
    archivedAt: '',
    createdAt: '2026-06-24T08:00:00.000Z',
    createdBy: 'sales-1',
    createdByDisplayName: 'Mira Tan',
    crmAccountId: 'crm-1',
    displayName: 'Serrano Fixtures',
    lifecycleStage: 'LEAD',
    ownerAccountId: 'sales-1',
    ownerDisplayName: 'Mira Tan',
    recordStatus: 'ACTIVE',
    ...overrides
  }
}

function buildSource(overrides: Record<string, unknown> = {}) {
  return {
    capturedAt: '2026-06-24T08:10:00.000Z',
    capturedByAccountId: 'sales-1',
    capturedByDisplayName: 'Mira Tan',
    crmAccountId: 'crm-1',
    externalReference: 'https://serrano.example',
    isPrimary: true,
    note: '',
    rawPayload: null,
    sourceName: 'Browser CRM capture',
    sourceRecordId: 'source-1',
    sourceType: 'BROWSER_EXTENSION',
    ...overrides
  }
}
