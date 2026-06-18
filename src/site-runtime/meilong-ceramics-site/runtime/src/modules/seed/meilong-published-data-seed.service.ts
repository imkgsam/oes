import { Injectable, OnModuleInit } from '@nestjs/common'
import { OesSiteRuntimeService, type StoredPublishedResource } from '@oes/site-runtime-kit'

const publicBaseUrl = 'https://meilong-ceramics.com'

// MeilongPublishedDataSeedService seeds contract-shaped local public views for the Meilong pilot site.
@Injectable()
export class MeilongPublishedDataSeedService implements OnModuleInit {
  constructor(private readonly runtimeService: OesSiteRuntimeService) {}

  // onModuleInit writes Meilong published resources only when local pilot seeding is enabled.
  async onModuleInit(): Promise<void> {
    if (process.env.SITE_MEILONG_SEED_PUBLISHED_DATA !== 'true') {
      return
    }
    const runtime = this.runtimeService.getRuntime()
    const siteId = runtime.credential.siteId
    const now = new Date('2026-06-16T00:00:00.000Z').toISOString()
    await runtime.store.upsertPublishedResources(seedResources(siteId, now))
    await runtime.store.updatePublishState({
      siteId,
      localPublishVersion: 7,
      latestSyncId: 'meilong-local-pilot-seed',
      lastSuccessfulSyncAt: now,
      lastKnownRemotePublishVersion: 7
    })
  }
}

// seedResources provides site-defined category, product, blog, and news public views for Meilong.
function seedResources(siteId: string, updatedAt: string): StoredPublishedResource[] {
  return [
    category(siteId, updatedAt, {
      id: 'category_porcelain_tiles',
      slug: 'porcelain-tiles',
      title: 'Porcelain Tiles',
      description:
        'Dense porcelain surfaces for commercial floors, hospitality interiors, and residential projects that need long service life.',
      image: '/images/meilong-showroom-hero.png',
      order: 10
    }),
    category(siteId, updatedAt, {
      id: 'category_sintered_slabs',
      slug: 'sintered-slabs',
      title: 'Sintered Slabs',
      description:
        'Large-format porcelain slabs for counters, wall cladding, furniture surfaces, and premium architectural packages.',
      image: '/images/meilong-showroom-hero.png',
      order: 20
    }),
    category(siteId, updatedAt, {
      id: 'category_mosaics',
      slug: 'mosaics-and-decor',
      title: 'Mosaics and Decor',
      description:
        'Coordinated mosaics, trims, and decorative formats for hotels, wellness spaces, retail interiors, and feature walls.',
      image: '/images/meilong-showroom-hero.png',
      order: 30
    }),
    category(siteId, updatedAt, {
      id: 'category_outdoor_tiles',
      slug: 'outdoor-pavers',
      title: 'Outdoor Pavers',
      description:
        'Slip-resistant exterior porcelain pavers for terraces, courtyards, pool decks, and commercial landscapes.',
      image: '/images/meilong-showroom-hero.png',
      order: 40
    }),
    product(siteId, updatedAt, {
      id: 'product_calacatta_royal_slab',
      slug: 'calacatta-royal-sintered-slab',
      title: 'Calacatta Royal Sintered Slab',
      summary: 'Bookmatched marble-look porcelain slab for hotel lobbies and high-touch commercial interiors.',
      description:
        'A large-format sintered porcelain slab with a disciplined white field and soft grey-gold veining. Designed for wall cladding, counters, reception desks, and furniture surfaces where visual continuity and easy maintenance matter.',
      model: 'ML-SL126278-CAR',
      categoryIds: ['category_sintered_slabs'],
      image: '/images/meilong-calacatta-slab.png',
      specs: [
        ['Format', '1200 x 2780', 'mm', 'Surface'],
        ['Thickness', '6', 'mm', 'Surface'],
        ['Finish', 'Polished / silk matt', '', 'Surface'],
        ['Application', 'Walls, counters, furniture panels', '', 'Use']
      ]
    }),
    product(siteId, updatedAt, {
      id: 'product_lumina_stone_tile',
      slug: 'lumina-stone-porcelain-tile',
      title: 'Lumina Stone Porcelain Tile',
      summary: 'Neutral stone-effect porcelain tile specified for multi-room commercial programs.',
      description:
        'Lumina Stone balances a warm mineral texture with calibrated edges for consistent installation across lobbies, corridors, restaurants, and model homes. The surface is designed for repeatable project procurement without a visually flat finish.',
      model: 'ML-PT800800-LST',
      categoryIds: ['category_porcelain_tiles'],
      image: '/images/meilong-showroom-hero.png',
      specs: [
        ['Format', '800 x 800', 'mm', 'Surface'],
        ['Water absorption', '< 0.5', '%', 'Performance'],
        ['Finish', 'Natural matt', '', 'Surface'],
        ['Edge', 'Rectified', '', 'Installation']
      ]
    }),
    product(siteId, updatedAt, {
      id: 'product_senda_terrace_paver',
      slug: 'senda-terrace-outdoor-paver',
      title: 'Senda Terrace Outdoor Paver',
      summary: '20 mm outdoor porcelain paver for terraces, pool decks, and public landscape zones.',
      description:
        'A structured exterior paver engineered for outdoor walking surfaces that need stable color, low water absorption, and a refined architectural finish. The palette coordinates with indoor porcelain ranges for inside-outside continuity.',
      model: 'ML-OP600600-SEN',
      categoryIds: ['category_outdoor_tiles'],
      image: '/images/meilong-showroom-hero.png',
      specs: [
        ['Format', '600 x 600', 'mm', 'Surface'],
        ['Thickness', '20', 'mm', 'Surface'],
        ['Finish', 'Structured grip', '', 'Performance'],
        ['Application', 'Terrace, pool deck, courtyard', '', 'Use']
      ]
    }),
    product(siteId, updatedAt, {
      id: 'product_arc_mosaic_series',
      slug: 'arc-mosaic-collection',
      title: 'Arc Mosaic Collection',
      summary: 'Coordinated porcelain mosaic sheets for feature walls, spas, and boutique hospitality spaces.',
      description:
        'Arc Mosaic gives designers a compact format with controlled tonal variation and project-ready sheet backing. It is suited to walls, wet areas, reception accents, and coordinated decor packages.',
      model: 'ML-MO300300-ARC',
      categoryIds: ['category_mosaics'],
      image: '/images/meilong-showroom-hero.png',
      specs: [
        ['Sheet size', '300 x 300', 'mm', 'Surface'],
        ['Chip format', 'Mixed arc geometry', '', 'Surface'],
        ['Finish', 'Satin glaze', '', 'Surface'],
        ['Application', 'Walls and decorative wet areas', '', 'Use']
      ]
    }),
    blog(siteId, updatedAt, {
      id: 'blog_porcelain_specification_notes',
      slug: 'porcelain-specification-notes-for-commercial-projects',
      title: 'Porcelain Specification Notes for Commercial Projects',
      summary:
        'A practical checklist for designers and procurement teams comparing porcelain tile and slab options.',
      image: '/images/meilong-showroom-hero.png',
      tags: ['Specification', 'Porcelain', 'B2B Projects'],
      body:
        '<p>Commercial porcelain selection starts with use conditions, not only appearance. Teams should confirm format, surface finish, edge treatment, installation environment, and cleaning expectations before samples are approved.</p><p>For hospitality and retail programs, Meilong recommends keeping a coordinated indoor tile, decor piece, and outdoor paver in the same design family. This reduces procurement complexity while giving designers enough range to handle public areas, wet zones, and exterior transitions.</p>'
    }),
    blog(siteId, updatedAt, {
      id: 'blog_slab_handling_guide',
      slug: 'large-format-slab-handling-guide',
      title: 'Large-format Slab Handling Guide',
      summary: 'How project teams can reduce breakage risk when ordering, receiving, and installing sintered slabs.',
      image: '/images/meilong-calacatta-slab.png',
      tags: ['Slabs', 'Installation', 'Project Delivery'],
      body:
        '<p>Large-format slabs require planned handling from crate arrival through final placement. Before delivery, confirm access routes, storage position, suction frame availability, and installer experience with thin porcelain panels.</p><p>Factory packing, clear labeling, and batch traceability help contractors keep matched surfaces together and reduce on-site rework.</p>'
    }),
    news(siteId, updatedAt, {
      id: 'news_2026_trade_collection',
      slug: '2026-commercial-surface-collection-preview',
      title: 'Meilong Previews 2026 Commercial Surface Collection',
      summary:
        'The new collection focuses on neutral stone looks, exterior pavers, and coordinated slab programs for B2B buyers.',
      image: '/images/meilong-showroom-hero.png',
      tags: ['Collection', 'Commercial Projects'],
      body:
        '<p>Meilong Ceramics has prepared a 2026 commercial surface preview for project distributors, design studios, and hospitality procurement teams. The pilot range focuses on steady colors, repeatable production, and category coordination across tile, slab, mosaic, and paver formats.</p>'
    }),
    news(siteId, updatedAt, {
      id: 'news_local_pilot_runtime',
      slug: 'local-site-runtime-pilot-launched',
      title: 'Local Site Runtime Pilot Launched for Meilong Ceramics',
      summary:
        'The pilot validates published product, category, blog, and news rendering through a deployment-shaped local runtime.',
      image: '/images/meilong-calacatta-slab.png',
      tags: ['Digital Operations', 'Published Data'],
      body:
        '<p>The Meilong Ceramics site pilot now renders public pages from local published data through the OES Site Runtime boundary. The storefront remains separate from OES credentials and uses deployment-shaped SEO identity for local preview.</p>'
    })
  ]
}

interface CategorySeed {
  id: string
  slug: string
  title: string
  description: string
  image: string
  order: number
}

interface ProductSeed {
  id: string
  slug: string
  title: string
  summary: string
  description: string
  model: string
  categoryIds: string[]
  image: string
  specs: Array<[string, string, string, string]>
}

interface ContentSeed {
  id: string
  slug: string
  title: string
  summary: string
  image: string
  tags: string[]
  body: string
}

// category maps a site-defined Meilong category into the P1 public view envelope.
function category(siteId: string, updatedAt: string, seed: CategorySeed): StoredPublishedResource {
  return envelope(siteId, 'category', seed.id, seed.slug, updatedAt, {
    category_id: seed.id,
    display_title: seed.title,
    description: seed.description,
    image: seed.image,
    sort_order: seed.order,
    seo: seo(seed.title, seed.description, seed.image, `/categories/${seed.slug}`)
  })
}

// product maps a Meilong product presentation into the P1 ProductPublicView payload.
function product(siteId: string, updatedAt: string, seed: ProductSeed): StoredPublishedResource {
  return envelope(siteId, 'product', seed.id, seed.slug, updatedAt, {
    product_id: seed.id,
    display_title: seed.title,
    display_description: seed.description,
    summary: seed.summary,
    model: seed.model,
    brand: 'Meilong Ceramics',
    category_ids: seed.categoryIds,
    images: [{ url: seed.image, alt: seed.title, role: 'primary' }],
    specs: seed.specs.map(([name, value, unit, group]) => ({ name, value, unit, group })),
    seo: seo(seed.title, seed.summary, seed.image, `/products/${seed.slug}`)
  })
}

// blog maps sanitized Meilong editorial content into a BlogPublicView payload.
function blog(siteId: string, updatedAt: string, seed: ContentSeed): StoredPublishedResource {
  return content(siteId, updatedAt, 'blog', seed)
}

// news maps sanitized Meilong announcement content into a NewsPublicView payload.
function news(siteId: string, updatedAt: string, seed: ContentSeed): StoredPublishedResource {
  return content(siteId, updatedAt, 'news', seed)
}

// content shares the P1 Blog and News public payload shape without introducing a page builder.
function content(
  siteId: string,
  updatedAt: string,
  resourceType: 'blog' | 'news',
  seed: ContentSeed
): StoredPublishedResource {
  return envelope(siteId, resourceType, seed.id, seed.slug, updatedAt, {
    content_id: seed.id,
    title: seed.title,
    summary: seed.summary,
    cover_image: seed.image,
    author: 'Meilong Editorial Desk',
    tags: seed.tags,
    body_html: seed.body,
    published_at: updatedAt,
    seo: seo(seed.title, seed.summary, seed.image, `/${resourceType}/${seed.slug}`)
  })
}

// envelope wraps a resource payload in the site-service public view storage shape.
function envelope(
  siteId: string,
  resourceType: 'product' | 'category' | 'blog' | 'news',
  resourceId: string,
  slug: string,
  updatedAt: string,
  payload: Record<string, unknown>
): StoredPublishedResource {
  return {
    siteId,
    resourceType,
    resourceId,
    slug,
    locale: 'en-US',
    status: 'published',
    publishVersion: 7,
    updatedAt,
    payloadJson: JSON.stringify(payload)
  }
}

// seo creates production-shaped canonical metadata from the Meilong public base URL.
function seo(title: string, description: string, image: string, path: string) {
  return {
    title: `${title} | Meilong Ceramics`,
    description,
    image: image.startsWith('http') ? image : `${publicBaseUrl}${image}`,
    canonical_url: `${publicBaseUrl}${path}`
  }
}
