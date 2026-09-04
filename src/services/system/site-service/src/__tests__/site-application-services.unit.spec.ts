import { createHash, createHmac } from 'node:crypto'
import { SITE_SUPPORTED_LOCALE_OPTIONS } from '@oes/common/contracts'
import { VALIDATION_FAILED } from '@oes/common/exceptions'
import { SiteAdminApplicationService } from '../application/services/site-admin-application.service'
import { SiteRuntimeApplicationService } from '../application/services/site-runtime-application.service'
import {
  buildCanonicalRequest,
  formatSignature
} from '../domain/security/site-request-signing'

// Verifies application services orchestrate repository, audit, credential, and signed runtime boundaries.
describe('site-service application services Unit', () => {
  const repository = {
    createSiteWithDefaultLocale: jest.fn(),
    listSiteCards: jest.fn(),
    saveCredentialMetadata: jest.fn(),
    listSiteCredentials: jest.fn(),
    saveAuditEnvelope: jest.fn(),
    findTenantIdForSite: jest.fn(),
    findContentOwnership: jest.fn(),
    findCredentialOwnership: jest.fn(),
    findPreviewResourceOwnership: jest.fn(),
    findCredentialForVerification: jest.fn(),
    rememberCredentialNonce: jest.fn(),
    getLatestPublishState: jest.fn(),
    getCommittedSyncTarget: jest.fn(),
    updateRuntimeSyncResult: jest.fn(),
    listChangedResourcesForRuntime: jest.fn(),
    batchGetPublicViewsForRuntime: jest.fn(),
    revokeSiteCredential: jest.fn(),
    createContentEntry: jest.fn(),
    updateContentLocaleVersion: jest.fn(),
    listPendingSyncResources: jest.fn(),
    getContentVersionForPublicView: jest.fn(),
    getPreviewContentVersionForPublicView: jest.fn(),
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
    listActiveSiteLocales: jest.fn(),
    unpublishSiteContent: jest.fn(),
    createContentCategory: jest.fn(),
    updateContentCategoryLocaleVersion: jest.fn(),
    deleteContentCategory: jest.fn(),
    getDefaultSiteLocale: jest.fn(),
    publishContentCategoryLocaleVersion: jest.fn(),
    requestContentCategoryLocalePublication: jest.fn(),
    getContentCategoryUsage: jest.fn(),
    listContentCategories: jest.fn(),
    getContentCategory: jest.fn(),
    getContentCategoryLocaleVersionForPublicView: jest.fn(),
    markContentCategoryVersionSynced: jest.fn(),
    getPendingSyncSummary: jest.fn(),
    listSyncHistory: jest.fn(),
    findSyncOwnership: jest.fn(),
    getSyncDetail: jest.fn(),
    getLastSyncBatch: jest.fn(),
    getWebhookDispatchConfig: jest.fn(),
    recordWebhookDelivery: jest.fn(),
    hasInitialWebhookDelivery: jest.fn(),
    listSiteAuditLogs: jest.fn(),
    getDraftPreviewResource: jest.fn(),
    getSnapshotForRuntime: jest.fn(),
    registerPageCapabilities: jest.fn(),
    listSitePages: jest.fn(),
    updateSitePageGovernance: jest.fn(),
    checkSitePagePreflight: jest.fn(),
    markSiteExposurePending: jest.fn(),
    publishSiteExposure: jest.fn(),
    markSiteExposureSynced: jest.fn(),
    runInTransaction: jest.fn()
  }
  const webhookPublisher = {
    publish: jest.fn()
  }
  const now = new Date('2026-06-15T08:00:00.000Z')
  /** Mirrors the immutable controller-injected Admin authority; body identity is never the fixture source. */
  const trustedAdmin = { tenantId: 'tenant_a', orgId: 'org_a', operatorId: 'operator_a', traceId: 'trace_a' }
  const admin = new SiteAdminApplicationService(
    repository as never,
    {
      now: () => now,
      randomId: (prefix) => `${prefix}_fixed`,
      randomSecret: () => 'client_secret_a',
      previewTokenSecret: 'site-service-local-preview-secret',
      oesBaseUrl: 'https://oes.example/api/v1/site',
      environment: 'local'
    },
    webhookPublisher
  )
  const runtime = new SiteRuntimeApplicationService(repository as never, {
    now: () => now,
    previewTokenSecret: 'site-service-local-preview-secret'
  })

  beforeEach(() => {
    jest.resetAllMocks()
    repository.findTenantIdForSite.mockResolvedValue('tenant_a')
    repository.findContentOwnership.mockResolvedValue({
      siteId: 'site_a',
      contentType: 'blog'
    })
    repository.findCredentialOwnership.mockResolvedValue({ siteId: 'site_a' })
    repository.findPreviewResourceOwnership.mockResolvedValue({
      siteId: 'site_a',
      resourceType: 'blog',
      localeMatched: true
    })
    repository.revokeSiteCredential.mockResolvedValue(true)
    repository.findSyncOwnership.mockResolvedValue({
      syncId: 'sync_a',
      siteId: 'site_a',
      tenantId: 'tenant_a'
    })
    repository.getLocaleStatus.mockResolvedValue('active')
    repository.runInTransaction.mockImplementation(async (callback) => callback())
  })

  it('creates a draft site, records audit, and lists site cards', async () => {
    repository.listSiteCards.mockResolvedValue([{ siteId: 'site_fixed', siteName: 'Brand US' }])

    await expect(
      admin.createSite({
        context: trustedAdmin,
        siteName: 'Brand US',
        siteType: 'brand',
        defaultLocale: 'en-US',
        primaryDomain: 'brand.example',
        previewBaseUrl: 'https://brand.example/preview'
      })
    ).resolves.toEqual({ siteId: 'site_fixed', status: 'draft', defaultLocale: 'en-US' })
    await expect(
      admin.listSiteCards({ context: trustedAdmin })
    ).resolves.toEqual({
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

  it('exposes fixed supported locale options from common contracts', () => {
    expect(SITE_SUPPORTED_LOCALE_OPTIONS).toEqual(
      expect.arrayContaining([
        { locale: 'en-US', nativeName: 'English (United States)' },
        { locale: 'zh-CN', nativeName: '简体中文' }
      ])
    )
  })

  it('rejects site and preparing-locale writes when the locale is not in the common enum', async () => {
    await expect(
      admin.createSite({
        context: trustedAdmin,
        siteName: 'Brand Esperanto',
        siteType: 'brand',
        defaultLocale: 'eo-EO'
      })
    ).rejects.toThrow('locale eo-EO is not supported')

    await expect(
      admin.addPreparingLocale({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        locale: 'eo-EO'
      })
    ).rejects.toThrow('locale eo-EO is not supported')

    expect(repository.createSiteWithDefaultLocale).not.toHaveBeenCalled()
    expect(repository.addPreparingLocale).not.toHaveBeenCalled()
  })

  it('rejects site content writes when the locale is not configured on the current site', async () => {
    repository.getLocaleStatus.mockResolvedValueOnce(null)
    await expect(
      admin.createSiteCategory({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a' },
        siteId: 'site_a',
        locale: 'fr-FR',
        slug: 'plates',
        displayTitle: 'Plates',
        seoTitle: 'Plates'
      })
    ).rejects.toThrow('locale fr-FR is not configured on site site_a')

    repository.getLocaleStatus.mockResolvedValueOnce('disabled')
    await expect(
      admin.addProductsToSite({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a' },
        siteId: 'site_a',
        productIds: ['product_a'],
        locales: ['fr-FR']
      })
    ).rejects.toThrow('locale fr-FR is not active or preparing on site site_a')

    repository.getLocaleStatus.mockResolvedValueOnce(null)
    await expect(
      admin.updateSiteContentLocaleVersion({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a' },
        siteId: 'site_a',
        version: {
          contentId: 'content_a',
          locale: 'fr-FR',
          slug: 'guide',
          title: 'Guide',
          bodyHtml: '<p>Guide</p>',
          seoTitle: 'Guide',
          seoDescription: 'Guide'
        }
      })
    ).rejects.toThrow('locale fr-FR is not configured on site site_a')

    repository.getLocaleStatus.mockResolvedValueOnce(null)
    await expect(
      admin.updateContentCategoryLocaleVersion({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a' },
        siteId: 'site_a',
        version: {
          categoryId: 'content_category_a',
          locale: 'fr-FR',
          slug: 'how-to',
          name: 'How To',
          seoTitle: 'How To',
          seoDescription: 'How To'
        }
      })
    ).rejects.toThrow('locale fr-FR is not configured on site site_a')
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

  it('includes the fixed capability-registration scope in default Runtime credentials', async () => {
    await expect(
      admin.generateSiteCredential({
        context: {
          tenantId: 'tenant_a',
          operatorId: 'operator_a',
          traceId: 'trace_a'
        },
        siteId: 'site_a'
      })
    ).resolves.toEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({
          scopes: ['site:read', 'site:sync', 'site:preview', 'site:status', 'site:capabilities']
        })
      })
    )

    expect(repository.saveCredentialMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        scopes: ['site:read', 'site:sync', 'site:preview', 'site:status', 'site:capabilities']
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

    const serialized = JSON.stringify(
      await admin.listSiteCredentials({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a'
      })
    )
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
    const signature = formatSignature(
      createHmac('sha256', 'client_secret_a').update(canonical).digest('hex')
    )
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
    repository.getLatestPublishState.mockResolvedValue({
      latestPublishVersion: 5,
      latestSyncId: 'sync_a'
    })

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

  it('registers a signed complete page capability manifest idempotently without publishing', async () => {
    repository.findCredentialForVerification.mockResolvedValue({
      siteId: 'site_a',
      clientId: 'client_a',
      credentialId: 'cred_a',
      clientSecret: 'client_secret_a',
      scopes: ['site:capabilities'],
      status: 'active',
      siteStatus: 'active'
    })
    repository.rememberCredentialNonce.mockResolvedValue(true)
    repository.findTenantIdForSite.mockResolvedValue('tenant_a')
    repository.registerPageCapabilities.mockResolvedValue({
      accepted: true,
      idempotentReplay: false,
      manifestHash: 'b8760cd0370e7c54852695c1fcfe895daa9f3d130a90ef1c58bdaa17d60ccacb',
      discoveredCount: 2,
      unavailablePageKeys: [],
      driftPageKeys: [],
      recoveredPageKeys: [],
      registrationGeneration: '1'
    })

    await expect(
      (runtime as any).registerPageCapabilities({
        signedContext: signedContextFor(
          '/api/v1/site/capabilities/pages:register',
          '{"idempotency_key":"deploy-42","expected_registration_generation":"0","capabilities":[{"page_key":"PRODUCT_DETAIL","supported_locales":["en-US","zh-CN"]},{"page_key":"HOME","supported_locales":["en-US"]}],"runtime_version":"1.0.0"}',
          'nonce_capabilities'
        ),
        idempotencyKey: 'deploy-42',
        expectedRegistrationGeneration: '0',
        runtimeVersion: '1.0.0',
        capabilities: [
          { pageKey: 'PRODUCT_DETAIL', supportedLocales: ['en-US', 'zh-CN'] },
          { pageKey: 'HOME', supportedLocales: ['en-US'] }
        ]
      })
    ).resolves.toEqual({
      accepted: true,
      idempotentReplay: false,
      manifestHash: 'b8760cd0370e7c54852695c1fcfe895daa9f3d130a90ef1c58bdaa17d60ccacb',
      discoveredCount: 2,
      unavailablePageKeys: [],
      driftPageKeys: [],
      recoveredPageKeys: [],
      registrationGeneration: '1'
    })

    expect(repository.registerPageCapabilities).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: 'site_a',
        clientId: 'client_a',
        idempotencyKey: 'deploy-42',
        expectedRegistrationGeneration: 0n,
        manifestHash: 'b8760cd0370e7c54852695c1fcfe895daa9f3d130a90ef1c58bdaa17d60ccacb',
        capabilities: [
          { pageKey: 'HOME', supportedLocales: ['en-US'] },
          { pageKey: 'PRODUCT_DETAIL', supportedLocales: ['en-US', 'zh-CN'] }
        ]
      })
    )
    expect(repository.saveAuditEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'site_page_capability.registered',
        operatorType: 'SITE_RUNTIME',
        tenantId: 'tenant_a',
        resourceType: 'site_page_capability_manifest',
        resourceId: 'site_a'
      })
    )
    expect(repository.createSyncBatch).not.toHaveBeenCalled()
    expect(webhookPublisher.publish).not.toHaveBeenCalled()
  })

  it('uses the frozen empty-manifest hash and audits stale generation rejection without publishing', async () => {
    repository.findCredentialForVerification.mockResolvedValue({
      siteId: 'site_a',
      clientId: 'client_a',
      credentialId: 'cred_a',
      clientSecret: 'client_secret_a',
      scopes: ['site:capabilities'],
      status: 'active',
      siteStatus: 'active'
    })
    repository.rememberCredentialNonce.mockResolvedValue(true)
    repository.findTenantIdForSite.mockResolvedValue('tenant_a')
    repository.registerPageCapabilities.mockResolvedValue({
      accepted: false,
      idempotentReplay: false,
      manifestHash: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
      discoveredCount: 0,
      unavailablePageKeys: [],
      driftPageKeys: [],
      recoveredPageKeys: [],
      registrationGeneration: '3'
    })

    await expect(
      (runtime as any).registerPageCapabilities({
        signedContext: signedContextFor(
          '/api/v1/site/capabilities/pages:register',
          '{"idempotency_key":"stale-deploy","expected_registration_generation":"1","capabilities":[],"runtime_version":"1.0.0"}',
          'nonce_stale_capabilities'
        ),
        idempotencyKey: 'stale-deploy',
        expectedRegistrationGeneration: '1',
        runtimeVersion: '1.0.0',
        capabilities: []
      })
    ).resolves.toEqual(expect.objectContaining({ accepted: false, registrationGeneration: '3' }))

    expect(repository.registerPageCapabilities).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedRegistrationGeneration: 1n,
        manifestHash: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945'
      })
    )
    expect(repository.saveAuditEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'site_page_capability.registration_stale_rejected',
        result: 'REJECTED',
        tenantId: 'tenant_a',
        traceId: 'trace_nonce_stale_capabilities'
      })
    )
    expect(repository.createSyncBatch).not.toHaveBeenCalled()
    expect(webhookPublisher.publish).not.toHaveBeenCalled()
  })

  it.each([
    ['non-array capabilities', { capabilities: 'HOME' }],
    ['sparse capabilities', { capabilities: Array(1) }],
    ['invalid BCP47 locale', { capabilities: [{ pageKey: 'HOME', supportedLocales: ['en_US'] }] }],
    [
      'duplicate canonical locale',
      { capabilities: [{ pageKey: 'HOME', supportedLocales: ['en-US', 'en-us'] }] }
    ],
    [
      'duplicate pageKey',
      {
        capabilities: [
          { pageKey: 'HOME', supportedLocales: ['en-US'] },
          { pageKey: 'HOME', supportedLocales: ['zh-CN'] }
        ]
      }
    ],
    [
      'pageKey over limit',
      { capabilities: [{ pageKey: 'P'.repeat(129), supportedLocales: ['en-US'] }] }
    ],
    [
      'locale count over limit',
      {
        capabilities: [
          {
            pageKey: 'HOME',
            supportedLocales: Array.from({ length: 33 }, (_, index) => `x-${index}`)
          }
        ]
      }
    ],
    ['whitespace idempotency', { idempotencyKey: ' deploy-42' }],
    ['idempotency over limit', { idempotencyKey: 'i'.repeat(256) }],
    ['missing runtimeVersion', { runtimeVersion: undefined }],
    ['whitespace runtimeVersion', { runtimeVersion: '1.0.0 ' }],
    ['runtimeVersion over limit', { runtimeVersion: 'v'.repeat(129) }]
  ])(
    'rejects malformed registration before repository mutation: %s',
    async (caseName, overrides) => {
      repository.findCredentialForVerification.mockResolvedValue({
        siteId: 'site_a',
        clientId: 'client_a',
        credentialId: 'cred_a',
        clientSecret: 'client_secret_a',
        scopes: ['site:capabilities'],
        status: 'active',
        siteStatus: 'active'
      })
      repository.rememberCredentialNonce.mockResolvedValue(true)
      repository.findTenantIdForSite.mockResolvedValue('tenant_a')
      const nonce = `nonce_validation_${caseName.replace(/[^a-z]+/gi, '_')}`

      await expect(
        (runtime as any).registerPageCapabilities({
          signedContext: signedContextFor('/api/v1/site/capabilities/pages:register', '{}', nonce),
          idempotencyKey: 'deploy-42',
          expectedRegistrationGeneration: '0',
          runtimeVersion: '1.0.0',
          capabilities: [{ pageKey: 'HOME', supportedLocales: ['en-US'] }],
          ...overrides
        })
      ).rejects.toMatchObject({ code: 'SITE_CAPABILITY_REGISTRATION_VALIDATION_FAILED' })
      expect(repository.registerPageCapabilities).not.toHaveBeenCalled()
    }
  )

  it('exposes page governance and records page-wide enabled/index changes as pending exposure', async () => {
    repository.listSitePages.mockResolvedValue([
      {
        pageKey: 'home',
        supportedLocales: ['en-US', 'zh-CN'],
        available: true,
        enabled: false,
        indexable: false,
        drift: false,
        syncStatus: 'synced',
        lastDiscoveredAt: now
      }
    ])
    repository.updateSitePageGovernance.mockResolvedValue({
      pageKey: 'home',
      supportedLocales: ['en-US', 'zh-CN'],
      available: true,
      enabled: true,
      indexable: false,
      drift: false,
      syncStatus: 'pending',
      lastDiscoveredAt: now
    })

    await expect(
      (admin as any).listSitePages({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a' },
        siteId: 'site_a'
      })
    ).resolves.toEqual({ pages: [expect.objectContaining({ pageKey: 'home', enabled: false })] })
    await expect(
      (admin as any).updateSitePageGovernance({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        pageKey: 'home',
        enabled: true,
        indexable: false
      })
    ).resolves.toEqual({
      page: expect.objectContaining({
        pageKey: 'home',
        enabled: true,
        indexable: false,
        syncStatus: 'pending'
      })
    })

    expect(repository.updateSitePageGovernance).toHaveBeenCalledWith({
      siteId: 'site_a',
      pageKey: 'home',
      enabled: true,
      indexable: false
    })
    expect(repository.markSiteExposurePending).toHaveBeenCalledWith({ siteId: 'site_a' })
    expect(repository.saveAuditEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'site_page.governance_updated',
        resourceType: 'site_page',
        resourceId: 'site_a:home'
      })
    )
  })

  it('blocks locale activation and returns machine-readable Sync preflight without advancing version or dispatching webhook', async () => {
    repository.checkSitePagePreflight.mockResolvedValue({
      ok: false,
      issues: [{ code: 'SITE_PAGE_LOCALE_COVERAGE_INCOMPLETE', pageKey: 'home', locale: 'zh-CN' }]
    })
    repository.checkLocaleCompleteness.mockResolvedValue({ complete: true, issues: [] })
    repository.getSitePublishStateForSync.mockResolvedValue({
      tenantId: 'tenant_a',
      currentPublishVersion: 4
    })

    await expect(
      admin.activateLocale({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        locale: 'zh-CN'
      })
    ).rejects.toMatchObject({ code: 'SITE_PAGE_LOCALE_COVERAGE_INCOMPLETE' })
    await expect(
      admin.syncAllPendingChanges({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a'
      })
    ).resolves.toEqual({
      syncId: '',
      publishVersion: 4,
      webhookDispatched: false,
      blocked: true,
      preflightIssues: [
        { code: 'SITE_PAGE_LOCALE_COVERAGE_INCOMPLETE', pageKey: 'home', locale: 'zh-CN' }
      ]
    })

    expect(repository.activateLocale).not.toHaveBeenCalled()
    expect(repository.getSitePublishStateForSync).toHaveBeenCalledWith('site_a')
    expect(repository.createSyncBatch).not.toHaveBeenCalled()
    expect(webhookPublisher.publish).not.toHaveBeenCalled()
  })

  it('commits exposure publication in the same publish version path as Sync without a public-view envelope', async () => {
    repository.getSitePublishStateForSync.mockResolvedValue({
      tenantId: 'tenant_a',
      currentPublishVersion: 4
    })
    repository.listPendingSyncResources.mockResolvedValue([
      {
        resourceType: 'site-exposure',
        resourceId: 'site_a',
        locale: '',
        changeType: 'update',
        markedAt: now
      }
    ])
    repository.publishSiteExposure.mockResolvedValue({
      siteId: 'site_a',
      publishVersion: 5,
      defaultLocale: 'en-US',
      activeLocales: ['en-US'],
      pages: [],
      publishedAt: now.toISOString()
    })
    repository.getWebhookDispatchConfig.mockResolvedValue({ targetUrl: null, signingSecret: null })
    repository.hasInitialWebhookDelivery.mockResolvedValue(false)

    await expect(
      admin.syncAllPendingChanges({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a'
      })
    ).resolves.toEqual({ syncId: 'sync_fixed', publishVersion: 5, webhookDispatched: false })

    expect(repository.publishSiteExposure).toHaveBeenCalledWith({
      siteId: 'site_a',
      publishVersion: 5,
      publishedAt: now
    })
    expect(repository.runInTransaction).toHaveBeenCalledTimes(1)
    expect(repository.markSiteExposureSynced).toHaveBeenCalledWith({ siteId: 'site_a' })
    expect(repository.upsertPublicView).not.toHaveBeenCalled()
    expect(repository.createSyncBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        publishVersion: 5,
        resources: [
          { resourceType: 'site-exposure', resourceId: 'site_a', locale: '', changeType: 'update' }
        ]
      })
    )
  })

  it('keeps no-change Sync on the current publish version without a batch or webhook', async () => {
    repository.getSitePublishStateForSync.mockResolvedValue({
      tenantId: 'tenant_a',
      currentPublishVersion: 6
    })
    repository.listPendingSyncResources.mockResolvedValue([])

    await expect(
      admin.syncAllPendingChanges({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a'
      })
    ).resolves.toEqual({ syncId: '', publishVersion: 6, webhookDispatched: false })

    expect(repository.createSyncBatch).not.toHaveBeenCalled()
    expect(repository.recordWebhookDelivery).not.toHaveBeenCalled()
    expect(webhookPublisher.publish).not.toHaveBeenCalled()
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
      version: {
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
      },
      slugChanged: false,
      previousSlug: null
    })
    repository.getSitePublishStateForSync.mockResolvedValue({
      tenantId: 'tenant_a',
      currentPublishVersion: 2
    })
    repository.hasInitialWebhookDelivery.mockResolvedValue(false)
    repository.getWebhookDispatchConfig.mockResolvedValue({
      targetUrl: 'https://runtime.example/oes/webhooks/site',
      signingSecret: 'webhook_secret_a'
    })
    repository.listPendingSyncResources.mockResolvedValue([
      {
        resourceType: 'blog',
        resourceId: 'content_fixed',
        locale: 'en-US',
        changeType: 'create',
        markedAt: now
      }
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
    expect(repository.recordWebhookDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        syncId: 'sync_fixed',
        siteId: 'site_a',
        tenantId: 'tenant_a',
        eventType: 'site.publish.available',
        publishVersion: 3,
        resent: false
      })
    )
    expect(webhookPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
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
      })
    )
    expect(JSON.stringify(webhookPublisher.publish.mock.calls[0][0].payload)).not.toContain(
      'changed'
    )
    expect(JSON.stringify(webhookPublisher.publish.mock.calls[0][0].payload)).not.toContain(
      'body_html'
    )
  })

  it('creates categories, validates Blog/News category refs, and syncs category public views independently', async () => {
    repository.createContentCategory.mockResolvedValue({
      categoryId: 'content_category_fixed',
      siteId: 'site_a',
      sortOrder: 10,
      localeVersions: []
    })
    repository.updateContentCategoryLocaleVersion.mockResolvedValue({
      categoryVersionId: 'content_category_version_fixed',
      categoryId: 'content_category_fixed',
      locale: 'en-US',
      slug: 'guides',
      displayName: 'Guides',
      archiveIntro: 'Practical guides',
      archiveLabel: 'Guides',
      seoTitle: 'Guides',
      seoDescription: 'Guides SEO',
      syncStatus: 'pending'
    })
    repository.updateContentLocaleVersion.mockResolvedValue({
      version: {
        contentVersionId: 'version_fixed',
        contentId: 'content_fixed',
        locale: 'en-US',
        slug: 'launch-note',
        title: 'Launch note',
        bodyHtml: '<p>Hello</p>',
        coverImageAlt: 'Launch note kiln inspection photo',
        categoryIds: ['content_category_fixed'],
        seoTitle: 'Launch SEO',
        seoDescription: 'Launch page',
        status: 'draft',
        syncStatus: 'pending'
      },
      slugChanged: false,
      previousSlug: null
    })
    repository.findContentOwnership.mockResolvedValue({
      siteId: 'site_a',
      contentType: 'blog'
    })
    repository.listActiveSiteLocales.mockResolvedValue(['en-US'])
    repository.getDefaultSiteLocale.mockResolvedValue('en-US')
    repository.getContentCategory.mockResolvedValue({ categoryId: 'content_category_fixed', localeVersions: [] })
    repository.requestContentCategoryLocalePublication.mockResolvedValue({ categoryId: 'content_category_fixed' })
    repository.listContentCategories.mockResolvedValue([
      {
        categoryId: 'content_category_fixed',
        localeVersions: [
          {
            locale: 'en-US',
            slug: 'guides',
            displayName: 'Guides',
            lastPublishedRevision: 1
          }
        ]
      }
    ])
    repository.getSitePublishStateForSync.mockResolvedValue({
      tenantId: 'tenant_a',
      currentPublishVersion: 4
    })
    repository.hasInitialWebhookDelivery.mockResolvedValue(false)
    repository.getWebhookDispatchConfig.mockResolvedValue({
      targetUrl: 'https://runtime.example/oes/webhooks/site',
      signingSecret: 'webhook_secret_a'
    })
    repository.listPendingSyncResources.mockResolvedValue([
      {
        resourceType: 'article-category',
        resourceId: 'content_category_fixed',
        locale: 'en-US',
        changeType: 'update',
        markedAt: now
      },
      {
        resourceType: 'blog',
        resourceId: 'content_fixed',
        locale: 'en-US',
        changeType: 'update',
        markedAt: now
      }
    ])
    repository.getContentCategoryLocaleVersionForPublicView.mockResolvedValue({
      categoryId: 'content_category_fixed',
      locale: 'en-US',
      slug: 'guides',
      displayName: 'Guides',
      archiveIntro: 'Practical guides',
      archiveLabel: 'Guides',
      sortOrder: 10,
      historicalSlugs: ['old-guides'],
      seoTitle: 'Guides',
      seoDescription: 'Guides SEO',
      seoImage: null,
    })
    repository.getContentVersionForPublicView.mockResolvedValue({
      contentId: 'content_fixed',
      contentType: 'blog',
      locale: 'en-US',
      slug: 'launch-note',
      title: 'Launch note',
      bodyHtml: '<p>Hello</p>',
      summary: 'Short',
      coverImage: null,
      coverImageAlt: 'Launch note kiln inspection photo',
      author: 'OES',
      categoryIds: ['content_category_fixed'],
      seoTitle: 'Launch SEO',
      seoDescription: 'Launch page',
      seoImage: null,
      publishedAt: null
    })

    await expect(
      admin.createContentCategory({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        sortOrder: 10,
        initialLocaleVersion: { locale: 'en-US', slug: 'guides', displayName: 'Guides', archiveIntro: 'Practical guides', archiveLabel: 'Guides' }
      })
    ).resolves.toEqual({
      category: expect.objectContaining({ categoryId: 'content_category_fixed' })
    })
    await expect(
      admin.updateContentCategoryLocaleVersion({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        version: {
          categoryId: 'content_category_fixed',
          locale: 'en-US',
          slug: 'guides',
          displayName: 'Guides',
          archiveIntro: 'Practical guides',
          archiveLabel: 'Guides',
          seoTitle: 'Guides',
          seoDescription: 'Guides SEO'
        }
      })
    ).resolves.toEqual({
      version: expect.objectContaining({
        categoryId: 'content_category_fixed',
        syncStatus: 'pending'
      })
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
          bodyHtml: '<p>Hello</p>',
          coverImageAlt: 'Launch note kiln inspection photo',
          categoryIds: ['content_category_fixed'],
          seoTitle: 'Launch SEO',
          seoDescription: 'Launch page'
        }
      })
    ).resolves.toEqual({
      version: expect.objectContaining({ categoryIds: ['content_category_fixed'] })
    })
    await expect(
      admin.syncAllPendingChanges({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a'
      })
    ).resolves.toEqual({ syncId: 'sync_fixed', publishVersion: 5, webhookDispatched: true })

    expect(repository.createContentCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'content_category_fixed',
        siteId: 'site_a',
        tenantId: 'tenant_a',
        syncStatus: 'pending'
      })
    )
    expect(repository.updateContentLocaleVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        coverImageAlt: 'Launch note kiln inspection photo',
        categoryIds: ['content_category_fixed'],
        syncStatus: 'pending'
      })
    )
    expect(repository.upsertPublicView).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceType: 'article-category',
        resourceId: 'content_category_fixed',
        publishVersion: 5,
        payload: expect.objectContaining({
          content_category_id: 'content_category_fixed',
          historical_slugs: ['old-guides']
        })
      })
    )
    expect(repository.upsertPublicView).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceType: 'blog',
        resourceId: 'content_fixed',
        payload: expect.objectContaining({
          cover_image_alt: 'Launch note kiln inspection photo'
        })
      })
    )
    expect(repository.markContentCategoryVersionSynced).toHaveBeenCalledWith({
      categoryId: 'content_category_fixed',
      locale: 'en-US'
    })
    expect(repository.saveAuditEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'content_category.created' })
    )
    expect(repository.saveAuditEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'content_category.updated' })
    )
  })

  it('rejects disabled or incomplete category references before saving Blog/News drafts', async () => {
    repository.findContentOwnership.mockResolvedValue({
      siteId: 'site_a',
      contentType: 'news'
    })
    repository.listActiveSiteLocales.mockResolvedValue(['en-US', 'zh-CN'])
    repository.listContentCategories.mockResolvedValue([
      {
        categoryId: 'content_category_fixed',
        status: 'disabled',
        appliesTo: 'blog',
        localeVersions: [
          {
            locale: 'en-US',
            slug: 'guides',
            displayName: 'Guides',
            seoTitle: 'Guides',
            seoDescription: 'Guides SEO'
          }
        ]
      }
    ])

    await expect(
      admin.updateSiteContentLocaleVersion({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a', traceId: 'trace_a' },
        siteId: 'site_a',
        version: {
          contentId: 'content_fixed',
          locale: 'en-US',
          slug: 'launch-note',
          title: 'Launch note',
          bodyHtml: '<p>Hello</p>',
          categoryIds: ['content_category_fixed', 'content_category_fixed'],
          seoTitle: 'Launch SEO',
          seoDescription: 'Launch page'
        }
      })
    ).rejects.toThrow('invalid content category references')
    expect(repository.updateContentLocaleVersion).not.toHaveBeenCalled()
  })

  it('verifies signed runtime changed-resource and public-view reads', async () => {
    repository.getCommittedSyncTarget.mockResolvedValue({ latestPublishVersion: 3, committed: true })
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
    repository.getLatestPublishState.mockResolvedValue({
      latestPublishVersion: 3,
      latestSyncId: 'sync_a'
    })
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
        signedContext: signedContextFor(
          '/api/v1/site/sync/changed-resources',
          '{"from_publish_version":2}',
          'nonce_changed'
        ),
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
        signedContext: signedContextFor(
          '/api/v1/site/sync/public-views:batchGet',
          '{"resources":[]}',
          'nonce_views'
        ),
        resources: [{ resourceType: 'blog', resourceId: 'content_fixed', locale: 'en-US' }],
        targetPublishVersion: 3
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

  it('reports the server target version when a delta filter returns no resource rows', async () => {
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
    repository.getLatestPublishState.mockResolvedValue({
      latestPublishVersion: 7,
      latestSyncId: 'sync_7'
    })
    repository.listChangedResourcesForRuntime.mockResolvedValue([])

    await expect(
      runtime.listChangedResources({
        signedContext: signedContextFor(
          '/api/v1/site/sync/changed-resources',
          '{"from_publish_version":3,"resource_types":["blog"]}',
          'nonce_filtered_changed'
        ),
        fromPublishVersion: 3,
        resourceTypes: ['blog']
      })
    ).resolves.toEqual({
      siteId: 'site_a',
      fromPublishVersion: 3,
      toPublishVersion: 7,
      requiresSnapshot: false,
      changedResources: []
    })
  })

  it('rejects missing runtime sync targets instead of falling back to latest', async () => {
    repository.findCredentialForVerification.mockResolvedValue({ siteId: 'site_a', clientId: 'client_a', credentialId: 'cred_a', clientSecret: 'client_secret_a', scopes: ['site:read'], status: 'active', siteStatus: 'active' })
    repository.rememberCredentialNonce.mockResolvedValue(true)
    await expect(runtime.batchGetPublicViews({ signedContext: signedContextFor('/api/v1/site/sync/public-views:batchGet', '{"resources":[]}', 'nonce_missing_target'), resources: [] })).rejects.toMatchObject({ definition: { code: 'SYNC_TARGET_REQUIRED' } })
    expect(repository.batchGetPublicViewsForRuntime).not.toHaveBeenCalled()
  })

  it('rejects targets beyond latest and committed versions whose immutable output is unavailable', async () => {
    repository.findCredentialForVerification.mockResolvedValue({ siteId: 'site_a', clientId: 'client_a', credentialId: 'cred_a', clientSecret: 'client_secret_a', scopes: ['site:read'], status: 'active', siteStatus: 'active' })
    repository.rememberCredentialNonce.mockResolvedValue(true)
    repository.getCommittedSyncTarget.mockResolvedValueOnce({ latestPublishVersion: 3, committed: false })
    await expect(runtime.batchGetPublicViews({ signedContext: signedContextFor('/api/v1/site/sync/public-views:batchGet', '{"target_publish_version":4}', 'nonce_future_target'), targetPublishVersion: 4, resources: [] })).rejects.toMatchObject({ definition: { code: 'SYNC_TARGET_NOT_COMMITTED' } })
    repository.getCommittedSyncTarget.mockResolvedValueOnce({ latestPublishVersion: 3, committed: false })
    await expect(runtime.batchGetPublicViews({ signedContext: signedContextFor('/api/v1/site/sync/public-views:batchGet', '{"target_publish_version":3}', 'nonce_unavailable_target'), targetPublishVersion: 3, resources: [] })).rejects.toMatchObject({ definition: { code: 'SYNC_TARGET_UNAVAILABLE' } })
  })

  it('preserves a requested snapshot target across pages and rejects a contaminated response', async () => {
    repository.findCredentialForVerification.mockResolvedValue({ siteId: 'site_a', clientId: 'client_a', credentialId: 'cred_a', clientSecret: 'client_secret_a', scopes: ['site:sync'], status: 'active', siteStatus: 'active' })
    repository.rememberCredentialNonce.mockResolvedValue(true)
    repository.getCommittedSyncTarget.mockResolvedValue({ latestPublishVersion: 8, committed: true })
    repository.getSnapshotForRuntime.mockResolvedValue({ snapshotPublishVersion: 7, publicViews: [{ siteId: 'site_a', resourceType: 'faq', resourceId: 'site_a:faq-directory', locale: 'en-US', slug: '', status: 'published', publishVersion: 7, updatedAt: now, payload: {} }], nextPageToken: '1', isComplete: false })
    await runtime.getSnapshot({ signedContext: signedContextFor('/api/v1/site/sync/snapshot', '{"target_publish_version":7}', 'nonce_target_page_1'), targetPublishVersion: 7, pageToken: '0' })
    await runtime.getSnapshot({ signedContext: signedContextFor('/api/v1/site/sync/snapshot', '{"target_publish_version":7}', 'nonce_target_page_2'), targetPublishVersion: 7, pageToken: '1' })
    expect(repository.getSnapshotForRuntime).toHaveBeenLastCalledWith(expect.objectContaining({ targetPublishVersion: 7, pageToken: '1' }))
    repository.getSnapshotForRuntime.mockResolvedValueOnce({ snapshotPublishVersion: 8, publicViews: [], isComplete: true })
    await expect(runtime.getSnapshot({ signedContext: signedContextFor('/api/v1/site/sync/snapshot', '{"target_publish_version":7}', 'nonce_target_drift'), targetPublishVersion: 7 })).rejects.toMatchObject({ definition: { code: 'SYNC_TARGET_MISMATCH' } })
  })

  it('serves signed runtime snapshots from one consistent publish version', async () => {
    repository.getCommittedSyncTarget.mockResolvedValue({ latestPublishVersion: 7, committed: true })
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
        pageSize: 100,
        targetPublishVersion: 7
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
      pageSize: 100,
      targetPublishVersion: 7
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
    ).rejects.toMatchObject({
      definition: VALIDATION_FAILED,
      additionalDetails: undefined
    })
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
    repository.getPreviewContentVersionForPublicView.mockResolvedValue({
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
        signedContext: signedContextFor(
          '/api/v1/site/preview/view',
          '{"preview_token":"x"}',
          'nonce_preview'
        ),
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
    expect(repository.upsertPublicView).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: 'draft_preview' })
    )
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

    expect(repository.addPreparingLocale).toHaveBeenCalledWith({
      siteId: 'site_a',
      locale: 'fr-FR'
    })
    expect(repository.activateLocale).toHaveBeenCalledWith({ siteId: 'site_a', locale: 'fr-FR' })
    expect(repository.disableLocale).toHaveBeenCalledWith({ siteId: 'site_a', locale: 'fr-FR' })
    expect(repository.markLocaleResourcesPending).toHaveBeenCalledWith({
      siteId: 'site_a',
      locale: 'fr-FR'
    })
    expect(repository.saveAuditEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'site_locale.added' })
    )
    expect(repository.saveAuditEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'site_locale.activated' })
    )
    expect(repository.saveAuditEnvelope).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'site_locale.disabled' })
    )
  })

  it('syncs disabled locale resources as disabled public view status', async () => {
    repository.getSitePublishStateForSync.mockResolvedValue({
      tenantId: 'tenant_a',
      currentPublishVersion: 10
    })
    repository.hasInitialWebhookDelivery.mockResolvedValue(false)
    repository.getWebhookDispatchConfig.mockResolvedValue({
      targetUrl: 'https://runtime.example/oes/webhooks/site',
      signingSecret: 'webhook_secret_a'
    })
    repository.listPendingSyncResources.mockResolvedValue([
      {
        resourceType: 'product',
        resourceId: 'product_fr',
        locale: 'fr-FR',
        changeType: 'locale_disable',
        markedAt: now
      }
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

    expect(repository.upsertPublicView).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceType: 'product',
        resourceId: 'product_fr',
        locale: 'fr-FR',
        status: 'disabled',
        publishVersion: 11
      })
    )
    expect(repository.createSyncBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        resources: [expect.objectContaining({ changeType: 'locale_disable' })]
      })
    )
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
    repository.getSitePublishStateForSync.mockResolvedValue({
      tenantId: 'tenant_a',
      currentPublishVersion: 12
    })
    repository.hasInitialWebhookDelivery.mockResolvedValue(false)
    repository.getWebhookDispatchConfig.mockResolvedValue({
      targetUrl: 'https://runtime.example/oes/webhooks/site',
      signingSecret: 'webhook_secret_a'
    })
    repository.listPendingSyncResources.mockResolvedValue([
      {
        resourceType: 'category',
        resourceId: 'category_fixed',
        locale: 'en-US',
        changeType: 'create',
        markedAt: now
      }
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

    expect(repository.upsertPublicView).toHaveBeenCalledWith(
      expect.objectContaining({
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
      })
    )
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
    repository.getSitePublishStateForSync.mockResolvedValue({
      tenantId: 'tenant_a',
      currentPublishVersion: 7
    })
    repository.hasInitialWebhookDelivery.mockResolvedValue(false)
    repository.getWebhookDispatchConfig.mockResolvedValue({
      targetUrl: 'https://runtime.example/oes/webhooks/site',
      signingSecret: 'webhook_secret_a'
    })
    repository.listPendingSyncResources.mockResolvedValue([
      {
        resourceType: 'product',
        resourceId: 'product_a',
        locale: 'en-US',
        changeType: 'update',
        markedAt: now
      }
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
    repository.getSyncDetail.mockResolvedValue({
      syncId: 'sync_existing',
      siteId: 'site_a',
      publishVersion: 8
    })
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

    expect(repository.createSyncBatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ syncId: 'sync_existing' })
    )
    expect(repository.upsertPublicView).not.toHaveBeenCalledWith(
      expect.objectContaining({ publishVersion: 9 })
    )
    expect(repository.recordWebhookDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        syncId: 'sync_existing',
        publishVersion: 8,
        resent: true
      })
    )
  })

  it('returns Admin sync and audit read models from repository data', async () => {
    repository.getPendingSyncSummary.mockResolvedValue({
      pendingCount: 2,
      resourceTypes: ['blog', 'product']
    })
    repository.listPendingSyncResources.mockResolvedValue([
      {
        resourceType: 'blog',
        resourceId: 'content_a',
        locale: 'en-US',
        changeType: 'create',
        latestPublishVersion: 0
      }
    ])
    repository.listSyncHistory.mockResolvedValue([
      {
        syncId: 'sync_a',
        siteId: 'site_a',
        publishVersion: 3,
        status: 'completed',
        triggeredBy: 'operator_a',
        resources: []
      }
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

    await expect(
      admin.getPendingSyncSummary({ context: { tenantId: 'tenant_a' }, siteId: 'site_a' })
    ).resolves.toEqual({
      pendingCount: 2,
      resourceTypes: ['blog', 'product']
    })
    await expect(
      admin.listPendingSyncResources({ context: { tenantId: 'tenant_a' }, siteId: 'site_a' })
    ).resolves.toEqual({
      resources: [expect.objectContaining({ resourceType: 'blog', resourceId: 'content_a' })]
    })
    await expect(
      admin.listSyncHistory({ context: { tenantId: 'tenant_a' }, siteId: 'site_a' })
    ).resolves.toEqual({
      batches: [expect.objectContaining({ syncId: 'sync_a', publishVersion: 3 })]
    })
    await expect(
      admin.getSyncDetail({
        context: { tenantId: 'tenant_a', operatorId: 'operator_a' },
        syncId: 'sync_a'
      })
    ).resolves.toEqual({
      batch: expect.objectContaining({ syncId: 'sync_a', publishVersion: 3 })
    })
    await expect(
      admin.listSiteAuditLogs({ context: { tenantId: 'tenant_a' }, siteId: 'site_a' })
    ).resolves.toEqual({
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
    signature: formatSignature(
      createHmac('sha256', 'client_secret_a').update(canonical).digest('hex')
    ),
    method: 'POST',
    path,
    normalizedQuery: '',
    bodySha256: createHash('sha256').update(body).digest('hex')
  }
}
