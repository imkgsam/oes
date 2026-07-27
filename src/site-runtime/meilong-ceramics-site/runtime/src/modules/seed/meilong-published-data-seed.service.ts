import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  NodeSqlitePublishedStore,
  OesSiteRuntimeService,
  type SitePageExposure,
  type StoredPublishedResource
} from '@oes/site-runtime-kit'

import { MEILONG_SITE_CAPABILITY_MANIFEST } from '../../site-capability-manifest'

const publicBaseUrl = 'https://meilong-ceramics.com'
const sinkSelectionReferenceSlug = 'sink-selection-made-easy-a-deep-dive-into-bathroom-sink-types'
const sinkSelectionArticleFigures = [
  {
    before: '<h3>2. Metal Sinks</h3>',
    html: '<figure><img src="https://cdn.shopify.com/s/files/1/0526/3536/9660/files/7_cc49953d-97eb-4ce7-8ec0-9f52d64e3a54_1024x1024.png?v=1712480893" alt="Clay-based ceramic bathroom sink" loading="lazy" decoding="async" width="1024" height="1024"></figure>'
  },
  {
    before: '<h3>3. Glass Sinks</h3>',
    html: '<figure><img src="https://cdn.shopify.com/s/files/1/0526/3536/9660/files/8_273cdfa0-acba-4595-b5ba-0505ca5134c8_1024x1024.png?v=1712480894" alt="Metal bathroom sink" loading="lazy" decoding="async" width="1024" height="1024"></figure>'
  },
  {
    before: '<h3>4. Acrylic, Composite, Resin, and Solid Surface Sinks</h3>',
    html: '<figure><img src="https://cdn.shopify.com/s/files/1/0526/3536/9660/files/10_a5c9136c-8bf8-47e8-a6ad-1314ce21db68_1024x1024.png?v=1712484032" alt="Glass bathroom sink" loading="lazy" decoding="async" width="1024" height="1024"></figure>'
  },
  {
    before: '<h3>5. Enameled Cast Iron Sinks</h3>',
    html: '<figure><img src="https://cdn.shopify.com/s/files/1/0526/3536/9660/files/9_b4e8b0a9-12f0-47a3-bc1c-2f6a2e53453c_1024x1024.png?v=1712484032" alt="Solid surface bathroom sink" loading="lazy" decoding="async" width="1024" height="1024"></figure>'
  }
]

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
    const store = new NodeSqlitePublishedStore({
      path: process.env.OES_SITE_STORE_PATH ?? './data/site-runtime.sqlite'
    })
    await store.init()
    try {
      const current = await store.getPublishState(siteId)
      const publishVersion = Math.max(current.localPublishVersion, 9)
      await store.commitPublication({
        mode: publishVersion === current.localPublishVersion ? 'rebuild' : 'snapshot',
        siteId,
        expectedLocalPublishVersion: current.localPublishVersion,
        publishVersion,
        latestSyncId: 'meilong-news-reference-fixture',
        lastKnownRemotePublishVersion: Math.max(current.lastKnownRemotePublishVersion ?? 0, 7),
        exposure: {
          siteId,
          publishVersion,
          defaultLocale: 'en-US',
          activeLocales: ['en-US'],
          pages: localSeedPageExposure(),
          publishedAt: now
        },
        resources: seedResources(siteId, now),
        missingResources: []
      })
    } finally {
      await store.close()
    }
  }
}

// localSeedPageExposure gives explicit local smoke fixtures a complete public page publication without altering OES discovery.
function localSeedPageExposure(): SitePageExposure[] {
  return MEILONG_SITE_CAPABILITY_MANIFEST.pages.map((page) => ({
    pageKey: page.pageKey,
    enabled: true,
    indexable: page.pageKey !== 'SEARCH',
    supportedLocales: [...page.supportedLocales]
  }))
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
    contentCategory(siteId, updatedAt, {
      id: 'content_category_specification',
      slug: 'bathroom-faucet',
      seoCanonicalPath: '/blogs/categories/bathroom-faucet',
      name: 'Bathroom Faucet',
      description: 'Ideas and practical guides for bathroom faucet planning and everyday care.',
      sortOrder: 10,
      historicalSlugs: ['spec-notes']
    }),
    contentCategory(siteId, updatedAt, {
      id: 'content_category_bathroom_design',
      slug: 'bathroom-design',
      seoCanonicalPath: '/blogs/categories/bathroom-design',
      name: 'Bathroom Design',
      description: 'Ideas for planning a calm, functional, and personal bathroom space.',
      sortOrder: 15,
      historicalSlugs: []
    }),
    contentCategory(siteId, updatedAt, {
      id: 'content_category_slab_handling',
      slug: 'care-and-cleaning',
      seoCanonicalPath: '/blogs/categories/care-and-cleaning',
      name: 'Care and Cleaning',
      description: 'Straightforward notes for keeping bathroom surfaces looking their best.',
      sortOrder: 30,
      historicalSlugs: []
    }),
    contentCategory(siteId, updatedAt, {
      id: 'content_category_commercial_projects',
      slug: 'kitchen-sink',
      seoCanonicalPath: '/blogs/categories/kitchen-sink',
      name: 'Kitchen Sink',
      description: 'Practical guidance for selecting and installing kitchen sinks.',
      sortOrder: 50,
      historicalSlugs: ['project-news']
    }),
    contentCategory(siteId, updatedAt, {
      id: 'content_category_roca_reference',
      slug: 'roca',
      seoCanonicalPath: '/news/categories/roca',
      name: 'Roca',
      description: 'Reference-only brand announcements used to validate the News listing replica.',
      sortOrder: 50,
      historicalSlugs: []
    }),
    contentCategory(siteId, updatedAt, {
      id: 'content_category_roca_group_reference',
      slug: 'roca-group',
      seoCanonicalPath: '/news/categories/roca-group',
      name: 'Roca Group',
      description: 'Reference-only corporate announcements used to validate the News listing replica.',
      sortOrder: 60,
      historicalSlugs: []
    }),
    contentCategory(siteId, updatedAt, {
      id: 'content_category_roca_sustainability_reference',
      slug: 'sustainability',
      seoCanonicalPath: '/news/categories/sustainability',
      name: 'Sustainability',
      description: 'Reference-only sustainability announcements used to validate the News listing replica.',
      sortOrder: 70,
      historicalSlugs: []
    }),
    contentCategory(siteId, updatedAt, {
      id: 'content_category_bathroom_sink_selection',
      slug: 'bathroom-sink',
      seoCanonicalPath: '/blogs/categories/bathroom-sink',
      name: 'Bathroom Sink',
      description: 'Guides for comparing bathroom sink formats, sizing, and installation details.',
      sortOrder: 20,
      historicalSlugs: ['sink-buying-guide']
    }),
    contentCategory(siteId, updatedAt, {
      id: 'content_category_installation_instruction',
      slug: 'installation-instruction',
      seoCanonicalPath: '/blogs/categories/installation-instruction',
      name: 'Installation Instruction',
      description: 'Step-by-step installation guidance for bathroom fixtures and accessories.',
      sortOrder: 40,
      historicalSlugs: []
    }),
    contentCategory(siteId, updatedAt, {
      id: 'content_category_shower_niche',
      slug: 'shower-niche',
      seoCanonicalPath: '/blogs/categories/shower-niche',
      name: 'Shower Niche',
      description: 'Planning and installation notes for well-proportioned shower storage.',
      sortOrder: 60,
      historicalSlugs: []
    }),
    contentCategory(siteId, updatedAt, {
      id: 'content_category_toilet',
      slug: 'toilet',
      seoCanonicalPath: '/blogs/categories/toilet',
      name: 'Toilet',
      description: 'Bathroom planning ideas for selecting and positioning a toilet.',
      sortOrder: 70,
      historicalSlugs: []
    }),
    contentCategory(siteId, updatedAt, {
      id: 'content_category_toilet_seat_bidet',
      slug: 'toilet-seat-bidet',
      seoCanonicalPath: '/blogs/categories/toilet-seat-bidet',
      name: 'Toilet Seat Bidet',
      description: 'Buying guidance for toilet seats and bidet accessories.',
      sortOrder: 80,
      historicalSlugs: []
    }),
    contentCategory(siteId, updatedAt, {
      id: 'content_category_unused',
      slug: 'vanity',
      name: 'Vanity',
      description: 'Bathroom vanity planning ideas for storage, proportion, and daily use.',
      sortOrder: 90,
      historicalSlugs: []
    }),
    blog(siteId, updatedAt, {
      id: 'blog_porcelain_specification_notes',
      slug: '10-expert-tips-for-transforming-your-bathroom-into-the-ultimate-spa-experience',
      title: '10 Expert Tips for Transforming Your Bathroom into the Ultimate Spa Experience',
      summary:
        'Imagine stepping into your bathroom and feeling like you’ve entered a tranquil spa—no appointment necessary. Just you, your favorite candle flickering softly on the counter, and the scent of eucalyptus and lavender wrapping around you like a cozy blanket. With...',
      image: '/images/blog-reference/spa-experience.jpg',
      categoryIds: ['content_category_bathroom_design'],
      publishedAt: '2025-06-06T00:00:00.000Z',
      historicalSlugs: ['porcelain-tile-specification-checklist', 'porcelain-specification-notes-for-commercial-projects'],
      body:
        '<p>Commercial porcelain selection starts with use conditions, not only appearance. Teams should confirm format, surface finish, edge treatment, installation environment, and cleaning expectations before samples are approved.</p><p>For hospitality and retail programs, Meilong recommends keeping a coordinated indoor tile, decor piece, and outdoor paver in the same design family. This reduces procurement complexity while giving designers enough range to handle public areas, wet zones, and exterior transitions.</p><h2>Surface types for project bathrooms and public interiors</h2><h3>1. Large-format sintered slabs</h3><p>Large slabs create a continuous stone-like plane for counters, vanities, reception desks, wall cladding, and wet-room feature panels. The most important specification checks are slab thickness, handling route, bookmatch plan, crate labeling, and installer tooling.</p><figure><img src="/images/meilong-calacatta-slab.png" alt="Large-format porcelain slab in a neutral commercial interior"><figcaption>Large slabs reduce visual joints and help commercial spaces feel calmer and more intentional.</figcaption></figure><h3>2. Porcelain floor and wall tiles</h3><p>Porcelain tile remains the most flexible choice for multi-room programs. Confirm water absorption, slip rating, finish, rectified edge, and shade variation before approving a sample board.</p><h3>3. Mosaics and decorative formats</h3><p>Mosaics work well for shower floors, feature walls, spa rooms, and boutique hospitality moments. Treat them as part of the same material family instead of a late decorative add-on.</p><h3>4. Outdoor pavers</h3><p>Exterior pavers need a more structured surface, a thicker body, and consistent color control across batches. Coordinating indoor porcelain with outdoor pavers helps terraces and public entries connect naturally with the interior program.</p><h2>Key features to confirm before purchase</h2><p><strong>Finish:</strong> polished, silk matt, natural matt, and structured grip surfaces behave differently under water, lighting, and maintenance routines.</p><p><strong>Format:</strong> large formats reduce grout lines, while smaller formats make slopes and compact wet zones easier to solve.</p><p><strong>Edge and installation:</strong> rectified edges support tighter joints, but require a stable substrate and experienced installers.</p><p><strong>Maintenance:</strong> commercial cleaning teams need clear guidance on approved detergents, abrasive tools, and expected finish changes over time.</p><h2>Products Recommended</h2><p>For a coordinated Meilong bathroom or hospitality package, start with a large slab for the visual anchor, a porcelain tile for repeatable floor areas, and an outdoor paver where inside-outside continuity matters.</p>'
    }),
    blog(siteId, updatedAt, {
      id: 'blog_sink_selection_reference_fixture',
      slug: 'sink-selection-made-easy-a-deep-dive-into-bathroom-sink-types',
      title: 'Choose the perfect bathroom sink for you',
      summary:
        "The selection of a bathroom sink is a crucial decision that can greatly impact your bathroom's overall aesthetic and functionality. Explore sink types, materials, and key features before you choose.",
      image: '/images/blog-reference/bathroom-sink.jpg',
      categoryIds: ['content_category_bathroom_sink_selection'],
      tags: ['Bathroom Design', 'Sink Types', 'Buying Guide'],
      authorDisplayName: 'ZJocelyn',
      publishedAt: '2024-04-07T00:00:00.000Z',
      historicalSlugs: ['bathroom-sink-types-guide'],
      body:
        '<p>The selection of a bathroom sink is a crucial decision that can greatly impact your bathroom\'s overall aesthetic and functionality. With numerous sink types and materials available, it\'s important to understand their unique advantages and considerations. This comprehensive guide aims to assist you in making an informed decision by providing an overview of different sink types, materials, and key features to consider.</p><h2>Sink Types</h2><h3>1. Wall Mounted Sink</h3><p>A wall-mounted sink offers excellent space utilization, creating a more spacious feel in small bathrooms. Its suspended design also facilitates easy cleaning, ensuring a hygienic environment. However, the installation process may require professional skills, and it may provide less countertop space compared to other sink types.</p><figure><img src="https://cdn.shopify.com/s/files/1/0526/3536/9660/files/1_5e22c741-9ba5-4341-9f1e-196f90d0e56d_1024x1024.png?v=1712480894" alt="Wall-mounted bathroom sink" loading="lazy" decoding="async" width="1024" height="1024"></figure><h3>2. Drop-in Sink</h3><p>The drop-in sink stands out with its fashionable design and offers flexibility in terms of countertop materials and design. However, cleaning around the sink area may require extra attention, and the sink occupying countertop space can limit storage options for toiletries.</p><figure><img src="https://cdn.shopify.com/s/files/1/0526/3536/9660/files/2_1c0b04e5-1073-40c9-8c8e-e1e3fe30510d_1024x1024.png?v=1712480890" alt="Drop-in bathroom sink" loading="lazy" decoding="async" width="1024" height="1024"></figure><h3>3. Vessel Sink</h3><p>Vessel sinks are known for their artistic expression and diverse material options. They are relatively easy to install, making them suitable for DIY projects. However, cleaning challenges may arise due to the potential accumulation of water and dirt between the sink bottom and the countertop. Additionally, depending on the vessel\'s shape, there may be a risk of splashing.</p><figure><img src="https://cdn.shopify.com/s/files/1/0526/3536/9660/files/3_0b270b87-93d5-40e2-a8d4-29eb382da806_1024x1024.png?v=1712480894" alt="Vessel bathroom sink" loading="lazy" decoding="async" width="1024" height="1024"></figure><h3>4. Undermount Sink</h3><p>An undermount sink creates a seamless appearance with the countertop, offering a modern and stylish design. Cleaning is convenient, as debris can be wiped directly into the sink without obstruction. However, undermount sinks require specific types of countertops and tend to be more expensive than other options.</p><figure><img src="https://cdn.shopify.com/s/files/1/0526/3536/9660/files/4_340fc2e1-2b77-4108-aeff-24dca33b5803_1024x1024.png?v=1712480894" alt="Undermount bathroom sink" loading="lazy" decoding="async" width="1024" height="1024"></figure><h3>5. Console Sink</h3><p>Console sinks provide ample countertop space and a stylish, open appearance. However, they require more wall space compared to pedestal sinks and offer less storage space.</p><figure><img src="https://cdn.shopify.com/s/files/1/0526/3536/9660/files/5_3ed315f1-a455-45eb-8b6f-ee4834d3cb50_1024x1024.png?v=1712480894" alt="Console bathroom sink" loading="lazy" decoding="async" width="1024" height="1024"></figure><h3>6. Pedestal Sink</h3><p>Pedestal sinks are ideal for small bathrooms, creating a sense of spaciousness by concealing pipes. They feature a timeless and elegant design. However, they provide limited storage space and may require adjustments to the pipes during installation.</p><figure><img src="https://cdn.shopify.com/s/files/1/0526/3536/9660/files/6_d5ee4c25-8411-4d84-9ccd-2ffd3ec48ddb_1024x1024.png?v=1712480894" alt="Pedestal bathroom sink" loading="lazy" decoding="async" width="1024" height="1024"></figure><h2>Sink Materials</h2><h3>1. Clay-based Ceramic Materials</h3><p>Sinks made from materials such as vitreous china, fireclay, and porcelain are common and easy to clean.</p><h3>2. Metal Sinks</h3><p>Brass, copper, and stainless steel sinks are durable choices that can enhance the bathroom\'s decor. Special cleaners may be required to prevent scratches on brass and copper sinks.</p><h3>3. Glass Sinks</h3><p>Made from thick tempered glass, these sinks bring a design element to the bathroom. They are prone to showing water spots and typically require nonabrasive cleaners.</p><h3>4. Acrylic, Composite, Resin, and Solid Surface Sinks</h3><p>These sinks are durable and easy to clean, making them suitable for highly used bathrooms. Some varieties resemble the appearance of marble or granite.</p><h3>5. Enameled Cast Iron Sinks</h3><p>These sinks have a substantive look, come in various rich colors, and are built to last a lifetime. However, they are heavy.</p><h2>Key Features to Consider</h2><h3>1. Color</h3><p>Sinks are available in countless different hues and finishes, allowing you to mix up the bathroom decor. Popular colors include white, beige, copper, metallic, nickel, blue, green, and gray.</p><h3>2. Faucet Hole Options</h3><p>Consider whether the sink includes a faucet hole or if the faucet needs to be installed separately. Different faucet hole options, such as single hole, centerset, and widespread, can accommodate various bathroom sink faucets.</p><h3>3. Water Conservation</h3><p>Some modern vessel sink and faucet combos offer water conservation benefits by controlling the flow rate for more efficient water use.</p><h3>4. Number of Sinks</h3><p>For spacious bathrooms, a double sink vanity can be a great option, providing ample cabinet space for concealed bathroom storage.</p><p>Selecting the perfect bathroom sink involves considering both style and functionality. Whether you opt for the sleek elegance of a glass vessel sink or the space-saving convenience of a pedestal sink, make a choice that suits your preferences and meets your practical needs.</p><h2>Products Recommended</h2><ul><li><a href="/collections/bathroom-sinks">DeerValley Ally 21*15 Vitreous China Undermount Rectangular Space-Saving Bathroom Sink with Overflow Hole DV-1U101/0085/0086</a></li><li><a href="/collections/bathroom-sinks">DeerValley DV-1U201 Ursa 21*15 White China Rectangular Sleek Undermount Bathroom Sink with Overflow</a></li><li><a href="/collections/bathroom-sinks">DeerValley Liberty Ceramic Bathroom Wall Mount Space-saving Rectangular Left Hand Sink (Faucet on the Left Hand) DV-1V081L/0091L</a></li></ul>'
    }),
    blog(siteId, updatedAt, {
      id: 'blog_slab_handling_guide',
      slug: 'how-to-install-a-shower-niche-easy-steps',
      title: 'How to Install a Shower Niche: Easy Steps',
      summary:
        'Upgrade your shower experience with a stylish and functional shower niche. This sleek addition not only enhances the aesthetics of your bathroom but also provides convenient storage for your essentials. Follow our easy step-by-step guide to install your shower niche...',
      image: '/images/blog-reference/shower-niche.png',
      categoryIds: ['content_category_installation_instruction', 'content_category_shower_niche'],
      publishedAt: '2024-04-06T00:00:00.000Z',
      historicalSlugs: ['large-slab-handling', 'large-format-slab-handling-guide'],
      body:
        '<p>Large-format slabs require planned handling from crate arrival through final placement. Before delivery, confirm access routes, storage position, suction frame availability, and installer experience with thin porcelain panels.</p><p>Factory packing, clear labeling, and batch traceability help contractors keep matched surfaces together and reduce on-site rework.</p>'
    }),
    blog(siteId, updatedAt, {
      id: 'blog_fireclay-kitchen-sink',
      slug: 'what-are-the-benefits-and-drawbacks-of-a-fireclay-kitchen-sink',
      title: 'What Are the Benefits and Drawbacks of a Fireclay Kitchen Sink?',
      summary:
        'When it comes to kitchen sinks, the material plays a pivotal role in determining its durability, aesthetics, and functionality. Among the array of options available, fireclay kitchen sinks have emerged as a popular choice, and for good reason. In this...',
      image: '/images/blog-reference/fireclay-kitchen-sink.png',
      categoryIds: ['content_category_commercial_projects'],
      publishedAt: '2024-03-05T00:00:00.000Z',
      historicalSlugs: [],
      body:
        '<p>When selecting a kitchen sink, balance surface durability, everyday cleaning, cabinet support, and the visual character of the material before choosing a final configuration.</p>'
    }),
    blog(siteId, updatedAt, {
      id: 'blog_drop-in-sink-installation',
      slug: 'how-to-install-a-drop-sink',
      title: 'How To Install a Drop-in Sink',
      summary:
        'Are you ready to transform your bathroom with a new drop-in sink? This installation guide will walk you through the process, ensuring a smooth and successful upgrade. Tools and Materials: Tube cutter Adjustable wrench Pencil Pipe wrench Safety glasses Jigsaw...',
      image: '/images/blog-reference/drop-in-sink.png',
      categoryIds: ['content_category_bathroom_sink_selection', 'content_category_installation_instruction'],
      publishedAt: '2024-02-17T00:00:00.000Z',
      historicalSlugs: [],
      body:
        '<p>A drop-in sink installation starts with a verified cutout, level support, and a clear plan for faucet, drain, and overflow connections.</p>'
    }),
    blog(siteId, updatedAt, {
      id: 'blog_measure-kitchen-sink',
      slug: 'how-to-accurately-measure-your-kitchen-sink',
      title: 'How to Accurately Measure Your Kitchen Sink',
      summary:
        "Whether you're embarking on a kitchen renovation or simply looking to replace your old sink, understanding how to measure your kitchen sink properly is essential. This guide will walk you through the meticulous steps involved in determining your project scope,...",
      image: '/images/blog-reference/measure-kitchen-sink.png',
      categoryIds: ['content_category_commercial_projects'],
      publishedAt: '2024-01-30T00:00:00.000Z',
      historicalSlugs: [],
      body:
        '<p>Record the cabinet opening, counter depth, existing cutout, and faucet clearance before selecting a replacement kitchen sink.</p>'
    }),
    blog(siteId, updatedAt, {
      id: 'blog_undermount-sink-installation',
      slug: 'how-to-install-an-undermount-sink',
      title: 'How to Install an Undermount Sink',
      summary:
        "Upgrade your bathroom's style with the sleek undermount sink design. Follow our guide for key steps in a polished installation. Dive in for an effortlessly sophisticated and functional result.Step 1: Verify the Cabinet ClearanceBefore diving into the installation process, it's...",
      image: '/images/blog-reference/undermount-sink.png',
      categoryIds: ['content_category_bathroom_sink_selection', 'content_category_installation_instruction'],
      publishedAt: '2024-01-17T00:00:00.000Z',
      historicalSlugs: [],
      body:
        '<p>Confirm cabinet clearance and solid support before mounting an undermount sink beneath a bathroom countertop.</p>'
    }),
    blog(siteId, updatedAt, {
      id: 'blog_measure-bathroom-faucet',
      slug: 'how-to-measure-bathroom-faucets-correctly',
      title: 'How to Measure Bathroom Faucets Correctly',
      summary:
        "As a seasoned faucet expert, ensuring precise measurements is crucial for a successful faucet installation. Let's delve into the professional approach to accurately measure your bathroom faucet.1. Prepare for Accurate Measurements:For a seamless installation, begin by gauging the existing faucet in...",
      image: '/images/blog-reference/measure-bathroom-faucet.png',
      categoryIds: ['content_category_specification'],
      publishedAt: '2024-01-08T00:00:00.000Z',
      historicalSlugs: [],
      body:
        '<p>Measure the faucet center, spout reach, mounting-hole spacing, and available clearance before choosing a replacement bathroom faucet.</p>'
    }),
    blog(siteId, updatedAt, {
      id: 'blog_hotel_surface_coordination',
      slug: 'a-guide-on-how-to-measure-a-toilet',
      title: 'A Guide on How to Measure a Toilet',
      summary:
        'When searching for a new toilet, it is crucial to consider its size and dimensions. Our guide provides insights into the factors affecting standard toilet dimensions, guidance on how to measure a toilet, and tips on using this information for a...',
      image: '/images/blog-reference/measure-toilet.png',
      categoryIds: ['content_category_toilet'],
      publishedAt: '2023-12-20T00:00:00.000Z',
      historicalSlugs: [],
      body:
        '<p>When selecting a toilet, confirm the room dimensions, rough-in distance, bowl projection, and clearance before making a final purchase decision.</p>'
    }),
    blog(siteId, updatedAt, {
      id: 'blog_wall_mount_sink_installation',
      slug: 'elevate-your-space-a-diy-guide-to-wall-mount-bathroom-sink-installation',
      title: 'Elevate Your Space: A DIY Guide to Wall Mount Bathroom Sink Installation',
      summary:
        'Upgrade your bathroom with an exquisite wall-mounted sink. Our step-by-step guide ensures a flawless installation. To guarantee a seamless setup, having the right tools and materials is crucial. Here are the tools and materials we recommend using. Silicone Safety Glasses...',
      image: '/images/blog-reference/wall-mount-sink.png',
      categoryIds: ['content_category_bathroom_sink_selection', 'content_category_installation_instruction'],
      publishedAt: '2023-12-19T00:00:00.000Z',
      historicalSlugs: [],
      body:
        '<p>Wall-mounted sinks need accurate rough-in planning, secure wall blocking, and clear dimensional checks before the fixture is installed.</p>'
    }),
    blog(siteId, updatedAt, {
      id: 'blog_vanity_size_matters',
      slug: 'size-matters-why-choosing-the-right-vanity-is-crucial',
      title: 'Size Matters: Why Choosing the Right Vanity is Crucial',
      summary:
        'Looking to spruce up your bathroom with a sparkling new vanity? Choosing just the right vanity to fit both visually and practically within your washroom can prove to be a tough decision. A variety of factors from width, depth, and...',
      image: '/images/blog-reference/vanity-size-matters.jpg',
      categoryIds: ['content_category_unused'],
      publishedAt: '2023-11-14T00:00:00.000Z',
      historicalSlugs: [],
      body:
        '<p>Vanity sizing should balance storage needs with door swing, plumbing access, mirror placement, and the room circulation path.</p>'
    }),
    blog(siteId, updatedAt, {
      id: 'blog_workstation_kitchen_sink',
      slug: 'what-is-a-workstation-kitchen-sink-and-why-theyre-trending-today',
      title: "What Is A Workstation Kitchen Sink and Why They're Trending Today",
      summary:
        'In the ever-evolving realm of kitchen design, one innovative concept that has taken the culinary world by storm is the workstation sink. In this article, we will explore the world of workstation sinks, shedding light on what they are, why...',
      image: '/images/blog-reference/workstation-kitchen-sink.jpg',
      categoryIds: ['content_category_commercial_projects'],
      publishedAt: '2023-10-25T00:00:00.000Z',
      historicalSlugs: [],
      body:
        '<p>Workstation sinks combine bowls, ledges, and accessories into one prep zone, so cabinet width and accessory storage need to be checked early.</p>'
    }),
    blog(siteId, updatedAt, {
      id: 'blog_shower_niche_care',
      slug: 'efficient-maintenance-shower-niche-care-tips',
      title: 'Efficient Maintenance Shower Niche Care Tips',
      summary:
        'In the realm of bathroom aesthetics, shower niches have emerged as a popular choice for both functionality and style. However, maintaining the pristine appearance and longevity of your shower niche requires some expert care. To help you in this endeavor,...',
      image: '/images/blog-reference/shower-niche-care.jpg',
      categoryIds: ['content_category_shower_niche', 'content_category_slab_handling'],
      publishedAt: '2023-10-23T00:00:00.000Z',
      historicalSlugs: [],
      body:
        '<p>Routine shower niche care protects grout, sealant, and shelf finishes while keeping bathroom storage practical and clean.</p>'
    }),
    blog(siteId, updatedAt, {
      id: 'blog_toilet_seat_bidet_guide',
      slug: 'toilet-seat-bidet-why-its-a-must-have-in-every-bathroom',
      title: "Toilet Seat Bidet: Why It's a Must-have in Every Bathroom",
      summary:
        'Bidets have been a fixture in many parts of the world for years, offering a superior and more hygienic alternative to traditional methods of post-toilet cleansing. In this article, we will explore the realm of bidets, delving into their numerous...',
      image: '/images/blog-reference/toilet-seat-bidet.jpg',
      categoryIds: ['content_category_toilet_seat_bidet'],
      publishedAt: '2023-10-11T01:00:00.000Z',
      historicalSlugs: [],
      body:
        '<p>A bidet seat selection should account for electrical supply, bowl shape, water connection, and the desired wash and drying functions.</p>'
    }),
    blog(siteId, updatedAt, {
      id: 'blog_bathroom_hardware_accessories',
      slug: 'choosing-and-utilizing-bathroom-hardware-accessories-crafting-the-perfect-bath-space',
      title: 'Choosing and Utilizing Bathroom Hardware Accessories: Crafting the Perfect Bath Space',
      summary:
        'Bathroom hardware accessories play a vital role in every household\'s bathroom and kitchen. They not only ensure smooth water flow but also enhance the safety and reliability of the water supply. In this article, we will delve into the types...',
      image: '/images/blog-reference/bathroom-hardware-accessories.jpg',
      categoryIds: ['content_category_bathroom_sink_selection', 'content_category_commercial_projects', 'content_category_toilet'],
      publishedAt: '2023-10-11T00:00:00.000Z',
      historicalSlugs: [],
      body:
        '<p>Bathroom hardware decisions should consider long-term maintenance, water supply reliability, and a coordinated installation sequence.</p>'
    }),
    blog(siteId, updatedAt, {
      id: 'blog_farmhouse_sink_installation',
      slug: 'mastering-farmhouse-sink-installation-diy-expert-tips',
      title: 'Mastering Farmhouse Sink Installation | DIY Expert Tips',
      summary:
        'Proper installation is essential for a farmhouse kitchen sink to ensure its longevity and functionality. In this article, we will provide detailed instructions on how to install a farmhouse kitchen sink, including important considerations and precautions to take. Follow our...',
      image: '/images/blog-reference/farmhouse-sink-installation.jpg',
      categoryIds: ['content_category_installation_instruction', 'content_category_commercial_projects'],
      publishedAt: '2023-09-27T00:00:00.000Z',
      historicalSlugs: [],
      body:
        '<p>Farmhouse sink installation depends on a properly supported cabinet, an accurate front cutout, and careful countertop alignment.</p>'
    }),
    blog(siteId, updatedAt, {
      id: 'blog_wall_hung_toilet_installation',
      slug: 'master-the-art-of-wall-hung-toilet-installation-step-by-step-guide',
      title: 'Master the Art of Wall Hung Toilet Installation | Step-by-Step Guide',
      summary:
        'In this article, we will provide step-by-step instructions on how to install a wall hung toilet. By following these expert tips, you can ensure a successful installation and improve your bathroom\'s aesthetics. Section 1: Dry Fit Outlet Pipe and Inlet Pipe To...',
      image: '/images/blog-reference/wall-hung-toilet-installation.png',
      categoryIds: ['content_category_installation_instruction', 'content_category_toilet'],
      publishedAt: '2023-09-24T01:00:00.000Z',
      historicalSlugs: [],
      body:
        '<p>Wall-hung toilet projects require an in-wall carrier, accurate pipe positioning, stable framing, and careful finish coordination.</p>'
    }),
    blog(siteId, updatedAt, {
      id: 'blog_kitchen_sink_buyers_guide',
      slug: 'choosing-the-perfect-kitchen-sink-a-comprehensive-buyers-guide',
      title: "Choosing the Perfect Kitchen Sink: A Comprehensive Buyer's Guide",
      summary:
        "The kitchen sink is an essential component of any kitchen, and selecting the right one can greatly enhance both functionality and aesthetics. In this blog post, we'll explore the different types of kitchen sinks, materials options, bowl configurations, and key...",
      image: '/images/blog-reference/kitchen-sink-buyers-guide.jpg',
      categoryIds: ['content_category_commercial_projects'],
      publishedAt: '2023-09-24T00:00:00.000Z',
      historicalSlugs: [],
      body:
        '<p>Kitchen sink selection should start with cabinet dimensions, counter material, preferred bowl configuration, and daily prep habits.</p>'
    }),
    blog(siteId, updatedAt, {
      id: "blog_dv_vessel_sink_installation",
      slug: "quick-and-easy-vessel-bathroom-sink-installation-guide",
      title: "Quick and Easy Vessel Bathroom Sink Installation Guide",
      summary: "In this step-by-step article, we'll walk you through the installation of your vessel bathroom sink, ensuring it's done flawlessly. Step 1: Confirm the Size and Placement To begin, carefully place the vessel sink on the installation countertop and ensure that it is the appropriate size for your space. It's crucial to have sufficient space left behind the sink",
      image: "https://cdn.shopify.com/s/files/1/0526/3536/9660/articles/DV-1V0001-0713_1.jpg?v=1724384674",
      categoryIds: ["content_category_bathroom_sink_selection","content_category_installation_instruction"],
      tags: ["Vessel Sink","Installation Guide","Bathroom Sink"],
      authorDisplayName: "ZJocelyn",
      publishedAt: "2023-09-13T02:34:38.000Z",
      historicalSlugs: [],
      body: "<p>In this step-by-step article, we'll walk you through the installation of your vessel bathroom sink, ensuring it's done flawlessly.</p>\n<p><br>Step 1: Confirm the Size and Placement<br>To begin, carefully place the vessel sink on the installation countertop and ensure that it is the appropriate size for your space. It's crucial to have sufficient space left behind the sink to install the faucet later on. This step ensures a hassle-free installation process and avoids any potential issues in the future. </p>\n<p><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/01_480x480.png?v=1694571642\" alt=\"\"><br>Step 2: Mark the Drain Hole Location<br>Using a pencil, mark the exact location where the drain hole should be on the countertop. This step is vital for ensuring proper drainage and functionality of the sink. Take your time to double-check the measurements and ensure accuracy.</p>\n<p><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/02_480x480.png?v=1694571672\" alt=\"\"><br>Step 3: Cut Countertop for Drain Opening<br>With the drain hole location marked, it's time to cut the countertop to create the opening. The recommended size for the drain opening is between 1 3/4 inches to 2 inches. Use appropriate tools such as a jigsaw to carefully cut along the marked lines. Take caution to avoid any damage to the countertop material and maintain a clean and precise cut.</p>\n<p><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/03_480x480.png?v=1694571686\" alt=\"\"><br>Step 4: Apply Silicone for a Secure Fit<br>Turn the vessel sink upside down and apply silicone to the bottom edge. This step helps create a watertight seal and ensures a secure fit between the sink and the countertop. Be sure to evenly distribute the silicone along the entire perimeter of the sink's bottom edge. Carefully flip the sink over and gently place it into the prepared opening, pressing down firmly to ensure proper adhesion.</p>\n<div><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/04_480x480.png?v=1694571702\" alt=\"\"></div>\n<p>Remember, proper installation is essential for a long-lasting and hassle-free experience. So, take your time, follow the instructions, and enjoy your newly installed vessel bathroom sink!</p>"
    }),
    blog(siteId, updatedAt, {
      id: "blog_dv_pedestal_sink_installation",
      slug: "perfect-your-bathroom-with-a-pedestal-sink-installation-made-easy",
      title: "Perfect Your Bathroom with a Pedestal Sink: Installation Made Easy",
      summary: "In this article, we'll provide you with a step-by-step guide on how to install a pedestal bathroom sink to perfection, ensuring a secure and leak-free result. Step 1: Marking and Preparation Before diving into the installation process, start by placing the basin column in the desired location and marking the position of the basin's installation hole. This cr",
      image: "https://cdn.shopify.com/s/files/1/0526/3536/9660/articles/1.jpg?v=1724384675",
      categoryIds: ["content_category_bathroom_sink_selection","content_category_installation_instruction"],
      tags: ["Pedestal Sink","Installation Guide","Bathroom Sink"],
      authorDisplayName: "ZJocelyn",
      publishedAt: "2023-09-11T09:07:41.000Z",
      historicalSlugs: [],
      body: "<p>In this article, we'll provide you with a step-by-step guide on how to install a pedestal bathroom sink to perfection, ensuring a secure and leak-free result.</p>\n<p> </p>\n<p>Step 1: Marking and Preparation</p>\n<p>Before diving into the installation process, start by placing the basin column in the desired location and marking the position of the basin's installation hole. This crucial step ensures that your sink will be perfectly aligned.<br><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/1_2b37ae11-ce02-4db2-86f1-96e5d92ad2ad_480x480.png?v=1694421867\"></p>\n<p>Step 2: Drilling and Anchoring</p>\n<p>With the marked position in place, use a drill to create a hole on the wall. Then, secure an expansion bolt into the installation hole. Attach the end of the bolt to the corresponding expansion bolt on the basin. This secure anchoring will provide the necessary support for your sink.<br><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/2_632859c7-9355-43a4-ae83-eaea5aea38e2_480x480.png?v=1694421882\"></p>\n<p>Step 3: Faucet and Basin Attachment</p>\n<p>Once the anchor points are in place, proceed to install the faucet. Then, firmly attach the basin to the bolts that are already anchored on the wall. Ensuring a secure connection here is vital to prevent any potential leaks in the future.<br><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/3_3a59a51a-a280-440c-8171-6200a50ebe17_480x480.png?v=1694421892\"></p>\n<p>Step 4: Drain Fittings and Sealant Application</p>\n<p>Follow the provided instructions to install the drain fittings correctly. Make sure to connect the inlet and drain pipe fittings precisely. To prevent leaks, seal the bottom of the drainage with high-quality silicone. Pay special attention to the faucet, water inlet, and drain pipe fittings, as any instability could result in unwanted leakage. After installation, thoroughly check for any defects, especially water leakage.<br><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/4_7582e294-7c2a-47a2-aae1-5f89cb82982d_480x480.png?v=1694421937\"></p>\n<p>Step 5: Finalizing the Installation</p>\n<p>Once the basin is securely in place, position the column accordingly. Apply adhesive sealing materials like silicone to the contact surfaces between the basin and the wall, as well as between the column and the ground. Avoid using epoxy resin glue or other materials that expand after hardening.<br><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/5_b6fe8b24-b699-4002-8f14-940621464d53_480x480.png?v=1694421973\"></p>\n<p>By following these expert tips and carefully executing each step, you can achieve a leak-free pedestal bathroom sink installation that adds both style and functionality to your bathroom.</p>"
    }),
    blog(siteId, updatedAt, {
      id: "blog_dv_strainer_installation",
      slug: "strainer-installation-made-simple-easy-to-follow-guide",
      title: "Strainer Installation Made Simple | Easy-to-Follow Guide",
      summary: "Installing a strainer in your kitchen sink is an essential step to ensure optimal functionality and prevent potential clogs in the plumbing system. In this step-by-step guide, we will walk you through the process of installing a strainer in your sink. From disassembling the strainer to checking for leaks, follow these instructions to complete a successful in",
      image: "https://cdn.shopify.com/s/files/1/0526/3536/9660/articles/DV-1K513-0110_1.jpg?v=1724384676",
      categoryIds: ["content_category_commercial_projects","content_category_installation_instruction"],
      tags: ["Kitchen Sink","Sink Strainer","Installation Guide"],
      authorDisplayName: "ZJocelyn",
      publishedAt: "2023-09-08T06:31:46.000Z",
      historicalSlugs: [],
      body: "<p>Installing a strainer in your kitchen sink is an essential step to ensure optimal functionality and prevent potential clogs in the plumbing system. In this step-by-step guide, we will walk you through the process of installing a strainer in your sink. From disassembling the strainer to checking for leaks, follow these instructions to complete a successful installation.</p>\n<p>Step 1: Taking apart the sink strainer</p>\n<p>To begin the installation, carefully take apart the sink strainer. Place the upper strainer body and white gasket into the sink hole. Ensure they fit snugly to create a watertight seal.</p>\n<p><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/1_1f7ba58d-1d11-4fc7-9315-9398833c17c6_480x480.png?v=1694152663\" alt=\"\"></p>\n<p>Step 2: Connect the lower strainer</p>\n<p>Next, connect the lower strainer and black gasket together. These parts will be installed underneath the sink. Make sure they align properly and create a secure connection with the upper strainer body.<br><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/2_913ce204-af1b-4c1d-85e6-d3634cadf5b4_480x480.png?v=1694152679\" alt=\"\"></p>\n<p>Step 3: Fixing the parts</p>\n<p>To ensure the strainer remains securely in place, use screws to fix the upper and lower parts together. Tighten the screws evenly to maintain a stable installation. This step is crucial for preventing any future issues or unwanted movement.<br><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/3_cd9e60b4-ce60-4d40-852e-0abd233ff25d_480x480.png?v=1694152690\" alt=\"\"></p>\n<p>Step 4: Connect the drain tail piece</p>\n<p>Now that the strainer is properly fixed, it's time to connect the drain tail piece. This component connects the strainer to the plumbing system, allowing water to flow smoothly from the sink. Ensure a proper seal by tightening the connection securely.<br><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/4_121a66fe-7401-4c13-877b-7b7ee542b943_480x480.png?v=1694152700\" alt=\"\"></p>\n<p>Step 5: Checking for leaks</p>\n<p>Before completing the installation, it's important to check for any leaks. Run water and carefully observe the area around the strainer and drain tail piece. Look for any signs of water leakage and address them promptly if found. A leak-free installation is vital to avoid potential water damage.<br><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/5_f521c243-4d2a-44dc-9ff5-f07790958964_480x480.png?v=1694152713\" alt=\"\"></p>\n<p>Step 6: Insert the basket</p>\n<p>To effectively filter out food particles and prevent clogging, insert the basket into the strainer. This will capture any debris and make it easier to clean. Regularly clean the basket to maintain optimal functionality.<br><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/6_21b5e8d2-a01e-402f-807e-b86489a1d6a0_480x480.png?v=1694152724\" alt=\"\"></p>\n<p>By following this step-by-step guide, you can successfully install a strainer for your undermount kitchen sink. Remember to pay attention to details, such as tightening screws and checking for leaks. The strainer will help enhance the functionality of your sink and keep your plumbing system in excellent condition. Enjoy a clog-free kitchen experience!</p>"
    }),
    blog(siteId, updatedAt, {
      id: "blog_dv_undermount_kitchen_kit",
      slug: "essential-tips-for-undermount-kitchen-sink-kit-installation",
      title: "Essential Tips for Undermount Kitchen Sink Kit Installation",
      summary: "If you're looking to install an undermount kitchen sink kit, follow these step-by-step instructions to ensure a successful installation. Measure the hole for the sink: Before you begin the installation process, you need to measure the hole where the sink will be placed. To do this, turn the sink upside down and trace the outline directly on the countertop wi",
      image: "https://cdn.shopify.com/s/files/1/0526/3536/9660/articles/DV-1K515-1028_2.jpg?v=1724384677",
      categoryIds: ["content_category_commercial_projects","content_category_installation_instruction"],
      tags: ["Kitchen Sink","Undermount Sink","Installation Guide"],
      authorDisplayName: "ZJocelyn",
      publishedAt: "2023-09-07T03:04:06.000Z",
      historicalSlugs: [],
      body: "<p>If you're looking to install an undermount kitchen sink kit, follow these step-by-step instructions to ensure a successful installation.</p>\n<p><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/DV-1K515-0424_1_5d200045-61f1-43f4-83d0-ad614c0a754e_480x480.jpg?v=1694055479\" alt=\"\"></p>\n<ol>\n<li>Measure the hole for the sink: Before you begin the installation process, you need to measure the hole where the sink will be placed. To do this, turn the sink upside down and trace the outline directly on the countertop with a pencil. It's important to note that the outline should be slightly larger than the sink's opening. However, to ensure a secure fit, make a second outline about 1/2 inch smaller than the original for the hole.</li>\n</ol>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/DV-1K513-0110_7_480x480.jpg?v=1694055785\"></p>\n<ol start=\"2\">\n<li>Fasten the mounting brackets: Once you have measured the hole, it's time to fasten the mounting brackets into the pre-drilled mounting holes in the countertop. Make sure to do this loosely, as you will need to adjust the sink later on.</li>\n</ol>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/2_03f27731-e8b5-4bf7-8cd1-005cbf13a2c5_480x480.png?v=1694054633\"></p>\n<ol start=\"3\">\n<li>Apply silicone caulk (not included): To prevent any leakage, apply silicone caulk (not included) evenly all around the top of the sink flanges. This will create a water-tight seal. After applying the caulk, position and align the sink under the countertop opening. Press the silicone and flange up onto the countertop to secure the sink in place.</li>\n</ol>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/3_14597167-2767-4efc-995c-2096e1f0b1ec_480x480.png?v=1694054652\"></p>\n<ol start=\"4\">\n<li>\n<span></span>Tighten the fasteners: From the underside of the countertop, lightly tighten the fasteners with a screwdriver until the sink is snug against the countertop. It's important to check the alignment of the sink to the countertop opening before fully tightening the fasteners. Once you are satisfied with the alignment, tighten the fasteners until the sink is securely tight against the countertop. Be careful not to over tighten. Lastly, wipe away any excess caulk with a rag.</li>\n</ol>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/4_3976de97-97eb-41a4-82b2-ea2e12f310c8_480x480.png?v=1694054668\"></p>\n<p>By following these installation instructions, you can successfully install an undermount kitchen sink kit. Remember to measure carefully, use the correct silicone caulk, and ensure proper alignment for a professional and secure installation.</p>"
    }),
    blog(siteId, updatedAt, {
      id: "blog_dv_ceramic_kitchen_sink_care",
      slug: "keep-your-ceramic-kitchen-sink-clean-and-well-maintained",
      title: "Keep Your Ceramic Kitchen Sink Clean and Well-Maintained",
      summary: "In this article, we will share some important tips for keeping your ceramic kitchen sink clean and well-maintained. Gentle Cleaning Products: When cleaning your ceramic kitchen sink, it is crucial to use mild, non-abrasive cleaning products. Avoid harsh chemicals, bleach, or scouring pads as they can cause damage to the ceramic surface. Stick to gentle dish ",
      image: "https://cdn.shopify.com/s/files/1/0526/3536/9660/articles/DV-1K016-0629_-_9.jpg?v=1724384673",
      categoryIds: ["content_category_slab_handling","content_category_commercial_projects"],
      tags: ["Kitchen Sink","Ceramic Care","Cleaning Guide"],
      authorDisplayName: "ZJocelyn",
      publishedAt: "2023-09-14T06:07:25.000Z",
      historicalSlugs: [],
      body: "<p>In this article, we will share some important tips for keeping your ceramic kitchen sink clean and well-maintained.</p>\n<ul>\n<li>\n<p>Gentle Cleaning Products: When cleaning your ceramic kitchen sink, it is crucial to use mild, non-abrasive cleaning products. Avoid harsh chemicals, bleach, or scouring pads as they can cause damage to the ceramic surface. Stick to gentle dish soap or specialized ceramic-safe cleaners for the best results.</p>\n</li>\n</ul>\n<p><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/4B17EDBD-F031-48f0-92B0-2494AE72DF72_480x480.png?v=1694670240\" alt=\"\"></p>\n<ul>\n<li>\n<p>Avoid Staining Agents: Ceramic sinks are prone to staining, so it is essential to prevent contact with staining agents as much as possible. Avoid leaving coffee grounds, tea bags, or food dyes in the sink for extended periods. Wipe away any spills or residues immediately to minimize the risk of permanent stains.</p>\n</li>\n</ul>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/DEC4F1C3-30CC-4950-88F8-F90814E09C57_480x480.png?v=1694672287\"></p>\n<ul>\n<li>\n<p>Regular Rinse and Dry: After each use, remember to rinse your ceramic sink thoroughly with warm water to remove any leftover food debris or cleaning agents. Wipe it dry with a clean, soft cloth to prevent water spots and mineral deposits from forming.</p>\n</li>\n</ul>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/3487D97A-3FFE-4ddb-8085-34EE99F211B2_480x480.png?v=1694672455\"></p>\n<ul>\n<li>\n<p>Use Cutting Boards and Mats: To protect the surface of your ceramic sink from scratches or chips, always use cutting boards or mats when working with sharp objects or heavy cookware. This simple precaution can greatly extend the lifespan of your sink and preserve its flawless appearance.</p>\n</li>\n</ul>\n<p><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/DV-1K0068-0810_4_c80be5ec-c4d2-4117-ac2e-1cafa28158e4_480x480.jpg?v=1694670810\" alt=\"\"></p>\n<ul>\n<li>\n<p>Avoid Extreme Temperatures: Ceramic sinks are sensitive to extreme temperatures. Do not pour boiling water directly into the sink or place hot pans or dishes directly onto the surface. Use trivets or heat-resistant mats to protect your sink from thermal shock, which can cause cracks or damage.</p>\n</li>\n</ul>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/9FB4B931-234F-44bc-9155-8C098866BBFF_480x480.png?v=1694672577\"></p>\n<ul>\n<li>\n<p>Regular Inspections: Keep an eye out for any signs of damage or potential issues. Check the sink's sealing and caulking regularly to ensure there are no leaks or water damage. If you notice any cracks, chips, or loose seals, address them promptly to prevent further damage.</p>\n</li>\n</ul>\n<p><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/DV-1K080-0714-_3_480x480.jpg?v=1694671200\" alt=\"\"></p>\n<p>I hope these tips can help you clean and maintain your kitchen sink more effectively.</p>"
    }),
    blog(siteId, updatedAt, {
      id: "blog_dv_certified_toilets",
      slug: "enhance-your-bathroom-experience-with-certified-toilets",
      title: "Enhance Your Bathroom Experience with Certified Toilets",
      summary: "When it comes to the safety, hygiene, quality, and performance of your bathroom, choosing a certified toilet is the key. With a range of certifications available, it's important to understand their features and advantages. Certification plays an essential role in guaranteeing the safety and performance of your toilet. Let's take a closer look at the certific",
      image: "https://cdn.shopify.com/s/files/1/0526/3536/9660/articles/DV-2F52531-0624_-_1.jpg?v=1724384671",
      categoryIds: ["content_category_toilet"],
      tags: ["Toilet","Bathroom Planning","Buying Guide"],
      authorDisplayName: "ZJocelyn",
      publishedAt: "2023-09-22T08:44:54.000Z",
      historicalSlugs: [],
      body: "When it comes to the safety, hygiene, quality, and performance of your bathroom, choosing a certified toilet is the key. With a range of certifications available, it's important to understand their features and advantages. Certification plays an essential role in guaranteeing the safety and performance of your toilet. Let's take a closer look at the certifications available in the United States and the benefits they offer.\n<div><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/DV-2F52531-0207_1_480x480.jpg?v=1695371678\" alt=\"\"></div>\n1. US CUPC Certified Toilets: The Symbol of Excellence<br>US CUPC certification stands for safety, hygiene, quality, and performance. These toilets undergo rigorous testing to meet the highest industry standards. When you choose a US CUPC certified toilet, you can have peace of mind knowing that you and your family are using a thoroughly tested and certified product.\n<div><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/CUPC_d7c976bf-a71a-4afb-8e0a-d89724265123_480x480.png?v=1695372027\" alt=\"\" width=\"186\" height=\"154\"></div>\n2. US EPA Certified Toilets: A Powerful Flush with Responsible Water Usage<br>US EPA certified toilets excel in both performance and environmental responsibility. By prioritizing water conservation, they not only provide exceptional flushing power but also contribute to a greener future. Enjoy a powerful flush while reducing your water usage with these environmentally conscious toilets.\n<div><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/EPA_480x480.png?v=1695372053\" alt=\"\" width=\"160\" height=\"157\"></div>\n3. US DOE Certified Toilets: Energy Efficiency Meets Exceptional User Experience<br>US DOE certified toilets combine high-energy efficiency performance with an exceptional user experience. With innovative features, these toilets optimize water usage without compromising on flushing power. Experience a comfortable and efficient bathroom while reducing energy consumption.\n<div><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/DOE2_480x480.png?v=1695372126\" alt=\"\" width=\"174\" height=\"151\"></div>\n4. US CEC Certified Toilets: Eco-friendly Luxury for a Sustainable Lifestyle<br>US CEC certified toilets seamlessly blend environmental consciousness with advanced technology. These toilets offer a reliable and energy-saving solution, ensuring a luxurious and eco-friendly bathroom experience. Contribute to a sustainable lifestyle by choosing these high-quality, eco-friendly toilets.\n<div><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/CEC_74fd2848-f9e7-4b4d-b907-e6204585e25d_480x480.png?v=1695372150\" alt=\"\" width=\"150\" height=\"150\"></div>\n5. US MASS Certified Toilets: Reliable and Compliant Choice <br>To ensure compliance with plumbing industry standards, US MASS certified toilets undergo rigorous audits and tests in design, manufacturing, and performance. These reliable toilets meet the highest quality standards and are a long-lasting investment for your bathroom.\n<div><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/AE7013CE-5FA9-4bfc-B199-C6359ABAEB5D-XexB3gMkY-transformed_480x480.png?v=1695372210\" alt=\"\" width=\"149\" height=\"149\"></div>\nInvesting in a certified toilet is a smart way to enhance your bathroom experience. Whether you prioritize safety, environmental responsibility, energy efficiency, or compliance with industry standards, there is a certification that caters to your needs. Upgrade your bathroom with a certified toilet and enjoy the benefits it brings to your family and the environment."
    }),
    blog(siteId, updatedAt, {
      id: "blog_dv_toilet_stain_removal",
      slug: "10-expert-tips-for-removing-toilet-stains-and-keeping-your-bathroom-clean",
      title: "10 Expert Tips for Removing Toilet Stains and Keeping Your Bathroom Clean",
      summary: "Toilets can easily accumulate dirt, odors, and discoloration with regular use, making frequent cleaning and maintenance essential. In this article, I will share some professional techniques to help you achieve efficient and thorough toilet cleaning, ensuring a hygienic and tidy bathroom. 1. Regular Toilet Tank Cleaning Method: Over time, your toilet tank can",
      image: "https://cdn.shopify.com/s/files/1/0526/3536/9660/articles/DV-1F52627-0104_1.jpg?v=1724384678",
      categoryIds: ["content_category_slab_handling","content_category_toilet"],
      tags: ["Toilet Care","Cleaning Guide","Bathroom Care"],
      authorDisplayName: "ZJocelyn",
      publishedAt: "2023-09-04T07:38:58.000Z",
      historicalSlugs: [],
      body: "Toilets can easily accumulate dirt, odors, and discoloration with regular use, making frequent cleaning and maintenance essential. In this article, I will share some professional techniques to help you achieve efficient and thorough toilet cleaning, ensuring a hygienic and tidy bathroom.\n<div><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/1_30ab160e-767a-4393-952c-3ea1c654dc93_480x480.png?v=1693812592\"></div>\n1. Regular Toilet Tank Cleaning Method:<br>Over time, your toilet tank can accumulate a significant amount of grime. To address this issue, use a toilet bowl cleaner to clean the tank. Afterward, wipe the tank with a cloth and add hot water to effectively prevent the buildup of toilet stains.\n<div><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/2_a00a05a5-6cde-4c2e-bbe8-75e0b40f152d_480x480.png?v=1693812645\"></div>\n2. Sandpaper Stain Removal:<br>For stubborn stains that regular cleaning agents can't tackle, use the finest-grit sandpaper to gently scrub the toilet bowl. This method can effectively remove persistent stains.\n<div><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/3_3f39179e-3dad-4434-9b87-8273eb365fd2_480x480.png?v=1693812660\"></div>\n3. Repurpose Soap Removal:<br>Collect leftover soap from around your home and place them inside an old stocking. Use this \"soap sock\" to scrub the toilet bowl walls, effectively eliminating stubborn stains.\n<div><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/4_460e23cc-e4b3-4d61-891a-3017f29ec2db_480x480.png?v=1693812672\"></div>\n4. Baking Soda for Stain Removal:<br>Sprinkle baking soda inside the toilet bowl and let it sit for half an hour. Then, scrub away the stains with a toilet brush. The grime should come off easily.\n<div><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/5_5f113d5d-18b2-493a-aa7d-c37660c06b3c_480x480.png?v=1693812685\"></div>\n5. Bleach Solution for Stain Removal:<br>Start by wiping the toilet bowl with a bleach solution. Allow it to sit for some time before rinsing with water to remove stains and disinfect the bowl.\n<div><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/6_68f56d97-7861-41d6-a57a-d8b23e7f649d_480x480.png?v=1693812721\"></div>\n6. Vinegar Stain Removal:<br>Mix vinegar and water in a bowl and pour it into the toilet bowl. Let it soak for several hours or overnight. The accumulated grime should come off easily when scrubbed.\n<div><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/7_7351c0e1-5934-4879-a4d8-a75bc99916fa_480x480.png?v=1693812734\"></div>\n7. Cleaning Agent Removal:<br>Add some water to the toilet bowl and use a toilet brush to scrub the bowl. Then, pour 5-10 milliliters of a cleaning agent into the bowl, distributing it evenly with the brush before scrubbing again.\n<div><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/8_bb05d8b8-b44a-4e4e-bf47-752d614f661f_480x480.png?v=1693812747\"></div>\n8. Cola Stain Removal:<br>Pour leftover cola into the toilet bowl and allow it to sit for a while. The acid in the cola can help break down stains. Use a toilet brush to scrub away any remaining residue.\n<div><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/9_44d189e9-f3a4-4e35-b951-bbd1bf6c27aa_480x480.png?v=1693812760\"></div>\n<p>Conclusion:<br>Maintaining a clean and stain-free toilet is crucial for a hygienic bathroom. Regular cleaning and the use of these methods will help ensure your toilet remains clean and odor-free.</p>\n<p> </p>\n<p><span>Products Recommended：</span></p>\n<p><a href=\"https://www.deervalleybath.com/collections/toilets/products/deervalley-dv-1f52636-dual-flush-elongated-ceramic-sleek-skirted-design-one-piece-toilet-seat-included\"><span>DV-1F52636 Prism Elongated One-Piece Toilet with Multi Colors, Dual-Flush Glazed Surface</span></a></p>\n<p><a href=\"https://www.deervalleybath.com/collections/toilets/products/deervalley-dv-1f52102-1-6-gpf-dual-flush-elongated-one-piece-toilet-seat-included\"><span>DV-1F52102 Ace Elongated One-Piece Toilet ,1.6 GPF Dual-Flush</span></a></p>\n<p><a href=\"https://www.deervalleybath.com/collections/toilets/products/deervalley-dv-1f0027-ace-1-6-gpf-dual-flush-elongated-one-piece-toilet-seat-included\"><span>DV-1F0027 Ace Elongated One-Piece Toilet, 1.6 GPF Dual-Flush</span></a></p>"
    }),
    blog(siteId, updatedAt, {
      id: "blog_dv_two_piece_toilet_installation",
      slug: "the-ultimate-guide-to-installing-a-two-piece-toilet-step-by-step-instructions",
      title: "The Ultimate Guide to Installing a Two-Piece Toilet: Step-by-Step Instructions",
      summary: "This installation guide provides detailed step-by-step instructions to ensure a smooth and successful toilet installation process. Step 1: Ensuring Proper Measurements Before jumping into the installation process, it's crucial to ensure that the shut-off valve is positioned at least 7 1/2\" away from the center of the drain. This will allow for easy access an",
      image: "https://cdn.shopify.com/s/files/1/0526/3536/9660/articles/DV-1F0072-0711_1.jpg?v=1724384679",
      categoryIds: ["content_category_installation_instruction","content_category_toilet"],
      tags: ["Two-Piece Toilet","Installation Guide","Bathroom Planning"],
      authorDisplayName: "ZJocelyn",
      publishedAt: "2023-08-31T09:36:56.000Z",
      historicalSlugs: [],
      body: "<p>This installation guide provides detailed step-by-step instructions to ensure a smooth and successful toilet installation process.<br><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/1_04e44020-9762-4fb8-bdd0-e4fd64abb3b1_480x480.png?v=1693473643\"></p>\n<p>Step 1: Ensuring Proper Measurements</p>\n<p>Before jumping into the installation process, it's crucial to ensure that the shut-off valve is positioned at least 7 1/2\" away from the center of the drain. This will allow for easy access and prevent any obstacles during the installation.<br><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/2_8f0e8105-1ec6-442e-aa14-7adb70db857b_480x480.png?v=1693473667\"></p>\n<p>Step 2: Installing Closet Bolts</p>\n<p>Start by installing the closet bolts to the flange channel. To do this, turn the bolts 90º and slide them into place, ensuring they are 6\" apart and parallel to the wall. These bolts will provide the necessary stability for the toilet.</p>\n<p><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/3_9b12c67a-5832-457c-ae91-7098aecaf30a_480x480.png?v=1693473700\" alt=\"\"></p>\n<p>Step 3: Applying the Wax Ring</p>\n<p>Place the toilet on the floor (using a cushion to prevent damage) and install the wax ring evenly around the waste flange. Make sure the tapered end of the ring is facing the toilet. This wax ring creates a watertight seal between the toilet and the drainage system.</p>\n<p><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/4_04d370d4-1434-44ae-8ed0-c137eff034b3_480x480.png?v=1693474535\" alt=\"\"></p>\n<p>Step 4: Positioning the Toilet on the Flange</p>\n<p>Lower the toilet onto the closet bolts so that the bolts project through the mounting holes in the base of the toilet. Gently rock the toilet to press the bowl downward onto the wax ring and flange. Proceed to install the washer and nut in sequence. Alternately tighten the nut until the toilet is firmly sealed to the floor. Finally, install the cap for a clean and finished look.<br><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/5_bba7eb22-2fa3-4141-8179-e5500682435b_480x480.png?v=1693473740\"></p>\n<p>Step 5: Installing the Toilet Tank</p>\n<p>Place the tank gasket over the tank nut, ensuring there are no gaps between the tank and the gasket. Insert the two tank bolts into the tank mounting holes, then guide the bolts to align the tank with the bowl. Tighten the nuts alternately to stabilize them on the toilet bowl.<br><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/6_0ecd3ec3-da21-4895-a838-b14d8fac2810_480x480.png?v=1693473777\"></p>\n<p>Step 6: Fitting the Toilet Seat</p>\n<ul>\n<li>\n<p><span></span>Open the hinge cover</p>\n</li>\n</ul>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/7_480x480.png?v=1693473804\"></p>\n<ul>\n<li>\n<p><span></span>Insert plastic screws into the holes of the hinges</p>\n</li>\n</ul>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/8_480x480.png?v=1693473820\"></p>\n<ul>\n<li>\n<p><span></span>Place the seat on bowl, adjust it in perfect position</p>\n</li>\n</ul>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/9_480x480.png?v=1693473846\"></p>\n<ul>\n<li>\n<p><span></span>Turn (B) onto (A) all the way up, finish finger-tightening from top</p>\n</li>\n</ul>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/10_480x480.png?v=1693473864\"></p>\n<ul>\n<li>\n<p><span></span>Tighten the nut (A)</p>\n</li>\n</ul>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/11_480x480.png?v=1693473906\"></p>\n<ul>\n<li>\n<p><span></span>Close the hinge cover</p>\n</li>\n</ul>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/12_0110a3ad-6409-4115-a71b-1b2c63dfc5f6_480x480.png?v=1693473943\"></p>\n<p>Step 7: Installing the Flush Button</p>\n<p>Remove the plastic nut from the lever arm by turning it clockwise. Insert the lever arm through the square hole on the front side of the tank, and then tighten the plastic nut counterclockwise to secure it. Attach the chain from the flapper to the trip lever arm, ensuring there's enough chain length to fully raise the flapper. Cut any excess chain length and insert the refill tube into the overflow tube, securing it with the provided clip. Remember to connect the flexible water supply line to the shut-off valve and perform a flush test to check for any leaks.<br><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/13_480x480.png?v=1693473981\"></p>\n<p>Conclusion:</p>\n<p>According to our step-by-step instructions, you will successfully install a two-piece toilet. If you have any questions or need further guidance, please contact us.</p>\n<p> </p>\nProducts Recommended: <br><a href=\"https://www.deervalleybath.com/collections/two-piece-toilets/products/deervalley-dv-2f0079-1-6-gpf-round-floor-mounted-two-piece-toilet-seat-included\">DeerValley DV-2F0079 Dynasty Round Floor Mounted Two-Piece Toilet</a><br><a href=\"https://www.deervalleybath.com/collections/two-piece-toilets/products/deervalley-dv-2f0078-1-6-gpf-elongated-floor-mounted-two-piece-toilet-seat-included-1\">DeerValley DV-2F0078 Dynasty Dual-Flush Elongated Floor Mounted Two-Piece Toilet</a><br><a href=\"https://www.deervalleybath.com/collections/two-piece-toilets/products/deervalley-dv-2f0077-1-6-gpf-round-floor-mounted-two-piece-toilet-seat-included\">DeerValley DV-2F0077 Dynasty Round Floor Mounted Two-Piece Toilet</a><br><a href=\"https://www.deervalleybath.com/collections/two-piece-toilets/products/deervalley-dv-2f0076-1-6-gpf-elongated-floor-mounted-two-piece-toilet-seat-included\">DeerValley DV-2F0076 Dynasty Dual-Flush Elongated Floor Mounted Two-Piece Toilet</a><br><a href=\"https://www.deervalleybath.com/collections/two-piece-toilets/products/deervalley-dv-2f52531-1-28-gpf-water-efficient-elongated-two-piece-toilet-seat-included\">DeerValley DV-2F52531 Dynasty 1.28 GPF (Water Efficient) Elongated Two-Piece Toilet</a>"
    }),
    blog(siteId, updatedAt, {
      id: "blog_dv_unclog_toilet",
      slug: "8-effective-methods-to-unclog-your-toilet",
      title: "8 Effective Methods to Unclog Your Toilet",
      summary: "In this tutorial, we will share with you 9 simple and effective methods to unclog your toilet. Tape Method: Using a roll of wide yellow duct tape, tightly seal it around the rim of the toilet. Press the tape down firmly and then flush the toilet. The pressure from the water will cause the tape to expand, and by pressing down on it, you can quickly eliminate ",
      image: "https://cdn.shopify.com/s/files/1/0526/3536/9660/articles/DV-1F0070-0817_1.jpg?v=1724384680",
      categoryIds: ["content_category_slab_handling","content_category_toilet"],
      tags: ["Toilet Care","Bathroom Care","Maintenance Guide"],
      authorDisplayName: "ZJocelyn",
      publishedAt: "2023-08-25T09:20:32.000Z",
      historicalSlugs: [],
      body: "<p>In this tutorial, we will share with you 9 simple and effective methods to unclog your toilet.</p>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/DV-1F0075-0705_1_c4884e8a-eabf-4056-a0c3-083374707bc3_480x480.jpg?v=1692954697\"></p>\n<h2>Tape Method:</h2>\n<ol></ol>\n<p>Using a roll of wide yellow duct tape, tightly seal it around the rim of the toilet. Press the tape down firmly and then flush the toilet. The pressure from the water will cause the tape to expand, and by pressing down on it, you can quickly eliminate the clog. Ensure there are no gaps in the tape to prevent any air circulation.</p>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/2015051410152219322_480x480.jpg?v=1692954750\"></p>\n<h2>Water Hose Method:</h2>\n<ol start=\"2\"></ol>\n<p>Connect a long pipe to your water tap, and insert the hose into the blocked drain. Open the valve to the maximum, and let the water pressure do the work for you. Be mindful not to use a hose that is too thick as it may affect the water pressure.</p>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/1_568c57f6-5d89-44ae-9ce1-7b6965d10595_480x480.png?v=1692954942\"></p>\n<h2>Hot Water + Dish Soap Method:</h2>\n<ol start=\"3\"></ol>\n<p>Pour boiling hot water mixed with dish soap into the clogged toilet. Then, vigorously plunge the water using a plunger until the blockage is cleared. It is crucial to use scalding hot water for this method.</p>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/2_480x480.png?v=1692954930\"></p>\n<h2>Baking Soda + Vinegar Method:</h2>\n<ol start=\"4\"></ol>\n<p>Pour a generous amount of baking soda into the toilet, followed by an equal amount of vinegar (1:1 ratio). After a chemical reaction takes place, wait for approximately 15 minutes, and the clog should clear rapidly. Finally, pour some hot water and cover the toilet with the lid.</p>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/3_480x480.png?v=1692954917\"></p>\n<h2>Large Soda Bottle Method:</h2>\n<ol start=\"5\"></ol>\n<p>In the absence of a plunger, you can use a large soda bottle. Cut open the bottom of the bottle and apply pressure onto the pipe opening, similar to using a plunger. Repeat this action multiple times until the blockage is cleared. Remember to tightly seal the bottle's mouth.</p>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/4_480x480.png?v=1692954905\"></p>\n<h2>Drain Snake Method:</h2>\n<ol start=\"6\"></ol>\n<p>Using a drain snake, insert it into the toilet and push it through the drain. Move it back and forth to dislodge and break down the clog until the toilet is unclogged.</p>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/9FC68301-156B-42af-8E58-1F36F2FD0731_480x480.png?v=1692955031\"></p>\n<h2>Wet/Dry Vacuum Method:</h2>\n<ol start=\"7\"></ol>\n<p>If you have a wet/dry vacuum cleaner at home, empty the toilet of all water using the vacuum. Then, insert the flexible hose into the drain and seal any gaps with a cloth. Turn on the vacuum to create suction, and the blockage will be pulled out. Remember to use only wet/dry vacuum cleaners with a water suction function.</p>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/5_480x480.png?v=1692954879\"></p>\n<h2>Repeat Flushing Method:</h2>\n<ol start=\"8\"></ol>\n<p>For minor clogs such as toilet paper or cloth accumulation, the simplest solution is to repeatedly flush the toilet until it clears. Be sure to continue this process until the toilet flushes smoothly again.</p>\n<p><img alt=\"\" src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/6_480x480.png?v=1692954855\"></p>\n<p>Conclusion:</p>\n<p>With these nine methods at your disposal, you can now confidently tackle any toilet clog that comes your way. Whether using common household items or specialized tools, these techniques will come in handy when faced with a troublesome toilet. Remember to take proper precautions, follow the instructions carefully, and soon you'll have a clear and functioning toilet once again!</p>\n<p> <img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/DV-1F52812-0602_12_480x480.jpg?v=1692954841\" alt=\"\"></p>\n<p> </p>\n<p> </p>\n<p>Products Recommended:</p>\n<p><a href=\"https://www.deervalleybath.com/collections/toilets/products/deervalley-dv-2f0077-1-6-gpf-round-floor-mounted-two-piece-toilet-seat-included\">DeerValley DV-2F0077 Dynasty Round Floor Mounted Two-Piece Toilet</a></p>\n<p><a href=\"https://www.deervalleybath.com/collections/toilets/products/deervalley-dv-1f0070-liberty-1-6-gpf-elongated-wall-hung-toilets-seat-included\">DeerValley DV-1F0070 Liberty 1.6 GPF Elongated Wall Hung Toilets</a></p>\n<p><a href=\"https://www.deervalleybath.com/collections/toilets/products/deervalley-dv-1f52508-one-piece-toilet-1-1-1-6-gpf-elongated-standard-toilet-with-comfortable-seat-height-seat-included\">DeerValley DV-1F52508 Symmetry One Piece Toilet 1.1/1.6 GPF Elongated Standard Toilet with Comfortable Seat Height</a></p>\n<p><a href=\"https://www.deervalleybath.com/collections/toilets/products/deervalley-dv-1f52102-1-6-gpf-dual-flush-elongated-one-piece-toilet-seat-included\">DeerValley DV-1F52102 Ace 1.6 GPF Dual-Flush Elongated One-Piece Toilet</a></p>"
    }),
    blog(siteId, updatedAt, {
      id: "blog_dv_one_piece_toilet_installation",
      slug: "a-complete-guide-to-installing-a-one-piece-toilet",
      title: "A Complete Guide to Installing a One-Piece Toilet (Type A)",
      summary: "Have you been contemplating upgrading your bathroom with a sleek and modern one-piece toilet? If so, fear not! Today, we'll guide you through the step-by-step process of installing a one-piece toilet, making it a hassle-free experience. So let's dive in and get started! Confirming the Measurements: Before making any purchase, ensure accurate measurements of ",
      image: "https://cdn.shopify.com/s/files/1/0526/3536/9660/articles/DV-1F52677_DV-1T151-0530.jpg?v=1724384681",
      categoryIds: ["content_category_installation_instruction","content_category_toilet"],
      tags: ["One-Piece Toilet","Installation Guide","Bathroom Planning"],
      authorDisplayName: "ZJocelyn",
      publishedAt: "2023-08-21T06:42:23.000Z",
      historicalSlugs: [],
      body: "Have you been contemplating upgrading your bathroom with a sleek and modern one-piece toilet? If so, fear not! Today, we'll guide you through the step-by-step process of installing a one-piece toilet, making it a hassle-free experience. So let's dive in and get started! <br>  <br>Confirming the Measurements: <br>Before making any purchase, ensure accurate measurements of your bathroom space. Check the following dimensions:\n<ul>\n<li>Rough-in distance (the distance from the toilet flange to the wall)</li>\n<li>Centerline distance between the toilet flange and the floor's water outlet</li>\n<li>Height of the toilet flange from the floor</li>\n</ul>\n<p> </p>\nCounting the Parts: <br>Once you've bought your dream one-piece toilet, ensure that all the necessary accessories are present. Check for items such as floor bolts, wax ring, L-bar, and an installation manual. Having a complete set is essential for a seamless installation. <br>  <br>1.Install the Floor Bolts and L-Bar: <br>Start by attaching the floor screws to the toilet flange, adjusting them to the correct position. Remember, it's important to align the two screws and the center of the flange in a straight line. Next, follow these steps:\n<ul>\n<li>Place the L-Bar, washer, and nut in sequence.</li>\n<li>Extend the L-Bar to its maximum length, and then tighten the nut.</li>\n</ul>\n<p>Making sure the L-Bar remains straight is crucial. <br> <img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/42865E03-1F22-45a8-B098-9DDF4B043F80_480x480.png?v=1692597765\" alt=\"\"> <br>2.Install the Wax Ring: <br>Now it's time to install the wax ring. Adjust the L-Bar if necessary, ensuring that it remains straight. Once everything is aligned, follow the manufacturer's instructions to attach the L-Bar securely.</p>\n<p><br><img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/0550F3A9-FAF4-4ebe-A0C6-B79022B75CA4_480x480.png?v=1692597827\" alt=\"\"> <br>3.Position the Toilet on the Flange: <br>With the wax ring in place, carefully position the toilet onto the flange. Gently rock the toilet back and forth to press the bowl tightly onto the wax ring and flange. Then, follow these steps:</p>\n<ul>\n<li>Attach the screws to the plastic sleeve.</li>\n<li>Install the screws into the two small holes on the side of the toilet.</li>\n<li>Fasten the screws using a cross screwdriver and then install the cap.</li>\n</ul>\n <img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/B4D900E8-D34C-4657-83C0-9DD147A38FDF_480x480.png?v=1692597891\" alt=\"\"> <br>4.Complete the Installation: <br>Finally, connect the flexible water supply line (not included) to the shut-off valve. Once connected, perform a flush test to ensure there are no leaks. Congratulations! You have successfully installed your one-piece toilet. <br> <img src=\"https://cdn.shopify.com/s/files/1/0526/3536/9660/files/C1B79151-2A24-4955-B556-A322A771383B_480x480.png?v=1692597952\" alt=\"\"> <br>By following this step-by-step guide, you can effortlessly transform your bathroom with a stylish, functional, and efficient one-piece toilet. Enjoy the convenience and comfort of your new upgrade, and don't forget to share your experience with us!Remember, if you ever need assistance or have questions, consult a professional plumber for expert advice. Happy toilet installation!\n<p> </p>\n<p> </p>\nRelated Products: <br><a href=\"https://www.deervalleybath.com/products/deervalley-dv-1f52626-comfort-height-1-28-gpf-water-efficient-elongated-one-piece-toilet-seat-included\" target=\"_blank\"><u><span>DeerValley DV-1F52626 Concord Comfortable Seat Height 1.28 GPF Water Efficient Elongated One-Piece Toilet (Seat Included)</span></u></a> <br><a href=\"https://www.deervalleybath.com/products/yodar-dual-flush-elongated-one-piece-toilet-seat-included\" target=\"_blank\"><u><span>DeerValley DV-1F52813 Liberty Dual-Flush Elongated One-Piece Toilet (Seat Included)</span></u></a>"
    }),
    // This local-only fixture preserves Roca's public listing metadata and images for faithful News replica review.
    news(siteId, updatedAt, {
      id: 'news_roca_almaty_showroom_reference',
      slug: 'roca-strengthens-presence-central-asia-new-showroom-almaty',
      title: 'Roca Strengthens Its Presence in Central Asia with a New Showroom in Almaty',
      summary: 'Roca has opened a new showroom in Almaty, Kazakhstan, expanding its presence in Central Asia.',
      image: '/images/news-reference/roca-almaty-showroom.jpg',
      categoryIds: ['content_category_roca_reference'],
      publishedAt: '2026-06-25T00:00:00.000Z',
      historicalSlugs: [],
      body: '<p>Roca has opened a new showroom in Almaty, Kazakhstan, to expand its presence in Central Asia.</p>'
    }),
    news(siteId, updatedAt, {
      id: 'news_roca_group_financial_results_reference',
      slug: 'roca-group-ends-2025-with-revenue-of-196-billion-euros-and-a-profit-of-43-million-euros',
      title: 'Roca Group ends 2025 with revenue of 1.96 billion euros and a profit of 43 million euros',
      summary: 'Roca Group reports its 2025 financial results alongside investments in sustainability, technology, and growth.',
      image: '/images/news-reference/roca-group-results.jpg',
      categoryIds: ['content_category_roca_group_reference', 'content_category_roca_sustainability_reference'],
      publishedAt: '2026-06-19T00:00:00.000Z',
      historicalSlugs: [],
      body: '<p>Roca Group reports its 2025 financial results alongside continued investment in sustainability, technology, and growth.</p>'
    }),
    news(siteId, updatedAt, {
      id: 'news_roca_climate_leaders_reference',
      slug: 'roca-group-recognized-among-europes-climate-leaders-by-financial-times-and-statista',
      title: 'Roca Group Recognized Among Europe’s Climate Leaders by Financial Times and Statista',
      summary: 'Roca Group is recognized among Europe’s leading companies in climate action for 2026.',
      image: '/images/news-reference/roca-climate-leaders.jpg',
      categoryIds: ['content_category_roca_group_reference', 'content_category_roca_sustainability_reference'],
      publishedAt: '2026-06-01T00:00:00.000Z',
      historicalSlugs: [],
      body: '<p>Roca Group is recognized among Europe’s leading companies in climate action for 2026.</p>'
    }),
    news(siteId, updatedAt, {
      id: 'news_roca_city_reference',
      slug: 'government-catalonia-approves-urban-planning-roca-city',
      title: 'The Government of Catalonia approves the urban planning for Roca City in Gavà and Viladecans',
      summary: 'The approved plan will transform the historic factory surroundings into a mixed-use eco-district.',
      image: '/images/news-reference/roca-city.jpg',
      categoryIds: ['content_category_roca_group_reference', 'content_category_roca_sustainability_reference'],
      publishedAt: '2026-05-27T00:00:00.000Z',
      historicalSlugs: [],
      body: '<p>The approved plan will transform the historic factory surroundings into a mixed-use eco-district.</p>'
    }),
    news(siteId, updatedAt, {
      id: 'news_roca_mediterranean_rituals_reference',
      slug: 'mediterranean-rituals-roca-explores-bathroom',
      title: 'Mediterranean Rituals: Roca explores the bathroom through architecture, design and technology',
      summary: 'A pavilion by Mesura presents Roca’s latest collections within a Mediterranean spatial concept.',
      image: '/images/news-reference/roca-mediterranean-rituals.jpg',
      categoryIds: ['content_category_roca_reference'],
      publishedAt: '2026-04-21T00:00:00.000Z',
      historicalSlugs: [],
      body: '<p>A pavilion by Mesura presents Roca’s latest collections within a Mediterranean spatial concept.</p>'
    }),
    news(siteId, updatedAt, {
      id: 'news_roca_uia_reference',
      slug: 'roca-main-partner-uia-world-congress-architects',
      title: 'Roca, Main Partner of the UIA 2026 World Congress of Architects Barcelona',
      summary: 'Roca takes part in an international forum for architectural thinking and innovation.',
      image: '/images/news-reference/roca-uia-2026.jpg',
      categoryIds: ['content_category_roca_reference'],
      publishedAt: '2026-03-26T00:00:00.000Z',
      historicalSlugs: [],
      body: '<p>Roca takes part in an international forum for architectural thinking and innovation.</p>'
    }),
    news(siteId, updatedAt, {
      id: 'news_roca_health_hub_reference',
      slug: 'roca-barcelona-madrid-health-hub-join-forces-drive-innovation',
      title: 'Roca and Barcelona & Madrid Health Hub join forces to drive innovation in digital health applied to the bathroom of the future',
      summary: 'The partnership connects Roca with a digital health ecosystem to test bathroom innovations.',
      image: '/images/news-reference/roca-health-hub.jpg',
      categoryIds: ['content_category_roca_reference'],
      publishedAt: '2026-03-23T00:00:00.000Z',
      historicalSlugs: [],
      body: '<p>The partnership connects Roca with a digital health ecosystem to test bathroom innovations.</p>'
    }),
    news(siteId, updatedAt, {
      id: 'news_roca_sydney_gallery_reference',
      slug: 'laufen-and-roca-open-sydney-gallery-a-new-hub-for-architecture-and-design-in-australia',
      title: 'Laufen and Roca open Sydney Gallery, a new hub for architecture and design in Australia',
      summary: 'Sydney Gallery becomes part of the Group’s international network of design-led spaces.',
      image: '/images/news-reference/roca-sydney-gallery.jpg',
      categoryIds: ['content_category_roca_reference'],
      publishedAt: '2026-03-19T00:00:00.000Z',
      historicalSlugs: [],
      body: '<p>Sydney Gallery becomes part of the Group’s international network of design-led spaces.</p>'
    }),
    // This second local-only reference page exercises progressive News loading with real public Roca release metadata.
    news(siteId, updatedAt, {
      id: 'news_roca_antonio_lupi_reference',
      slug: 'roca-group-entering-luxury-segment-antonio-lupi',
      title: 'Roca Group is entering the luxury segment with the incorporation of Antonio Lupi, an iconic Italian brand in bathroom space design',
      summary: 'Roca Group acquires a majority stake in Antonio Lupi Design to support the Italian brand’s international expansion.',
      image: '/images/news-reference/roca-antonio-lupi.webp',
      categoryIds: ['content_category_roca_group_reference'],
      publishedAt: '2025-07-22T00:00:00.000Z',
      historicalSlugs: [],
      body: '<p>Roca Group has acquired a majority stake in Antonio Lupi Design, a leading name in bathroom furniture and design.</p>'
    }),
    news(siteId, updatedAt, {
      id: 'news_roca_phoenix_reference',
      slug: 'roca-group-strengthens-tapware-division-acquisition-phoenix',
      title: 'Roca Group strengthens its tapware division with the acquisition of Australian company Phoenix.',
      summary: 'The acquisition reinforces Roca Group’s presence in Australia and its position in mid- to high-end tapware.',
      image: '/images/news-reference/roca-phoenix.jpg',
      categoryIds: ['content_category_roca_group_reference'],
      publishedAt: '2025-07-10T00:00:00.000Z',
      historicalSlugs: [],
      body: '<p>Roca Group has acquired Phoenix, an Australian tapware company recognised for design leadership.</p>'
    }),
    news(siteId, updatedAt, {
      id: 'news_roca_group_2024_results_reference',
      slug: 'roca-group-closed-2024-with-revenues-and-investment',
      title: 'Roca Group closed 2024 with revenues of €1.95 billion and an investment of €155 million',
      summary: 'The Group reports its 2024 results alongside continued investment in technology, industrial capacity and sustainability.',
      image: '/images/news-reference/roca-group-2024-results.jpg',
      categoryIds: ['content_category_roca_group_reference', 'content_category_roca_sustainability_reference'],
      publishedAt: '2025-06-20T00:00:00.000Z',
      historicalSlugs: [],
      body: `<p>Roca Group closed 2024 in a more difficult global trading environment, reporting turnover of 1.948 billion euros. Currency movements in markets where the Group operates were a material factor in the year, yet the result also shows continued investment in manufacturing, product development and long-term capability.</p>
        <h2>Financial performance</h2>
        <p>Reported turnover was 5% lower than in the prior year. Roca Group attributed much of that movement to the effect of local currencies against the euro, while continuing to focus on operational control and the needs of individual markets.</p>
        <p>Operating profit reached 108 million euros, equivalent to a 5.6% return on sales. On a comparable basis that excludes the consequences of leaving Russia and hyperinflation in Argentina, net profit was 86.4 million euros, an increase of 35% from the previous year.</p>
        <ul>
          <li><strong>1.948 billion euros</strong> in 2024 turnover</li>
          <li><strong>108 million euros</strong> in operating profit</li>
          <li><strong>86.4 million euros</strong> in like-for-like net profit</li>
        </ul>
        <h2>Investment and industrial capacity</h2>
        <p>During 2024, the Group allocated 155 million euros to investment, slightly above the amount committed in 2023. The programme covered digitalisation, safer operations, cost efficiency, product development, facility upgrades and progress against sustainability priorities.</p>
        <p>Roca Group also announced a 70-million-euro production centre in Kazakhstan. The planned site is intended to reinforce distribution across Central Asian markets and adds industrial capacity to the Group's wider growth plan.</p>
        <h2>Sustainability progress</h2>
        <p>The results sit alongside a series of manufacturing changes intended to reduce the footprint of bathroom-product production. At Gmunden in Austria, Roca Group has operated an electric kiln for sanitaryware using renewable electricity, replacing gas at that facility. The Group has also worked to electrify production in Brazil and Portugal, and began zero-emissions production of shower enclosures at a factory designed to run on renewable energy.</p>
        <p>Since 2018, Roca Group reports that its own operational emissions have fallen by more than 53% and its energy intensity by 55%. Its stated objective is net-zero emissions in operations by 2045. In January 2025, EcoVadis awarded the Group a Platinum Medal for its sustainability performance.</p>
        <figure><img src="/images/news-reference/roca-zero-emission-facility.png" alt="Roca Group zero-emission sanitaryware facility" loading="lazy" decoding="async" width="1378" height="946"></figure>
        <figure><img src="/images/news-reference/roca-ecovadis-platinum.jpg" alt="Roca Group EcoVadis Platinum recognition" loading="lazy" decoding="async" width="860" height="605"></figure>
        <figure><img src="/images/news-reference/roca-kazakhstan-plant.jpg" alt="Roca Group production centre planned for Kazakhstan" loading="lazy" decoding="async" width="600" height="357"></figure>
        <h2>Portfolio expansion</h2>
        <p>Growth in 2024 also included acquisitions and venture investments. Roca Group added Nosag and Ineocare in accessible bathroom solutions, Idral in public-space tapware and Innotec in modular bathroom-integration systems. It also completed full ownership of Mobiliario Royo.</p>
        <p>Through Roca Group Ventures, the Group took positions in Boon and Kmina and invested in specialist funds focused on digital health and water. Together, these moves broaden the Group's access to inclusive design, public-space products and technologies connected to bathroom use and water management.</p>`
    }),
    news(siteId, updatedAt, {
      id: 'news_roca_kazakhstan_plant_reference',
      slug: 'roca-group-build-production-plant-kazakhstan',
      title: 'Roca Group to Build a Production Plant in Kazakhstan',
      summary: 'Roca Group will invest €70 million in a new industrial plant that will serve as its Central Asia production hub.',
      image: '/images/news-reference/roca-kazakhstan-plant.jpg',
      categoryIds: ['content_category_roca_group_reference'],
      publishedAt: '2025-06-12T00:00:00.000Z',
      historicalSlugs: [],
      body: '<p>The Kyzylorda facility will manufacture and assemble products for bathroom spaces across Central Asia.</p>'
    }),
    news(siteId, updatedAt, {
      id: 'news_roca_global_website_reference',
      slug: 'fresh-new-look-for-roca-com-global-inspiration',
      title: 'A fresh new look for Roca.com showcases global inspiration, professional resources, and Roca’s commitment to sustainability',
      summary: 'Roca launches a renewed global website with simplified navigation and resources for homeowners and professionals.',
      image: '/images/news-reference/roca-global-website.jpg',
      categoryIds: ['content_category_roca_reference'],
      publishedAt: '2025-10-21T00:00:00.000Z',
      historicalSlugs: [],
      body: '<p>Roca.com has been renewed to help visitors explore collections, projects and professional resources.</p>'
    }),
    news(siteId, updatedAt, {
      id: 'news_roca_delhi_gallery_reference',
      slug: 'roca-group-opens-delhi-gallery-india',
      title: 'Roca Group opens the Roca Delhi Gallery, its first in India as part of its international network of design-led cultural spaces',
      summary: 'The Delhi Gallery brings Roca and LAUFEN together in a new cultural hub for architecture, design and innovation.',
      image: '/images/news-reference/roca-delhi-gallery.jpg',
      categoryIds: ['content_category_roca_reference'],
      publishedAt: '2025-12-12T00:00:00.000Z',
      historicalSlugs: [],
      body: '<p>Roca’s first Gallery in India joins its international network of spaces for design culture and innovation.</p>'
    }),
    news(siteId, updatedAt, {
      id: 'news_roca_zero_emission_reference',
      slug: 'roca-group-zero-emission-sanitary-ceramics-facility',
      title: 'Roca Group sets a sustainability benchmark with the world’s first zero-emission sanitary ceramics production facility',
      summary: 'Roca Group presents the world’s first CO2-free sanitary ceramics production facility and its progress in sustainable manufacturing.',
      image: '/images/news-reference/roca-zero-emission-facility.png',
      categoryIds: ['content_category_roca_group_reference', 'content_category_roca_sustainability_reference'],
      publishedAt: '2025-03-18T00:00:00.000Z',
      historicalSlugs: [],
      body: '<p>The Gmunden facility operates with an electric tunnel kiln and sets a new production benchmark for sanitary ceramics.</p>'
    }),
    news(siteId, updatedAt, {
      id: 'news_roca_ecovadis_platinum_reference',
      slug: 'roca-group-awarded-ecovadis-platinum-medal-sustainability',
      title: 'Roca Group Awarded EcoVadis Platinum Medal for Sustainability Performance',
      summary: 'EcoVadis has placed Roca Group among the top 1% of companies assessed for sustainability performance.',
      image: '/images/news-reference/roca-ecovadis-platinum.jpg',
      categoryIds: ['content_category_roca_group_reference', 'content_category_roca_sustainability_reference'],
      publishedAt: '2025-01-27T00:00:00.000Z',
      historicalSlugs: [],
      body: '<p>Roca Group receives EcoVadis’ highest sustainability recognition for its company-wide performance.</p>'
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
  categoryIds: string[]
  tags?: string[]
  authorDisplayName?: string
  publishedAt?: string
  coverImageHasEmbeddedCategoryLabels?: boolean
  historicalSlugs: string[]
  body: string
}

interface ContentCategorySeed {
  id: string
  slug: string
  seoCanonicalPath?: `/blogs/categories/${string}` | `/news/categories/${string}`
  name: string
  description: string
  sortOrder: number
  historicalSlugs: string[]
}

// category maps a site-defined Meilong category into the P1 public view envelope.
function category(siteId: string, updatedAt: string, seed: CategorySeed): StoredPublishedResource {
  return envelope(siteId, 'category', seed.id, seed.slug, updatedAt, {
    category_id: seed.id,
    display_title: seed.title,
    description: seed.description,
    image: seed.image,
    sort_order: seed.order
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

// contentCategory maps a neutral localized Category seed into the public archive view payload.
function contentCategory(siteId: string, updatedAt: string, seed: ContentCategorySeed): StoredPublishedResource {
  return envelope(siteId, 'article-category', seed.id, seed.slug, updatedAt, {
    content_category_id: seed.id,
    display_name: seed.name,
    archive_intro: seed.description,
    archive_label: seed.name,
    sort_order: seed.sortOrder,
    historical_slugs: seed.historicalSlugs,
    seo: seo(
      seed.name,
      seed.description,
      '/images/meilong-showroom-hero.png',
      seed.seoCanonicalPath
    )
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
    cover_image_alt: seed.title,
    cover_image_has_embedded_category_labels: seed.coverImageHasEmbeddedCategoryLabels ?? false,
    author_display_name: seed.authorDisplayName ?? 'Meilong Editorial Desk',
    category_ids: seed.categoryIds,
    tags: seed.tags ?? [],
    body_html: withReferenceArticleMedia(seed.slug, seed.body),
    published_at: seed.publishedAt ?? updatedAt,
    historical_slugs: seed.historicalSlugs,
    seo: seo(seed.title, seed.summary, seed.image, `/${resourceType}/${seed.slug}`)
  })
}

// withReferenceArticleMedia restores the complete source figure sequence for the copied sink-selection article fixture.
function withReferenceArticleMedia(slug: string, body: string): string {
  if (slug !== sinkSelectionReferenceSlug) {
    return body
  }
  return sinkSelectionArticleFigures.reduce((article, figure) => article.replace(figure.before, `${figure.html}${figure.before}`), body)
}

// envelope wraps a resource payload in the site-service public view storage shape.
function envelope(
  siteId: string,
  resourceType: 'product' | 'category' | 'blog' | 'news' | 'article-category',
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

// seo creates production-shaped metadata and only adds an explicit canonical when the resource has one.
function seo(title: string, description: string, image: string, path?: string) {
  return {
    title: `${title} | Meilong Ceramics`,
    description,
    image: image.startsWith('http') ? image : `${publicBaseUrl}${image}`,
    ...(path ? { canonical_url: `${publicBaseUrl}${path}` } : {})
  }
}
