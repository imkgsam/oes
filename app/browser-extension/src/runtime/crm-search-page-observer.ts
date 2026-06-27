export interface CrmSearchPageObserverResult {
  installed: boolean
  skipped: boolean
}

// Installs a lightweight Google search-page observer that asks the background worker to annotate after async renders.
export function installCrmSearchAutoRequestInCurrentDocument(): CrmSearchPageObserverResult {
  const defaultAnnotationDebounceMs = 240
  const imageResultAnnotationDebounceMs = 240
  const generalMutationCooldownMs = 8_000
  const pageGlobal = globalThis as typeof globalThis & {
    __oesCrmSearchObserverInstalled?: boolean
    chrome?: {
      runtime?: {
        sendMessage?: (message: unknown) => Promise<unknown>
      }
    }
    clearTimeout: typeof clearTimeout
    document: Document
    location: Location
    MutationObserver: typeof MutationObserver
    setTimeout: typeof setTimeout
  }

  function isSupportedSearchPage(): boolean {
    try {
      return (
        /^https?:$/.test(pageGlobal.location.protocol) &&
        /(^|\.)google\./i.test(pageGlobal.location.hostname) &&
        pageGlobal.location.pathname === '/search'
      )
    } catch {
      return false
    }
  }

  function isOesNode(value: Node | null): boolean {
    if (!value || value.nodeType !== Node.ELEMENT_NODE) {
      return false
    }

    const element = value as Element
    return Boolean(
      element.closest?.('.oes-crm-search-annotation') ||
      element.closest?.('#oes-crm-search-annotation-style') ||
      element.classList?.contains('oes-crm-search-annotation') ||
      element.id === 'oes-crm-search-annotation-style'
    )
  }

  function isOnlyOesAnnotationMutation(mutation: MutationRecord): boolean {
    return (
      isOesNode(mutation.target) ||
      Array.from(mutation.addedNodes).some(isOesNode) ||
      Array.from(mutation.removedNodes).some(isOesNode)
    )
  }

  // Detects newly inserted Google image result cards so Show more images can be re-annotated without waiting for general page churn cooldown.
  function includesImageResultCandidate(mutation: MutationRecord): boolean {
    return Array.from(mutation.addedNodes).some((node) => containsImageResultCandidate(node))
  }

  // Recognizes the image-card shapes Google appends in the All tab without broadening final annotation targets.
  function containsImageResultCandidate(node: Node): boolean {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return false
    }

    const element = node as Element
    if (
      element.matches?.('a[href] img') ||
      element.matches?.('img') && element.closest?.('a[href]') ||
      element.matches?.('a[data-oes-image-result="true"][href], a[href*="/imgres"][href], a[href*="imgrefurl="][href], a[href*="tbm=isch"][href], a[aria-labelledby][href]') ||
      element.matches?.('a[href]') && Boolean(element.querySelector('img'))
    ) {
      return true
    }

    return Boolean(element.querySelector?.([
      'a[href] img',
      'a[data-oes-image-result="true"][href]',
      'a[href*="/imgres"][href]',
      'a[href*="imgrefurl="][href]',
      'a[href*="tbm=isch"][href]',
      'a[aria-labelledby][href]'
    ].join(',')))
  }

  let pending: ReturnType<typeof setTimeout> | undefined
  let lastSentAt = 0
  function requestAnnotation(options: { imageResultMutation?: boolean } = {}): void {
    const now = Date.now()
    const waitMs = options.imageResultMutation
      ? imageResultAnnotationDebounceMs
      : lastSentAt > 0
        ? Math.max(defaultAnnotationDebounceMs, lastSentAt + generalMutationCooldownMs - now)
        : defaultAnnotationDebounceMs
    pageGlobal.clearTimeout(pending)
    pending = pageGlobal.setTimeout(() => {
      lastSentAt = Date.now()
      void pageGlobal.chrome?.runtime?.sendMessage?.({ type: 'oes.crm.annotateSearchPage' })
    }, waitMs)
  }

  if (!isSupportedSearchPage() || !pageGlobal.chrome?.runtime?.sendMessage) {
    return { installed: false, skipped: true }
  }

  if (pageGlobal.__oesCrmSearchObserverInstalled) {
    return { installed: true, skipped: false }
  }

  pageGlobal.__oesCrmSearchObserverInstalled = true
  requestAnnotation()
  const observer = new pageGlobal.MutationObserver((mutations) => {
    if (mutations.length > 0 && mutations.every(isOnlyOesAnnotationMutation)) {
      return
    }

    requestAnnotation({
      imageResultMutation: mutations.some(includesImageResultCandidate)
    })
  })
  observer.observe(pageGlobal.document.documentElement, {
    childList: true,
    subtree: true
  })

  return { installed: true, skipped: false }
}
