export interface CrmSearchAnnotationResultItem {
  archiveReason?: string
  archivedAt?: string
  deepLinks?: { tenantWebCrmAccountUrl?: string }
  domain?: string
  duplicateHints?: Array<{
    archiveReason?: string
    archivedAt?: string
    lifecycleStage?: string
    ownerKind?: string
    recordStatus?: string
  }>
  lifecycleStage?: string
  matchedFields?: string[]
  matchedAccount?: {
    archiveReason?: string
    archivedAt?: string
    crmAccountId?: string
    lifecycleStage?: string
    ownerKind?: string
    recordStatus?: string
  } | null
  ownerKind?: string
  recordStatus?: string
  status: string
  summary?: {
    displayName?: string
    label?: string
  }
  tags?: Array<{
    label: string
    type?: string
  }>
  title?: string
  url: string
}

export interface CrmSearchAnnotationInput {
  document?: Document
  results: CrmSearchAnnotationResultItem[]
  tenantWebBaseUrl: string
}

export interface CrmSearchAnnotationResult {
  annotatedCount: number
}

export interface CrmSearchAnnotationClearInput {
  document?: Document
}

export interface CrmSearchAnnotationClearResult {
  removedCount: number
}

// Removes all OES CRM search-page DOM injected by the extension from the current document.
export function clearCrmSearchResultsAnnotationsInCurrentDocument(
  input: CrmSearchAnnotationClearInput = {}
): CrmSearchAnnotationClearResult {
  const pageDocument = input.document ?? globalThis.document
  if (!pageDocument) {
    return { removedCount: 0 }
  }

  const annotations = Array.from(pageDocument.querySelectorAll('.oes-crm-search-annotation'))
  annotations.forEach((node) => node.remove())
  pageDocument.getElementById('oes-crm-search-annotation-style')?.remove()

  return { removedCount: annotations.length }
}

// Injects read-only CRM status badges into the current Google result page without exposing auth state to the page.
export function annotateCrmSearchResultsInCurrentDocument(input: CrmSearchAnnotationInput): CrmSearchAnnotationResult {
  const pageDocument = input.document ?? globalThis.document
  if (!pageDocument || !Array.isArray(input.results)) {
    return { annotatedCount: 0 }
  }

  function ensureStyle(): void {
    if (pageDocument.getElementById('oes-crm-search-annotation-style')) {
      return
    }

    const style = pageDocument.createElement('style')
    style.id = 'oes-crm-search-annotation-style'
    style.textContent = `
      .oes-crm-search-annotation {
        align-items: center;
        display: inline-flex;
        flex-wrap: wrap;
        gap: 5px;
        direction: ltr;
        margin-left: 8px;
        unicode-bidi: isolate;
        vertical-align: middle;
      }
      .oes-crm-image-annotation {
        display: flex;
        margin: 6px 0 0;
      }
      .oes-crm-search-badge {
        align-items: center;
        background: #f6f8f7;
        border: 1px solid #d7dfd9;
        border-radius: 999px;
        color: #25342a;
        display: inline-flex;
        font: 500 12px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0;
        padding: 4px 8px;
        white-space: nowrap;
      }
      .oes-crm-search-badge[data-tag-tone="customer"] {
        background: #edf7f1;
        border-color: #b9dcc5;
        color: #174c2c;
      }
      .oes-crm-search-badge[data-tag-tone="owner-self"] {
        background: #eef5fb;
        border-color: #bed4e8;
        color: #1d4d73;
      }
      .oes-crm-search-badge[data-tag-tone="owner-pool"] {
        background: #fff8e8;
        border-color: #ead39a;
        color: #664513;
      }
      .oes-crm-search-badge[data-tag-tone="owner-other"] {
        background: #f5f5f5;
        border-color: #d8d8d8;
        color: #525252;
      }
      .oes-crm-search-badge[data-tag-tone="lifecycle-lead"] {
        background: #eef9fb;
        border-color: #b9dde4;
        color: #1f5e68;
      }
      .oes-crm-search-badge[data-tag-tone="lifecycle-pc"] {
        background: #eef7f5;
        border-color: #b7d9d2;
        color: #1f5d51;
      }
      .oes-crm-search-badge[data-tag-tone="lifecycle-customer"] {
        background: #edf7f1;
        border-color: #b9dcc5;
        color: #174c2c;
      }
      .oes-crm-search-badge[data-tag-tone="archived"] {
        background: #f3f4f4;
        border-color: #d6dada;
        color: #5f6965;
      }
      .oes-crm-search-badge[data-tag-tone="archive-low-value"],
      .oes-crm-search-badge[data-tag-tone="archive-no-fit"],
      .oes-crm-search-badge[data-tag-tone="archive-unresponsive"] {
        background: #fff8e8;
        border-color: #ead39a;
        color: #664513;
      }
      .oes-crm-search-badge[data-tag-tone="archive-invalid"] {
        background: #fff1ed;
        border-color: #efc1b4;
        color: #7a3727;
      }
      .oes-crm-search-badge[data-tag-tone="archive-non-target"],
      .oes-crm-search-badge[data-tag-tone="archive-duplicate"] {
        background: #f1f5ff;
        border-color: #c9d7f2;
        color: #284d8f;
      }
      .oes-crm-search-badge[data-tag-tone="archive-other"] {
        background: #f5f2ff;
        border-color: #d8cef3;
        color: #554084;
      }
    `
    pageDocument.head?.appendChild(style)
  }

  function clearExistingAnnotations(): void {
    pageDocument.querySelectorAll('.oes-crm-search-annotation').forEach((node) => node.remove())
    pageDocument.getElementById('oes-crm-search-annotation-style')?.remove()
  }

  function normalizeCandidateUrl(value: string): string {
    try {
      const url = new URL(value, pageDocument.location?.href || 'https://www.google.com/')
      const nested = url.searchParams.get('imgrefurl') || url.searchParams.get('url') || url.searchParams.get('q')
      const normalized = nested?.startsWith('http') ? new URL(nested) : url
      normalized.hash = ''
      return `${normalized.origin}${normalized.pathname.replace(/\/$/, '')}${normalized.search}`
    } catch {
      return ''
    }
  }

  function findResultAnchors(resultUrl: string): HTMLAnchorElement[] {
    const normalizedResultUrl = normalizeCandidateUrl(resultUrl)
    if (!normalizedResultUrl) {
      return []
    }

    const titleAnchors = Array.from(pageDocument.querySelectorAll<HTMLAnchorElement>('a[href]')).filter((anchor) =>
      Boolean(anchor.querySelector('h3'))
    )
    const imageAnchors = collectImageSectionAnchors()

    const matches = new Set<HTMLAnchorElement>()
    for (const anchor of [...titleAnchors, ...imageAnchors]) {
      if (normalizeCandidateUrl(anchor.getAttribute('href') ?? anchor.href) === normalizedResultUrl) {
        matches.add(anchor)
      }
    }
    return Array.from(matches)
  }

  function collectImageSectionAnchors(): HTMLAnchorElement[] {
    const selectors = [
      'a[data-oes-image-result="true"][href]',
      'a[href*="/imgres"][href]',
      'a[href*="imgrefurl="][href]',
      'a[href*="tbm=isch"][href]',
      'a[aria-labelledby][href]'
    ].join(',')
    const anchors = new Set<HTMLAnchorElement>(pageDocument.querySelectorAll<HTMLAnchorElement>(selectors))
    pageDocument.querySelectorAll<HTMLImageElement>('a[href] img').forEach((image) => {
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
    return normalizeAnnotationText(anchor.textContent) === '' &&
      resolveAriaLabelledTitle(anchor) !== '' &&
      hasNearbyImageEvidence(anchor)
  }

  // Resolves the visible title referenced by an overlay card's aria-labelledby attribute.
  function resolveAriaLabelledTitle(anchor: HTMLAnchorElement): string {
    const ids = normalizeAnnotationText(anchor.getAttribute('aria-labelledby')).split(' ').filter(Boolean)
    const cardRoot = resolveImageCardRoot(anchor)
    for (const id of ids) {
      const scopedLabel = cardRoot ? normalizeAnnotationText(findElementById(cardRoot, id)?.textContent) : ''
      if (scopedLabel) {
        return scopedLabel
      }
      const label = normalizeAnnotationText(pageDocument.getElementById(id)?.textContent)
      if (label) {
        return label
      }
    }
    return ''
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
    const alt = normalizeAnnotationText(image.getAttribute('alt'))
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
        if (
          normalizeAnnotationText(sibling.textContent) &&
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

  function resolveImageAnnotationTarget(anchor: HTMLAnchorElement): Element {
    const ids = normalizeAnnotationText(anchor.getAttribute('aria-labelledby')).split(' ').filter(Boolean)
    const cardRoot = resolveImageCardRoot(anchor)
    for (const id of ids) {
      const label = (cardRoot ? findElementById(cardRoot, id) : null) ?? pageDocument.getElementById(id)
      if (label) {
        return label.closest('.T3Fozb') ?? label.closest('.VaiWld') ?? label.closest('.yVCOtc') ?? label
      }
    }

    const siblingMetadata = resolveImageCardSiblingMetadata(anchor)
    if (siblingMetadata) {
      return siblingMetadata
    }

    return anchor
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

  function hasNearbyImagesHeading(anchor: Element): boolean {
    let current: Element | null = anchor
    let depth = 0
    while (current && depth < 6) {
      const ariaLabel = current.getAttribute('aria-label') ?? ''
      if (/^images$/i.test(normalizeAnnotationText(ariaLabel))) {
        return true
      }
      const directHeading = Array.from(current.children).find((child) =>
        /^H[1-6]$/i.test(child.tagName) && /^images$/i.test(normalizeAnnotationText(child.textContent))
      )
      if (directHeading) {
        return true
      }
      let sibling = current.previousElementSibling
      let siblingDepth = 0
      while (sibling && siblingDepth < 3) {
        if (/^images$/i.test(normalizeAnnotationText(sibling.textContent))) {
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

  function normalizeAnnotationText(value: string | null | undefined): string {
    return (value ?? '').replace(/\s+/g, ' ').trim()
  }

  function buildAnnotation(result: CrmSearchAnnotationResultItem, variant: 'image' | 'search' = 'search'): HTMLSpanElement {
    const annotation = pageDocument.createElement('span')
    annotation.className = variant === 'image'
      ? 'oes-crm-search-annotation oes-crm-image-annotation'
      : 'oes-crm-search-annotation'

    for (const tag of annotationTags(result)) {
      const badge = pageDocument.createElement('span')
      badge.className = 'oes-crm-search-badge'
      badge.dataset.status = result.status
      badge.dataset.tagTone = tagTone(tag.type || result.status)
      badge.textContent = tag.label
      annotation.appendChild(badge)
    }

    return annotation
  }

  function annotationTags(result: CrmSearchAnnotationResultItem): Array<{ label: string; type: string }> {
    const tags: Array<{ label: string; type: string }> = []
    const ownerTag = ownerDimensionTag(result)
    const lifecycleTag = lifecycleDimensionTag(result)
    const archiveReason = archiveReasonCode(result)

    if (ownerTag) {
      addTag(tags, ownerTag.label, ownerTag.type)
    }
    if (lifecycleTag) {
      addTag(tags, lifecycleTag.label, lifecycleTag.type)
    }
    if (isArchived(result)) {
      addTag(tags, 'Archived', 'ARCHIVED')
      if (archiveReason) {
        addTag(tags, archiveReasonLabel(archiveReason), archiveReason)
      }
    }

    return tags
  }

  function addTag(tags: Array<{ label: string; type: string }>, label: string, type: string): void {
    const normalizedLabel = label.trim()
    if (!normalizedLabel || tags.some((tag) => tagSemanticKey(tag.label, tag.type) === tagSemanticKey(normalizedLabel, type))) {
      return
    }
    tags.push({
      label: normalizedLabel,
      type
    })
  }

  function ownerDimensionTag(result: CrmSearchAnnotationResultItem): { label: string; type: string } | null {
    const ownerKind = normalizeTagCode(result.matchedAccount?.ownerKind || result.ownerKind || result.duplicateHints?.[0]?.ownerKind)
    if (ownerKind === 'SELF' || result.status === 'OWNED_LEAD') {
      return { label: '我的', type: 'OWNER_SELF' }
    }
    if (ownerKind === 'POOL' || result.status === 'POOL_LEAD') {
      return { label: '公海', type: 'OWNER_POOL' }
    }
    if (ownerKind === 'OTHER_OWNER' || result.status === 'OTHER_OWNER_LEAD' || result.status === 'RESTRICTED') {
      return { label: '他人', type: 'OWNER_OTHER' }
    }

    return null
  }

  function lifecycleDimensionTag(result: CrmSearchAnnotationResultItem): { label: string; type: string } | null {
    const lifecycleStage = normalizeTagCode(
      result.matchedAccount?.lifecycleStage || result.lifecycleStage || result.duplicateHints?.[0]?.lifecycleStage
    ) || inferredLifecycleStage(result.status)

    if (lifecycleStage === 'LEAD') {
      return { label: 'Lead', type: 'LIFECYCLE_LEAD' }
    }
    if (lifecycleStage === 'PROSPECT_CUSTOMER') {
      return { label: 'PC', type: 'LIFECYCLE_PC' }
    }
    if (lifecycleStage === 'CUSTOMER') {
      return { label: 'Customer', type: 'LIFECYCLE_CUSTOMER' }
    }

    return null
  }

  function inferredLifecycleStage(status: string): string {
    if (status === 'CUSTOMER') {
      return 'CUSTOMER'
    }
    if (status === 'PROSPECT_CUSTOMER') {
      return 'PROSPECT_CUSTOMER'
    }
    if (
      status === 'OWNED_LEAD' ||
      status === 'POOL_LEAD' ||
      status === 'OTHER_OWNER_LEAD' ||
      status === 'POSSIBLE_DUPLICATE' ||
      status === 'RESTRICTED'
    ) {
      return 'LEAD'
    }

    return ''
  }

  function isArchived(result: CrmSearchAnnotationResultItem): boolean {
    return Boolean(
      result.archivedAt ||
      result.matchedAccount?.archivedAt ||
      result.duplicateHints?.[0]?.archivedAt ||
      normalizeTagCode(result.recordStatus || result.matchedAccount?.recordStatus || result.duplicateHints?.[0]?.recordStatus) === 'ARCHIVED'
    )
  }

  function archiveReasonCode(result: CrmSearchAnnotationResultItem): string {
    return normalizeTagCode(
      result.archiveReason || result.matchedAccount?.archiveReason || result.duplicateHints?.[0]?.archiveReason
    )
  }

  function archiveReasonLabel(reason: string): string {
    const labels: Record<string, string> = {
      COMPETITOR: '同行',
      DUPLICATE: '重复',
      INVALID_TARGET: '无效',
      LOW_VALUE: '低价值',
      NON_TARGET_ACCOUNT: '非目标',
      NO_FIT: '不匹配',
      OTHER: '其他',
      UNRESPONSIVE: '无响应'
    }
    return labels[reason] ?? '其他'
  }

  function tagSemanticKey(label: string, type: string): string {
    return `${normalizeTagCode(type)}:${label.trim().toUpperCase()}`
  }

  function normalizeTagCode(value: string | undefined | null): string {
    return value?.trim().toUpperCase() ?? ''
  }

  function tagTone(type: string): string {
    const tones: Record<string, string> = {
      ARCHIVED: 'archived',
      COMPETITOR: 'archive-competitor',
      DUPLICATE: 'archive-duplicate',
      INVALID_TARGET: 'archive-invalid',
      LIFECYCLE_CUSTOMER: 'lifecycle-customer',
      LIFECYCLE_LEAD: 'lifecycle-lead',
      LIFECYCLE_PC: 'lifecycle-pc',
      LOW_VALUE: 'archive-low-value',
      NON_TARGET_ACCOUNT: 'archive-non-target',
      NO_FIT: 'archive-no-fit',
      OTHER: 'archive-other',
      OWNER_OTHER: 'owner-other',
      OWNER_POOL: 'owner-pool',
      OWNER_SELF: 'owner-self',
      UNRESPONSIVE: 'archive-unresponsive'
    }
    return tones[type] ?? 'record'
  }

  function shouldAnnotateResult(result: CrmSearchAnnotationResultItem): boolean {
    return result.status !== 'UNKNOWN'
  }

  clearExistingAnnotations()
  ensureStyle()

  let annotatedCount = 0
  const annotatedAnchors = new Set<HTMLAnchorElement>()

  for (const result of input.results) {
    if (!shouldAnnotateResult(result)) {
      continue
    }

    const anchors = findResultAnchors(result.url).filter((anchor) => !annotatedAnchors.has(anchor))
    if (!anchors.length) {
      continue
    }

    for (const anchor of anchors) {
      const title = anchor.querySelector('h3')
      if (title) {
        title.appendChild(buildAnnotation(result))
      } else if (isImageSectionAnchor(anchor)) {
        resolveImageAnnotationTarget(anchor).appendChild(buildAnnotation(result, 'image'))
      }
      annotatedAnchors.add(anchor)
      annotatedCount += 1
    }
  }

  return { annotatedCount }
}
