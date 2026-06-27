import { ExtensionCrmWorkspaceService } from './extension-crm-workspace.service'

/** buildExtensionSource creates the minimum browser-extension source context accepted by CRM workspace BFF tests. */
function buildExtensionSource() {
  return {
    requestId: 'req-1',
    traceId: 'trace-1',
    user: {
      aid: 'account-1',
      scopeLevel: 'TENANT',
      terminal: 'BROWSER_EXTENSION',
      tid: 'tenant-1'
    }
  }
}

describe('ExtensionCrmWorkspaceService InternetDomain integration', () => {
  it('resolves a www search-result domain as matched when CRM duplicate detection finds the canonical domain', async () => {
    const customerManagementService = {
      checkLeadDuplicate: jest.fn().mockResolvedValue({
        duplicateResult: {
          resultType: 'CLAIMABLE_EXISTING',
          candidates: [
            {
              confidence: 'HIGH',
              crmAccountId: 'crm-vintage-1',
              displayName: 'Vintage Tub',
              lifecycleStage: 'LEAD',
              matchedFields: ['leadDomain'],
              ownerAccountId: null,
              recordStatus: 'ACTIVE'
            }
          ]
        }
      })
    }
    const permissionAccessSummaryAdapter = {
      getAccountAccessSummary: jest.fn()
    }
    const service = new ExtensionCrmWorkspaceService(
      customerManagementService as any,
      permissionAccessSummaryAdapter as any
    )
    const source = buildExtensionSource()

    await expect(
      service.resolveSearchResults(
        {
          capturedAt: '2026-06-23T00:00:00.000Z',
          query: 'vintage tub',
          results: [
            {
              domain: 'www.vintagetub.com',
              title: 'Vintage Tub',
              url: 'https://www.vintagetub.com/products?id=1'
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
          domain: 'www.vintagetub.com',
          matchedAccount: expect.objectContaining({
            crmAccountId: 'crm-vintage-1'
          }),
          status: 'POOL_LEAD'
        })
      ]
    })
    expect(customerManagementService.checkLeadDuplicate).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        leadDomain: 'www.vintagetub.com'
      }),
      source
    )
  })
})
