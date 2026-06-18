import { createHash, createHmac, randomUUID } from 'node:crypto'
import { SiteAdminApplicationService } from '../../src/application/services/site-admin-application.service'
import { SiteRuntimeApplicationService } from '../../src/application/services/site-runtime-application.service'
import { buildCanonicalRequest, formatSignature } from '../../src/domain/security/site-request-signing'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaSiteRepository } from '../../src/infrastructure/repositories/prisma-site.repository'
import { cleanupByPrefix, createPrismaForIntegration, createTestPrefix } from '../helpers/integration-db'

// Verifies the OES-side P1 application loop from Admin draft changes to signed Site Runtime public-view pull.
describe('site-service application closed loop L2', () => {
  let prisma: PrismaService
  let repository: PrismaSiteRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaSiteRepository(prisma)
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
    await cleanupByPrefix(prisma, prefix)
  })

  afterEach(async () => {
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it('creates content, syncs public view, and serves signed runtime delta reads', async () => {
    const now = new Date('2026-06-15T08:00:00.000Z')
    let sequence = 0
    const webhookPublisher = { publish: jest.fn().mockResolvedValue(undefined) }
    const admin = new SiteAdminApplicationService(repository, {
      now: () => now,
      randomId: (prefixName) => `${prefix}_${prefixName}_${++sequence}`,
      randomSecret: () => `${prefix}_client_secret`,
      oesBaseUrl: 'https://oes.example/api/v1/site',
      environment: 'local'
    }, webhookPublisher)
    const runtime = new SiteRuntimeApplicationService(repository, { now: () => now })
    const tenantId = `${prefix}_tenant`
    const operatorId = `${prefix}_operator`

    const createdSite = await admin.createSite({
      tenantId,
      orgId: `${prefix}_org`,
      operatorId,
      traceId: `${prefix}_trace`,
      siteName: `${prefix} Brand`,
      siteType: 'brand',
      defaultLocale: 'en-US',
      primaryDomain: `${prefix}.example`,
      previewBaseUrl: `https://${prefix}.example/preview`
    })
    const credential = await admin.generateSiteCredential({
      context: { tenantId, operatorId, traceId: `${prefix}_trace` },
      siteId: createdSite.siteId,
      scopes: ['site:read', 'site:sync', 'site:status']
    })
    const parsedCredential = parseCredentialBundle(credential.credentialBundle ?? '')
    await admin.updateSiteSettings({
      context: { tenantId, operatorId, traceId: `${prefix}_trace` },
      siteId: createdSite.siteId,
      webhookUrl: `https://${prefix}.runtime.example/oes/webhooks/site`
    })
    const createdCategory = await admin.createSiteCategory({
      context: { tenantId, operatorId, traceId: `${prefix}_trace` },
      siteId: createdSite.siteId,
      locale: 'en-US',
      slug: `${prefix}-basins`,
      displayTitle: 'Basins',
      description: 'Bathroom basin collections',
      sortOrder: 10,
      seoTitle: 'Bathroom Basins',
      seoDescription: 'Explore basin collections'
    })
    const createdContent = await admin.createSiteContent({
      context: { tenantId, operatorId, traceId: `${prefix}_trace` },
      siteId: createdSite.siteId,
      contentType: 'blog'
    })
    await admin.updateSiteContentLocaleVersion({
      context: { tenantId, operatorId, traceId: `${prefix}_trace` },
      siteId: createdSite.siteId,
      version: {
        contentId: createdContent.content?.contentId,
        locale: 'en-US',
        slug: `${prefix}-launch`,
        title: 'Launch note',
        summary: 'Short',
        bodyHtml: '<p>Hello</p><script>alert(1)</script>',
        seoTitle: 'Launch SEO',
        seoDescription: 'Launch page'
      }
    })
    const sync = await admin.syncAllPendingChanges({
      context: { tenantId, operatorId, traceId: `${prefix}_trace` },
      siteId: createdSite.siteId
    })
    await expect(
      runtime.getLatestPublishState({
        signedContext: signContext({
          path: '/api/v1/site/sync/latest',
          bodyText: '{"local_publish_version":0}',
          nonce: `${prefix}_nonce_latest`,
          siteId: parsedCredential.site_id,
          clientId: parsedCredential.client_id,
          credentialId: parsedCredential.credential_id,
          clientSecret: parsedCredential.client_secret,
          now
        }),
        localPublishVersion: 0
      })
    ).resolves.toEqual(
      expect.objectContaining({
        siteId: createdSite.siteId,
        latestPublishVersion: sync.publishVersion,
        hasUpdates: true
      })
    )
    await expect(
      runtime.listChangedResources({
        signedContext: signContext({
          path: '/api/v1/site/sync/changed-resources',
          bodyText: '{"from_publish_version":0}',
          nonce: `${prefix}_nonce_changed`,
          siteId: parsedCredential.site_id,
          clientId: parsedCredential.client_id,
          credentialId: parsedCredential.credential_id,
          clientSecret: parsedCredential.client_secret,
          now
        }),
        fromPublishVersion: 0
      })
    ).resolves.toEqual(
      expect.objectContaining({
        changedResources: [
          expect.objectContaining({
            resourceType: 'category',
            resourceId: createdCategory.category?.categoryId,
            latestPublishVersion: sync.publishVersion
          }),
          expect.objectContaining({
            resourceType: 'blog',
            resourceId: createdContent.content?.contentId,
            latestPublishVersion: sync.publishVersion
          })
        ]
      })
    )
    const publicViews = await runtime.batchGetPublicViews({
      signedContext: signContext({
        path: '/api/v1/site/sync/public-views:batchGet',
        bodyText: '{"resources":[]}',
        nonce: `${prefix}_nonce_views`,
        siteId: parsedCredential.site_id,
        clientId: parsedCredential.client_id,
        credentialId: parsedCredential.credential_id,
        clientSecret: parsedCredential.client_secret,
        now
      }),
      resources: [
        { resourceType: 'category', resourceId: createdCategory.category?.categoryId, locale: 'en-US' },
        { resourceType: 'blog', resourceId: createdContent.content?.contentId, locale: 'en-US' }
      ]
    })

    expect(publicViews.publicViews).toEqual(expect.arrayContaining([
      expect.objectContaining({
        siteId: createdSite.siteId,
        resourceType: 'category',
        payloadJson: expect.stringContaining('"display_title":"Basins"')
      }),
      expect.objectContaining({
        siteId: createdSite.siteId,
        resourceType: 'blog',
        payloadJson: expect.stringContaining('"body_html":"<p>Hello</p>"')
      })
    ]))
    await expect(
      runtime.reportSyncResult({
        signedContext: signContext({
          path: '/api/v1/site/sync/report',
          bodyText: `{"sync_id":"${sync.syncId}","local_publish_version":${sync.publishVersion},"status":"completed"}`,
          nonce: `${prefix}_nonce_report`,
          siteId: parsedCredential.site_id,
          clientId: parsedCredential.client_id,
          credentialId: parsedCredential.credential_id,
          clientSecret: parsedCredential.client_secret,
          now
        }),
        syncId: sync.syncId,
        localPublishVersion: sync.publishVersion,
        status: 'completed',
        completedAt: now.toISOString()
      })
    ).resolves.toEqual({ accepted: true, serverTime: now.toISOString() })

    const siteCards = await admin.listSiteCards({ tenantId, operatorId, traceId: `${prefix}_trace` })
    expect(siteCards.cards).toEqual([
      expect.objectContaining({
        siteId: createdSite.siteId,
        runtimeStatus: 'healthy',
        runtimePublishVersion: sync.publishVersion,
        pendingSyncCount: 0
      })
    ])
    const webhookDeliveries = await prisma.getExecutionClient().siteWebhookDelivery.findMany({
      where: { syncId: sync.syncId }
    })
    expect(webhookPublisher.publish).toHaveBeenCalledTimes(1)
    expect(webhookPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({
      syncId: sync.syncId,
      siteId: createdSite.siteId,
      eventType: 'site.publish.available',
      publishVersion: sync.publishVersion,
      targetUrl: `https://${prefix}.runtime.example/oes/webhooks/site`,
      signingSecret: parsedCredential.client_secret,
      resent: false
    }))
    expect(webhookDeliveries).toEqual([
      expect.objectContaining({
        siteId: createdSite.siteId,
        tenantId,
        eventType: 'site.publish.available',
        publishVersion: sync.publishVersion,
        status: 'dispatched'
      })
    ])
    expect(JSON.stringify(webhookDeliveries[0]?.payload)).not.toContain('changed')
    expect(JSON.stringify(webhookDeliveries[0]?.payload)).not.toContain('body_html')

    await repository.addPreparingLocale({ siteId: createdSite.siteId, locale: 'fr-FR' })
    await repository.addProductPublication({
      publicationId: `${prefix}_publication_fr`,
      siteId: createdSite.siteId,
      tenantId,
      productId: `${prefix}_product_fr`,
      locale: 'fr-FR',
      slug: `${prefix}-produit-fr`,
      displayTitle: 'Produit FR',
      displayDescription: 'French description',
      seoTitle: 'Produit FR',
      seoDescription: 'French SEO',
      seoImage: null,
      imageOverride: null,
      publishStatus: 'published',
      syncStatus: 'synced'
    })
    await admin.disableLocale({
      context: { tenantId, operatorId, traceId: `${prefix}_trace` },
      siteId: createdSite.siteId,
      locale: 'fr-FR'
    })
    const disableSync = await admin.syncAllPendingChanges({
      context: { tenantId, operatorId, traceId: `${prefix}_trace` },
      siteId: createdSite.siteId
    })

    await expect(
      runtime.listChangedResources({
        signedContext: signContext({
          path: '/api/v1/site/sync/changed-resources',
          bodyText: `{"from_publish_version":${sync.publishVersion}}`,
          nonce: `${prefix}_nonce_changed_disabled`,
          siteId: parsedCredential.site_id,
          clientId: parsedCredential.client_id,
          credentialId: parsedCredential.credential_id,
          clientSecret: parsedCredential.client_secret,
          now
        }),
        fromPublishVersion: sync.publishVersion
      })
    ).resolves.toEqual(expect.objectContaining({
      changedResources: [
        expect.objectContaining({
          resourceType: 'product',
          resourceId: `${prefix}_product_fr`,
          locale: 'fr-FR',
          changeType: 'locale_disable',
          latestPublishVersion: disableSync.publishVersion
        })
      ]
    }))
    const disabledView = await runtime.batchGetPublicViews({
      signedContext: signContext({
        path: '/api/v1/site/sync/public-views:batchGet',
        bodyText: '{"resources":[]}',
        nonce: `${prefix}_nonce_disabled_view`,
        siteId: parsedCredential.site_id,
        clientId: parsedCredential.client_id,
        credentialId: parsedCredential.credential_id,
        clientSecret: parsedCredential.client_secret,
        now
      }),
      resources: [{ resourceType: 'product', resourceId: `${prefix}_product_fr`, locale: 'fr-FR' }]
    })
    expect(disabledView.publicViews?.[0]).toEqual(expect.objectContaining({
      resourceType: 'product',
      resourceId: `${prefix}_product_fr`,
      locale: 'fr-FR',
      status: 'disabled',
      publishVersion: disableSync.publishVersion
    }))
  })
})

/** parseCredentialBundle decodes the opaque P1 bundle for integration-test signing. */
function parseCredentialBundle(bundle: string) {
  const encoded = bundle.replace('oes_site_cred_v1.', '')
  return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
    site_id: string
    client_id: string
    credential_id: string
    client_secret: string
  }
}

/** signContext builds one frozen signed Site Runtime gRPC context for integration tests. */
function signContext(input: {
  path: string
  bodyText: string
  nonce: string
  siteId: string
  clientId: string
  credentialId: string
  clientSecret: string
  now: Date
}) {
  const body = Buffer.from(input.bodyText)
  const timestamp = String(input.now.getTime())
  const canonical = buildCanonicalRequest({
    method: 'POST',
    path: input.path,
    query: {},
    body,
    siteId: input.siteId,
    clientId: input.clientId,
    credentialId: input.credentialId,
    timestamp,
    nonce: input.nonce
  })

  return {
    siteId: input.siteId,
    clientId: input.clientId,
    credentialId: input.credentialId,
    requestId: randomUUID(),
    traceId: randomUUID(),
    timestamp,
    nonce: input.nonce,
    signature: formatSignature(createHmac('sha256', input.clientSecret).update(canonical).digest('hex')),
    method: 'POST',
    path: input.path,
    normalizedQuery: '',
    bodySha256: createHash('sha256').update(body).digest('hex')
  }
}
