import { ExtensionCrmWorkspaceService } from './extension-crm-workspace.service'

describe('ExtensionCrmWorkspaceService', () => {
  const customerManagementService = {
    checkLeadDuplicate: jest.fn(),
    claimCrmAccount: jest.fn(),
    createDraftLead: jest.fn(),
    createLead: jest.fn(),
    getCrmAccount: jest.fn()
  }
  const permissionAccessSummaryAdapter = {
    getAccountAccessSummary: jest.fn()
  }

  const service = new ExtensionCrmWorkspaceService(
    customerManagementService as any,
    permissionAccessSummaryAdapter as any
  )
  const source = {
    requestId: 'req-1',
    traceId: 'trace-1',
    user: {
      aid: 'account-1',
      scopeLevel: 'TENANT',
      terminal: 'BROWSER_EXTENSION',
      tid: 'tenant-1'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    permissionAccessSummaryAdapter.getAccountAccessSummary.mockResolvedValue({
      actionCodes: ['crm.account.read', 'crm.account.create', 'crm.account.claim']
    })
  })

  it('resolves an unknown official site with create actions from CRM duplicate semantics', async () => {
    customerManagementService.checkLeadDuplicate.mockResolvedValue({
      duplicateResult: { resultType: 'NO_DUPLICATE', candidates: [] }
    })

    await expect(
      service.resolvePageContext(
        {
          page: {
            capturedAt: '2026-06-23T00:00:00.000Z',
            domain: 'serrano.example',
            pageKind: 'OFFICIAL_SITE',
            title: 'Serrano Fixtures',
            url: 'https://serrano.example',
            visibleEmails: ['imports@serrano.example'],
            visiblePhones: []
          }
        },
        source as any
      )
    ).resolves.toEqual(
      expect.objectContaining({
        allowedActions: ['CHECK_DUPLICATE', 'CREATE_DRAFT_LEAD', 'CREATE_ACTIVE_LEAD'],
        status: 'UNKNOWN'
      })
    )
  })

  it('renders claimable pool duplicate as pool lead without leaking owner detail', async () => {
    customerManagementService.checkLeadDuplicate.mockResolvedValue({
      duplicateResult: {
        resultType: 'CLAIMABLE_EXISTING',
        candidates: [
          {
            confidence: 'HIGH',
            crmAccountId: 'crm-pool-1',
            displayName: 'Serrano Fixtures',
            lifecycleStage: 'LEAD',
            matchedFields: ['leadDomain'],
            ownerAccountId: '',
            recordStatus: 'ACTIVE'
          }
        ]
      }
    })

    await expect(
      service.resolvePageContext(
        {
          page: {
            capturedAt: '2026-06-23T00:00:00.000Z',
            domain: 'serrano.example',
            pageKind: 'OFFICIAL_SITE',
            title: 'Serrano Fixtures',
            url: 'https://serrano.example'
          }
        },
        source as any
      )
    ).resolves.toEqual(
      expect.objectContaining({
        allowedActions: ['CLAIM_POOL_LEAD', 'OPEN_OES_DETAIL'],
        matchedAccount: expect.objectContaining({ crmAccountId: 'crm-pool-1' }),
        status: 'POOL_LEAD'
      })
    )
  })

  it('omits Google search results when CRM has no visible record', async () => {
    customerManagementService.checkLeadDuplicate.mockResolvedValue({
      duplicateResult: { resultType: 'NO_DUPLICATE', candidates: [] }
    })

    await expect(
      service.resolveSearchResults(
        {
          capturedAt: '2026-06-23T00:00:00.000Z',
          query: 'ceramic fixtures',
          results: [
            {
              domain: 'serrano.example',
              title: 'Serrano Fixtures',
              url: 'https://serrano.example'
            }
          ],
          searchEngine: 'GOOGLE'
        },
        source as any
      )
    ).resolves.toEqual({ results: [] })
  })

  it('returns archived CRM matches with CRM-owned archive reason for search result tags', async () => {
    customerManagementService.checkLeadDuplicate.mockResolvedValue({
      duplicateResult: {
        resultType: 'DUPLICATE',
        candidates: [
          {
            archiveReason: 'NON_TARGET_ACCOUNT',
            archivedAt: '2026-06-23T00:00:00.000Z',
            confidence: 'HIGH',
            crmAccountId: 'crm-pc-1',
            displayName: 'Kohler',
            lifecycleStage: 'PROSPECT_CUSTOMER',
            matchedFields: ['leadDomain'],
            ownerAccountId: '',
            recordStatus: 'ARCHIVED'
          }
        ]
      }
    })

    await expect(
      service.resolveSearchResults(
        {
          capturedAt: '2026-06-23T00:00:00.000Z',
          query: 'kohler bathroom fixtures',
          results: [
            {
              domain: 'kohler.example',
              title: 'Kohler',
              url: 'https://kohler.example'
            }
          ],
          searchEngine: 'GOOGLE'
        },
        source as any
      )
    ).resolves.toEqual({
      results: [
        expect.objectContaining({
          allowedActions: [],
          archiveReason: 'NON_TARGET_ACCOUNT',
          archivedAt: '2026-06-23T00:00:00.000Z',
          matchedAccount: expect.objectContaining({
            archiveReason: 'NON_TARGET_ACCOUNT',
            archivedAt: '2026-06-23T00:00:00.000Z',
            crmAccountId: 'crm-pc-1',
            recordStatus: 'ARCHIVED'
          }),
          status: 'PROSPECT_CUSTOMER'
        })
      ]
    })
  })

  it('hydrates archived search result candidates before rendering archive reason tags', async () => {
    customerManagementService.checkLeadDuplicate.mockResolvedValue({
      duplicateResult: {
        resultType: 'OWNED_DUPLICATE',
        candidates: [
          {
            confidence: 'HIGH',
            crmAccountId: 'crm-kohler-1',
            displayName: 'Kohler',
            lifecycleStage: 'LEAD',
            matchedFields: ['leadDomain'],
            ownerAccountId: 'account-1',
            recordStatus: 'ARCHIVED'
          }
        ]
      }
    })
    customerManagementService.getCrmAccount.mockResolvedValue({
      archiveReason: 'NON_TARGET_ACCOUNT',
      archivedAt: '2026-06-23T00:00:00.000Z',
      crmAccountId: 'crm-kohler-1',
      displayName: 'Kohler',
      lifecycleStage: 'LEAD',
      ownerAccountId: 'account-1',
      ownerDisplayName: '陈双鹏',
      recordStatus: 'ARCHIVED'
    })

    await expect(
      service.resolveSearchResults(
        {
          capturedAt: '2026-06-23T00:00:00.000Z',
          query: 'kohler',
          results: [
            {
              domain: 'kohler.com',
              title: 'Kohler',
              url: 'https://www.kohler.com'
            }
          ],
          searchEngine: 'GOOGLE'
        },
        source as any
      )
    ).resolves.toEqual({
      results: [
        expect.objectContaining({
          archiveReason: 'NON_TARGET_ACCOUNT',
          archivedAt: '2026-06-23T00:00:00.000Z',
          matchedAccount: expect.objectContaining({
            crmAccountId: 'crm-kohler-1',
            recordStatus: 'ARCHIVED',
            archiveReason: 'NON_TARGET_ACCOUNT'
          }),
          status: 'OWNED_LEAD'
        })
      ]
    })
    expect(customerManagementService.getCrmAccount).toHaveBeenCalledWith('tenant-1', 'crm-kohler-1', source)
  })

  it('does not expose claim or create actions for archived official-site matches', async () => {
    customerManagementService.checkLeadDuplicate.mockResolvedValue({
      duplicateResult: {
        resultType: 'CLAIMABLE_EXISTING',
        candidates: [
          {
            confidence: 'HIGH',
            crmAccountId: 'crm-kohler-1',
            displayName: 'Kohler',
            lifecycleStage: 'LEAD',
            matchedFields: ['leadDomain'],
            ownerAccountId: '',
            recordStatus: 'ARCHIVED'
          }
        ]
      }
    })
    customerManagementService.getCrmAccount.mockResolvedValue({
      archiveReason: 'NON_TARGET_ACCOUNT',
      archivedAt: '2026-06-23T00:00:00.000Z',
      crmAccountId: 'crm-kohler-1',
      displayName: 'Kohler',
      lifecycleStage: 'LEAD',
      ownerAccountId: '',
      recordStatus: 'ARCHIVED'
    })

    await expect(
      service.resolvePageContext(
        {
          page: {
            capturedAt: '2026-06-23T00:00:00.000Z',
            domain: 'kohler.com',
            pageKind: 'OFFICIAL_SITE',
            title: 'Kohler',
            url: 'https://www.kohler.com'
          }
        },
        source as any
      )
    ).resolves.toEqual(
      expect.objectContaining({
        allowedActions: ['OPEN_OES_DETAIL'],
        archiveReason: 'NON_TARGET_ACCOUNT',
        matchedAccount: expect.objectContaining({
          crmAccountId: 'crm-kohler-1',
          recordStatus: 'ARCHIVED'
        })
      })
    )
  })

  it('renders archived official-site matches even when duplicate candidates have sparse lifecycle ownership fields', async () => {
    customerManagementService.checkLeadDuplicate.mockResolvedValue({
      duplicateResult: {
        resultType: 'DUPLICATE',
        candidates: [
          {
            archiveReason: 'COMPETITOR',
            archivedAt: '2026-06-24T00:00:00.000Z',
            confidence: 'HIGH',
            crmAccountId: 'crm-archived-sparse-1',
            displayName: 'Archived Sparse Fixtures',
            matchedFields: ['leadDomain'],
            recordStatus: 'ARCHIVED'
          }
        ]
      }
    })
    customerManagementService.getCrmAccount.mockResolvedValue({
      archiveReason: 'COMPETITOR',
      archivedAt: '2026-06-24T00:00:00.000Z',
      crmAccountId: 'crm-archived-sparse-1',
      displayName: 'Archived Sparse Fixtures',
      recordStatus: 'ARCHIVED'
    })

    await expect(
      service.resolvePageContext(
        {
          page: {
            capturedAt: '2026-06-24T00:00:00.000Z',
            domain: 'archived-sparse.example',
            pageKind: 'OFFICIAL_SITE',
            title: 'Archived Sparse Fixtures',
            url: 'https://archived-sparse.example'
          }
        },
        source as any
      )
    ).resolves.toEqual(
      expect.objectContaining({
        allowedActions: ['OPEN_OES_DETAIL'],
        archiveReason: 'COMPETITOR',
        matchedAccount: expect.objectContaining({
          archiveReason: 'COMPETITOR',
          crmAccountId: 'crm-archived-sparse-1',
          recordStatus: 'ARCHIVED'
        }),
        status: 'POOL_LEAD'
      })
    )
  })

  it('creates active leads with browser-extension source and owned-by-operator assignment', async () => {
    customerManagementService.createLead.mockResolvedValue({
      crmAccount: {
        createdAt: '2026-06-23T00:00:01.000Z',
        crmAccountId: 'crm-lead-1',
        displayName: 'Serrano Fixtures',
        lifecycleStage: 'LEAD',
        ownerAccountId: 'account-1',
        ownerDisplayName: 'Mira Tan',
        recordStatus: 'ACTIVE'
      },
      duplicateResult: { candidates: [], resultType: 'NO_DUPLICATE' },
      resultType: 'CREATED'
    })

    await expect(
      service.createActiveLead(
        {
          displayName: 'Serrano Fixtures',
          leadCompanyName: 'Serrano Fixtures',
          leadDomain: 'serrano.example',
          page: {
            capturedAt: '2026-06-23T00:00:00.000Z',
            domain: 'serrano.example',
            pageKind: 'OFFICIAL_SITE',
            title: 'Serrano Fixtures',
            url: 'https://serrano.example'
          }
        },
        source as any
      )
    ).resolves.toEqual(
      expect.objectContaining({
        allowedActions: ['OPEN_OES_DETAIL'],
        resultType: 'CREATED'
      })
    )
    expect(customerManagementService.createLead).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        assignmentIntent: 'OWNED_BY_OPERATOR',
        claimForCurrentUser: false,
        sourceType: 'BROWSER_EXTENSION'
      }),
      source
    )
  })

  it('resolves mutation actions from access-summary when JWT permission claims are absent', async () => {
    permissionAccessSummaryAdapter.getAccountAccessSummary.mockResolvedValue({
      actionCodes: ['crm.account.read']
    })
    customerManagementService.checkLeadDuplicate.mockResolvedValue({
      duplicateResult: { resultType: 'NO_DUPLICATE', candidates: [] }
    })

    await expect(
      service.resolvePageContext(
        {
          page: {
            capturedAt: '2026-06-23T00:00:00.000Z',
            domain: 'serrano.example',
            pageKind: 'OFFICIAL_SITE',
            title: 'Serrano Fixtures',
            url: 'https://serrano.example'
          }
        },
        source as any
      )
    ).resolves.toEqual(
      expect.objectContaining({
        allowedActions: ['CHECK_DUPLICATE'],
        status: 'UNKNOWN'
      })
    )

    expect(permissionAccessSummaryAdapter.getAccountAccessSummary).toHaveBeenCalledWith(
      {
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT'
      },
      source
    )
  })

  it('closes draft claim and detail capabilities through existing CRM P1 service methods', async () => {
    customerManagementService.createDraftLead.mockResolvedValue({
      createdAt: '2026-06-23T00:00:01.000Z',
      crmAccountId: 'draft-1',
      displayName: 'Serrano Fixtures',
      lifecycleStage: 'LEAD',
      recordStatus: 'DRAFT'
    })
    customerManagementService.claimCrmAccount.mockResolvedValue({
      crmAccountId: 'pool-1',
      displayName: 'Serrano Fixtures',
      lifecycleStage: 'LEAD',
      ownerAccountId: 'account-1',
      recordStatus: 'ACTIVE'
    })
    customerManagementService.getCrmAccount.mockResolvedValue({
      crmAccountId: 'owned-1',
      displayName: 'Serrano Fixtures',
      lifecycleStage: 'LEAD',
      ownerAccountId: 'account-1',
      recordStatus: 'ACTIVE'
    })

    await expect(
      service.createDraftLead({ displayName: 'Serrano Fixtures', leadDomain: 'serrano.example' }, source as any)
    ).resolves.toEqual(
      expect.objectContaining({
        allowedActions: ['OPEN_OES_DETAIL'],
        crmAccount: expect.objectContaining({ crmAccountId: 'draft-1' })
      })
    )
    await expect(service.claimPoolLead('pool-1', source as any)).resolves.toEqual(
      expect.objectContaining({
        allowedActions: ['OPEN_OES_DETAIL'],
        status: 'OWNED_LEAD'
      })
    )
    await expect(service.getAccountSummary('owned-1', source as any)).resolves.toEqual(
      expect.objectContaining({
        allowedActions: ['OPEN_OES_DETAIL'],
        status: 'OWNED_LEAD'
      })
    )

    expect(customerManagementService.createDraftLead).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ sourceType: 'BROWSER_EXTENSION' }),
      source
    )
    expect(customerManagementService.claimCrmAccount).toHaveBeenCalledWith('tenant-1', 'pool-1', source)
    expect(customerManagementService.getCrmAccount).toHaveBeenCalledWith('tenant-1', 'owned-1', source)
  })

  it('creates draft leads with the standard browser capture rawPayload contract', async () => {
    customerManagementService.createDraftLead.mockResolvedValue({
      createdAt: '2026-06-23T00:00:01.000Z',
      crmAccountId: 'draft-1',
      displayName: 'Serrano Fixtures',
      lifecycleStage: 'LEAD',
      recordStatus: 'DRAFT'
    })
    const capture = {
      browserContext: { entryPoint: 'CONTEXT_MENU', workspace: 'CRM' },
      capturedAt: '2026-06-23T00:00:00.000Z',
      captureKind: 'LINK',
      companyNameCandidates: ['Serrano Fixtures'],
      sourcePageTitle: 'Google',
      sourcePageUrl: 'https://www.google.com/search?q=serrano',
      targetDomain: 'serrano.example',
      targetTitle: 'serrano.example',
      targetUrl: 'https://serrano.example',
      visibleEmails: ['imports@serrano.example'],
      visiblePhones: ['+1 312 847 1928']
    }

    await service.createDraftLead(
      {
        capture,
        displayName: 'Serrano Fixtures',
        leadCompanyName: 'Serrano Fixtures',
        leadDomain: 'serrano.example',
        priority: 'B',
        sourceNote: 'Captured from context menu'
      } as any,
      source as any
    )

    expect(customerManagementService.createDraftLead).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        sourceCapturedAt: '2026-06-23T00:00:00.000Z',
        sourceExternalReference: 'https://serrano.example',
        sourceName: 'Browser CRM capture',
        sourceNote: 'Captured from context menu',
        sourceRawPayload: capture,
        sourceType: 'BROWSER_EXTENSION'
      }),
      source
    )
  })
})
