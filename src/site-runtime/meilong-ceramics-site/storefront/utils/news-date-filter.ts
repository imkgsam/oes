import type { PublicViewEnvelope } from '../types/public-view'

export interface NewsDateFilter {
  month?: number
  year?: number
}

// parseNewsDateFilter converts public GET query values into safe archive filter fields.
export function parseNewsDateFilter(query: Record<string, unknown>): NewsDateFilter {
  const month = parseBoundedInteger(query.month, 1, 12)
  const year = parseBoundedInteger(query.year, 2000, 2100)
  return {
    ...(month ? { month } : {}),
    ...(year ? { year } : {})
  }
}

// hasNewsDateFilter reports whether the current archive is a non-canonical filtered state.
export function hasNewsDateFilter(filter: NewsDateFilter): boolean {
  return Boolean(filter.month || filter.year)
}

// matchesNewsDateFilter keeps News cards aligned with the server-rendered public publishing timestamp.
export function matchesNewsDateFilter(item: PublicViewEnvelope, filter: NewsDateFilter): boolean {
  const publishedAt = item.payload.published_at
  if (typeof publishedAt !== 'string' || Number.isNaN(Date.parse(publishedAt))) {
    return false
  }

  const date = new Date(publishedAt)
  return (!filter.month || date.getUTCMonth() + 1 === filter.month) &&
    (!filter.year || date.getUTCFullYear() === filter.year)
}

// newsPublicationYears returns stable, descending years for the visible archive's date filter.
export function newsPublicationYears(items: PublicViewEnvelope[]): number[] {
  const years = new Set<number>()
  for (const item of items) {
    const publishedAt = item.payload.published_at
    if (typeof publishedAt === 'string' && !Number.isNaN(Date.parse(publishedAt))) {
      years.add(new Date(publishedAt).getUTCFullYear())
    }
  }
  return [...years].sort((left, right) => right - left)
}

// parseBoundedInteger rejects malformed query input before it reaches public filtering logic.
function parseBoundedInteger(value: unknown, minimum: number, maximum: number): number | undefined {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : undefined
}
