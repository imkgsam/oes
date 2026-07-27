import { buildFaqDirectoryPublicView } from '../../src/domain/faq/faq-public-view-builder'

describe('site-service FAQ directory public view L1', () => {
  it('builds one locale-scoped FAQ directory with deterministic category and entry order', () => {
    const view = buildFaqDirectoryPublicView({
      siteId: 'site_a',
      locale: 'en-US',
      publishVersion: 9,
      updatedAt: new Date('2026-07-24T08:00:00.000Z'),
      categories: [
        {
          categoryId: 'category_b',
          title: 'Installation',
          anchorKey: 'installation',
          sortOrder: 20,
          entries: [
            {
              entryId: 'entry_b',
              question: 'How long?',
              answerHtml: '<p>Two hours</p><script>unsafe()</script>',
              sortOrder: 20
            },
            {
              entryId: 'entry_a',
              question: 'Who installs it?',
              answerHtml: '<p>A qualified installer</p>',
              sortOrder: 10
            }
          ]
        },
        {
          categoryId: 'category_a',
          title: 'Care',
          anchorKey: 'care',
          sortOrder: 10,
          entries: []
        }
      ]
    })

    expect(view).toEqual({
      site_id: 'site_a',
      resource_type: 'faq',
      resource_id: 'site_a:faq-directory',
      locale: 'en-US',
      status: 'published',
      publish_version: 9,
      updated_at: '2026-07-24T08:00:00.000Z',
      payload: {
        categories: [
          {
            category_id: 'category_a',
            title: 'Care',
            anchor_key: 'care',
            sort_order: 10,
            entries: []
          },
          {
            category_id: 'category_b',
            title: 'Installation',
            anchor_key: 'installation',
            sort_order: 20,
            entries: [
              {
                entry_id: 'entry_a',
                question: 'Who installs it?',
                answer_html: '<p>A qualified installer</p>',
                sort_order: 10
              },
              {
                entry_id: 'entry_b',
                question: 'How long?',
                answer_html: '<p>Two hours</p>',
                sort_order: 20
              }
            ]
          }
        ]
      }
    })
  })

  it('represents a locale with no public FAQ categories as unpublished rather than a fallback directory', () => {
    expect(buildFaqDirectoryPublicView({ siteId: 'site_a', locale: 'fr-FR', publishVersion: 10, updatedAt: new Date('2026-07-25T00:00:00.000Z'), categories: [], status: 'unpublished' })).toMatchObject({ resource_type: 'faq', locale: 'fr-FR', status: 'unpublished', payload: { categories: [] } })
  })
})
