import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { ContentCategoryArchiveController } from '../runtime/src/modules/public-data/content-category-archive.controller'
import { ContentArchiveController } from '../runtime/src/modules/public-data/content-archive.controller'
import { PublicDataController } from '../runtime/src/modules/public-data/public-data.controller'
import { SiteConfigService } from '../runtime/src/modules/site-config/site-config.service'
import { SiteExposureController } from '../runtime/src/modules/site-exposure/site-exposure.controller'

const composedCategorySlug = 'café-guides'
const invalidCanonicalCategorySlugs = [
  ['padded', ` ${composedCategorySlug} `],
  ['decomposed-NFC', composedCategorySlug.normalize('NFD')]
] as const

describe('Runtime HTTP controller protocol boundaries', () => {
  it.each(['unknown', 'article-category', 'article-categories', 'NEWS'])(
    'rejects unsupported public resource collection %s with 404',
    async (collection) => {
      const controller = createPublicDataController()

      await expect(controller.listResources(collection as never)).rejects.toMatchObject({
        status: 404
      })
      await expect(
        controller.getResourceBySlug(collection as never, 'slug')
      ).rejects.toMatchObject({ status: 404 })
    }
  )

  it.each(['products', 'categories', 'article-categories'])(
    'rejects removed public list collection %s without delegating to a detail gate',
    async (collection) => {
      const service = createPublicDataServiceDouble()
      const controller = createPublicDataController(service)

      await expect(controller.listResources(collection)).rejects.toMatchObject({ status: 404 })
      expect(service.listResources).not.toHaveBeenCalled()
    }
  )

  it('keeps product detail public while rejecting removed Product Category detail exposure', async () => {
    const service = createPublicDataServiceDouble()
    const controller = createPublicDataController(service)

    await expect(controller.getResourceBySlug('products', 'tile-one')).resolves.toEqual({
      slug: 'slug'
    })
    await expect(
      controller.getResourceBySlug('categories', 'porcelain-tiles')
    ).rejects.toMatchObject({ status: 404 })
    await expect(
      controller.getResourceBySlug('article-categories', 'bathroom-sink')
    ).rejects.toMatchObject({ status: 404 })
    expect(service.getResourceBySlug).toHaveBeenCalledTimes(1)
    expect(service.getResourceBySlug).toHaveBeenCalledWith({
      collection: 'products',
      slug: 'tile-one',
      locale: undefined
    })
  })

  it.each(['NaN', 'Infinity', '0', '-1', '1.5', '201'])(
    'rejects invalid public resource limit %s with 400',
    async (limit) => {
      const controller = createPublicDataController()

      await expect(controller.listResources('news', 'en-US', limit)).rejects.toMatchObject({
        status: 400
      })
    }
  )

  it('parses the legal list limit and passes an opaque cursor unchanged', async () => {
    const service = createPublicDataServiceDouble()
    const controller = createPublicDataController(service)

    await expect(
      controller.listResources('news', 'en-US', '200', 'opaque:+/==')
    ).resolves.toEqual({ items: [], nextCursor: null })
    expect(service.listResources).toHaveBeenCalledWith({
      collection: 'news',
      locale: 'en-US',
      limit: 200,
      cursor: 'opaque:+/=='
    })
  })

  it.each(['unknown', 'article-category', 'NEWS'])(
    'rejects unsupported category content type %s with 404',
    async (contentType) => {
      const controller = createCategoryController()

      await expect(
        controller.listVisibleCategories(contentType as never)
      ).rejects.toMatchObject({ status: 404 })
      await expect(
        controller.getCategoryArchive(contentType as never, 'slug')
      ).rejects.toMatchObject({ status: 404 })
      await expect(
        controller.resolveContentRedirect(contentType as never, 'slug')
      ).rejects.toMatchObject({ status: 404 })
    }
  )

  it.each([
    ['page', 'NaN'],
    ['page', 'Infinity'],
    ['page', '0'],
    ['page', '-1'],
    ['page', '1.5'],
    ['pageSize', 'NaN'],
    ['pageSize', 'Infinity'],
    ['pageSize', '0'],
    ['pageSize', '-1'],
    ['pageSize', '1.5'],
    ['pageSize', '25']
  ])('rejects invalid archive %s value %s with 400', async (field, value) => {
    const controller = createCategoryController()

    await expect(
      controller.getCategoryArchive(
        'blog',
        'guides',
        'en-US',
        field === 'page' ? value : undefined,
        field === 'pageSize' ? value : undefined
      )
    ).rejects.toMatchObject({ status: 400 })
  })

  it.each([
    ['page', '9007199254740992'],
    ['month', '0'],
    ['month', '13'],
    ['year', '1999'],
    ['year', '2101']
  ])('rejects category archive %s=%s outside the shared numeric contract', async (field, value) => {
    const controller = createCategoryController()
    const values = archiveQueryArguments(field, value)

    await expect(
      controller.getCategoryArchive('blog', 'guides', 'en-US', ...values)
    ).rejects.toMatchObject({ status: 400 })
  })

  it.each([
    ['page', '0'],
    ['page', '-1'],
    ['page', '9007199254740992'],
    ['pageSize', '0'],
    ['pageSize', '49'],
    ['month', '0'],
    ['month', '13'],
    ['year', '1999'],
    ['year', '2101']
  ])('rejects content archive %s=%s outside the shared numeric contract', async (field, value) => {
    const controller = createContentArchiveController()

    await expect(
      Promise.resolve().then(() =>
        controller.getArchivePage('blog', 'en-US', ...archiveQueryArguments(field, value))
      )
    ).rejects.toMatchObject({ status: 400 })
  })

  it.each([
    ['page', '2e3'],
    ['page', '0xC'],
    ['page', '+12'],
    ['page', '12.0'],
    ['page', ' 12 '],
    ['month', '0xC'],
    ['month', '+12'],
    ['month', '12.0'],
    ['month', ' 12 '],
    ['year', '2e3']
  ])('rejects non-decimal category archive %s=%s with 400', async (field, value) => {
    const controller = createCategoryController()

    await expect(
      controller.getCategoryArchive(
        'news',
        'company',
        'en-US',
        ...archiveQueryArguments(field, value)
      )
    ).rejects.toMatchObject({ status: 400 })
  })

  it.each([
    ['page', '2e3'],
    ['page', '0xC'],
    ['page', '+12'],
    ['page', '12.0'],
    ['page', ' 12 '],
    ['month', '0xC'],
    ['month', '+12'],
    ['month', '12.0'],
    ['month', ' 12 '],
    ['year', '2e3']
  ])('rejects non-decimal content archive %s=%s with 400', async (field, value) => {
    const controller = createContentArchiveController()

    await expect(
      Promise.resolve().then(() =>
        controller.getArchivePage(
          'news',
          'en-US',
          ...archiveQueryArguments(field, value)
        )
      )
    ).rejects.toMatchObject({ status: 400 })
  })

  it('parses legal archive page and pageSize values before delegating', async () => {
    const service = createCategoryServiceDouble()
    const controller = createCategoryController(service)

    await controller.getCategoryArchive('blog', 'guides', 'en-US', '3', '24')

    expect(service.getArchive).toHaveBeenCalledWith({
      contentType: 'blog',
      slug: 'guides',
      locale: 'en-US',
      page: 3,
      pageSize: 24
    })
  })

  it('rejects an unsupported site-exposure page key with 400', async () => {
    const siteExposure = {
      getRouteDecision: jest.fn().mockResolvedValue({})
    }
    const controller = new SiteExposureController(
      siteExposure as never,
      new SiteConfigService()
    )

    await expect(controller.getRouteDecision('unknown-page')).rejects.toMatchObject({
      status: 400
    })
  })

  it('parses the Category archive page threshold before route-decision dispatch', async () => {
    const siteExposure = {
      getRouteDecision: jest.fn().mockResolvedValue({})
    }
    const controller = new SiteExposureController(
      siteExposure as never,
      new SiteConfigService()
    )
    const getRouteDecision = controller.getRouteDecision.bind(controller) as unknown as (
      pageKey: unknown,
      locale?: unknown,
      collection?: unknown,
      slug?: unknown,
      archivePage?: unknown,
      archivePageSize?: unknown
    ) => Promise<unknown>

    await getRouteDecision(
      'NEWS_CATEGORY',
      'fr-FR',
      'news-category',
      'nouvelles-groupe',
      '2',
      '8'
    )

    expect(siteExposure.getRouteDecision).toHaveBeenCalledWith({
      pageKey: 'NEWS_CATEGORY',
      locale: 'fr-FR',
      resource: { collection: 'news-category', slug: 'nouvelles-groupe' },
      categoryArchive: { kind: 'category-archive', page: 2, pageSize: 8 }
    })
  })

  it.each([
    ['missing', undefined] as const,
    ['empty', ''] as const,
    ...invalidCanonicalCategorySlugs
  ])(
    'rejects a %s Category slug with an archive threshold before service dispatch',
    async (_label, slug) => {
      const siteExposure = { getRouteDecision: jest.fn().mockResolvedValue({}) }
      const controller = new SiteExposureController(
        siteExposure as never,
        new SiteConfigService()
      )
      const getRouteDecision = controller.getRouteDecision.bind(controller) as unknown as (
        pageKey: unknown,
        locale?: unknown,
        collection?: unknown,
        slug?: unknown,
        archivePage?: unknown,
        archivePageSize?: unknown
      ) => Promise<unknown>

      await expect(
        getRouteDecision(
          'NEWS_CATEGORY',
          'en-US',
          'news-category',
          slug,
          '2',
          '8'
        )
      ).rejects.toMatchObject({ status: 400 })
      expect(siteExposure.getRouteDecision).not.toHaveBeenCalled()
    }
  )

  it('dispatches a composed Unicode Category slug unchanged to the Runtime service', async () => {
    const siteExposure = { getRouteDecision: jest.fn().mockResolvedValue({}) }
    const controller = new SiteExposureController(
      siteExposure as never,
      new SiteConfigService()
    )

    await controller.getRouteDecision(
      'NEWS_CATEGORY',
      'en-US',
      'news-category',
      composedCategorySlug,
      '2',
      '8'
    )

    expect(siteExposure.getRouteDecision).toHaveBeenCalledWith({
      pageKey: 'NEWS_CATEGORY',
      locale: 'en-US',
      resource: { collection: 'news-category', slug: composedCategorySlug },
      categoryArchive: { kind: 'category-archive', page: 2, pageSize: 8 }
    })
  })

  it('keeps a Category collection read without an archive threshold valid', async () => {
    const siteExposure = { getRouteDecision: jest.fn().mockResolvedValue({}) }
    const controller = new SiteExposureController(
      siteExposure as never,
      new SiteConfigService()
    )

    await controller.getRouteDecision(
      'NEWS_CATEGORY',
      'en-US',
      'news-category'
    )

    expect(siteExposure.getRouteDecision).toHaveBeenCalledWith({
      pageKey: 'NEWS_CATEGORY',
      locale: 'en-US',
      resource: { collection: 'news-category', slug: undefined },
      categoryArchive: undefined
    })
  })

  it.each([
    ['missing page size', 'NEWS_CATEGORY', 'news-category', '2', undefined],
    ['missing page', 'NEWS_CATEGORY', 'news-category', undefined, '8'],
    ['non-Category page', 'NEWS_DETAIL', 'news', '2', '8'],
    ['mismatched Category collection', 'BLOG_CATEGORY', 'news-category', '2', '9']
  ])(
    'rejects %s archive threshold before route-decision dispatch',
    async (_label, pageKey, collection, archivePage, archivePageSize) => {
      const siteExposure = { getRouteDecision: jest.fn().mockResolvedValue({}) }
      const controller = new SiteExposureController(
        siteExposure as never,
        new SiteConfigService()
      )
      const getRouteDecision = controller.getRouteDecision.bind(controller) as unknown as (
        pageKey: unknown,
        locale?: unknown,
        collection?: unknown,
        slug?: unknown,
        archivePage?: unknown,
        archivePageSize?: unknown
      ) => Promise<unknown>

      await expect(
        getRouteDecision(
          pageKey,
          'en-US',
          collection,
          'category-slug',
          archivePage,
          archivePageSize
        )
      ).rejects.toMatchObject({ status: 400 })
      expect(siteExposure.getRouteDecision).not.toHaveBeenCalled()
    }
  )

  it.each([
    ['repeated query', ['en-US', 'fr-FR']],
    ['object query', { value: 'en-US' }]
  ])('rejects %s shapes for every public-data query before service dispatch', async (_label, value) => {
    const service = createPublicDataServiceDouble()
    const controller = createPublicDataController(service)

    await expect(controller.listResources('news', value as never)).rejects.toMatchObject({
      status: 400
    })
    await expect(
      controller.listResources('news', 'en-US', value as never)
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      controller.listResources('news', 'en-US', '2', value as never)
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      controller.getResourceBySlug('news', 'slug', value as never)
    ).rejects.toMatchObject({ status: 400 })
    expect(service.listResources).not.toHaveBeenCalled()
    expect(service.getResourceBySlug).not.toHaveBeenCalled()
  })

  it.each([
    ['repeated query', ['en-US', 'fr-FR']],
    ['object query', { value: 'en-US' }]
  ])('rejects %s shapes for every category query before service dispatch', async (_label, value) => {
    const service = createCategoryServiceDouble()
    const controller = createCategoryController(service)

    await expect(
      controller.listVisibleCategories('blog', value as never)
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      controller.listVisibleCategories('blog', 'BLOG_LIST', value as never)
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      controller.getCategoryArchive('blog', 'slug', value as never)
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      controller.getCategoryArchive('blog', 'slug', 'en-US', value as never)
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      controller.getCategoryArchive('blog', 'slug', 'en-US', '1', value as never)
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      controller.resolveContentRedirect('blog', 'slug', value as never)
    ).rejects.toMatchObject({ status: 400 })
    expect(service.listVisibleCategories).not.toHaveBeenCalled()
    expect(service.getArchive).not.toHaveBeenCalled()
    expect(service.resolveContentRedirect).not.toHaveBeenCalled()
  })

  it.each([
    ['repeated query', ['HOME', 'ABOUT']],
    ['object query', { value: 'HOME' }]
  ])('rejects %s shapes for every site-exposure query before service dispatch', async (_label, value) => {
    const siteExposure = {
      getRouteDecision: jest.fn().mockResolvedValue({})
    }
    const controller = new SiteExposureController(
      siteExposure as never,
      new SiteConfigService()
    )

    await expect(controller.getRouteDecision(value as never)).rejects.toMatchObject({ status: 400 })
    await expect(
      controller.getRouteDecision('HOME', value as never)
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      controller.getRouteDecision('HOME', 'en-US', value as never)
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      controller.getRouteDecision('HOME', 'en-US', 'news', value as never)
    ).rejects.toMatchObject({ status: 400 })
    expect(siteExposure.getRouteDecision).not.toHaveBeenCalled()
  })
})

describe('Runtime controller architecture boundaries', () => {
  it('keeps PublicDataController free of publication fences and Runtime readers', () => {
    const source = readRuntimeSource('public-data/public-data.controller.ts')

    expect(source).not.toMatch(/OesSiteRuntimeService|SiteExposureService/)
    expect(source).not.toMatch(/withStablePublication|getRuntime\(|publicViews/)
    expect(source).not.toMatch(/getRouteDecision|listPublishedResources/)
  })

  it('keeps SeoController as a single service delegate without route-index aggregation', () => {
    const source = readRuntimeSource('seo/seo.controller.ts')

    expect(source).not.toMatch(
      /OesSiteRuntimeService|SiteExposureService|ContentCategoryArchiveService/
    )
    expect(source).not.toMatch(/withStablePublication|getRuntime\(|publicViews/)
    expect(source).not.toMatch(/Promise\.all|listAllPublishedResources|getPagePolicy/)
    expect(source).not.toMatch(/for\s*\(/)
  })
})

// createPublicDataServiceDouble provides only the controller's delegated application-service contract.
function createPublicDataServiceDouble() {
  return {
    listResources: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
    getResourceBySlug: jest.fn().mockResolvedValue({ slug: 'slug' })
  }
}

// createPublicDataController adapts the desired single-service constructor across the RED refactor boundary.
function createPublicDataController(service = createPublicDataServiceDouble()): PublicDataController {
  const Controller = PublicDataController as unknown as new (
    publicData: ReturnType<typeof createPublicDataServiceDouble>
  ) => PublicDataController
  return new Controller(service)
}

// createCategoryServiceDouble provides complete controller delegation methods without business behavior.
function createCategoryServiceDouble() {
  return {
    listVisibleCategories: jest.fn().mockResolvedValue([]),
    getArchive: jest.fn().mockResolvedValue({}),
    resolveContentRedirect: jest.fn().mockResolvedValue(null)
  }
}

// createCategoryController constructs the real protocol adapter with a narrow service boundary.
function createCategoryController(
  service = createCategoryServiceDouble()
): ContentCategoryArchiveController {
  return new ContentCategoryArchiveController(service as never)
}

// createContentArchiveController constructs the archive protocol adapter with a narrow service double.
function createContentArchiveController(): ContentArchiveController {
  return new ContentArchiveController({ getArchivePage: jest.fn().mockResolvedValue({}) } as never)
}

// archiveQueryArguments places one public numeric string in the controller's page/pageSize/month/year order.
function archiveQueryArguments(
  field: string,
  value: string
): [string | undefined, string | undefined, string | undefined, string | undefined] {
  return [
    field === 'page' ? value : undefined,
    field === 'pageSize' ? value : undefined,
    field === 'month' ? value : undefined,
    field === 'year' ? value : undefined
  ]
}

// readRuntimeSource loads controller source for stable forbidden-dependency architecture assertions.
function readRuntimeSource(relativePath: string): string {
  return readFileSync(join(__dirname, '../runtime/src/modules', relativePath), 'utf8')
}
