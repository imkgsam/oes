import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { MODULE_METADATA } from '@nestjs/common/constants'
import { NodeSqlitePublishedStore } from '@oes/site-runtime-kit'

import { AppModule } from '../runtime/src/app.module'
import { MeilongPublishedDataSeedService } from '../runtime/src/modules/seed/meilong-published-data-seed.service'
import { MEILONG_SITE_CAPABILITY_MANIFEST } from '../runtime/src/site-capability-manifest'

describe('Meilong local seed exposure integration', () => {
  it('registers the local published-data seed on the production Runtime module path', () => {
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AppModule) as unknown[]

    expect(providers).toContain(MeilongPublishedDataSeedService)
  })

  it('commits resources and the complete page publication atomically at one version', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'meilong-seed-exposure-'))
    const store = new NodeSqlitePublishedStore({ path: join(directory, 'runtime.sqlite') })
    const previousSeedFlag = process.env.SITE_MEILONG_SEED_PUBLISHED_DATA
    const previousStorePath = process.env.OES_SITE_STORE_PATH
    process.env.SITE_MEILONG_SEED_PUBLISHED_DATA = 'true'
    process.env.OES_SITE_STORE_PATH = join(directory, 'runtime.sqlite')
    try {
      const service = new MeilongPublishedDataSeedService({
        getRuntime: () => ({
          credential: { siteId: 'meilong-seed-test' }
        })
      } as never)

      await service.onModuleInit()

      await store.init()
      const publication = await store.getSiteExposurePublication('meilong-seed-test')
      const publishState = await store.getPublishState('meilong-seed-test')
      expect(publication?.publishVersion).toBe(publishState.localPublishVersion)
      expect(publication?.pages.map((page) => page.pageKey)).toEqual(
        MEILONG_SITE_CAPABILITY_MANIFEST.pages.map((page) => page.pageKey)
      )
      expect(publication?.pages.every((page) => page.supportedLocales[0] === 'en-US')).toBe(true)
      const categoryViews = await store.listPublishedResources({
        siteId: 'meilong-seed-test',
        resourceType: 'article-category',
        locale: 'en-US',
        status: 'published',
        limit: 500
      })
      expect(categoryViews.items).not.toHaveLength(0)
      for (const category of categoryViews.items) {
        const payload = JSON.parse(category.payloadJson) as Record<string, unknown>
        const seo = payload.seo as Record<string, unknown>

        expect(payload).toEqual(expect.objectContaining({
          content_category_id: category.resourceId,
          display_name: expect.any(String),
          sort_order: expect.any(Number),
          historical_slugs: expect.any(Array)
        }))
        expect(payload).not.toHaveProperty('appliesTo')
        expect(payload).not.toHaveProperty('applies_to')
        expect(payload).not.toHaveProperty('is_visible_in_blog_archive')
        expect(payload).not.toHaveProperty('is_visible_in_news_archive')
        if (typeof seo.canonical_url === 'string') {
          expect(seo.canonical_url).toMatch(
            /^https:\/\/meilong-ceramics\.com\/(?:blogs|news)\/categories\/[a-z0-9-]+$/
          )
          expect(seo.canonical_url).not.toContain('/topic/')
          expect(seo.canonical_url).not.toContain('/category/')
        }
        expect(payload.historical_slugs).not.toContain('topic')
        expect(payload.historical_slugs).not.toContain('category')
      }
      await expect(
        store.resolveHistoricalAlias({
          siteId: 'meilong-seed-test',
          namespace: 'article-category',
          locale: 'en-US',
          slug: 'project-news'
        })
      ).resolves.toMatchObject({
        resourceId: 'content_category_commercial_projects',
        canonicalSlug: 'kitchen-sink'
      })
      await expect(
        store.resolveHistoricalAlias({
          siteId: 'meilong-seed-test',
          namespace: 'article-category',
          locale: 'en-US',
          slug: 'topic'
        })
      ).resolves.toBeNull()
    } finally {
      await store.close()
      if (previousSeedFlag === undefined) {
        delete process.env.SITE_MEILONG_SEED_PUBLISHED_DATA
      } else {
        process.env.SITE_MEILONG_SEED_PUBLISHED_DATA = previousSeedFlag
      }
      if (previousStorePath === undefined) {
        delete process.env.OES_SITE_STORE_PATH
      } else {
        process.env.OES_SITE_STORE_PATH = previousStorePath
      }
      rmSync(directory, { force: true, recursive: true })
    }
  })
})
