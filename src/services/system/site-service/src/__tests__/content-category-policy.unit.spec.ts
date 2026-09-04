import { assertContentCategoryReferencesValid } from '../domain/publication/content-category-policy'
import { buildArticleCategoryPublicView } from '../domain/public-view/public-view-builders'

describe('Content Category publication policy', () => {
  /** This suite locks the neutral, same-locale Article Category producer rules. */
  it('accepts a neutral Category only when its target locale has a published revision', () => {
    expect(() =>
      assertContentCategoryReferencesValid({
        contentType: 'news',
        targetLocale: 'en-US',
        referencedCategoryIds: ['category_guides'],
        categories: [
          {
            categoryId: 'category_guides',
            localeVersions: [
              {
                locale: 'en-US',
                slug: 'guides',
                displayName: 'Guides',
                lastPublishedRevision: 1
              }
            ]
          } as any
        ]
      })
    ).not.toThrow()
  })

  it('builds neutral Category public data with deterministic optional-field fallbacks', () => {
    const view = buildArticleCategoryPublicView({
      siteId: 'site_a',
      categoryId: 'category_guides',
      locale: 'en-US',
      slug: 'guides',
      displayName: 'Guides',
      sortOrder: 5,
      publishVersion: 7,
      updatedAt: new Date('2026-07-26T00:00:00.000Z')
    } as any)

    expect(view.payload).toEqual({
      content_category_id: 'category_guides',
      display_name: 'Guides',
      archive_intro: null,
      archive_label: 'Guides',
      sort_order: 5,
      historical_slugs: [],
      seo: { title: 'Guides', description: null, image: null }
    })
  })
})
