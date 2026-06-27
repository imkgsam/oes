export type PageKind = 'OFFICIAL_SITE' | 'SEARCH_RESULTS'

export interface PageSignals {
  capturedAt: string
  companyNameCandidates: string[]
  domain: string
  pageKind: PageKind
  selectedText: string
  socialLinks: string[]
  title: string
  url: string
  visibleEmails: string[]
  visiblePhones: string[]
}

export interface SearchResultCandidateSignal {
  domain: string
  snippet: string
  title: string
  url: string
}

export interface SearchResultSignals {
  capturedAt: string
  query: string
  results: SearchResultCandidateSignal[]
  searchEngine: 'BING' | 'GOOGLE' | 'OTHER'
}

const MAX_SELECTED_TEXT_LENGTH = 600
const MAX_SEARCH_RESULTS = 10
const MAX_IMAGE_SECTION_RESULTS = 8

// Collects bounded customer website evidence from the active document without serializing page body text.
export function collectPageSignalsFromDocument(
  document: Document,
  locationLike: { href: string; selectedText?: string }
): PageSignals {
  const url = new URL(locationLike.href)
  const title = normalizeText(document.title) || normalizeText(document.querySelector('h1')?.textContent)

  return {
    capturedAt: new Date().toISOString(),
    companyNameCandidates: collectCompanyNameCandidates(document, title),
    domain: url.hostname,
    pageKind: 'OFFICIAL_SITE',
    selectedText: clampText(locationLike.selectedText ?? '', MAX_SELECTED_TEXT_LENGTH),
    socialLinks: collectSocialLinks(document),
    title,
    url: url.href,
    visibleEmails: collectEmails(document),
    visiblePhones: collectPhones(document)
  }
}

// Collects bounded search result candidates for read-only CRM status display.
export function collectSearchResultSignalsFromDocument(
  document: Document,
  locationLike: { href: string }
): SearchResultSignals {
  const url = new URL(locationLike.href)
  const webAnchors = collectSearchResultAnchors(document)
  const imageAnchors = collectImageSectionAnchors(document)
  const results: SearchResultCandidateSignal[] = []
  const seen = new Set<string>()

  collectCandidatesFromAnchors(webAnchors, {
    baseHref: url.href,
    maxCount: MAX_SEARCH_RESULTS,
    results,
    seen
  })
  collectCandidatesFromAnchors(imageAnchors, {
    baseHref: url.href,
    maxCount: MAX_IMAGE_SECTION_RESULTS,
    preferImageTitle: true,
    results,
    seen
  })

  return {
    capturedAt: new Date().toISOString(),
    query: normalizeSearchQuery(url),
    results,
    searchEngine: resolveSearchEngine(url.hostname)
  }
}

// Collects the active page from a browser tab after a user-triggered runtime request.
export function collectCurrentPageSignals(): { page?: PageSignals; searchResults?: SearchResultSignals } {
  const maxSelectedTextLength = 600
  const maxSearchResults = 10
  const pageGlobal = globalThis as typeof globalThis & {
    document: Document
    getSelection?: () => Selection | null
    location: Location
  }

  function collectPageSignalsFromCurrentDocument(
    document: Document,
    locationLike: { href: string; selectedText?: string }
  ): PageSignals {
    const url = new URL(locationLike.href)
    const title = normalizeCurrentText(document.title) || normalizeCurrentText(document.querySelector('h1')?.textContent)

    return {
      capturedAt: new Date().toISOString(),
      companyNameCandidates: collectCurrentCompanyNameCandidates(document, title),
      domain: url.hostname,
      pageKind: 'OFFICIAL_SITE',
      selectedText: clampCurrentText(locationLike.selectedText ?? '', maxSelectedTextLength),
      socialLinks: collectCurrentSocialLinks(document),
      title,
      url: url.href,
      visibleEmails: collectCurrentEmails(document),
      visiblePhones: collectCurrentPhones(document)
    }
  }

  function collectSearchResultSignalsFromCurrentDocument(
    document: Document,
    locationLike: { href: string }
  ): SearchResultSignals {
    const url = new URL(locationLike.href)
    const webAnchors = collectCurrentSearchResultAnchors(document)
    const imageAnchors = collectCurrentImageSectionAnchors(document)
    const results: SearchResultCandidateSignal[] = []
    const seen = new Set<string>()

    collectCurrentCandidatesFromAnchors(webAnchors, {
      baseHref: url.href,
      maxCount: maxSearchResults,
      results,
      seen
    })
    collectCurrentCandidatesFromAnchors(imageAnchors, {
      baseHref: url.href,
      maxCount: 8,
      preferImageTitle: true,
      results,
      seen
    })

    return {
      capturedAt: new Date().toISOString(),
      query: normalizeCurrentSearchQuery(url),
      results,
      searchEngine: resolveCurrentSearchEngine(url.hostname)
    }
  }

  function collectCurrentCompanyNameCandidates(document: Document, title: string): string[] {
    return uniqueCurrentStrings([
      normalizeCurrentText(document.querySelector('h1')?.textContent),
      normalizeCurrentTitleCandidate(title)
    ]).slice(0, 3)
  }

  function collectCurrentEmails(document: Document): string[] {
    const values = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="mailto:"]')).map((anchor) =>
      anchor.href.replace(/^mailto:/i, '').split('?')[0]
    )
    return uniqueCurrentStrings(values).slice(0, 5)
  }

  function collectCurrentPhones(document: Document): string[] {
    const values = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]')).map((anchor) =>
      decodeURIComponent(anchor.href.replace(/^tel:/i, ''))
    )
    return uniqueCurrentStrings(values).slice(0, 5)
  }

  function collectCurrentSocialLinks(document: Document): string[] {
    const socialSelector = [
      'a[href*="linkedin.com"]',
      'a[href*="facebook.com"]',
      'a[href*="instagram.com"]',
      'a[href*="x.com"]',
      'a[href*="twitter.com"]'
    ].join(',')
    const values = Array.from(document.querySelectorAll<HTMLAnchorElement>(socialSelector))
      .map((anchor) => anchor.href)
      .filter((href) => /linkedin\.com|facebook\.com|instagram\.com|x\.com|twitter\.com/i.test(href))
    return uniqueCurrentStrings(values).slice(0, 5)
  }

  function normalizeCurrentSearchQuery(url: URL): string {
    return normalizeCurrentText(url.searchParams.get('q') ?? url.searchParams.get('query') ?? '')
  }

  function resolveCurrentSearchEngine(hostname: string): SearchResultSignals['searchEngine'] {
    if (/google\./i.test(hostname)) {
      return 'GOOGLE'
    }

    if (/bing\./i.test(hostname)) {
      return 'BING'
    }

    return 'OTHER'
  }

  function isCurrentSearchEngineHost(hostname: string): boolean {
    return /(^|\.)google\.|(^|\.)bing\.|(^|\.)search\.yahoo\./i.test(hostname)
  }

  function collectCurrentSearchResultAnchors(document: Document): HTMLAnchorElement[] {
    return Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]')).filter((anchor) =>
      Boolean(anchor.querySelector('h3'))
    )
  }

  function collectCurrentImageSectionAnchors(document: Document): HTMLAnchorElement[] {
    const selectors = [
      'a[data-oes-image-result="true"][href]',
      'a[href*="/imgres"][href]',
      'a[href*="imgrefurl="][href]',
      'a[href*="tbm=isch"][href]',
      'a[aria-labelledby][href]'
    ].join(',')
    const anchors = new Set<HTMLAnchorElement>(document.querySelectorAll<HTMLAnchorElement>(selectors))
    document.querySelectorAll<HTMLImageElement>('a[href] img').forEach((image) => {
      const anchor = image.closest<HTMLAnchorElement>('a[href]')
      if (anchor) {
        anchors.add(anchor)
      }
    })
    return Array.from(anchors).filter((anchor) => isCurrentImageSectionAnchor(anchor))
  }

  function isCurrentImageSectionAnchor(anchor: HTMLAnchorElement): boolean {
    if (anchor.querySelector('h3')) {
      return false
    }
    if (anchor.dataset.oesImageResult === 'true') {
      return true
    }

    const href = anchor.getAttribute('href') ?? anchor.href
    return /\/imgres|imgrefurl=|tbm=isch/i.test(href) ||
      hasCurrentNearbyImagesHeading(anchor) ||
      hasCurrentImageCardSiblingMetadata(anchor) ||
      isCurrentGoogleAllTabImageOverlayAnchor(anchor)
  }

  // Recognizes Google All-tab image cards where the clickable link is an empty overlay and metadata is in sibling nodes.
  function isCurrentGoogleAllTabImageOverlayAnchor(anchor: HTMLAnchorElement): boolean {
    return normalizeCurrentText(anchor.textContent) === '' &&
      resolveCurrentAriaLabelledTitle(anchor) !== '' &&
      hasCurrentNearbyImageEvidence(anchor)
  }

  // Checks only the local card ancestry for product-image evidence to avoid treating unrelated page chrome as image results.
  function hasCurrentNearbyImageEvidence(anchor: Element): boolean {
    let current: Element | null = anchor
    let depth = 0
    while (current && depth < 5) {
      const image = Array.from(current.querySelectorAll<HTMLImageElement>('img')).find((candidate) =>
        isCurrentProductImageCandidate(candidate)
      )
      if (image) {
        return true
      }
      current = current.parentElement
      depth += 1
    }
    return false
  }

  // Filters out favicon-like images while accepting Google thumbnail images that may be lazy-loaded.
  function isCurrentProductImageCandidate(image: HTMLImageElement): boolean {
    const alt = normalizeCurrentText(image.getAttribute('alt'))
    const src = image.getAttribute('src') ?? ''
    const dataSrc = image.getAttribute('data-src') ?? ''
    return alt !== '' || /encrypted-tbn|data:image\/(?:jpeg|jpg|webp|png)/i.test(`${src} ${dataSrc}`)
  }

  function hasCurrentImageCardSiblingMetadata(anchor: HTMLAnchorElement): boolean {
    return Boolean(anchor.querySelector('img') && resolveCurrentImageCardSiblingMetadata(anchor))
  }

  function resolveCurrentImageCardSiblingMetadata(anchor: Element): Element | null {
    let current: Element | null = anchor
    let depth = 0
    while (current && depth < 5) {
      let sibling = current.nextElementSibling
      let siblingDepth = 0
      while (sibling && siblingDepth < 4) {
        if (
          normalizeCurrentText(sibling.textContent) &&
          !sibling.querySelector('img') &&
          !anchor.contains(sibling)
        ) {
          return sibling
        }
        sibling = sibling.nextElementSibling
        siblingDepth += 1
      }
      current = current.parentElement
      depth += 1
    }
    return null
  }

  function hasCurrentNearbyImagesHeading(anchor: Element): boolean {
    let current: Element | null = anchor
    let depth = 0
    while (current && depth < 6) {
      const ariaLabel = current.getAttribute('aria-label') ?? ''
      if (/^images$/i.test(normalizeCurrentText(ariaLabel))) {
        return true
      }
      const directHeading = Array.from(current.children).find((child) =>
        /^H[1-6]$/i.test(child.tagName) && /^images$/i.test(normalizeCurrentText(child.textContent))
      )
      if (directHeading) {
        return true
      }
      let sibling = current.previousElementSibling
      let siblingDepth = 0
      while (sibling && siblingDepth < 3) {
        if (/^images$/i.test(normalizeCurrentText(sibling.textContent))) {
          return true
        }
        sibling = sibling.previousElementSibling
        siblingDepth += 1
      }
      current = current.parentElement
      depth += 1
    }
    return false
  }

  function collectCurrentCandidatesFromAnchors(
    anchors: HTMLAnchorElement[],
    options: {
      baseHref: string
      maxCount: number
      preferImageTitle?: boolean
      results: SearchResultCandidateSignal[]
      seen: Set<string>
    }
  ): void {
    let added = 0
    for (const anchor of anchors) {
      if (added >= options.maxCount) {
        break
      }

      const href = normalizeCurrentSearchResultUrl(anchor.getAttribute('href') ?? anchor.href, options.baseHref)
      if (!href || options.seen.has(href)) {
        continue
      }

      const resultUrl = new URL(href)
      if (isCurrentSearchEngineHost(resultUrl.hostname)) {
        continue
      }

      options.seen.add(href)
      options.results.push({
        domain: resultUrl.hostname,
        snippet: '',
        title: resolveCurrentAnchorTitle(anchor, resultUrl.hostname, options.preferImageTitle === true),
        url: resultUrl.href
      })
      added += 1
    }
  }

  function resolveCurrentAnchorTitle(anchor: HTMLAnchorElement, fallback: string, preferImageTitle: boolean): string {
    const labelledTitle = resolveCurrentAriaLabelledTitle(anchor)
    const siblingTitle = normalizeCurrentText(resolveCurrentImageCardSiblingMetadata(anchor)?.textContent)
    const imageTitle = normalizeCurrentText(anchor.querySelector('img')?.getAttribute('alt')) ||
      normalizeCurrentText(anchor.getAttribute('aria-label'))
    const textTitle = normalizeCurrentText(anchor.textContent)
    return (preferImageTitle
      ? textTitle || labelledTitle || siblingTitle || imageTitle
      : textTitle || labelledTitle || siblingTitle || imageTitle) || fallback
  }

  function resolveCurrentAriaLabelledTitle(anchor: HTMLAnchorElement): string {
    const ids = normalizeCurrentText(anchor.getAttribute('aria-labelledby')).split(' ').filter(Boolean)
    const cardRoot = resolveCurrentImageCardRoot(anchor)
    for (const id of ids) {
      const scopedLabel = cardRoot ? normalizeCurrentText(findCurrentElementById(cardRoot, id)?.textContent) : ''
      if (scopedLabel) {
        return scopedLabel
      }
      const label = normalizeCurrentText(anchor.ownerDocument.getElementById(id)?.textContent)
      if (label) {
        return label
      }
    }
    return ''
  }

  function resolveCurrentImageCardRoot(anchor: Element): Element | null {
    let current: Element | null = anchor
    let depth = 0
    while (current && depth < 6) {
      const hasImage = Array.from(current.querySelectorAll<HTMLImageElement>('img')).some((image) =>
        isCurrentProductImageCandidate(image)
      )
      if (hasImage && current.querySelector('[id]')) {
        return current
      }
      current = current.parentElement
      depth += 1
    }
    return null
  }

  function findCurrentElementById(root: Element, id: string): Element | null {
    return Array.from(root.querySelectorAll('[id]')).find((element) => element.id === id) ?? null
  }

  function normalizeCurrentSearchResultUrl(href: string, baseHref: string): string {
    try {
      const url = new URL(href, baseHref)
      const nested = url.searchParams.get('imgrefurl') || url.searchParams.get('url') || url.searchParams.get('q')
      if (nested?.startsWith('http')) {
        return new URL(nested).href
      }
      return url.href
    } catch {
      return ''
    }
  }

  function normalizeCurrentTitleCandidate(title: string): string {
    return normalizeCurrentText(title.split(/\s[-|]\s/)[0])
  }

  function normalizeCurrentText(value: string | null | undefined): string {
    return (value ?? '').replace(/\s+/g, ' ').trim()
  }

  function clampCurrentText(value: string, maxLength: number): string {
    const normalized = normalizeCurrentText(value)
    return normalized.length > maxLength ? normalized.slice(0, maxLength) : normalized
  }

  function uniqueCurrentStrings(values: Array<string | null | undefined>): string[] {
    return Array.from(new Set(values.map(normalizeCurrentText).filter(Boolean)))
  }

  if (isCurrentSearchEngineHost(pageGlobal.location.hostname)) {
    return {
      searchResults: collectSearchResultSignalsFromCurrentDocument(pageGlobal.document, {
        href: pageGlobal.location.href
      })
    }
  }

  return {
    page: collectPageSignalsFromCurrentDocument(pageGlobal.document, {
      href: pageGlobal.location.href,
      selectedText: pageGlobal.getSelection?.()?.toString() ?? ''
    })
  }
}

function collectCompanyNameCandidates(document: Document, title: string): string[] {
  return uniqueStrings([
    normalizeText(document.querySelector('h1')?.textContent),
    normalizeTitleCandidate(title)
  ]).slice(0, 3)
}

function collectEmails(document: Document): string[] {
  const values = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="mailto:"]')).map((anchor) =>
    anchor.href.replace(/^mailto:/i, '').split('?')[0]
  )
  return uniqueStrings(values).slice(0, 5)
}

function collectPhones(document: Document): string[] {
  const values = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]')).map((anchor) =>
    decodeURIComponent(anchor.href.replace(/^tel:/i, ''))
  )
  return uniqueStrings(values).slice(0, 5)
}

function collectSocialLinks(document: Document): string[] {
  const values = Array.from(document.querySelectorAll<HTMLAnchorElement>([
    'a[href*="linkedin.com"]',
    'a[href*="facebook.com"]',
    'a[href*="instagram.com"]',
    'a[href*="x.com"]',
    'a[href*="twitter.com"]'
  ].join(',')))
    .map((anchor) => anchor.href)
    .filter((href) => /linkedin\.com|facebook\.com|instagram\.com|x\.com|twitter\.com/i.test(href))
  return uniqueStrings(values).slice(0, 5)
}

function normalizeSearchQuery(url: URL): string {
  return normalizeText(url.searchParams.get('q') ?? url.searchParams.get('query') ?? '')
}

function resolveSearchEngine(hostname: string): SearchResultSignals['searchEngine'] {
  if (/google\./i.test(hostname)) {
    return 'GOOGLE'
  }

  if (/bing\./i.test(hostname)) {
    return 'BING'
  }

  return 'OTHER'
}

function isSearchEngineHost(hostname: string): boolean {
  return /(^|\.)google\.|(^|\.)bing\.|(^|\.)search\.yahoo\./i.test(hostname)
}

function collectSearchResultAnchors(document: Document): HTMLAnchorElement[] {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]')).filter((anchor) =>
    Boolean(anchor.querySelector('h3'))
  )
}

function collectImageSectionAnchors(document: Document): HTMLAnchorElement[] {
  const selectors = [
    'a[data-oes-image-result="true"][href]',
    'a[href*="/imgres"][href]',
    'a[href*="imgrefurl="][href]',
    'a[href*="tbm=isch"][href]',
    'a[aria-labelledby][href]'
  ].join(',')
  const anchors = new Set<HTMLAnchorElement>(document.querySelectorAll<HTMLAnchorElement>(selectors))
  document.querySelectorAll<HTMLImageElement>('a[href] img').forEach((image) => {
    const anchor = image.closest<HTMLAnchorElement>('a[href]')
    if (anchor) {
      anchors.add(anchor)
    }
  })
  return Array.from(anchors).filter((anchor) => isImageSectionAnchor(anchor))
}

function isImageSectionAnchor(anchor: HTMLAnchorElement): boolean {
  if (anchor.querySelector('h3')) {
    return false
  }
  if (anchor.dataset.oesImageResult === 'true') {
    return true
  }

  const href = anchor.getAttribute('href') ?? anchor.href
  return /\/imgres|imgrefurl=|tbm=isch/i.test(href) ||
    hasNearbyImagesHeading(anchor) ||
    hasImageCardSiblingMetadata(anchor) ||
    isGoogleAllTabImageOverlayAnchor(anchor)
}

// Recognizes Google All-tab image cards where the clickable link is an empty overlay and metadata is in sibling nodes.
function isGoogleAllTabImageOverlayAnchor(anchor: HTMLAnchorElement): boolean {
  return normalizeText(anchor.textContent) === '' &&
    resolveAriaLabelledTitle(anchor) !== '' &&
    hasNearbyImageEvidence(anchor)
}

// Checks only the local card ancestry for product-image evidence to avoid treating unrelated page chrome as image results.
function hasNearbyImageEvidence(anchor: Element): boolean {
  let current: Element | null = anchor
  let depth = 0
  while (current && depth < 5) {
    const image = Array.from(current.querySelectorAll<HTMLImageElement>('img')).find((candidate) =>
      isProductImageCandidate(candidate)
    )
    if (image) {
      return true
    }
    current = current.parentElement
    depth += 1
  }
  return false
}

// Filters out favicon-like images while accepting Google thumbnail images that may be lazy-loaded.
function isProductImageCandidate(image: HTMLImageElement): boolean {
  const alt = normalizeText(image.getAttribute('alt'))
  const src = image.getAttribute('src') ?? ''
  const dataSrc = image.getAttribute('data-src') ?? ''
  return alt !== '' || /encrypted-tbn|data:image\/(?:jpeg|jpg|webp|png)/i.test(`${src} ${dataSrc}`)
}

function hasImageCardSiblingMetadata(anchor: HTMLAnchorElement): boolean {
  return Boolean(anchor.querySelector('img') && resolveImageCardSiblingMetadata(anchor))
}

function resolveImageCardSiblingMetadata(anchor: Element): Element | null {
  let current: Element | null = anchor
  let depth = 0
  while (current && depth < 5) {
    let sibling = current.nextElementSibling
    let siblingDepth = 0
    while (sibling && siblingDepth < 4) {
      if (normalizeText(sibling.textContent) && !sibling.querySelector('img') && !anchor.contains(sibling)) {
        return sibling
      }
      sibling = sibling.nextElementSibling
      siblingDepth += 1
    }
    current = current.parentElement
    depth += 1
  }
  return null
}

function hasNearbyImagesHeading(anchor: Element): boolean {
  let current: Element | null = anchor
  let depth = 0
  while (current && depth < 6) {
    const ariaLabel = current.getAttribute('aria-label') ?? ''
    if (/^images$/i.test(normalizeText(ariaLabel))) {
      return true
    }
    const directHeading = Array.from(current.children).find((child) =>
      /^H[1-6]$/i.test(child.tagName) && /^images$/i.test(normalizeText(child.textContent))
    )
    if (directHeading) {
      return true
    }
    let sibling = current.previousElementSibling
    let siblingDepth = 0
    while (sibling && siblingDepth < 3) {
      if (/^images$/i.test(normalizeText(sibling.textContent))) {
        return true
      }
      sibling = sibling.previousElementSibling
      siblingDepth += 1
    }
    current = current.parentElement
    depth += 1
  }
  return false
}

function collectCandidatesFromAnchors(
  anchors: HTMLAnchorElement[],
  options: {
    baseHref: string
    maxCount: number
    preferImageTitle?: boolean
    results: SearchResultCandidateSignal[]
    seen: Set<string>
  }
): void {
  let added = 0
  for (const anchor of anchors) {
    if (added >= options.maxCount) {
      break
    }

    const href = normalizeSearchResultUrl(anchor.getAttribute('href') ?? anchor.href, options.baseHref)
    if (!href || options.seen.has(href)) {
      continue
    }

    const resultUrl = new URL(href)
    if (isSearchEngineHost(resultUrl.hostname)) {
      continue
    }

    options.seen.add(href)
    options.results.push({
      domain: resultUrl.hostname,
      snippet: '',
      title: resolveAnchorTitle(anchor, resultUrl.hostname, options.preferImageTitle === true),
      url: resultUrl.href
    })
    added += 1
  }
}

function resolveAnchorTitle(anchor: HTMLAnchorElement, fallback: string, preferImageTitle: boolean): string {
  const labelledTitle = resolveAriaLabelledTitle(anchor)
  const siblingTitle = normalizeText(resolveImageCardSiblingMetadata(anchor)?.textContent)
  const imageTitle = normalizeText(anchor.querySelector('img')?.getAttribute('alt')) ||
    normalizeText(anchor.getAttribute('aria-label'))
  const textTitle = normalizeText(anchor.textContent)
  return (preferImageTitle
    ? textTitle || labelledTitle || siblingTitle || imageTitle
    : textTitle || labelledTitle || siblingTitle || imageTitle) || fallback
}

function resolveAriaLabelledTitle(anchor: HTMLAnchorElement): string {
  const ids = normalizeText(anchor.getAttribute('aria-labelledby')).split(' ').filter(Boolean)
  const cardRoot = resolveImageCardRoot(anchor)
  for (const id of ids) {
    const scopedLabel = cardRoot ? normalizeText(findElementById(cardRoot, id)?.textContent) : ''
    if (scopedLabel) {
      return scopedLabel
    }
    const label = normalizeText(anchor.ownerDocument.getElementById(id)?.textContent)
    if (label) {
      return label
    }
  }
  return ''
}

function resolveImageCardRoot(anchor: Element): Element | null {
  let current: Element | null = anchor
  let depth = 0
  while (current && depth < 6) {
    const hasImage = Array.from(current.querySelectorAll<HTMLImageElement>('img')).some((image) =>
      isProductImageCandidate(image)
    )
    if (hasImage && current.querySelector('[id]')) {
      return current
    }
    current = current.parentElement
    depth += 1
  }
  return null
}

function findElementById(root: Element, id: string): Element | null {
  return Array.from(root.querySelectorAll('[id]')).find((element) => element.id === id) ?? null
}

function normalizeSearchResultUrl(href: string, baseHref: string): string {
  try {
    const url = new URL(href, baseHref)
    const nested = url.searchParams.get('imgrefurl') || url.searchParams.get('url') || url.searchParams.get('q')
    if (nested?.startsWith('http')) {
      return new URL(nested).href
    }
    return url.href
  } catch {
    return ''
  }
}

function normalizeTitleCandidate(title: string): string {
  return normalizeText(title.split(/\s[-|]\s/)[0])
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function clampText(value: string, maxLength: number): string {
  const normalized = normalizeText(value)
  return normalized.length > maxLength ? normalized.slice(0, maxLength) : normalized
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map(normalizeText).filter(Boolean)))
}
