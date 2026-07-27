import { canonicalPageNumber } from '../types/site-route-policy'
import { parseNewsDateFilter, type NewsDateFilter } from './news-date-filter'

export interface NewsRootArchiveRouteState {
  dateFilter: NewsDateFilter
}

export interface NewsCategoryArchiveRouteState extends NewsRootArchiveRouteState {
  page: number
}

// normalizeArchivePage gives public archive page queries one safe, one-based semantic identity.
export function normalizeArchivePage(value: unknown): number {
  return canonicalPageNumber(value) ?? 1
}

// buildArchiveRouteKey remounts an archive only when its path or normalized page meaning changes.
export function buildArchiveRouteKey(path: string, query: Record<string, unknown>): string {
  return `${path}?page=${normalizeArchivePage(query.page)}`
}

// parseNewsRootArchiveRouteState derives only date-filter semantics for the root load-more archive.
export function parseNewsRootArchiveRouteState(
  query: Record<string, unknown>
): NewsRootArchiveRouteState {
  return {
    dateFilter: parseNewsDateFilter(query)
  }
}

// parseNewsCategoryArchiveRouteState preserves page and date-filter semantics for paginated categories.
export function parseNewsCategoryArchiveRouteState(
  query: Record<string, unknown>
): NewsCategoryArchiveRouteState {
  return {
    page: normalizeArchivePage(query.page),
    dateFilter: parseNewsDateFilter(query)
  }
}

// buildNewsRootArchiveRouteKey excludes page noise from root load-more page and session identity.
export function buildNewsRootArchiveRouteKey(
  path: string,
  state: NewsRootArchiveRouteState
): string {
  return buildNewsDateFilterRouteKey(path, state.dateFilter)
}

// buildNewsCategoryArchiveRouteKey retains page identity for directly accessible category pages.
export function buildNewsCategoryArchiveRouteKey(
  path: string,
  state: NewsCategoryArchiveRouteState
): string {
  return buildNewsDateFilterRouteKey(path, state.dateFilter, state.page)
}

// buildNewsDateFilterRouteKey serializes one normalized News filter with optional category pagination.
function buildNewsDateFilterRouteKey(
  path: string,
  dateFilter: NewsDateFilter,
  page?: number
): string {
  const { month, year } = dateFilter
  const fields = [
    ...(page === undefined ? [] : [`page=${page}`]),
    `month=${month ?? 'all'}`,
    `year=${year ?? 'all'}`
  ]
  return `${path}?${fields.join('&')}`
}
