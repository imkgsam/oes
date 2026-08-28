import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  NodeSqlitePublishedStore,
  OesSiteRuntimeService,
  type StoredPublishedResource
} from '@oes/site-runtime-kit'

// TemplatePublishedDataSeedService seeds generic local public views for template-only local preview.
@Injectable()
export class TemplatePublishedDataSeedService implements OnModuleInit {
  constructor(private readonly runtimeService: OesSiteRuntimeService) {}

  // onModuleInit writes generic published resources only when local template seeding is enabled.
  async onModuleInit(): Promise<void> {
    if (process.env.SITE_TEMPLATE_SEED_PUBLISHED_DATA !== 'true') {
      return
    }
    const runtime = this.runtimeService.getRuntime()
    const siteId = runtime.credential.siteId
    const now = new Date('2026-06-16T00:00:00.000Z').toISOString()
    const store = new NodeSqlitePublishedStore({
      path: process.env.OES_SITE_STORE_PATH ?? './data/site-runtime.sqlite'
    })
    await store.init()
    try {
      await store.upsertPublishedResources(seedResources(siteId, now))
      await store.updatePublishState({
        siteId,
        localPublishVersion: 1,
        latestSyncId: 'template-local-seed',
        lastSuccessfulSyncAt: now,
        lastKnownRemotePublishVersion: 1
      })
    } finally {
      await store.close()
    }
  }
}

// seedResources provides neutral product/category/blog/news examples without site-specific branding.
function seedResources(siteId: string, updatedAt: string): StoredPublishedResource[] {
  return [
    {
      siteId,
      resourceType: 'category',
      resourceId: 'category_surface_systems',
      slug: 'surface-systems',
      locale: 'en-US',
      status: 'published',
      publishVersion: 1,
      updatedAt,
      payloadJson: JSON.stringify({
        category_id: 'category_surface_systems',
        display_title: 'Surface Systems',
        description: 'Published category data supplied by the current site.',
        image: 'https://picsum.photos/seed/oes-category-surface/1200/800',
        sort_order: 10,
        seo: {
          title: 'Surface Systems',
          description: 'Browse site-published category views from the local runtime store.',
          image: 'https://picsum.photos/seed/oes-category-surface/1200/800'
        }
      })
    },
    {
      siteId,
      resourceType: 'product',
      resourceId: 'product_modular_basin',
      slug: 'modular-basin-system',
      locale: 'en-US',
      status: 'published',
      publishVersion: 1,
      updatedAt,
      payloadJson: JSON.stringify({
        product_id: 'product_modular_basin',
        display_title: 'Modular Basin System',
        display_description:
          'A generic published product view used to demonstrate local rendering boundaries.',
        summary: 'Local product public view rendered without live OES calls.',
        model: 'P1-4827',
        brand: 'Site-defined brand',
        category_ids: ['category_surface_systems'],
        images: [
          {
            url: 'https://picsum.photos/seed/oes-product-basin/1400/900',
            alt: 'Generic product surface detail',
            role: 'primary'
          }
        ],
        specs: [
          { name: 'Material', value: 'Published specification', unit: '', group: 'Overview' },
          { name: 'Finish', value: 'Site-controlled display value', unit: '', group: 'Overview' }
        ],
        seo: {
          title: 'Modular Basin System',
          description: 'A product page rendered from Site Runtime local published data.',
          image: 'https://picsum.photos/seed/oes-product-basin/1400/900'
        }
      })
    },
    {
      siteId,
      resourceType: 'blog',
      resourceId: 'blog_material_notes',
      slug: 'material-notes-for-specifiers',
      locale: 'en-US',
      status: 'published',
      publishVersion: 1,
      updatedAt,
      payloadJson: JSON.stringify({
        content_id: 'blog_material_notes',
        title: 'Material Notes for Specifiers',
        summary: 'A neutral blog public view for storefront rendering and SEO structure.',
        cover_image: 'https://picsum.photos/seed/oes-blog-material/1200/800',
        author: 'Site Editorial',
        tags: ['Published Data', 'Specification'],
        body_html:
          '<p>This body is sanitized HTML from the published public view. The template renders it without adding a CMS or page builder.</p>',
        published_at: updatedAt,
        seo: {
          title: 'Material Notes for Specifiers',
          description: 'A blog page rendered from local published data.',
          image: 'https://picsum.photos/seed/oes-blog-material/1200/800'
        }
      })
    },
    {
      siteId,
      resourceType: 'news',
      resourceId: 'news_runtime_preview',
      slug: 'runtime-template-preview',
      locale: 'en-US',
      status: 'published',
      publishVersion: 1,
      updatedAt,
      payloadJson: JSON.stringify({
        content_id: 'news_runtime_preview',
        title: 'Runtime Template Preview',
        summary: 'A neutral news public view for sitemap and structured data output.',
        cover_image: 'https://picsum.photos/seed/oes-news-runtime/1200/800',
        author: 'Site Editorial',
        tags: ['Runtime', 'Template'],
        body_html:
          '<p>This news entry proves the template can render local news public views without realtime OES dependency.</p>',
        published_at: updatedAt,
        seo: {
          title: 'Runtime Template Preview',
          description: 'A news page rendered from Site Runtime local published data.',
          image: 'https://picsum.photos/seed/oes-news-runtime/1200/800'
        }
      })
    }
  ]
}
