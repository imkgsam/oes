import { NotFoundException } from '@nestjs/common'
import { ACCESS_DENIED, UNAUTHENTICATED } from '@oes/common/exceptions'
import {
  SiteAdminApplicationRepository,
  SiteAdminApplicationService
} from '../../src/application/services/site-admin-application.service'

type ContentOwnership = {
  siteId: string
  contentType: string
}

type ContentUpdateResult = {
  version: unknown
  slugChanged: boolean
  previousSlug: string | null
}

type ContentRepositoryMock = {
  runInTransaction: jest.MockedFunction<SiteAdminApplicationRepository['runInTransaction']>
  findTenantIdForSite: jest.MockedFunction<SiteAdminApplicationRepository['findTenantIdForSite']>
  findContentOwnership: jest.Mock<Promise<ContentOwnership | null>, [contentId: string]>
  getSiteContent: jest.MockedFunction<SiteAdminApplicationRepository['getSiteContent']>
  getLocaleStatus: jest.MockedFunction<SiteAdminApplicationRepository['getLocaleStatus']>
  listContentCategories: jest.MockedFunction<
    SiteAdminApplicationRepository['listContentCategories']
  >
  updateContentLocaleVersion: jest.MockedFunction<
    SiteAdminApplicationRepository['updateContentLocaleVersion']
  >
  unpublishSiteContent: jest.Mock<
    Promise<boolean>,
    [input: { siteId: string; contentId: string; locale: string }]
  >
  saveAuditEnvelope: jest.MockedFunction<SiteAdminApplicationRepository['saveAuditEnvelope']>
}

const CONTEXT = {
  tenantId: 'tenant_a',
  operatorId: 'operator_a',
  traceId: 'trace_a'
}

/** contentRecord returns a protected Admin detail payload for one owned Content parent. */
function contentRecord(contentId = 'content_a') {
  return {
    contentId,
    siteId: 'site_a',
    contentType: 'blog',
    status: 'draft',
    versions: []
  }
}

/** localeVersion returns the persisted result of one owned Content locale upsert. */
function localeVersion() {
  return {
    contentVersionId: 'version_a',
    contentId: 'content_a',
    locale: 'en-US',
    slug: 'owned-slug',
    title: 'Owned title',
    bodyHtml: '<p>owned body</p>',
    seoTitle: 'Owned SEO',
    seoDescription: 'Owned SEO description',
    status: 'draft',
    syncStatus: 'pending'
  }
}

/** createHarness supplies only the explicitly typed repository calls used by this ownership slice. */
function createHarness() {
  const repository: ContentRepositoryMock = {
    runInTransaction: jest
      .fn()
      .mockImplementation(async <T>(callback: () => Promise<T>): Promise<T> => callback()),
    findTenantIdForSite: jest.fn().mockResolvedValue('tenant_a'),
    findContentOwnership: jest.fn().mockResolvedValue({
      siteId: 'site_a',
      contentType: 'blog'
    }),
    getSiteContent: jest.fn().mockResolvedValue(contentRecord()),
    getLocaleStatus: jest.fn().mockResolvedValue('active'),
    listContentCategories: jest.fn().mockResolvedValue([]),
    updateContentLocaleVersion: jest.fn().mockResolvedValue({
      version: localeVersion(),
      slugChanged: false,
      previousSlug: null
    } satisfies ContentUpdateResult),
    unpublishSiteContent: jest.fn().mockResolvedValue(true),
    saveAuditEnvelope: jest.fn().mockResolvedValue(undefined)
  }
  const application = new SiteAdminApplicationService(
    repository as unknown as SiteAdminApplicationRepository,
    {
      previewTokenSecret: 'site-service-local-preview-secret',
      randomId: (prefix) => `${prefix}_fixed`,
      now: () => new Date('2026-07-22T08:00:00.000Z')
    }
  )
  return { application, repository }
}

/** updateRequest builds a valid Content locale update whose categories cannot mask ownership failures. */
function updateRequest() {
  return {
    context: CONTEXT,
    siteId: 'site_a',
    version: {
      contentId: 'content_a',
      locale: 'en-US',
      slug: 'owned-slug',
      title: 'Owned title',
      bodyHtml: '<p>owned body</p>',
      categoryIds: [],
      seoTitle: 'Owned SEO',
      seoDescription: 'Owned SEO description'
    }
  }
}

/** expectAccessDenied verifies the stable detail-free descendant denial contract. */
function expectAccessDenied(error: unknown): void {
  expect(error).toMatchObject({
    definition: expect.objectContaining({
      code: ACCESS_DENIED.code,
      rpcStatus: ACCESS_DENIED.rpcStatus
    }),
    additionalDetails: undefined
  })
}

/** expectNoContentEffects proves rejected Content targets cannot read payloads or write/audit state. */
function expectNoContentEffects(repository: ContentRepositoryMock): void {
  expect(repository.getSiteContent).not.toHaveBeenCalled()
  expect(repository.getLocaleStatus).not.toHaveBeenCalled()
  expect(repository.listContentCategories).not.toHaveBeenCalled()
  expect(repository.updateContentLocaleVersion).not.toHaveBeenCalled()
  expect(repository.unpublishSiteContent).not.toHaveBeenCalled()
  expect(repository.saveAuditEnvelope).not.toHaveBeenCalled()
}

// Verifies all Content descendant operations authenticate, authorize the Site, then authorize the parent.
describe('SiteAdmin Content descendant ownership', () => {
  it.each([
    {
      operation: 'get',
      invoke: (application: SiteAdminApplicationService, operatorId?: string) =>
        application.getSiteContent({
          context: { tenantId: 'tenant_a', operatorId },
          siteId: 'site_a',
          contentId: 'content_a'
        })
    },
    {
      operation: 'update',
      invoke: (application: SiteAdminApplicationService, operatorId?: string) =>
        application.updateSiteContentLocaleVersion({
          ...updateRequest(),
          context: { tenantId: 'tenant_a', operatorId }
        })
    },
    {
      operation: 'unpublish',
      invoke: (application: SiteAdminApplicationService, operatorId?: string) =>
        application.unpublishSiteContent({
          context: { tenantId: 'tenant_a', operatorId },
          siteId: 'site_a',
          contentId: 'content_a',
          locale: 'en-US'
        })
    }
  ])('rejects a missing operator before $operation ownership or effects', async ({ invoke }) => {
    const { application, repository } = createHarness()

    const error = await invoke(application, undefined).catch((caught: unknown) => caught)

    expect(error).toMatchObject({
      definition: expect.objectContaining({
        code: UNAUTHENTICATED.code,
        rpcStatus: UNAUTHENTICATED.rpcStatus
      }),
      additionalDetails: undefined
    })
    expect(repository.findTenantIdForSite).not.toHaveBeenCalled()
    expect(repository.findContentOwnership).not.toHaveBeenCalled()
    expect(repository.runInTransaction).not.toHaveBeenCalled()
    expectNoContentEffects(repository)
  })

  it('returns an owned Content detail only after the parent ownership fact', async () => {
    const { application, repository } = createHarness()

    await expect(
      application.getSiteContent({
        context: CONTEXT,
        siteId: 'site_a',
        contentId: 'content_a'
      })
    ).resolves.toEqual({ content: contentRecord() })

    expect(repository.findContentOwnership).toHaveBeenCalledWith('content_a')
    expect(repository.findContentOwnership.mock.invocationCallOrder[0]).toBeLessThan(
      repository.getSiteContent.mock.invocationCallOrder[0]
    )
  })

  it.each([
    { ownerCase: 'same-tenant other Site', siteId: 'site_b' },
    { ownerCase: 'foreign-tenant Site', siteId: 'site_foreign' }
  ])('denies $ownerCase Content detail without reading its payload', async ({ siteId }) => {
    const { application, repository } = createHarness()
    repository.findContentOwnership.mockResolvedValue({ siteId, contentType: 'blog' })

    const error = await application
      .getSiteContent({
        context: CONTEXT,
        siteId: 'site_a',
        contentId: 'content_secret'
      })
      .catch((caught: unknown) => caught)

    expectAccessDenied(error)
    expect(JSON.stringify(error)).not.toContain(siteId)
    expectNoContentEffects(repository)
  })

  it('returns NOT_FOUND for a missing Content parent without reading detail', async () => {
    const { application, repository } = createHarness()
    repository.findContentOwnership.mockResolvedValue(null)

    await expect(
      application.getSiteContent({
        context: CONTEXT,
        siteId: 'site_a',
        contentId: 'content_missing'
      })
    ).rejects.toBeInstanceOf(NotFoundException)

    expectNoContentEffects(repository)
  })

  it('maps a detail disappearing after owned parent authorization to NOT_FOUND', async () => {
    const { application, repository } = createHarness()
    repository.getSiteContent.mockResolvedValue(null)

    await expect(
      application.getSiteContent({
        context: CONTEXT,
        siteId: 'site_a',
        contentId: 'content_a'
      })
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it.each([
    { ownerCase: 'same-tenant other Site', siteId: 'site_b' },
    { ownerCase: 'foreign-tenant Site', siteId: 'site_foreign' }
  ])(
    'denies $ownerCase update with empty categories before payload, history, upsert, or audit',
    async ({ siteId }) => {
      const { application, repository } = createHarness()
      repository.findContentOwnership.mockResolvedValue({ siteId, contentType: 'blog' })

      const error = await application
        .updateSiteContentLocaleVersion(updateRequest())
        .catch((caught: unknown) => caught)

      expectAccessDenied(error)
      expect(repository.runInTransaction).toHaveBeenCalledTimes(1)
      expectNoContentEffects(repository)
    }
  )

  it('returns NOT_FOUND for a missing update parent before locale or category validation', async () => {
    const { application, repository } = createHarness()
    repository.findContentOwnership.mockResolvedValue(null)

    await expect(
      application.updateSiteContentLocaleVersion(updateRequest())
    ).rejects.toBeInstanceOf(NotFoundException)

    expect(repository.getLocaleStatus).not.toHaveBeenCalled()
    expect(repository.listContentCategories).not.toHaveBeenCalled()
    expect(repository.updateContentLocaleVersion).not.toHaveBeenCalled()
    expect(repository.saveAuditEnvelope).not.toHaveBeenCalled()
  })

  it('creates a missing locale child and audits inside the parent ownership transaction', async () => {
    const { application, repository } = createHarness()
    let transactionActive = false
    repository.runInTransaction.mockImplementation(async <T>(callback: () => Promise<T>) => {
      transactionActive = true
      try {
        return await callback()
      } finally {
        transactionActive = false
      }
    })
    repository.findContentOwnership.mockImplementation(async () => {
      expect(transactionActive).toBe(true)
      return { siteId: 'site_a', contentType: 'blog' }
    })
    repository.updateContentLocaleVersion.mockImplementation(async () => {
      expect(transactionActive).toBe(true)
      return {
        version: localeVersion(),
        slugChanged: false,
        previousSlug: null
      }
    })
    repository.saveAuditEnvelope.mockImplementation(async () => {
      expect(transactionActive).toBe(true)
    })

    await expect(application.updateSiteContentLocaleVersion(updateRequest())).resolves.toEqual({
      version: localeVersion()
    })

    expect(repository.findContentOwnership).toHaveBeenCalledWith('content_a')
    expect(repository.updateContentLocaleVersion).toHaveBeenCalledWith(
      expect.objectContaining({ siteId: 'site_a', contentId: 'content_a', locale: 'en-US' })
    )
    expect(repository.saveAuditEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'content.updated',
        operatorId: 'operator_a',
        resourceId: 'content_a'
      })
    )
  })

  it('records exact update and slug-change audit events without body fields', async () => {
    const { application, repository } = createHarness()
    repository.updateContentLocaleVersion.mockResolvedValue({
      version: localeVersion(),
      slugChanged: true,
      previousSlug: 'old-slug'
    })

    await expect(application.updateSiteContentLocaleVersion(updateRequest())).resolves.toEqual({
      version: localeVersion()
    })

    expect(repository.saveAuditEnvelope.mock.calls.map(([input]) => input.eventType)).toEqual([
      'content.updated',
      'content.slug_changed'
    ])
    expect(repository.saveAuditEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'content.slug_changed',
        details: {
          siteId: 'site_a',
          contentId: 'content_a',
          locale: 'en-US',
          previousSlug: 'old-slug',
          currentSlug: 'owned-slug'
        }
      })
    )
    const auditInput = JSON.stringify(repository.saveAuditEnvelope.mock.calls)
    expect(auditInput).not.toContain('owned body')
    expect(auditInput).not.toContain('seo')
  })

  it('does not record slug-change audit when the slug is unchanged', async () => {
    const { application, repository } = createHarness()

    await expect(application.updateSiteContentLocaleVersion(updateRequest())).resolves.toEqual({
      version: localeVersion()
    })

    expect(repository.saveAuditEnvelope.mock.calls.map(([input]) => input.eventType)).toEqual([
      'content.updated'
    ])
  })

  it.each([
    { ownerCase: 'same-tenant other Site', siteId: 'site_b' },
    { ownerCase: 'foreign-tenant Site', siteId: 'site_foreign' }
  ])('denies $ownerCase unpublish before composite mutation or audit', async ({ siteId }) => {
    const { application, repository } = createHarness()
    repository.findContentOwnership.mockResolvedValue({ siteId, contentType: 'blog' })

    const error = await application
      .unpublishSiteContent({
        context: CONTEXT,
        siteId: 'site_a',
        contentId: 'content_secret',
        locale: 'en-US'
      })
      .catch((caught: unknown) => caught)

    expectAccessDenied(error)
    expect(repository.unpublishSiteContent).not.toHaveBeenCalled()
    expect(repository.saveAuditEnvelope).not.toHaveBeenCalled()
  })

  it.each([
    { ownerCase: 'foreign Content', owner: { siteId: 'site_b', contentType: 'blog' } },
    { ownerCase: 'missing Content', owner: null }
  ])(
    'checks $ownerCase ownership before a blank locale on update and unpublish',
    async ({ owner }) => {
      const updateHarness = createHarness()
      updateHarness.repository.findContentOwnership.mockResolvedValue(owner)
      const blankUpdate = updateRequest()
      blankUpdate.version.locale = '   '

      const updateError = await updateHarness.application
        .updateSiteContentLocaleVersion(blankUpdate)
        .catch((caught: unknown) => caught)

      if (owner) {
        expectAccessDenied(updateError)
      } else {
        expect(updateError).toBeInstanceOf(NotFoundException)
      }
      expectNoContentEffects(updateHarness.repository)

      const unpublishHarness = createHarness()
      unpublishHarness.repository.findContentOwnership.mockResolvedValue(owner)
      const unpublishError = await unpublishHarness.application
        .unpublishSiteContent({
          context: CONTEXT,
          siteId: 'site_a',
          contentId: 'content_a',
          locale: '   '
        })
        .catch((caught: unknown) => caught)

      if (owner) {
        expectAccessDenied(unpublishError)
      } else {
        expect(unpublishError).toBeInstanceOf(NotFoundException)
      }
      expectNoContentEffects(unpublishHarness.repository)
    }
  )

  it('returns NOT_FOUND for a missing unpublish parent before composite mutation or audit', async () => {
    const { application, repository } = createHarness()
    repository.findContentOwnership.mockResolvedValue(null)

    await expect(
      application.unpublishSiteContent({
        context: CONTEXT,
        siteId: 'site_a',
        contentId: 'content_missing',
        locale: 'en-US'
      })
    ).rejects.toBeInstanceOf(NotFoundException)

    expect(repository.unpublishSiteContent).not.toHaveBeenCalled()
    expect(repository.saveAuditEnvelope).not.toHaveBeenCalled()
  })

  it('returns NOT_FOUND when an owned parent has no locale child to unpublish', async () => {
    const { application, repository } = createHarness()
    repository.unpublishSiteContent.mockResolvedValue(false)

    await expect(
      application.unpublishSiteContent({
        context: CONTEXT,
        siteId: 'site_a',
        contentId: 'content_a',
        locale: 'zh-CN'
      })
    ).rejects.toBeInstanceOf(NotFoundException)

    expect(repository.unpublishSiteContent).toHaveBeenCalledWith({
      siteId: 'site_a',
      contentId: 'content_a',
      locale: 'zh-CN'
    })
    expect(repository.saveAuditEnvelope).not.toHaveBeenCalled()
  })

  it('unpublishes an owned composite and audits inside one transaction', async () => {
    const { application, repository } = createHarness()

    await expect(
      application.unpublishSiteContent({
        context: CONTEXT,
        siteId: 'site_a',
        contentId: 'content_a',
        locale: 'en-US'
      })
    ).resolves.toEqual({ unpublished: true })

    expect(repository.runInTransaction).toHaveBeenCalledTimes(1)
    expect(repository.findContentOwnership.mock.invocationCallOrder[0]).toBeLessThan(
      repository.unpublishSiteContent.mock.invocationCallOrder[0]
    )
    expect(repository.unpublishSiteContent.mock.invocationCallOrder[0]).toBeLessThan(
      repository.saveAuditEnvelope.mock.invocationCallOrder[0]
    )
    expect(repository.saveAuditEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'content.unpublished' })
    )
  })
})

// Verifies the sync application passes the authorized Site into every Content public-view repository call.
describe('SiteAdmin Content public-view sync ownership', () => {
  it('scopes both Content public-view read and pending clear to the synchronized Site', async () => {
    const repository = {
      findTenantIdForSite: jest.fn().mockResolvedValue('tenant_a'),
      checkSitePagePreflight: jest.fn().mockResolvedValue({ ok: true, issues: [] }),
      getSitePublishStateForSync: jest.fn().mockResolvedValue({
        tenantId: 'tenant_a',
        currentPublishVersion: 4
      }),
      listPendingSyncResources: jest.fn().mockResolvedValue([
        {
          resourceType: 'blog',
          resourceId: 'content_a',
          locale: 'en-US',
          changeType: 'update',
          markedAt: new Date('2026-07-22T07:59:00.000Z')
        }
      ]),
      getContentVersionForPublicView: jest.fn().mockResolvedValue({
        contentId: 'content_a',
        contentType: 'blog',
        locale: 'en-US',
        slug: 'owned-slug',
        title: 'Owned title',
        bodyHtml: '<p>owned body</p>',
        categoryIds: [],
        seoTitle: 'Owned SEO',
        seoDescription: 'Owned SEO description'
      }),
      getLocaleStatus: jest.fn().mockResolvedValue('active'),
      upsertPublicView: jest.fn().mockResolvedValue(undefined),
      markContentVersionSynced: jest.fn().mockResolvedValue(true),
      createSyncBatch: jest.fn().mockResolvedValue(undefined),
      runInTransaction: jest
        .fn()
        .mockImplementation(async <T>(callback: () => Promise<T>): Promise<T> => callback()),
      hasInitialWebhookDelivery: jest.fn().mockResolvedValue(false),
      getWebhookDispatchConfig: jest.fn().mockResolvedValue(null),
      recordWebhookDelivery: jest.fn().mockResolvedValue(undefined)
    }
    const application = new SiteAdminApplicationService(repository as never, {
      previewTokenSecret: 'site-service-local-preview-secret',
      randomId: (prefix) => `${prefix}_fixed`,
      now: () => new Date('2026-07-22T08:00:00.000Z')
    })

    await expect(
      application.syncAllPendingChanges({ context: CONTEXT, siteId: 'site_a' })
    ).resolves.toEqual({ syncId: 'sync_fixed', publishVersion: 5, webhookDispatched: false })

    expect(repository.getContentVersionForPublicView).toHaveBeenCalledWith({
      siteId: 'site_a',
      contentId: 'content_a',
      locale: 'en-US'
    })
    expect(repository.markContentVersionSynced).toHaveBeenCalledWith({
      siteId: 'site_a',
      contentId: 'content_a',
      locale: 'en-US'
    })
  })
})
