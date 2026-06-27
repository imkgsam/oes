const BROWSER_ACTIVITY_PAGE_ACTIVITY_MESSAGE = 'oes.browserActivity.pageActivity'
const MIN_EVENT_INTERVAL_MS = 1_000
let lastSentAtMs = 0
let observerActive = true

// emitActivity sends only bounded activity facts to the authenticated background runtime.
function emitActivity(kind: 'click' | 'keyboard' | 'mouse' | 'scroll'): void {
  if (!observerActive) {
    return
  }

  const occurredAtMs = Date.now()
  if (occurredAtMs - lastSentAtMs < MIN_EVENT_INTERVAL_MS) {
    return
  }

  lastSentAtMs = occurredAtMs
  sendActivityMessage({
    kind,
    occurredAtMs,
    type: BROWSER_ACTIVITY_PAGE_ACTIVITY_MESSAGE
  })
}

// sendActivityMessage shields page event handlers from stale extension contexts after reload/update.
function sendActivityMessage(message: { kind: string; occurredAtMs: number; type: string }): void {
  try {
    const response = globalThis.chrome?.runtime?.sendMessage?.(message)
    if (response && typeof (response as Promise<unknown>).catch === 'function') {
      void (response as Promise<unknown>).catch(handleSendMessageFailure)
    }
  } catch (error) {
    handleSendMessageFailure(error)
  }
}

function handleSendMessageFailure(error: unknown): void {
  if (isExtensionContextInvalidated(error)) {
    stopPageObservers()
  }
}

function isExtensionContextInvalidated(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return /Extension context invalidated/i.test(message)
}

function stopPageObservers(): void {
  if (!observerActive) {
    return
  }

  observerActive = false
  globalThis.removeEventListener('click', handleClick)
  globalThis.removeEventListener('keydown', handleKeydown)
  globalThis.removeEventListener('mousemove', handleMousemove)
  globalThis.removeEventListener('scroll', handleScroll)
}

function handleClick(): void {
  emitActivity('click')
}

function handleKeydown(): void {
  emitActivity('keyboard')
}

function handleMousemove(): void {
  emitActivity('mouse')
}

function handleScroll(): void {
  emitActivity('scroll')
}

globalThis.addEventListener('click', handleClick, { passive: true })
globalThis.addEventListener('keydown', handleKeydown, { passive: true })
globalThis.addEventListener('mousemove', handleMousemove, { passive: true })
globalThis.addEventListener('scroll', handleScroll, { passive: true })
