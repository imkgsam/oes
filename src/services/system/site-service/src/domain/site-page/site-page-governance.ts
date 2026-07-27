import { createHash } from 'node:crypto'
import {
  SitePageCapabilityDeclaration,
  validateSiteCapabilityManifest
} from './site-capability-registration'

export type { SitePageCapabilityDeclaration } from './site-capability-registration'

export interface SitePageCapabilityRecord extends SitePageCapabilityDeclaration {
  available: boolean
  enabled: boolean
  indexable: boolean
  syncStatus: string
  lastDiscoveredAt: Date
}

export interface SitePageCapabilityState extends SitePageCapabilityRecord {
  drift: boolean
}

export type SitePagePreflightIssueCode =
  | 'SITE_PAGE_CAPABILITY_DRIFT'
  | 'SITE_PAGE_LOCALE_COVERAGE_INCOMPLETE'

export interface SitePagePreflightIssue {
  code: SitePagePreflightIssueCode
  pageKey: string
  locale: string
}

/** canonicalManifestHash produces the frozen snake_case UTF-8 manifest bytes and SHA-256 identity. */
export function canonicalManifestHash(declarations: SitePageCapabilityDeclaration[]): {
  canonicalJson: string
  hash: string
} {
  const canonicalPages = validateSiteCapabilityManifest(declarations)
    .map((declaration) => {
      return {
        page_key: declaration.pageKey,
        supported_locales: [...declaration.supportedLocales].sort(utf8UnsignedCompare)
      }
    })
    .sort((left, right) => utf8UnsignedCompare(left.page_key, right.page_key))
  const canonicalJson = JSON.stringify(canonicalPages)
  return {
    canonicalJson,
    hash: createHash('sha256').update(Buffer.from(canonicalJson, 'utf8')).digest('hex')
  }
}

/** evaluateCapabilityRegistration applies one complete manifest while preserving operator-owned governance fields. */
export function evaluateCapabilityRegistration(input: {
  existing: SitePageCapabilityRecord[]
  declared: SitePageCapabilityDeclaration[]
  discoveredAt?: Date
}) {
  const discoveredAt = input.discoveredAt ?? new Date()
  const existingByKey = new Map(input.existing.map((page) => [page.pageKey, page]))
  const declaredByKey = new Map(
    validateSiteCapabilityManifest(input.declared).map((page) => [
      page.pageKey,
      { ...page, supportedLocales: [...page.supportedLocales].sort(utf8UnsignedCompare) }
    ])
  )
  const disappearedPageKeys: string[] = []
  const recoveredPageKeys: string[] = []
  const pages: SitePageCapabilityState[] = []

  for (const declaration of declaredByKey.values()) {
    const previous = existingByKey.get(declaration.pageKey)
    if (previous && !previous.available && previous.enabled) {
      recoveredPageKeys.push(declaration.pageKey)
    }
    pages.push({
      ...declaration,
      available: true,
      enabled: previous?.enabled ?? false,
      indexable: previous?.indexable ?? false,
      syncStatus: previous?.syncStatus ?? 'synced',
      lastDiscoveredAt: discoveredAt,
      drift: false
    })
  }

  for (const previous of input.existing) {
    if (declaredByKey.has(previous.pageKey)) {
      continue
    }
    disappearedPageKeys.push(previous.pageKey)
    pages.push({ ...previous, available: false, drift: previous.enabled })
  }

  return {
    pages: pages.sort((left, right) => utf8UnsignedCompare(left.pageKey, right.pageKey)),
    disappearedPageKeys: disappearedPageKeys.sort(utf8UnsignedCompare),
    driftPageKeys: pages
      .filter((page) => page.drift)
      .map((page) => page.pageKey)
      .sort(utf8UnsignedCompare),
    recoveredPageKeys: recoveredPageKeys.sort(utf8UnsignedCompare)
  }
}

/** evaluateSitePagePreflight checks enabled page discovery and locale coverage without inventing page kinds. */
export function evaluateSitePagePreflight(input: {
  activeLocales: string[]
  activatingLocale?: string
  pages: SitePageCapabilityRecord[]
}) {
  const locales = uniqueSorted([
    ...input.activeLocales,
    ...(input.activatingLocale ? [input.activatingLocale] : [])
  ])
  const issues: SitePagePreflightIssue[] = []

  for (const page of input.pages
    .filter((candidate) => candidate.enabled)
    .sort((left, right) => utf8UnsignedCompare(left.pageKey, right.pageKey))) {
    if (!page.available) {
      issues.push({ code: 'SITE_PAGE_CAPABILITY_DRIFT', pageKey: page.pageKey, locale: '' })
      continue
    }
    const supported = new Set(page.supportedLocales)
    for (const locale of locales) {
      if (!supported.has(locale)) {
        issues.push({ code: 'SITE_PAGE_LOCALE_COVERAGE_INCOMPLETE', pageKey: page.pageKey, locale })
      }
    }
  }

  return { ok: issues.length === 0, issues }
}

/** buildSiteExposurePublication creates the slug-free governance payload committed with one publish version. */
export function buildSiteExposurePublication(input: {
  siteId: string
  publishVersion: number
  defaultLocale: string
  activeLocales: string[]
  pages: SitePageCapabilityRecord[]
  publishedAt: Date
}) {
  return {
    siteId: input.siteId,
    publishVersion: input.publishVersion,
    defaultLocale: input.defaultLocale,
    activeLocales: uniqueSorted(input.activeLocales),
    pages: input.pages
      .map((page) => ({
        pageKey: page.pageKey,
        enabled: page.enabled,
        indexable: page.indexable,
        supportedLocales: uniqueSorted(page.supportedLocales)
      }))
      .sort((left, right) => utf8UnsignedCompare(left.pageKey, right.pageKey)),
    publishedAt: input.publishedAt.toISOString()
  }
}

/** uniqueSorted creates deterministic string sets for hashing, persistence, and publication. */
function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort(utf8UnsignedCompare)
}

/** utf8UnsignedCompare orders strings by their unsigned UTF-8 byte sequences without normalization. */
function utf8UnsignedCompare(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'))
}
