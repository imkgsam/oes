import { createHash, createHmac } from 'node:crypto'
import { SiteAdminApplicationService } from '../../src/application/services/site-admin-application.service'
import { SiteRuntimeApplicationService } from '../../src/application/services/site-runtime-application.service'
import { buildCanonicalRequest, formatSignature } from '../../src/domain/security/site-request-signing'

// Verifies application services orchestrate repository, audit, credential, and signed runtime boundaries.
describe('site-service application services L1', () => {
  const repository = {
    createSiteWithDefaultLocale: jest.fn(),
    listSiteCards: jest.fn(),
    saveCredentialMetadata: jest.fn(),
    listSiteCredentials: jest.fn(),
    saveAuditEnvelope: jest.fn(),
    findCredentialForVerification: jest.fn(),
    rememberCredentialNonce: jest.fn(),
    getLatestPublishState: jest.fn(),
    updateRuntimeSyncResult: jest.fn(),
    listChangedResourcesForRuntime: jest.fn(),
    batchGetPublicViewsForRuntime: jest.fn(),
    revokeSiteCredential: jest.fn(),
    createContentEntry: jest.fn(),
    updateContentLocaleVersion: jest.fn(),
    listPendingSyncResources: jest.fn(),
    getContentVersionForPublicView: jest.fn(),
    upsertPublicView: jest.fn(),
    createSyncBatch: jest.fn(),
    markContentVersionSynced: jest.fn(),
    markProductPublicationSynced: jest.fn(),
    getSitePublishStateForSync: jest.fn(),
    updateSiteSettings: jest.fn(),
    disableSite: jest.fn(),
    addPreparingLocale: jest.fn(),
    checkLocaleCompleteness: jest.fn(),
    activateLocale: jest.fn(),
    disableLocale: jest.fn(),
    markLocaleResourcesPending: jest.fn(),
    getLocaleStatus: jest.fn(),
    listSiteCategories: jest.fn(),
    createSiteCategory: jest.fn(),
    updateSiteCategory: jest.fn(),
    unpublishSiteCategory: jest.fn(),
    getCategoryPublicationForPublicView: jest.fn(),
    markCategoryPublicationSynced: jest.fn(),
    listSiteProducts: jest.fn(),
    searchProductMasterForAdd: jest.fn(),
    getSiteProductPublication: jest.fn(),
    addProductPublication: jest.fn(),
    updateSiteProductPublication: jest.fn(),
    unpublishSiteProduct: jest.fn(),
    getProductPublicationForPublicView: jest.fn(),
    listSiteContents: jest.fn(),
    getSiteContent: jest.fn(),
    unpublishSiteContent: jest.fn(),
    getPendingSyncSummary: jest.fn(),
    listSyncHistory: jest.fn(),
    getSyncDetail: jest.fn(),
    getLastSyncBatch: jest.fn(),
    getWebhookDispatchConfig: jest.fn(),
    recordWebhookDelivery: jest.fn(),
    hasInitialWebhookDelivery: jest.fn(),
    listSiteAuditLogs: jest.fn(),
    getDraftPreviewResource: jest.fn(),
    getSnapshotForRuntime: jest.fn()
  }
  const webhookPublisher = {
    publish: jest.fn()
  }
  const now = new Date('2026-06-15T08:00:00.000Z')
  const admin = new SiteAdminApplicationService(repository as never, {
    now: () => now,
    randomId: (prefix) => `${prefix}_fixed`,
    randomSecret: () => 'client_secret_a',
    oesBaseUrl: 'https://oes.example/api/v1/site',
    environment: 'local'
  }, webhookPublisher)
  const runtime = new SiteRuntimeApplicationService(repository as never, { now: () => now })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('creates a draft site, records audit, and lists site cards', async () => {
    repository.listSiteCards.mockResolvedValue([{ siteId: 'site_fixed', siteName: 'Brand US' }])

    await expect(
      admin.createSite({
        tenantId: 'tenant_a',
        orgId: 'org_a',
        operatorId: 'operator_a',
        traceId: 'trace_a',
        siteName: 'Brand US',
        siteType: 'brand',
        defaultLocale: 'en-US',
        primaryDomain: 'brand.example',
        previewBaseUrl: 'https://brand.example/preview'
      })
    ).resolves.toEqual({ siteId: 'site_fixed', status: 'draft', defaultLocale: 'en-US' })
    await expect(admin.listSiteCards({ tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' })).resolves.toEqual({
      cards: [{ siteId: 'site_fixed', siteName: 'Brand US' }]
    })

    expect(repository.createSiteWithDefaultLocale).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: 'site_fixed',
        tenantId: 'tenant_a',
        siteCode: 'brand-us',
        defaultLocale: 'en-US',
        createdBy: 'operator_a'
      })
    )
    expect(repository.saveAuditEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'site.created',
        result: 'SUCCEEDED',
        operatorId: 'operator_a',
        tenantId: 'tenant_a',
        orgId: 'org_a',
        traceId: 'trace_a'
      })
    )
  })

  it('generates a one-time credential bundle while storing only protected credential material', async () => {
    await expect(
      admin.generateSiteCredential({
        context: {
          tenantId: 'tenant_a',
          operatorId: 'operator_a',
          traceId: 'trace_a'
        },
        siteId: 'site_a',
        scopes: ['site:read', 'site:sync']
      })
    ).resolves.toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({
          credentialId: 'cred_fixed',
          clientId: 'client_fixed',
          scopes: ['site:read', 'site:sync'],
          status: 'active'
        }),
        credentialBundle: expect.stringMatching(/^oes_site_cred_v1\./)
      })
    )

    expect(repository.saveCredentialMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        credentialId: 'cred_fixed',
        clientId: 'client_fixed',
        secretHash: createHash('sha256').update('client_secret_a').digest('hex'),
        secretCiphertext: expect.any(String),
        scopes: ['site:read', 'site:sync']
      })
    )
  })

  it('lists credential metadata without exposing one-time credential bundles or secret material', async () => {
    repository.listSiteCredentials.mockResolvedValue([
      {
        credentialId: 'cred_a',
        clientId: 'client_a',
        status: 'active',
        scopes: ['site:read', 'site:sync'],
        createdAt: now,
        lastUsedAt: null,
        revokedAt: null,
        secretCiphertext: 'must-not-leak',
        secretHash: 'must-not-leak'
      }
    ])

    await expect(
      admin.listSiteCredentials({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a'
      })
    ).resolves.toEqual({
      credentials: [
        {
          credentialId: 'cred_a',
          clientId: 'client_a',
          status: 'active',
          scopes: ['site:read', 'site:sync'],
          createdAt: '2026-06-15T08:00:00.000Z',
          lastUsedAt: '',
          revokedAt: ''
        }
      ]
    })

    const serialized = JSON.stringify(await admin.listSiteCredentials({
      context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
      siteId: 'site_a'
    }))
    expect(serialized).not.toContain('must-not-leak')
    expect(serialized).not.toContain('oes_site_cred_v1')
  })

  it('verifies signed runtime latest-state requests inside site-service', async () => {
    const body = Buffer.from('{"local_publish_version":2}')
    const timestamp = String(now.getTime())
    const canonical = buildCanonicalRequest({
      method: 'POST',
      path: '/api/v1/site/sync/latest',
      query: {},
      body,
      siteId: 'site_a',
      clientId: 'client_a',
      credentialId: 'cred_a',
      timestamp,
      nonce: 'nonce_a'
    })
    const signature = formatSignature(createHmac('sha256', 'client_secret_a').update(canonical).digest('hex'))
    repository.findCredentialForVerification.mockResolvedValue({
      siteId: 'site_a',
      clientId: 'client_a',
      credentialId: 'cred_a',
      clientSecret: 'client_secret_a',
      scopes: ['site:sync', 'site:read'],
      status: 'active',
      siteStatus: 'active'
    })
    repository.rememberCredentialNonce.mockResolvedValue(true)
    repository.getLatestPublishState.mockResolvedValue({ latestPublishVersion: 5, latestSyncId: 'sync_a' })

    await expect(
      runtime.getLatestPublishState({
        signedContext: {
          siteId: 'site_a',
          clientId: 'client_a',
          credentialId: 'cred_a',
          requestId: 'request_a',
          traceId: 'trace_a',
          timestamp,
          nonce: 'nonce_a',
          signature,
          method: 'POST',
          path: '/api/v1/site/sync/latest',
          normalizedQuery: '',
          bodySha256: createHash('sha256').update(body).digest('hex')
        },
        localPublishVersion: 2
      })
    ).resolves.toEqual({
      siteId: 'site_a',
      latestPublishVersion: 5,
      latestSyncId: 'sync_a',
      hasUpdates: true,
      serverTime: now.toISOString()
    })
  })

  it('creates site content drafts and syncs pending content into sanitized public views', async () => {
    repository.createContentEntry.mockResolvedValue({
      contentId: 'content_fixed',
      siteId: 'site_a',
      contentType: 'blog',
      status: 'draft',
      versions: []
    })
    repository.updateContentLocaleVersion.mockResolvedValue({
      contentVersionId: 'version_fixed',
      contentId: 'content_fixed',
      locale: 'en-US',
      slug: 'launch-note',
      title: 'Launch note',
      bodyHtml: '<p>Hello</p><script>alert(1)</script>',
      seoTitle: 'Launch SEO',
      seoDescription: 'Launch page',
      status: 'draft',
      syncStatus: 'pending'
    })
    repository.getSitePublishStateForSync.mockResolvedValue({ tenantId: 'tenant_a', currentPublishVersion: 2 })
    repository.hasInitialWebhookDelivery.mockResolvedValue(false)
    repository.getWebhookDispatchConfig.mockResolvedValue({
      targetUrl: 'https://runtime.example/oes/webhooks/site',
      signingSecret: 'webhook_secret_a'
    })
    repository.listPendingSyncResources.mockResolvedValue([
      { resourceType: 'blog', resourceId: 'content_fixed', locale: 'en-US', changeType: 'create', markedAt: now }
    ])
    repository.getContentVersionForPublicView.mockResolvedValue({
      contentId: 'content_fixed',
      contentType: 'blog',
      locale: 'en-US',
      slug: 'launch-note',
      title: 'Launch note',
      bodyHtml: '<p>Hello</p><script>alert(1)</script>',
      summary: 'Short',
      coverImage: null,
      author: 'OES',
      tags: ['launch'],
      seoTitle: 'Launch SEO',
      seoDescription: 'Launch page',
      seoImage: null,
      publishedAt: null
    })

    await expect(
      admin.createSiteContent({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        contentType: 'blog'
      })
    ).resolves.toEqual({
      content: expect.objectContaining({ contentId: 'content_fixed', contentType: 'blog' })
    })
    await expect(
      admin.updateSiteContentLocaleVersion({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        version: {
          contentId: 'content_fixed',
          locale: 'en-US',
          slug: 'launch-note',
          title: 'Launch note',
          bodyHtml: '<p>Hello</p><script>alert(1)</script>',
          seoTitle: 'Launch SEO',
          seoDescription: 'Launch page'
        }
      })
    ).resolves.toEqual({
      version: expect.objectContaining({ contentId: 'content_fixed', syncStatus: 'pending' })
    })
    await expect(
      admin.syncAllPendingChanges({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a'
      })
    ).resolves.toEqual({ syncId: 'sync_fixed', publishVersion: 3, webhookDispatched: true })

    expect(repository.upsertPublicView).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceType: 'blog',
        resourceId: 'content_fixed',
        publishVersion: 3,
        payload: expect.objectContaining({
          body_html: '<p>Hello</p>'
        })
      })
    )
    expect(repository.createSyncBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        syncId: 'sync_fixed',
        publishVersion: 3,
        resources: [expect.objectContaining({ resourceType: 'blog', resourceId: 'content_fixed' })]
      })
    )
    expect(repository.recordWebhookDelivery).toHaveBeenCalledWith(expect.objectContaining({
      syncId: 'sync_fixed',
      siteId: 'site_a',
      tenantId: 'tenant_a',
      eventType: 'site.publish.available',
      publishVersion: 3,
      resent: false
    }))
    expect(webhookPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({
      syncId: 'sync_fixed',
      siteId: 'site_a',
      eventType: 'site.publish.available',
      publishVersion: 3,
      payload: {
        event_id: 'webhook_fixed',
        site_id: 'site_a',
        event_type: 'site.publish.available',
        publish_version: 3,
        occurred_at: '2026-06-15T08:00:00.000Z'
      },
      headers: {
        'x-oes-site-id': 'site_a',
        'x-oes-event-id': 'webhook_fixed'
      },
      targetUrl: 'https://runtime.example/oes/webhooks/site',
      signingSecret: 'webhook_secret_a',
      resent: false,
      occurredAt: now
    }))
    expect(JSON.stringify(webhookPublisher.publish.mock.calls[0][0].payload)).not.toContain('changed')
    expect(JSON.stringify(webhookPublisher.publish.mock.calls[0][0].payload)).not.toContain('body_html')
  })

  it('verifies signed runtime changed-resource and public-view reads', async () => {
    repository.findCredentialForVerification.mockResolvedValue({
      siteId: 'site_a',
      clientId: 'client_a',
      credentialId: 'cred_a',
      clientSecret: 'client_secret_a',
      scopes: ['site:sync', 'site:read'],
      status: 'active',
      siteStatus: 'active'
    })
    repository.rememberCredentialNonce.mockResolvedValue(true)
    repository.listChangedResourcesForRuntime.mockResolvedValue([
      {
        resourceType: 'blog',
        resourceId: 'content_fixed',
        locale: 'en-US',
        changeType: 'create',
        latestPublishVersion: 3
      }
    ])
    repository.batchGetPublicViewsForRuntime.mockResolvedValue({
      publicViews: [
        {
          siteId: 'site_a',
          resourceType: 'blog',
          resourceId: 'content_fixed',
          locale: 'en-US',
          slug: 'launch-note',
          status: 'published',
          publishVersion: 3,
          updatedAt: now,
          payload: { title: 'Launch note' }
        }
      ],
      missingResources: [],
      serverPublishVersion: 3
    })

    await expect(
      runtime.listChangedResources({
        signedContext: signedContextFor('/api/v1/site/sync/changed-resources', '{"from_publish_version":2}', 'nonce_changed'),
        fromPublishVersion: 2
      })
    ).resolves.toEqual({
      siteId: 'site_a',
      fromPublishVersion: 2,
      toPublishVersion: 3,
      requiresSnapshot: false,
      changedResources: [
        {
          resourceType: 'blog',
          resourceId: 'content_fixed',
          locale: 'en-US',
          changeType: 'create',
          latestPublishVersion: 3
        }
      ]
    })
    await expect(
      runtime.batchGetPublicViews({
        signedContext: signedContextFor('/api/v1/site/sync/public-views:batchGet', '{"resources":[]}', 'nonce_views'),
        resources: [{ resourceType: 'blog', resourceId: 'content_fixed', locale: 'en-US' }]
      })
    ).resolves.toEqual({
      serverPublishVersion: 3,
      missingResources: [],
      publicViews: [
        expect.objectContaining({
          siteId: 'site_a',
          resourceType: 'blog',
          payloadJson: JSON.stringify({ title: 'Launch note' })
        })
      ]
    })
  })

  it('serves signed runtime snapshots from one consistent publish version', async () => {
    repository.findCredentialForVerification.mockResolvedValue({
      siteId: 'site_a',
      clientId: 'client_a',
      credentialId: 'cred_a',
      clientSecret: 'client_secret_a',
      scopes: ['site:sync'],
      status: 'active',
      siteStatus: 'active'
    })
    repository.rememberCredentialNonce.mockResolvedValue(true)
    repository.getSnapshotForRuntime.mockResolvedValue({
      snapshotPublishVersion: 7,
      publicViews: [
        {
          siteId: 'site_a',
          resourceType: 'product',
          resourceId: 'product_a',
          locale: 'en-US',
          slug: 'gearbox',
          status: 'published',
          publishVersion: 6,
          updatedAt: now,
          payload: { title: 'Gearbox' }
        },
        {
          siteId: 'site_a',
          resourceType: 'blog',
          resourceId: 'blog_a',
          locale: 'en-US',
          slug: 'launch-note',
          status: 'published',
          publishVersion: 7,
          updatedAt: now,
          payload: { title: 'Launch note' }
        }
      ],
      nextPageToken: '',
      isComplete: true
    })

    await expect(
      runtime.getSnapshot({
        signedContext: signedContextFor(
          '/api/v1/site/sync/snapshot',
          '{"resource_types":["product","blog"],"locales":["en-US"],"page_size":100}',
          'nonce_snapshot'
        ),
        resourceTypes: ['product', 'blog'],
        locales: ['en-US'],
        pageSize: 100
      })
    ).resolves.toEqual({
      siteId: 'site_a',
      snapshotPublishVersion: 7,
      publicViews: [
        expect.objectContaining({
          siteId: 'site_a',
          resourceType: 'product',
          resourceId: 'product_a',
          payloadJson: JSON.stringify({ title: 'Gearbox' })
        }),
        expect.objectContaining({
          siteId: 'site_a',
          resourceType: 'blog',
          resourceId: 'blog_a',
          payloadJson: JSON.stringify({ title: 'Launch note' })
        })
      ],
      nextPageToken: '',
      isComplete: true
    })
    expect(repository.getSnapshotForRuntime).toHaveBeenCalledWith({
      siteId: 'site_a',
      resourceTypes: ['product', 'blog'],
      locales: ['en-US'],
      pageToken: undefined,
      pageSize: 100
    })
  })

  it('rotates and revokes credentials and issues 15-minute preview tokens', async () => {
    await expect(
      admin.rotateSiteCredential({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        credentialId: 'cred_old'
      })
    ).resolves.toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({ credentialId: 'cred_fixed', status: 'active' }),
        credentialBundle: expect.stringMatching(/^oes_site_cred_v1\./)
      })
    )
    await expect(
      admin.revokeSiteCredential({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        credentialId: 'cred_fixed'
      })
    ).resolves.toEqual({ revoked: true })
    await expect(
      admin.issuePreviewToken({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        resourceType: 'blog',
        resourceId: 'content_fixed',
        locale: 'en-US'
      })
    ).resolves.toEqual(
      expect.objectContaining({
        previewToken: expect.stringMatching(/^oes_preview_v1\./),
        previewUrl: expect.stringContaining('preview_token='),
        expiresAt: '2026-06-15T08:15:00.000Z'
      })
    )

    expect(repository.revokeSiteCredential).toHaveBeenCalledWith({
      siteId: 'site_a',
      credentialId: 'cred_fixed',
      revokedAt: now
    })
  })

  it('rejects unsupported category preview tokens at the Admin issue boundary', async () => {
    await expect(
      admin.issuePreviewToken({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        resourceType: 'category',
        resourceId: 'category_fixed',
        locale: 'en-US'
      })
    ).rejects.toThrow('resourceType is unsupported')
  })

  it('serves signed draft preview views without writing public publish state', async () => {
    repository.findCredentialForVerification.mockResolvedValue({
      siteId: 'site_a',
      clientId: 'client_a',
      credentialId: 'cred_a',
      clientSecret: 'client_secret_a',
      scopes: ['site:preview'],
      status: 'active',
      siteStatus: 'active'
    })
    repository.rememberCredentialNonce.mockResolvedValue(true)
    repository.getContentVersionForPublicView.mockResolvedValue({
      contentId: 'content_fixed',
      contentType: 'blog',
      locale: 'en-US',
      slug: 'launch-note',
      title: 'Launch note',
      bodyHtml: '<p>Hello</p><script>alert(1)</script>',
      summary: 'Short',
      coverImage: null,
      author: 'OES',
      tags: ['launch'],
      seoTitle: 'Launch SEO',
      seoDescription: 'Launch page',
      seoImage: null,
      publishedAt: null
    })
    const issued = await admin.issuePreviewToken({
      context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
      siteId: 'site_a',
      resourceType: 'blog',
      resourceId: 'content_fixed',
      locale: 'en-US'
    })

    await expect(
      runtime.getPreviewView({
        signedContext: signedContextFor('/api/v1/site/preview/view', '{"preview_token":"x"}', 'nonce_preview'),
        previewToken: issued.previewToken,
        resourceType: 'blog',
        resourceId: 'content_fixed',
        locale: 'en-US'
      })
    ).resolves.toEqual({
      previewView: expect.objectContaining({
        siteId: 'site_a',
        resourceType: 'blog',
        resourceId: 'content_fixed',
        status: 'draft_preview',
        publishVersion: 0,
        payloadJson: expect.stringContaining('"body_html":"<p>Hello</p>"')
      }),
      expiresAt: '2026-06-15T08:15:00.000Z',
      noindex: true,
      cachePolicy: 'no-store'
    })
    expect(repository.upsertPublicView).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'draft_preview' }))
  })

  it('manages locale lifecycle through the site-service owner boundary', async () => {
    repository.checkLocaleCompleteness.mockResolvedValue({ complete: true, issues: [] })

    await expect(
      admin.addPreparingLocale({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        locale: 'fr-FR'
      })
    ).resolves.toEqual({ added: true })
    await expect(
      admin.checkLocaleCompleteness({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        locale: 'fr-FR'
      })
    ).resolves.toEqual({ complete: true, issues: [] })
    await expect(
      admin.activateLocale({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        locale: 'fr-FR'
      })
    ).resolves.toEqual({ activated: true })
    await expect(
      admin.disableLocale({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        locale: 'fr-FR'
      })
    ).resolves.toEqual({ disabled: true })

    expect(repository.addPreparingLocale).toHaveBeenCalledWith({ siteId: 'site_a', locale: 'fr-FR' })
    expect(repository.activateLocale).toHaveBeenCalledWith({ siteId: 'site_a', locale: 'fr-FR' })
    expect(repository.disableLocale).toHaveBeenCalledWith({ siteId: 'site_a', locale: 'fr-FR' })
    expect(repository.markLocaleResourcesPending).toHaveBeenCalledWith({ siteId: 'site_a', locale: 'fr-FR' })
    expect(repository.saveAuditEnvelope).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'site_locale.added' }))
    expect(repository.saveAuditEnvelope).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'site_locale.activated' }))
    expect(repository.saveAuditEnvelope).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'site_locale.disabled' }))
  })

  it('syncs disabled locale resources as disabled public view status', async () => {
    repository.getSitePublishStateForSync.mockResolvedValue({ tenantId: 'tenant_a', currentPublishVersion: 10 })
    repository.hasInitialWebhookDelivery.mockResolvedValue(false)
    repository.getWebhookDispatchConfig.mockResolvedValue({
      targetUrl: 'https://runtime.example/oes/webhooks/site',
      signingSecret: 'webhook_secret_a'
    })
    repository.listPendingSyncResources.mockResolvedValue([
      { resourceType: 'product', resourceId: 'product_fr', locale: 'fr-FR', changeType: 'locale_disable', markedAt: now }
    ])
    repository.getLocaleStatus.mockResolvedValue('disabled')
    repository.getProductPublicationForPublicView.mockResolvedValue({
      productId: 'product_fr',
      locale: 'fr-FR',
      slug: 'produit-fr',
      displayTitle: 'Produit FR',
      displayDescription: 'French description',
      seoTitle: 'Produit FR',
      seoDescription: 'French SEO',
      seoImage: null,
      imageOverride: null,
      publishStatus: 'published'
    })

    await expect(
      admin.syncAllPendingChanges({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a'
      })
    ).resolves.toEqual({ syncId: 'sync_fixed', publishVersion: 11, webhookDispatched: true })

    expect(repository.upsertPublicView).toHaveBeenCalledWith(expect.objectContaining({
      resourceType: 'product',
      resourceId: 'product_fr',
      locale: 'fr-FR',
      status: 'disabled',
      publishVersion: 11
    }))
    expect(repository.createSyncBatch).toHaveBeenCalledWith(expect.objectContaining({
      resources: [expect.objectContaining({ changeType: 'locale_disable' })]
    }))
  })

  it('creates site categories and syncs CategoryPublicView envelopes', async () => {
    repository.createSiteCategory.mockResolvedValue({
      categoryId: 'category_fixed',
      siteId: 'site_a',
      locale: 'en-US',
      slug: 'basins',
      displayTitle: 'Basins',
      description: 'Bathroom basin collections',
      sortOrder: 10,
      publishStatus: 'published',
      syncStatus: 'pending'
    })
    repository.getSitePublishStateForSync.mockResolvedValue({ tenantId: 'tenant_a', currentPublishVersion: 12 })
    repository.hasInitialWebhookDelivery.mockResolvedValue(false)
    repository.getWebhookDispatchConfig.mockResolvedValue({
      targetUrl: 'https://runtime.example/oes/webhooks/site',
      signingSecret: 'webhook_secret_a'
    })
    repository.listPendingSyncResources.mockResolvedValue([
      { resourceType: 'category', resourceId: 'category_fixed', locale: 'en-US', changeType: 'create', markedAt: now }
    ])
    repository.getCategoryPublicationForPublicView.mockResolvedValue({
      categoryId: 'category_fixed',
      parentCategoryId: null,
      locale: 'en-US',
      slug: 'basins',
      displayTitle: 'Basins',
      description: 'Bathroom basin collections',
      image: null,
      sortOrder: 10,
      seoTitle: 'Bathroom Basins',
      seoDescription: 'Explore basin collections',
      seoImage: null,
      publishStatus: 'published'
    })

    await expect(
      admin.createSiteCategory({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        locale: 'en-US',
        slug: 'basins',
        displayTitle: 'Basins',
        description: 'Bathroom basin collections',
        sortOrder: 10,
        seoTitle: 'Bathroom Basins',
        seoDescription: 'Explore basin collections'
      } as never)
    ).resolves.toEqual({
      category: expect.objectContaining({ categoryId: 'category_fixed', syncStatus: 'pending' })
    })
    await expect(
      admin.syncAllPendingChanges({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a'
      })
    ).resolves.toEqual({ syncId: 'sync_fixed', publishVersion: 13, webhookDispatched: true })

    expect(repository.upsertPublicView).toHaveBeenCalledWith(expect.objectContaining({
      resourceType: 'category',
      resourceId: 'category_fixed',
      locale: 'en-US',
      slug: 'basins',
      status: 'published',
      publishVersion: 13,
      payload: expect.objectContaining({
        category_id: 'category_fixed',
        display_title: 'Basins'
      })
    }))
    expect(repository.markCategoryPublicationSynced).toHaveBeenCalledWith({
      siteId: 'site_a',
      categoryId: 'category_fixed',
      locale: 'en-US'
    })
  })

  it('adds product publications, marks them pending, and syncs ProductPublicView envelopes', async () => {
    repository.addProductPublication.mockResolvedValue({
      publicationId: 'publication_fixed',
      siteId: 'site_a',
      productId: 'product_a',
      locale: 'en-US',
      slug: 'product-a',
      displayTitle: 'Product A',
      displayDescription: 'A product',
      seoTitle: 'Product A SEO',
      seoDescription: 'A product SEO',
      categoryIds: ['category_fixed'],
      publishStatus: 'published',
      syncStatus: 'pending'
    })
    repository.getSitePublishStateForSync.mockResolvedValue({ tenantId: 'tenant_a', currentPublishVersion: 7 })
    repository.hasInitialWebhookDelivery.mockResolvedValue(false)
    repository.getWebhookDispatchConfig.mockResolvedValue({
      targetUrl: 'https://runtime.example/oes/webhooks/site',
      signingSecret: 'webhook_secret_a'
    })
    repository.listPendingSyncResources.mockResolvedValue([
      { resourceType: 'product', resourceId: 'product_a', locale: 'en-US', changeType: 'update', markedAt: now }
    ])
    repository.getProductPublicationForPublicView.mockResolvedValue({
      productId: 'product_a',
      locale: 'en-US',
      slug: 'product-a',
      displayTitle: 'Product A',
      displayDescription: 'A product',
      seoTitle: 'Product A SEO',
      seoDescription: 'A product SEO',
      seoImage: null,
      imageOverride: null,
      categoryIds: ['category_fixed'],
      publishStatus: 'published'
    })

    await expect(
      admin.addProductsToSite({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        productIds: ['product_a'],
        locales: ['en-US']
      })
    ).resolves.toEqual({
      publications: [expect.objectContaining({ productId: 'product_a', syncStatus: 'pending' })]
    })
    await expect(
      admin.syncAllPendingChanges({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a'
      })
    ).resolves.toEqual({ syncId: 'sync_fixed', publishVersion: 8, webhookDispatched: true })

    expect(repository.upsertPublicView).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceType: 'product',
        resourceId: 'product_a',
        publishVersion: 8,
        payload: expect.objectContaining({
          product_id: 'product_a',
          display_title: 'Product A',
          category_ids: ['category_fixed']
        })
      })
    )
    expect(repository.markProductPublicationSynced).toHaveBeenCalledWith({
      siteId: 'site_a',
      productId: 'product_a',
      locale: 'en-US'
    })
  })

  it('keeps webhook retry and resend idempotent without advancing publish versions', async () => {
    repository.getLastSyncBatch.mockResolvedValue({ syncId: 'sync_existing', publishVersion: 8 })
    repository.getSyncDetail.mockResolvedValue({ syncId: 'sync_existing', siteId: 'site_a', publishVersion: 8 })
    repository.getWebhookDispatchConfig.mockResolvedValue({
      targetUrl: 'https://runtime.example/oes/webhooks/site',
      signingSecret: 'webhook_secret_a'
    })

    await expect(
      admin.retryLastSync({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a'
      })
    ).resolves.toEqual({ syncId: 'sync_existing', publishVersion: 8 })
    await expect(
      admin.resendWebhook({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        syncId: 'sync_existing'
      })
    ).resolves.toEqual({ resent: true })

    expect(repository.createSyncBatch).not.toHaveBeenCalledWith(expect.objectContaining({ syncId: 'sync_existing' }))
    expect(repository.upsertPublicView).not.toHaveBeenCalledWith(expect.objectContaining({ publishVersion: 9 }))
    expect(repository.recordWebhookDelivery).toHaveBeenCalledWith(expect.objectContaining({
      syncId: 'sync_existing',
      publishVersion: 8,
      resent: true
    }))
  })

  it('returns Admin sync and audit read models from repository data', async () => {
    repository.getPendingSyncSummary.mockResolvedValue({ pendingCount: 2, resourceTypes: ['blog', 'product'] })
    repository.listPendingSyncResources.mockResolvedValue([
      { resourceType: 'blog', resourceId: 'content_a', locale: 'en-US', changeType: 'create', latestPublishVersion: 0 }
    ])
    repository.listSyncHistory.mockResolvedValue([
      { syncId: 'sync_a', siteId: 'site_a', publishVersion: 3, status: 'completed', triggeredBy: 'operator_a', resources: [] }
    ])
    repository.getSyncDetail.mockResolvedValue({
      syncId: 'sync_a',
      siteId: 'site_a',
      publishVersion: 3,
      status: 'completed',
      triggeredBy: 'operator_a',
      resources: []
    })
    repository.listSiteAuditLogs.mockResolvedValue([
      {
        eventId: 'audit_a',
        siteId: 'site_a',
        eventType: 'site.created',
        resourceType: 'site',
        resourceId: 'site_a',
        operatorId: 'operator_a',
        result: 'SUCCEEDED',
        traceId: 'trace_a',
        occurredAt: now
      }
    ])

    await expect(admin.getPendingSyncSummary({ context: { tenantId: 'tenant_a' }, siteId: 'site_a' })).resolves.toEqual({
      pendingCount: 2,
      resourceTypes: ['blog', 'product']
    })
    await expect(admin.listPendingSyncResources({ context: { tenantId: 'tenant_a' }, siteId: 'site_a' })).resolves.toEqual({
      resources: [expect.objectContaining({ resourceType: 'blog', resourceId: 'content_a' })]
    })
    await expect(admin.listSyncHistory({ context: { tenantId: 'tenant_a' }, siteId: 'site_a' })).resolves.toEqual({
      batches: [expect.objectContaining({ syncId: 'sync_a', publishVersion: 3 })]
    })
    await expect(admin.getSyncDetail({ context: { tenantId: 'tenant_a' }, syncId: 'sync_a' })).resolves.toEqual({
      batch: expect.objectContaining({ syncId: 'sync_a', publishVersion: 3 })
    })
    await expect(admin.listSiteAuditLogs({ context: { tenantId: 'tenant_a' }, siteId: 'site_a' })).resolves.toEqual({
      auditLogs: [expect.objectContaining({ auditId: 'audit_a', operation: 'site.created' })]
    })
  })
})

/** signedContextFor builds one signed context for application-level Site Runtime tests. */
function signedContextFor(path: string, bodyText: string, nonce: string) {
  const body = Buffer.from(bodyText)
  const timestamp = String(new Date('2026-06-15T08:00:00.000Z').getTime())
  const canonical = buildCanonicalRequest({
    method: 'POST',
    path,
    query: {},
    body,
    siteId: 'site_a',
    clientId: 'client_a',
    credentialId: 'cred_a',
    timestamp,
    nonce
  })

  return {
    siteId: 'site_a',
    clientId: 'client_a',
    credentialId: 'cred_a',
    requestId: `request_${nonce}`,
    traceId: `trace_${nonce}`,
    timestamp,
    nonce,
    signature: formatSignature(createHmac('sha256', 'client_secret_a').update(canonical).digest('hex')),
    method: 'POST',
    path,
    normalizedQuery: '',
    bodySha256: createHash('sha256').update(body).digest('hex')
  }
}
