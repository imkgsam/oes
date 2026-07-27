import {
  buildArchiveRouteKey,
  buildNewsCategoryArchiveRouteKey,
  buildNewsRootArchiveRouteKey,
  normalizeArchivePage,
  parseNewsCategoryArchiveRouteState,
  parseNewsRootArchiveRouteState
} from '../storefront/utils/archive-route-key'
import {
  NEWS_ARCHIVE_SESSION_LIMIT,
  upsertBoundedNewsArchiveSession
} from '../storefront/utils/news-archive-session-cache'
import { parseNewsDateFilter } from '../storefront/utils/news-date-filter'

describe('archive semantic route state', () => {
  const newsRootKey = (path: string, query: Record<string, unknown>) =>
    buildNewsRootArchiveRouteKey(path, parseNewsRootArchiveRouteState(query))
  const newsCategoryKey = (path: string, query: Record<string, unknown>) =>
    buildNewsCategoryArchiveRouteKey(path, parseNewsCategoryArchiveRouteState(query))

  it('keeps News root load-more sessions independent from page, tracking, hash, and query order', () => {
    const left = newsRootKey('/news', {
      page: '2',
      month: '03',
      year: '2025',
      utm_source: 'campaign',
      hash: '#news'
    })
    const right = newsRootKey('/news', {
      ignored: 'value',
      year: '2025',
      month: '3',
      page: '99'
    })

    expect(left).toBe(right)
    expect(left).toBe('/news?month=3&year=2025')
    expect(newsRootKey('/news', { page: '2' })).toBe(newsRootKey('/news', {}))
  })

  it('retains normalized page identity for paginated News categories', () => {
    const pageOne = newsCategoryKey('/news/categories/company', {})
    const pageTwo = newsCategoryKey('/news/categories/company', { page: '2' })

    expect(pageOne).toBe('/news/categories/company?page=1&month=all&year=all')
    expect(pageTwo).toBe('/news/categories/company?page=2&month=all&year=all')
    expect(pageTwo).not.toBe(pageOne)
  })

  it('treats a leading-zero page as page one across Blog and News Category state', () => {
    expect(normalizeArchivePage('02')).toBe(1)
    expect(buildArchiveRouteKey('/blogs/categories/sinks', { page: '02' })).toBe(
      buildArchiveRouteKey('/blogs/categories/sinks', {})
    )
    expect(parseNewsCategoryArchiveRouteState({ page: '02' }).page).toBe(1)
    expect(newsCategoryKey('/news/categories/company', { page: '02' })).toBe(
      newsCategoryKey('/news/categories/company', {})
    )
    expect(newsRootKey('/news', { page: '02' })).toBe(newsRootKey('/news', {}))
  })

  it('normalizes invalid archive fields without letting unrelated News queries split sessions', () => {
    expect(
      newsRootKey('/news', {
        page: 'unsafe',
        month: '13',
        year: '1999',
        tracking: 'one'
      })
    ).toBe(newsRootKey('/news', {}))
    expect(buildArchiveRouteKey('/blogs', { page: '2', utm_medium: 'email' })).toBe(
      buildArchiveRouteKey('/blogs', { page: '2', month: '3', year: '2025' })
    )
  })

  it('keeps different paths and valid News filter values in different semantic sessions', () => {
    expect(newsRootKey('/news', { year: '2024' })).not.toBe(
      newsRootKey('/newsroom', { year: '2024' })
    )
    expect(newsRootKey('/news', { year: '2024' })).not.toBe(
      newsRootKey('/news', { year: '2025' })
    )
  })

  it.each([
    ['year', '2e3', '2000'],
    ['month', '0xC', '12'],
    ['month', '+12', '12'],
    ['month', '12.0', '12'],
    ['month', ' 12 ', '12']
  ])('treats non-decimal %s=%s as no filter instead of canonical %s', (field, raw, canonical) => {
    const invalidQuery = { [field]: raw }
    const canonicalQuery = { [field]: canonical }

    expect(parseNewsDateFilter(invalidQuery)).toEqual({})
    expect(parseNewsRootArchiveRouteState(invalidQuery).dateFilter).toEqual(
      parseNewsDateFilter(invalidQuery)
    )
    expect(parseNewsCategoryArchiveRouteState(invalidQuery).dateFilter).toEqual(
      parseNewsDateFilter(invalidQuery)
    )
    expect(newsRootKey('/news', invalidQuery)).toBe(
      newsRootKey('/news', {})
    )
    expect(newsRootKey('/news', invalidQuery)).not.toBe(
      newsRootKey('/news', canonicalQuery)
    )
  })

  it.each(['2e3', '0xC', '+12', '12.0', ' 12 '])(
    'does not treat non-decimal page=%s as a canonical page number',
    (raw) => {
      expect(buildArchiveRouteKey('/blogs', { page: raw })).toBe(
        buildArchiveRouteKey('/blogs', {})
      )
    }
  )

  it('evicts the oldest News sessions at the explicit client-state limit', () => {
    let sessions = {}
    for (let index = 0; index < NEWS_ARCHIVE_SESSION_LIMIT + 3; index += 1) {
      sessions = upsertBoundedNewsArchiveSession(sessions, `route-${index}`, {
        committedPublishVersion: 7,
        loadedPage: index + 1,
        scrollY: index
      })
    }

    expect(Object.keys(sessions)).toHaveLength(NEWS_ARCHIVE_SESSION_LIMIT)
    expect(sessions).not.toHaveProperty('route-0')
    expect(sessions).not.toHaveProperty('route-2')
    expect(sessions).toHaveProperty(`route-${NEWS_ARCHIVE_SESSION_LIMIT + 2}`)
  })
})
