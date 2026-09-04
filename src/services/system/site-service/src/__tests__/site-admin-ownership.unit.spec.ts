import { NotFoundException } from '@nestjs/common'
import { ACCESS_DENIED, UNAUTHENTICATED } from '@oes/common/exceptions'
import {
  SiteAdminApplicationRepository,
  SiteAdminApplicationService
} from '../application/services/site-admin-application.service'
import * as previewToken from '../domain/preview/preview-token'

type AdminContext = {
  tenantId?: string
  orgId?: string
  operatorId?: string
  traceId?: string
}

type OwnershipCase = {
  name: string
  invoke: (application: SiteAdminApplicationService, context: AdminContext) => Promise<unknown>
}

const MATCHING_CONTEXT: AdminContext = {
  tenantId: 'tenant_a',
  orgId: 'org_a',
  operatorId: 'operator_a',
  traceId: 'trace_a'
}

const REPRESENTATIVE_CASES: OwnershipCase[] = [
  {
    name: 'ordinary read',
    invoke: (application, context) =>
      application.listSiteContents({ context, siteId: 'site_a', contentType: 'blog' })
  },
  {
    name: 'ordinary write',
    invoke: (application, context) =>
      application.updateSiteSettings({ context, siteId: 'site_a', siteName: 'Owned Site' })
  },
  {
    name: 'page governance',
    invoke: (application, context) =>
      application.updateSitePageGovernance({
        context,
        siteId: 'site_a',
        pageKey: 'ABOUT',
        enabled: true,
        indexable: true
      })
  },
  {
    name: 'credential generation',
    invoke: (application, context) =>
      application.generateSiteCredential({ context, siteId: 'site_a' })
  },
  {
    name: 'sync publication',
    invoke: (application, context) =>
      application.syncAllPendingChanges({ context, siteId: 'site_a' })
  },
  {
    name: 'webhook retry',
    invoke: (application, context) => application.retryLastSync({ context, siteId: 'site_a' })
  },
  {
    name: 'preview token',
    invoke: (application, context) =>
      application.issuePreviewToken({
        context,
        siteId: 'site_a',
        resourceType: 'blog',
        resourceId: 'content_a',
        locale: 'en-US'
      })
  },
  {
    name: 'audit query',
    invoke: (application, context) => application.listSiteAuditLogs({ context, siteId: 'site_a' })
  }
]

const ALL_DIRECT_SITE_TARGET_CASES: OwnershipCase[] = [
  ...REPRESENTATIVE_CASES,
  {
    name: 'credential list',
    invoke: (application, context) => application.listSiteCredentials({ context, siteId: 'site_a' })
  },
  {
    name: 'site disable',
    invoke: (application, context) => application.disableSite({ context, siteId: 'site_a' })
  },
  {
    name: 'locale add',
    invoke: (application, context) =>
      application.addPreparingLocale({ context, siteId: 'site_a', locale: 'fr-FR' })
  },
  {
    name: 'locale completeness',
    invoke: (application, context) =>
      application.checkLocaleCompleteness({ context, siteId: 'site_a', locale: 'fr-FR' })
  },
  {
    name: 'locale activate',
    invoke: (application, context) =>
      application.activateLocale({ context, siteId: 'site_a', locale: 'fr-FR' })
  },
  {
    name: 'locale disable',
    invoke: (application, context) =>
      application.disableLocale({ context, siteId: 'site_a', locale: 'fr-FR' })
  },
  {
    name: 'page list',
    invoke: (application, context) => application.listSitePages({ context, siteId: 'site_a' })
  },
  {
    name: 'site category list',
    invoke: (application, context) =>
      application.listSiteCategories({ context, siteId: 'site_a' } as never)
  },
  {
    name: 'site category create',
    invoke: (application, context) =>
      application.createSiteCategory({
        context,
        siteId: 'site_a',
        locale: 'en-US',
        slug: 'basins',
        displayTitle: 'Basins',
        seoTitle: 'Basins'
      })
  },
  {
    name: 'site category update',
    invoke: (application, context) =>
      application.updateSiteCategory({
        context,
        siteId: 'site_a',
        category: {
          categoryId: 'category_a',
          siteId: 'site_a',
          slug: 'basins',
          displayTitle: 'Basins',
          seoTitle: 'Basins'
        }
      })
  },
  {
    name: 'site category unpublish',
    invoke: (application, context) =>
      application.unpublishSiteCategory({
        context,
        siteId: 'site_a',
        categoryId: 'category_a',
        locale: 'en-US'
      })
  },
  {
    name: 'site product list',
    invoke: (application, context) => application.listSiteProducts({ context, siteId: 'site_a' })
  },
  {
    name: 'product search',
    invoke: (application, context) =>
      application.searchProductMasterForAdd({ context, siteId: 'site_a' })
  },
  {
    name: 'product publication detail',
    invoke: (application, context) =>
      application.getSiteProductPublication({
        context,
        siteId: 'site_a',
        publicationId: 'publication_a'
      })
  },
  {
    name: 'product publication add',
    invoke: (application, context) =>
      application.addProductsToSite({
        context,
        siteId: 'site_a',
        productIds: ['product_a'],
        locales: ['en-US']
      })
  },
  {
    name: 'product publication update',
    invoke: (application, context) =>
      application.updateSiteProductPublication({
        context,
        publication: {
          publicationId: 'publication_a',
          siteId: 'site_a',
          slug: 'product-a',
          displayTitle: 'Product A',
          displayDescription: '',
          seoTitle: 'Product A',
          seoDescription: ''
        }
      })
  },
  {
    name: 'product publication unpublish',
    invoke: (application, context) =>
      application.unpublishSiteProduct({
        context,
        siteId: 'site_a',
        publicationId: 'publication_a'
      })
  },
  {
    name: 'content detail',
    invoke: (application, context) =>
      application.getSiteContent({ context, siteId: 'site_a', contentId: 'content_a' })
  },
  {
    name: 'content create',
    invoke: (application, context) =>
      application.createSiteContent({ context, siteId: 'site_a', contentType: 'blog' })
  },
  {
    name: 'content locale update',
    invoke: (application, context) =>
      application.updateSiteContentLocaleVersion({
        context,
        siteId: 'site_a',
        version: {
          contentId: 'content_a',
          locale: 'en-US',
          slug: 'article-a',
          title: 'Article A',
          bodyHtml: '<p>Article A</p>',
          seoTitle: 'Article A',
          seoDescription: 'Article A'
        }
      })
  },
  {
    name: 'content category create',
    invoke: (application, context) =>
      application.createContentCategory({
        context,
        siteId: 'site_a',
        initialLocaleVersion: {
          locale: 'en-US',
          slug: 'guides',
          displayName: 'Guides'
        }
      })
  },
  {
    name: 'content category locale update',
    invoke: (application, context) =>
      application.updateContentCategoryLocaleVersion({
        context,
        siteId: 'site_a',
        version: {
          categoryId: 'content_category_a',
          locale: 'en-US',
          slug: 'guides',
          displayName: 'Guides',
          seoTitle: 'Guides',
          seoDescription: 'Guides'
        }
      })
  },
  {
    name: 'content category delete',
    invoke: (application, context) =>
      application.deleteContentCategory({
        context,
        siteId: 'site_a',
        categoryId: 'content_category_a'
      })
  },
  {
    name: 'content category list',
    invoke: (application, context) =>
      application.listContentCategories({ context, siteId: 'site_a' } as never)
  },
  {
    name: 'content category detail',
    invoke: (application, context) =>
      application.getContentCategory({
        context,
        siteId: 'site_a',
        categoryId: 'content_category_a'
      } as never)
  },
  {
    name: 'content unpublish',
    invoke: (application, context) =>
      application.unpublishSiteContent({
        context,
        siteId: 'site_a',
        contentId: 'content_a',
        locale: 'en-US'
      })
  },
  {
    name: 'pending sync summary',
    invoke: (application, context) =>
      application.getPendingSyncSummary({ context, siteId: 'site_a' })
  },
  {
    name: 'pending sync resource list',
    invoke: (application, context) =>
      application.listPendingSyncResources({ context, siteId: 'site_a' })
  },
  {
    name: 'sync history',
    invoke: (application, context) => application.listSyncHistory({ context, siteId: 'site_a' })
  },
  {
    name: 'credential rotation site gate',
    invoke: (application, context) =>
      application.rotateSiteCredential({
        context,
        siteId: 'site_a',
        credentialId: 'credential_a'
      })
  },
  {
    name: 'credential revoke site gate',
    invoke: (application, context) =>
      application.revokeSiteCredential({
        context,
        siteId: 'site_a',
        credentialId: 'credential_a'
      })
  }
]

const AUTHENTICATION_PRECEDENCE_CASES: OwnershipCase[] = [
  {
    name: 'blank direct Site target',
    invoke: (application, context) =>
      application.listSiteContents({ context, siteId: '   ', contentType: 'blog' })
  },
  {
    name: 'missing category payload',
    invoke: (application, context) =>
      application.updateSiteCategory({ context, siteId: 'site_a' } as never)
  },
  {
    name: 'missing publication payload',
    invoke: (application, context) => application.updateSiteProductPublication({ context } as never)
  },
  {
    name: 'missing content version payload',
    invoke: (application, context) =>
      application.updateSiteContentLocaleVersion({ context, siteId: 'site_a' })
  },
  {
    name: 'missing Content Category version payload',
    invoke: (application, context) =>
      application.updateContentCategoryLocaleVersion({ context, siteId: 'site_a' })
  }
]

/** Creates an isolated SiteAdmin harness whose repository calls can prove ownership fail-fast behavior. */
function createHarness() {
  const calls: Record<string, jest.Mock> = {}
  const repository = new Proxy(calls, {
    get(target, property: string) {
      target[property] ??= jest.fn()
      return target[property]
    }
  }) as unknown as SiteAdminApplicationRepository
  const repositoryMock = repository as unknown as Record<string, jest.Mock>

  repositoryMock.findTenantIdForSite.mockResolvedValue('tenant_a')
  repositoryMock.findPreviewResourceOwnership.mockResolvedValue({
    siteId: 'site_a',
    resourceType: 'blog',
    localeMatched: true
  })
  repositoryMock.findContentOwnership.mockResolvedValue({
    siteId: 'site_a',
    contentType: 'blog'
  })
  repositoryMock.findCredentialOwnership.mockResolvedValue({ siteId: 'site_a' })
  repositoryMock.revokeSiteCredential.mockResolvedValue(true)
  repositoryMock.listSiteCards.mockResolvedValue([])
  repositoryMock.listSiteCredentials.mockResolvedValue([])
  repositoryMock.listSiteContents.mockResolvedValue([])
  repositoryMock.listSiteProducts.mockResolvedValue([])
  repositoryMock.updateContentLocaleVersion.mockResolvedValue({
    version: { contentId: 'content_a', locale: 'en-US' },
    slugChanged: false,
    previousSlug: null
  })
  repositoryMock.listSiteCategories.mockResolvedValue([])
  repositoryMock.listContentCategories.mockResolvedValue([])
  repositoryMock.createSiteCategory.mockResolvedValue({ categoryId: 'category_a' })
  repositoryMock.createContentCategory.mockResolvedValue({ categoryId: 'content_category_a' })
  repositoryMock.getContentCategory.mockResolvedValue({ categoryId: 'content_category_a' })
  repositoryMock.getDefaultSiteLocale.mockResolvedValue('en-US')
  repositoryMock.deleteContentCategory.mockResolvedValue({ tombstoned: false })
  repositoryMock.listSitePages.mockResolvedValue([])
  repositoryMock.listSiteAuditLogs.mockResolvedValue([])
  repositoryMock.listSyncHistory.mockResolvedValue([])
  repositoryMock.listPendingSyncResources.mockResolvedValue([])
  repositoryMock.getPendingSyncSummary.mockResolvedValue({ pendingCount: 0, resourceTypes: [] })
  repositoryMock.getSitePublishStateForSync.mockResolvedValue({
    tenantId: 'tenant_a',
    currentPublishVersion: 3
  })
  repositoryMock.getLastSyncBatch.mockResolvedValue(null)
  repositoryMock.getLocaleStatus.mockResolvedValue('active')
  repositoryMock.checkLocaleCompleteness.mockResolvedValue({ complete: true, issues: [] })
  repositoryMock.checkSitePagePreflight.mockResolvedValue({ ok: true, issues: [] })
  repositoryMock.searchProductMasterForAdd.mockResolvedValue({ candidates: [], total: 0 })
  repositoryMock.updateSitePageGovernance.mockResolvedValue({
    pageKey: 'ABOUT',
    supportedLocales: ['en-US'],
    available: true,
    enabled: true,
    indexable: true,
    drift: false,
    syncStatus: 'pending'
  })
  repositoryMock.runInTransaction.mockImplementation(async (callback: () => Promise<unknown>) =>
    callback()
  )
  repositoryMock.runPublishTransaction.mockImplementation(
    async (_siteId: string, callback: () => Promise<unknown>) => callback()
  )

  const randomSecret = jest.fn(() => 'client_secret_a')
  const webhookPublisher = { publish: jest.fn() }
  const application = new SiteAdminApplicationService(
    repository,
    {
      now: () => new Date('2026-07-22T08:00:00.000Z'),
      randomId: (prefix) => `${prefix}_fixed`,
      randomSecret,
      previewTokenSecret: 'site-service-local-preview-secret',
      oesBaseUrl: 'https://oes.example/api/v1/site',
      environment: 'test'
    },
    webhookPublisher
  )

  return { application, calls, randomSecret, webhookPublisher }
}

/** Asserts an ownership rejection stopped every business repository, secret, webhook, and token side effect. */
function expectOwnershipOnlyCalls(
  harness: ReturnType<typeof createHarness>,
  previewTokenSigner: jest.SpyInstance
) {
  for (const [name, call] of Object.entries(harness.calls)) {
    if (name !== 'findTenantIdForSite') {
      expect(call).not.toHaveBeenCalled()
    }
  }
  expect(harness.randomSecret).not.toHaveBeenCalled()
  expect(harness.webhookPublisher.publish).not.toHaveBeenCalled()
  expect(previewTokenSigner).not.toHaveBeenCalled()
}

/** Asserts the single ownership lookup completed before every observed business-side call. */
function expectOwnershipBeforeBusinessCalls(
  harness: ReturnType<typeof createHarness>,
  previewTokenSigner: jest.SpyInstance
) {
  expect(harness.calls.findTenantIdForSite).toHaveBeenCalledTimes(1)
  expect(harness.calls.findTenantIdForSite).toHaveBeenCalledWith('site_a')
  const ownershipCallOrder = harness.calls.findTenantIdForSite.mock.invocationCallOrder[0]
  const businessCalls = [
    ...Object.entries(harness.calls)
      .filter(([name, call]) => name !== 'findTenantIdForSite' && call.mock.calls.length > 0)
      .map(([, call]) => call),
    harness.randomSecret,
    harness.webhookPublisher.publish,
    previewTokenSigner
  ].filter((call) => call.mock.calls.length > 0)

  expect(businessCalls.length).toBeGreaterThan(0)
  for (const call of businessCalls) {
    expect(call.mock.invocationCallOrder[0]).toBeGreaterThan(ownershipCallOrder)
  }
}

// Verifies the SiteAdmin application enforces Site ownership before every direct site target path.
describe('SiteAdmin Site ownership gate', () => {
  let previewTokenSigner: jest.SpyInstance

  beforeEach(() => {
    previewTokenSigner = jest.spyOn(previewToken, 'issuePreviewToken')
  })

  afterEach(() => {
    previewTokenSigner.mockRestore()
  })

  it('enumerates every direct Site target method in one ownership table', () => {
    expect(ALL_DIRECT_SITE_TARGET_CASES).toHaveLength(39)
  })

  it.each(ALL_DIRECT_SITE_TARGET_CASES)('allows tenant match for $name', async ({ invoke }) => {
    const harness = createHarness()

    await expect(invoke(harness.application, MATCHING_CONTEXT)).resolves.toBeDefined()

    expectOwnershipBeforeBusinessCalls(harness, previewTokenSigner)
  })

  it('reuses the single authorized normalized Site target throughout credential rotation', async () => {
    const harness = createHarness()

    await expect(
      harness.application.rotateSiteCredential({
        context: MATCHING_CONTEXT,
        siteId: '  site_a  ',
        credentialId: 'credential_a'
      })
    ).resolves.toBeDefined()

    expect(harness.calls.findTenantIdForSite).toHaveBeenCalledTimes(1)
    expect(harness.calls.findTenantIdForSite).toHaveBeenCalledWith('site_a')
    expect(harness.calls.saveCredentialMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: 'site_a' })
    )
    expect(harness.calls.revokeSiteCredential).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: 'site_a', credentialId: 'credential_a' })
    )
  })

  it.each(ALL_DIRECT_SITE_TARGET_CASES)(
    'denies a foreign tenant before $name reaches business effects',
    async ({ invoke }) => {
      const harness = createHarness()
      harness.calls.findTenantIdForSite.mockResolvedValue('tenant_foreign')

      const denial = await invoke(harness.application, MATCHING_CONTEXT).catch(
        (error: unknown) => error
      )
      expect(denial).toMatchObject({
        definition: expect.objectContaining({
          code: ACCESS_DENIED.code,
          rpcStatus: ACCESS_DENIED.rpcStatus
        })
      })
      const deniedError = denial as {
        additionalDetails?: unknown
        toRpcPayload: () => unknown
      }
      expect(deniedError.additionalDetails).toBeUndefined()
      const serializedPayload = JSON.stringify(deniedError.toRpcPayload())
      expect(serializedPayload).not.toContain('tenant_a')
      expect(serializedPayload).not.toContain('tenant_foreign')

      expect(harness.calls.findTenantIdForSite).toHaveBeenCalledTimes(1)
      expect(harness.calls.findTenantIdForSite).toHaveBeenCalledWith('site_a')
      expectOwnershipOnlyCalls(harness, previewTokenSigner)
    }
  )

  it.each(ALL_DIRECT_SITE_TARGET_CASES)(
    'returns NOT_FOUND for a missing Site before $name reaches business effects',
    async ({ invoke }) => {
      const harness = createHarness()
      harness.calls.findTenantIdForSite.mockResolvedValue(null)

      await expect(invoke(harness.application, MATCHING_CONTEXT)).rejects.toBeInstanceOf(
        NotFoundException
      )

      expect(harness.calls.findTenantIdForSite).toHaveBeenCalledTimes(1)
      expect(harness.calls.findTenantIdForSite).toHaveBeenCalledWith('site_a')
      expectOwnershipOnlyCalls(harness, previewTokenSigner)
    }
  )

  it.each(
    [
      { contextCase: 'missing', context: { operatorId: 'operator_a', traceId: 'trace_a' } },
      {
        contextCase: 'blank',
        context: { tenantId: '   ', operatorId: 'operator_a', traceId: 'trace_a' }
      }
    ].flatMap(({ contextCase, context }) =>
      ALL_DIRECT_SITE_TARGET_CASES.map((ownershipCase) => ({
        ...ownershipCase,
        contextCase,
        context
      }))
    )
  )(
    'rejects $contextCase context tenant before $name reaches ownership lookup or business effects',
    async ({ invoke, context }) => {
      const harness = createHarness()

      const denial = await invoke(harness.application, context).catch((error: unknown) => error)
      expect(denial).toMatchObject({
        definition: expect.objectContaining({
          code: UNAUTHENTICATED.code,
          rpcStatus: UNAUTHENTICATED.rpcStatus
        }),
        additionalDetails: undefined
      })

      expect(harness.calls.findTenantIdForSite).not.toHaveBeenCalled()
      expectOwnershipOnlyCalls(harness, previewTokenSigner)
    }
  )

  it.each(
    [
      { contextCase: 'missing', context: { operatorId: 'operator_a', traceId: 'trace_a' } },
      {
        contextCase: 'blank',
        context: { tenantId: '   ', operatorId: 'operator_a', traceId: 'trace_a' }
      }
    ].flatMap(({ contextCase, context }) =>
      AUTHENTICATION_PRECEDENCE_CASES.map((ownershipCase) => ({
        ...ownershipCase,
        contextCase,
        context
      }))
    )
  )('rejects $contextCase tenant before validating $name', async ({ invoke, context }) => {
    const harness = createHarness()

    const denial = await invoke(harness.application, context).catch((error: unknown) => error)
    expect(denial).toMatchObject({
      definition: expect.objectContaining({
        code: UNAUTHENTICATED.code,
        rpcStatus: UNAUTHENTICATED.rpcStatus
      }),
      additionalDetails: undefined
    })
    expect(harness.calls.findTenantIdForSite).not.toHaveBeenCalled()
    expectOwnershipOnlyCalls(harness, previewTokenSigner)
  })

  it('does not apply existing-resource ownership lookup to CreateSite or ListSiteCards', async () => {
    const harness = createHarness()

    await expect(
      harness.application.createSite({
        context: MATCHING_CONTEXT,
        siteName: 'New Site',
        siteType: 'brand',
        defaultLocale: 'en-US'
      })
    ).resolves.toEqual({ siteId: 'site_fixed', status: 'draft', defaultLocale: 'en-US' })
    await expect(
      harness.application.listSiteCards({ context: MATCHING_CONTEXT })
    ).resolves.toEqual({ cards: [] })

    expect(harness.calls.findTenantIdForSite).not.toHaveBeenCalled()
  })
})
