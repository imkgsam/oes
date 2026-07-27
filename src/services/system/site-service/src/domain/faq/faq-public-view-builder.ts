import { sanitizeSiteHtml } from '../content/site-html-sanitizer'

export interface FaqDirectoryCategoryInput {
  categoryId: string
  title: string
  anchorKey: string
  sortOrder: number
  entries: Array<{
    entryId: string
    question: string
    answerHtml: string
    sortOrder: number
  }>
}

export interface BuildFaqDirectoryPublicViewInput {
  siteId: string
  locale: string
  publishVersion: number
  updatedAt: Date
  categories: FaqDirectoryCategoryInput[]
  status?: 'published' | 'unpublished' | 'disabled'
}

/** buildFaqDirectoryPublicView creates the slug-free, locale-scoped FAQ payload consumed by Site Runtime. */
export function buildFaqDirectoryPublicView(input: BuildFaqDirectoryPublicViewInput) {
  return {
    site_id: input.siteId,
    resource_type: 'faq' as const,
    resource_id: `${input.siteId}:faq-directory`,
    locale: input.locale,
    status: input.status ?? 'published',
    publish_version: input.publishVersion,
    updated_at: input.updatedAt.toISOString(),
    payload: {
      categories: [...input.categories]
        .sort(compareSortOrderAndId)
        .map((category) => ({
          category_id: category.categoryId,
          title: category.title,
          anchor_key: category.anchorKey,
          sort_order: category.sortOrder,
          entries: [...category.entries].sort(compareSortOrderAndId).map((entry) => ({
            entry_id: entry.entryId,
            question: entry.question,
            answer_html: sanitizeSiteHtml(entry.answerHtml),
            sort_order: entry.sortOrder
          }))
        }))
    }
  }
}

/** compareSortOrderAndId gives manual FAQ ordering a stable deterministic tiebreaker. */
function compareSortOrderAndId(
  left: { sortOrder: number; categoryId?: string; entryId?: string },
  right: { sortOrder: number; categoryId?: string; entryId?: string }
) {
  return left.sortOrder - right.sortOrder || (left.categoryId ?? left.entryId ?? '').localeCompare(right.categoryId ?? right.entryId ?? '')
}
