export const MEILONG_TERMINAL_CONTENT_DETAIL_SLUGS = [
  'category',
  'topic',
  'categories'
] as const

const terminalContentDetailSlugSet = new Set<string>(
  MEILONG_TERMINAL_CONTENT_DETAIL_SLUGS
)

// normalizeContentDetailSlug gives Runtime archive and SEO reads one safe decoded slug identity.
export function normalizeContentDetailSlug(slug: string): string | undefined {
  let decodedSlug: string
  try {
    decodedSlug = decodeURIComponent(slug).normalize('NFC')
  } catch {
    return undefined
  }
  if (
    !decodedSlug ||
    decodedSlug.includes('/') ||
    decodedSlug.includes('\\') ||
    decodedSlug === '.' ||
    decodedSlug === '..'
  ) {
    return undefined
  }
  return decodedSlug.toLowerCase()
}

// isRoutableContentDetailSlug rejects unsafe and reserved Blog/News detail slugs with normalized semantics.
export function isRoutableContentDetailSlug(slug: string): boolean {
  const semanticSlug = normalizeContentDetailSlug(slug)
  return semanticSlug !== undefined && !terminalContentDetailSlugSet.has(semanticSlug)
}
