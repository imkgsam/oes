import { randomUUID } from 'node:crypto'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaSiteRepository } from '../../src/infrastructure/repositories/prisma-site.repository'
import { PrismaSiteTransactionRunner } from '../../src/infrastructure/transactions/prisma-site-transaction-runner'
import { cleanupByPrefix, createPrismaForIntegration, createTestPrefix } from '../helpers/integration-db'

describe('Prisma site-service P1 repositories L2', () => {
  let prisma: PrismaService
  let repository: PrismaSiteRepository
  let transactionRunner: PrismaSiteTransactionRunner
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaSiteRepository(prisma)
    transactionRunner = new PrismaSiteTransactionRunner(prisma)
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

  it('Site P1 persistence / stores site, locale, credential, publication, content, public view, sync, and audit facts', async () => {
    const tenantId = `${prefix}_tenant`
    const siteId = randomUUID()
    const productPublicationId = randomUUID()
    const categoryId = randomUUID()
    const contentId = randomUUID()
    const contentVersionId = randomUUID()
    const syncId = randomUUID()
    const auditId = randomUUID()
    const credentialId = randomUUID()

    await repository.createSiteWithDefaultLocale({
      siteId,
      tenantId,
      siteCode: `${prefix}_brand_us`,
      siteName: `${prefix} Brand US`,
      siteType: 'brand',
      defaultLocale: 'en-US',
      primaryDomain: 'brand.example.com',
      previewBaseUrl: 'https://brand.example.com/preview',
      createdBy: `${prefix}_operator`
    })
    await repository.saveCredentialMetadata({
      credentialId,
      siteId,
      clientId: `${prefix}_client`,
      secretHash: `${prefix}_secret_hash`,
      secretCiphertext: Buffer.from(JSON.stringify({ secret: `${prefix}_secret` }), 'utf8').toString('base64url'),
      scopes: ['site:read', 'site:sync'],
      status: 'active',
      createdBy: `${prefix}_operator`
    })
    await repository.updateSiteSettings({
      siteId,
      siteName: null,
      primaryDomain: 'brand.example.com',
      previewBaseUrl: 'https://brand.example.com/preview',
      webhookUrl: 'https://runtime.example.com/oes/webhooks/site',
      runtimeStatusUrl: null,
      allowedOrigins: []
    })
    await repository.addProductPublication({
      publicationId: productPublicationId,
      siteId,
      tenantId,
      productId: `${prefix}_product`,
      locale: 'en-US',
      slug: 'basin-100',
      displayTitle: 'Basin 100',
      displayDescription: 'Ceramic basin',
      seoTitle: 'Basin SEO',
      seoDescription: 'Public basin',
      seoImage: null,
      imageOverride: null,
      categoryIds: [categoryId],
      publishStatus: 'draft',
      syncStatus: 'pending'
    })
    await repository.createSiteCategory({
      categoryId,
      siteId,
      tenantId,
      parentCategoryId: null,
      sourceCategoryId: `${prefix}_item_category`,
      locale: 'en-US',
      slug: 'basins',
      displayTitle: 'Basins',
      description: 'Bathroom basin collections',
      image: null,
      sortOrder: 10,
      seoTitle: 'Bathroom Basins',
      seoDescription: 'Explore basin collections',
      seoImage: null,
      publishStatus: 'published',
      syncStatus: 'pending'
    })
    await repository.createContentWithLocaleVersion({
      contentId,
      contentVersionId,
      siteId,
      tenantId,
      contentType: 'blog',
      locale: 'en-US',
      slug: 'launch-note',
      title: 'Launch note',
      bodyHtml: '<p>Hello</p>',
      summary: 'Short note',
      coverImage: null,
      author: 'OES Editorial',
      tags: ['launch'],
      seoTitle: 'Launch SEO',
      seoDescription: 'Launch page',
      seoImage: null,
      publishedAt: new Date('2026-06-15T08:00:00.000Z'),
      status: 'draft',
      syncStatus: 'pending'
    })
    await repository.upsertPublicView({
      siteId,
      tenantId,
      resourceType: 'blog',
      resourceId: contentId,
      locale: 'en-US',
      slug: 'launch-note',
      status: 'published',
      publishVersion: 1,
      payload: { content_id: contentId, title: 'Launch note' },
      updatedAt: new Date('2026-06-15T08:30:00.000Z')
    })
    await repository.upsertPublicView({
      siteId,
      tenantId,
      resourceType: 'category',
      resourceId: categoryId,
      locale: 'en-US',
      slug: 'basins',
      status: 'published',
      publishVersion: 1,
      payload: { category_id: categoryId, display_title: 'Basins' },
      updatedAt: new Date('2026-06-15T08:30:00.000Z')
    })
    await repository.createSyncBatch({
      syncId,
      siteId,
      tenantId,
      publishVersion: 1,
      status: 'completed',
      triggeredBy: `${prefix}_operator`,
      resources: [
        {
          resourceType: 'blog',
          resourceId: contentId,
          locale: 'en-US',
          changeType: 'create'
        }
      ]
    })
    await repository.recordWebhookDelivery({
      deliveryId: randomUUID(),
      syncId,
      siteId,
      tenantId,
      eventId: `${prefix}_event`,
      eventType: 'site.publish.available',
      publishVersion: 1,
      targetUrl: 'https://runtime.example.com/oes/webhooks/site',
      status: 'dispatched',
      payload: {
        event_id: `${prefix}_event`,
        site_id: siteId,
        event_type: 'site.publish.available',
        publish_version: 1,
        occurred_at: '2026-06-15T08:31:00.000Z'
      },
      headers: {
        'x-oes-site-id': siteId,
        'x-oes-event-id': `${prefix}_event`
      },
      resent: false,
      deliveredAt: new Date('2026-06-15T08:31:00.000Z')
    })
    await repository.saveAuditEnvelope({
      eventId: auditId,
      service: 'site-service',
      module: 'sync',
      eventType: 'sync.completed',
      occurredAt: new Date('2026-06-15T08:31:00.000Z'),
      result: 'SUCCEEDED',
      operatorId: `${prefix}_operator`,
      operatorType: 'HUMAN',
      tenantId,
      orgId: `${prefix}_org`,
      traceId: `${prefix}_trace`,
      resourceType: 'site_sync_batch',
      resourceId: syncId,
      details: { siteId, publishVersion: 1 }
    })

    const overview = await repository.findSiteOverview(tenantId, siteId)
    const views = await repository.listPublicViews(tenantId, siteId)
    const sync = await repository.getSyncBatch(tenantId, syncId)
    const audits = await repository.listAuditEnvelopes(tenantId, siteId)
    const credentials = await repository.listSiteCredentials({ siteId })
    const webhookDispatchConfig = await repository.getWebhookDispatchConfig({ siteId })
    const categories = await repository.listSiteCategories({ siteId })
    const categoryPublicViewInput = await repository.getCategoryPublicationForPublicView({ siteId, categoryId, locale: 'en-US' })
    const client = prisma.getExecutionClient()
    const webhookDeliveries = await client.siteWebhookDelivery.findMany({ where: { syncId } })

    expect(overview).toEqual(
      expect.objectContaining({
        siteId,
        tenantId,
        siteCode: `${prefix}_brand_us`,
        defaultLocale: 'en-US',
        latestPublishVersion: 1
      })
    )
    expect(overview?.locales).toEqual([
      expect.objectContaining({ locale: 'en-US', status: 'active', isDefault: true })
    ])
    expect(overview?.credentials).toEqual([
      expect.objectContaining({
        clientId: `${prefix}_client`,
        scopes: ['site:read', 'site:sync'],
        status: 'active'
      })
    ])
    expect(credentials).toEqual([
      expect.objectContaining({
        credentialId,
        clientId: `${prefix}_client`,
        scopes: ['site:read', 'site:sync'],
        status: 'active'
      })
    ])
    expect(categories).toEqual([
      expect.objectContaining({
        categoryId,
        sourceCategoryId: `${prefix}_item_category`,
        slug: 'basins',
        displayTitle: 'Basins',
        syncStatus: 'pending'
      })
    ])
    expect(categoryPublicViewInput).toEqual(expect.objectContaining({
      categoryId,
      slug: 'basins',
      displayTitle: 'Basins',
      publishStatus: 'published'
    }))
    expect(JSON.stringify(credentials)).not.toContain(`${prefix}_secret`)
    expect(webhookDispatchConfig).toEqual({
      targetUrl: 'https://runtime.example.com/oes/webhooks/site',
      signingSecret: `${prefix}_secret`
    })
    expect(webhookDeliveries).toEqual([
      expect.objectContaining({
        syncId,
        siteId,
        tenantId,
        eventType: 'site.publish.available',
        publishVersion: 1,
        status: 'dispatched',
        resent: false
      })
    ])
    await expect(repository.hasInitialWebhookDelivery({ syncId, eventType: 'site.publish.available' })).resolves.toBe(true)
    expect(views).toEqual(expect.arrayContaining([
      expect.objectContaining({
        resourceType: 'blog',
        resourceId: contentId,
        slug: 'launch-note',
        publishVersion: 1
      }),
      expect.objectContaining({
        resourceType: 'category',
        resourceId: categoryId,
        slug: 'basins',
        publishVersion: 1
      })
    ]))
    expect(sync?.resources).toEqual([
      expect.objectContaining({
        resourceType: 'blog',
        resourceId: contentId,
        changeType: 'create'
      })
    ])
    expect(audits).toEqual(expect.arrayContaining([
      expect.objectContaining({
        eventId: auditId,
        eventType: 'sync.completed',
        tenantId
      }),
      expect.objectContaining({
        eventType: 'site_webhook.dispatched',
        resourceId: syncId,
        tenantId
      })
    ]))
    await expect(repository.findSiteOverview(`${prefix}_other_tenant`, siteId)).resolves.toBeNull()
  })

  it('Sync transaction / rolls back public views when sync generation fails', async () => {
    const tenantId = `${prefix}_tenant`
    const siteId = randomUUID()

    await repository.createSiteWithDefaultLocale({
      siteId,
      tenantId,
      siteCode: `${prefix}_brand_us`,
      siteName: `${prefix} Brand US`,
      siteType: 'brand',
      defaultLocale: 'en-US',
      primaryDomain: null,
      previewBaseUrl: null,
      createdBy: `${prefix}_operator`
    })

    await expect(
      transactionRunner.runInTransaction(async () => {
        await repository.upsertPublicView({
          siteId,
          tenantId,
          resourceType: 'blog',
          resourceId: randomUUID(),
          locale: 'en-US',
          slug: 'rollback-note',
          status: 'published',
          publishVersion: 1,
          payload: { title: 'Rollback note' },
          updatedAt: new Date('2026-06-15T09:00:00.000Z')
        })
        throw new Error('simulated sync generation failure')
      })
    ).rejects.toThrow('simulated sync generation failure')

    await expect(repository.listPublicViews(tenantId, siteId)).resolves.toEqual([])
  })

  it('Locale disable sync / marks locale resources pending and emits locale_disable resources', async () => {
    const tenantId = `${prefix}_tenant`
    const siteId = randomUUID()
    const productPublicationId = randomUUID()
    const contentId = randomUUID()

    await repository.createSiteWithDefaultLocale({
      siteId,
      tenantId,
      siteCode: `${prefix}_brand_us`,
      siteName: `${prefix} Brand US`,
      siteType: 'brand',
      defaultLocale: 'en-US',
      primaryDomain: null,
      previewBaseUrl: null,
      createdBy: `${prefix}_operator`
    })
    await repository.addPreparingLocale({ siteId, locale: 'fr-FR' })
    await repository.addProductPublication({
      publicationId: productPublicationId,
      siteId,
      tenantId,
      productId: `${prefix}_product_fr`,
      locale: 'fr-FR',
      slug: 'produit-fr',
      displayTitle: 'Produit FR',
      displayDescription: 'French description',
      seoTitle: 'Produit FR',
      seoDescription: 'French SEO',
      seoImage: null,
      imageOverride: null,
      publishStatus: 'published',
      syncStatus: 'synced'
    })
    await repository.createContentWithLocaleVersion({
      contentId,
      contentVersionId: randomUUID(),
      siteId,
      tenantId,
      contentType: 'blog',
      locale: 'fr-FR',
      slug: 'note-fr',
      title: 'Note FR',
      bodyHtml: '<p>Bonjour</p>',
      summary: null,
      coverImage: null,
      author: null,
      tags: [],
      seoTitle: 'Note FR',
      seoDescription: 'French note',
      seoImage: null,
      publishedAt: null,
      status: 'draft',
      syncStatus: 'synced'
    })

    await repository.disableLocale({ siteId, locale: 'fr-FR' })
    await repository.markLocaleResourcesPending({ siteId, locale: 'fr-FR' })

    await expect(repository.getLocaleStatus({ siteId, locale: 'fr-FR' })).resolves.toBe('disabled')
    await expect(repository.listPendingSyncResources(siteId)).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({
        resourceType: 'product',
        resourceId: `${prefix}_product_fr`,
        locale: 'fr-FR',
        changeType: 'locale_disable'
      }),
      expect.objectContaining({
        resourceType: 'blog',
        resourceId: contentId,
        locale: 'fr-FR',
        changeType: 'locale_disable'
      })
    ]))
  })
})
