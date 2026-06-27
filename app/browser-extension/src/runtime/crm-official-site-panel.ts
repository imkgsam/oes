import type { ExtensionCrmResolvedPage } from '../side-panel/crm-types'

export interface RenderCrmOfficialSitePanelInput {
  document?: Document
  reopenClosedPanel?: boolean
  resolvedPage: ExtensionCrmResolvedPage
  tenantWebBaseUrl: string
}

export interface ClearCrmOfficialSitePanelInput {
  document?: Document
}

// Renders the CRM official-site floating panel inside the current page without leaking extension styles.
export async function renderCrmOfficialSitePanelInCurrentDocument(input: RenderCrmOfficialSitePanelInput) {
  const pageDocument = input.document ?? globalThis.document
  const resolvedPage = input.resolvedPage
  const hostId = 'oes-crm-official-site-panel'
  const closeMarkerId = 'oes-crm-official-site-panel-close-marker'
  const panelPositionStorageKey = 'oes-crm-official-site-panel-position:v1'

  function text(value: unknown): string {
    return String(value ?? '').replace(/\s+/g, ' ').trim()
  }

  function escapeHtml(value: unknown): string {
    return text(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function normalizeCode(value: unknown): string {
    return text(value).toUpperCase()
  }

  function isRenderable(): boolean {
    return Boolean(pageDocument?.body && resolvedPage?.status && (
      resolvedPage.status !== 'UNKNOWN' || hasVisibleCrmContext()
    ))
  }

  // Builds the same-tab key that suppresses immediate re-renders after an explicit close.
  function closedStorageKey(): string {
    const pageTarget = normalizeClosedPageTarget(resolvedPage.url || pageDocument.location?.href)
    if (pageTarget) {
      return `oes-crm-panel-closed:page:${pageTarget}`
    }

    const fallback = text(resolvedPage.domain || resolvedPage.matchedAccount?.crmAccountId || 'unknown')
    return `oes-crm-panel-closed:record:${fallback}`
  }

  // Checks a current-document close marker so page reloads naturally reopen eligible panels.
  function isClosedInCurrentDocument(key: string): boolean {
    return pageDocument.getElementById(closeMarkerId)?.getAttribute('data-oes-closed-key') === key
  }

  // Marks only the current DOM document as explicitly closed without persisting across reloads.
  function markClosedInCurrentDocument(key: string): void {
    pageDocument.getElementById(closeMarkerId)?.remove()
    const marker = pageDocument.createElement('span')
    marker.id = closeMarkerId
    marker.hidden = true
    marker.setAttribute('aria-hidden', 'true')
    marker.setAttribute('data-oes-closed-key', key)
    pageDocument.body?.appendChild(marker)
  }

  // Clears the current-document close marker when a user explicitly asks to reopen the panel.
  function clearClosedInCurrentDocument(): void {
    pageDocument.getElementById(closeMarkerId)?.remove()
  }

  // Normalizes explicit close state to the current page path instead of suppressing an entire customer domain.
  function normalizeClosedPageTarget(value: unknown): string {
    const raw = text(value)
    if (!raw) {
      return ''
    }

    try {
      const url = new URL(raw)
      return `${url.hostname.replace(/^www\./i, '')}${url.pathname || '/'}`
    } catch {
      return ''
    }
  }

  // Builds the per-domain key that keeps the panel in pill mode after an explicit hide.
  function minimizedStorageKey(): string {
    const domain = text(resolvedPage.domain || resolvedPage.matchedAccount?.crmAccountId || 'unknown')
    return `oes-crm-panel-minimized:${domain}`
  }

  // Reads legacy session-scoped state so same-tab retries still respect older persisted choices.
  function readLegacySessionValue(key: string): string | null {
    try {
      return globalThis.sessionStorage?.getItem(key) ?? null
    } catch {
      return null
    }
  }

  // Writes a same-tab fallback before asynchronous extension storage finishes.
  function writeLegacySessionValue(key: string, value: string): void {
    try {
      globalThis.sessionStorage?.setItem(key, value)
    } catch {
      // Page storage can be unavailable in privacy-restricted contexts.
    }
  }

  // Reads extension-global panel state with a localStorage fallback for browser preview and tests.
  async function readStorageValue<T>(key: string): Promise<T | null> {
    const storage = resolveChromeStorage()
    if (storage) {
      try {
        const result = await storage.get(key)
        return (result[key] as T | undefined) ?? null
      } catch {
        // Fall back to page storage when Chrome storage is unavailable on an injected page.
      }
    }

    try {
      const raw = globalThis.localStorage?.getItem(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  }

  // Writes extension-global panel state with a localStorage fallback for browser preview and tests.
  async function writeStorageValue(key: string, value: unknown): Promise<void> {
    const storage = resolveChromeStorage()
    if (storage) {
      try {
        await storage.set({ [key]: value })
        return
      } catch {
        // Fall back to page storage when Chrome storage is unavailable on an injected page.
      }
    }

    try {
      globalThis.localStorage?.setItem(key, JSON.stringify(value))
    } catch {
      // Page storage can be unavailable in privacy-restricted contexts.
    }
  }

  // Resolves Chrome extension storage when the function runs as an injected extension script.
  function resolveChromeStorage(): chrome.storage.StorageArea | undefined {
    return globalThis.chrome?.storage?.local
  }

  // Normalizes persisted coordinates so malformed storage cannot place the panel off the viewport edge.
  function normalizePosition(value: unknown): { bottom: number; right: number } | null {
    if (!value || typeof value !== 'object') {
      return null
    }
    const position = value as { bottom?: unknown; right?: unknown }
    const right = Number(position.right)
    const bottom = Number(position.bottom)
    if (!Number.isFinite(right) || !Number.isFinite(bottom)) {
      return null
    }
    const viewportWidth = Number(globalThis.innerWidth)
    const viewportHeight = Number(globalThis.innerHeight)
    const maxRight = Number.isFinite(viewportWidth) ? Math.max(12, viewportWidth - 48) : Number.POSITIVE_INFINITY
    const maxBottom = Number.isFinite(viewportHeight) ? Math.max(12, viewportHeight - 48) : Number.POSITIVE_INFINITY
    return {
      bottom: Math.min(Math.max(12, bottom), maxBottom),
      right: Math.min(Math.max(12, right), maxRight)
    }
  }

  function resolveOwnershipLabel(): { label: string; tone: string } {
    const ownerKind = normalizeCode(primaryAccountContext()?.ownerKind)
    const status = normalizeCode(resolvedPage.status)
    if (ownerKind === 'SELF' || status === 'OWNED_LEAD' || status === 'CUSTOMER' || status === 'PROSPECT_CUSTOMER') {
      return { label: '我的', tone: 'owner-self' }
    }
    if (ownerKind === 'POOL' || status === 'POOL_LEAD') {
      return { label: '公海', tone: 'owner-pool' }
    }
    return { label: '他人', tone: 'owner-other' }
  }

  function resolveLifecycleLabel(): { label: string; tone: string } {
    const lifecycle = normalizeCode(primaryAccountContext()?.lifecycleStage)
    if (lifecycle.includes('CUSTOMER') || normalizeCode(resolvedPage.status) === 'CUSTOMER') {
      return { label: 'Customer', tone: 'lifecycle-customer' }
    }
    if (lifecycle === 'PC' || lifecycle.includes('PROSPECT')) {
      return { label: 'PC', tone: 'lifecycle-pc' }
    }
    return { label: 'Lead', tone: 'lifecycle-lead' }
  }

  function resolveArchiveReasonLabel(value: unknown): string {
    const labels: Record<string, string> = {
      COMPETITOR: '同行',
      DUPLICATE: '重复',
      INVALID_TARGET: '无效目标',
      LOW_VALUE: '低价值',
      NON_TARGET_ACCOUNT: '非目标',
      NO_FIT: '不匹配',
      OTHER: '其他',
      UNRESPONSIVE: '无响应'
    }
    return labels[normalizeCode(value)] ?? text(value)
  }

  function buildDeepLink(): string {
    const accountId = text(primaryAccountContext()?.crmAccountId)
    const raw = text(resolvedPage.deepLinks?.tenantWebCrmAccountUrl) || (accountId ? `/crm/accounts/${encodeURIComponent(accountId)}` : '')
    if (!raw) {
      return ''
    }
    try {
      return new URL(raw, input.tenantWebBaseUrl).href
    } catch {
      return ''
    }
  }

  function renderBadge(label: string, tone: string): string {
    return `<span class="crm-tag crm-badge" data-tone="${escapeHtml(tone)}">${escapeHtml(label)}</span>`
  }

  function renderMetaItem(label: string, value: string): string {
    if (!value) {
      return ''
    }
    return `<span class="crm-meta-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></span>`
  }

  function recordOf(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? value as Record<string, unknown> : {}
  }

  // Reads the first duplicate hint as the public CRM context fallback for restricted or legacy responses.
  function firstDuplicateHintRecord(): Record<string, unknown> {
    return recordOf(resolvedPage.duplicateHints?.[0])
  }

  // Resolves the safest account-like context that the floating panel can display.
  function primaryAccountContext(): Record<string, unknown> | NonNullable<ExtensionCrmResolvedPage['matchedAccount']> | null {
    if (resolvedPage.matchedAccount) {
      return resolvedPage.matchedAccount
    }

    const hint = firstDuplicateHintRecord()
    if (!text(hint.crmAccountId || hint.displayName || hint.ownerKind)) {
      return null
    }

    return {
      archiveReason: hint.archiveReason,
      archivedAt: hint.archivedAt,
      crmAccountId: hint.crmAccountId,
      displayName: hint.displayName,
      lifecycleStage: hint.lifecycleStage,
      ownerKind: hint.ownerKind,
      priority: hint.priority,
      recordStatus: hint.recordStatus
    }
  }

  // Determines whether an otherwise unknown resolved page still contains visible CRM context.
  function hasVisibleCrmContext(): boolean {
    const accountContext = primaryAccountContext()
    return Boolean(accountContext && text(accountContext.crmAccountId || accountContext.displayName || accountContext.ownerKind))
  }

  function formatPriority(value: unknown): string {
    const raw = text(value).toUpperCase()
    if (!raw) {
      return ''
    }
    return raw.startsWith('P') ? raw : `P${raw}`
  }

  function resolveCustomTags(value: unknown): Array<{ label: string; tone: string }> {
    if (!Array.isArray(value)) {
      return []
    }
    const tags: Array<{ label: string; tone: string }> = []
    for (const item of value) {
      const itemRecord = recordOf(item)
      const label = text(typeof item === 'string' ? item : itemRecord.label || itemRecord.name || itemRecord.value)
      if (!label || tags.some((tag) => tag.label === label)) {
        continue
      }
      tags.push({
        label,
        tone: text(itemRecord.type || itemRecord.tone || 'custom') || 'custom'
      })
    }
    return tags.slice(0, 4)
  }

  function installDrag(
    host: HTMLElement,
    handle: HTMLElement,
    options: { allowActionHandle?: boolean; onDragged?: () => void } = {}
  ): void {
    let dragging = false
    let moved = false
    let startX = 0
    let startY = 0
    let startRight = 24
    let startBottom = 24

    handle.addEventListener('pointerdown', (event) => {
      const target = event.target instanceof Element ? event.target : null
      if (!options.allowActionHandle && target?.closest('[data-action]')) {
        return
      }
      dragging = true
      moved = false
      startX = event.clientX
      startY = event.clientY
      startRight = Number.parseFloat(host.style.right || '24') || 24
      startBottom = Number.parseFloat(host.style.bottom || '24') || 24
      handle.setPointerCapture?.(event.pointerId)
    })

    handle.addEventListener('pointermove', (event) => {
      if (!dragging) {
        return
      }
      moved = moved || Math.abs(event.clientX - startX) > 3 || Math.abs(event.clientY - startY) > 3
      host.style.right = `${Math.max(12, startRight - (event.clientX - startX))}px`
      host.style.bottom = `${Math.max(12, startBottom - (event.clientY - startY))}px`
    })

    handle.addEventListener('pointerup', (event) => {
      if (!dragging) {
        return
      }
      dragging = false
      handle.releasePointerCapture?.(event.pointerId)
      if (moved) {
        options.onDragged?.()
      }
      void writeStorageValue(panelPositionStorageKey, {
        bottom: Number.parseFloat(host.style.bottom || '24') || 24,
        right: Number.parseFloat(host.style.right || '24') || 24
      })
    })
  }

  if (!isRenderable()) {
    pageDocument.getElementById(hostId)?.remove()
    return { rendered: false, skipped: true }
  }

  const closedKey = closedStorageKey()
  if (input.reopenClosedPanel) {
    clearClosedInCurrentDocument()
  }
  if (!input.reopenClosedPanel && isClosedInCurrentDocument(closedKey)) {
    pageDocument.getElementById(hostId)?.remove()
    return { rendered: false, skipped: true }
  }

  const account = primaryAccountContext()
  const ownership = resolveOwnershipLabel()
  const lifecycle = resolveLifecycleLabel()
  const deepLink = buildDeepLink()
  const recordStatus = normalizeCode(account?.recordStatus)
  const isArchived = recordStatus === 'ARCHIVED' || Boolean(account?.archivedAt || account?.archiveReason)
  const archiveReason = resolveArchiveReasonLabel(account?.archiveReason || resolvedPage.archiveReason)
  const displayName = text(account?.displayName || resolvedPage.summary?.displayName || resolvedPage.title || resolvedPage.domain)
  const resolvedRecord = recordOf(resolvedPage)
  const accountRecord = recordOf(account)
  const summaryRecord = recordOf(resolvedPage.summary)
  const country = text(account?.leadCountry || accountRecord.country || summaryRecord.country || resolvedRecord.country).toUpperCase()
  const priority = formatPriority(account?.priority || accountRecord.priority || summaryRecord.priority || resolvedRecord.priority)
  const customTags = resolveCustomTags(resolvedRecord.tags || accountRecord.tags || summaryRecord.tags)
  const savedPosition = normalizePosition(await readStorageValue(panelPositionStorageKey))
  const minimizedKey = minimizedStorageKey()
  const isMinimized = (await readStorageValue<boolean>(minimizedKey)) === true || readLegacySessionValue(minimizedKey) === '1'
  const panelMotionMs = 180
  const actionsDockIcon = '<svg class="crm-action-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h.01"/><path d="M8 8h.01"/><path d="M12 8h.01"/></svg>'
  const minimizeIcon = '<svg class="crm-action-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8"/></svg>'
  const openOesIcon = '<svg class="crm-action-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4h6v6"/><path d="M12 4 5 11"/></svg>'
  const closeIcon = '<svg class="crm-action-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="m5 5 6 6"/><path d="m11 5-6 6"/></svg>'

  pageDocument.getElementById(hostId)?.remove()
  const host = pageDocument.createElement('section')
  host.id = hostId
  host.dataset.minimized = isMinimized ? 'true' : 'false'
  host.style.position = 'fixed'
  host.style.right = `${savedPosition?.right ?? 24}px`
  host.style.bottom = `${savedPosition?.bottom ?? 24}px`
  host.style.zIndex = '2147483646'
  host.style.width = '340px'
  host.style.maxWidth = 'calc(100vw - 32px)'
  host.style.fontFamily = 'Satoshi, Geist, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

  const shadow = host.attachShadow({ mode: 'open' })
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; }
      .crm-panel {
        position: relative;
        min-height: 168px;
        max-height: min(420px, calc(100vh - 32px));
        color: #ece7d6;
        background:
          radial-gradient(circle at 12% 0%, rgba(169, 149, 95, .18), transparent 36%),
          linear-gradient(155deg, #202729 0%, #151a1c 58%, #101416 100%);
        border: 1px solid rgba(236, 231, 214, .12);
        border-radius: 8px;
        box-shadow:
          inset 0 1px 0 rgba(236, 231, 214, .08),
          0 24px 54px -28px rgba(0, 0, 0, .72);
        overflow: visible;
        backdrop-filter: blur(18px) saturate(1.08);
        opacity: 1;
        transform: translate(0, 0) scale(1);
        transform-origin: calc(100% - 24px) 24px;
        transition:
          opacity 140ms ease,
          transform ${panelMotionMs}ms cubic-bezier(.16, 1, .3, 1);
        will-change: transform, opacity;
      }
      .crm-panel-scroll {
        max-height: min(420px, calc(100vh - 32px));
        overflow-x: hidden;
        overflow-y: auto;
        scrollbar-color: rgba(236, 231, 214, .22) transparent;
      }
      .crm-head {
        align-items: flex-start;
        cursor: grab;
        display: flex;
        gap: 12px;
        justify-content: space-between;
        padding: 18px 58px 14px 16px;
        user-select: none;
      }
      .crm-kicker {
        color: #a9955f;
        font-size: 11px;
        font-weight: 760;
        letter-spacing: .09em;
        text-transform: uppercase;
      }
      .crm-title {
        color: #f1ecd8;
        font-size: 20px;
        font-weight: 800;
        line-height: 1.08;
        margin-top: 5px;
        max-width: 248px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .crm-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        margin-top: 12px;
      }
      .crm-meta-item {
        align-items: center;
        background: rgba(236, 231, 214, .045);
        border: 1px solid rgba(236, 231, 214, .08);
        border-radius: 999px;
        display: inline-flex;
        gap: 6px;
        min-height: 26px;
        padding: 5px 8px;
      }
      .crm-meta-item span {
        color: rgba(236, 231, 214, .44);
        font-size: 10px;
        font-weight: 740;
      }
      .crm-meta-item strong {
        color: #ece7d6;
        font-size: 12px;
        font-weight: 800;
      }
      .crm-actions {
        align-items: center;
        display: flex;
        flex-shrink: 0;
        gap: 4px;
        position: absolute;
        right: 14px;
        top: 14px;
        z-index: 4;
      }
      .crm-action-dock {
        position: relative;
        height: 26px;
        width: 80px;
      }
      button, a.crm-action-item {
        appearance: none;
        border: 0;
        border-radius: 7px;
        cursor: pointer;
        font: inherit;
        transition:
          background 160ms ease,
          border-color 160ms ease,
          color 160ms ease,
          transform 160ms ease;
      }
      .crm-action-pin {
        align-items: center;
        background: rgba(17, 22, 24, .44);
        border: 0;
        border-radius: 7px;
        color: rgba(236, 231, 214, .58);
        display: grid;
        gap: 2px;
        height: 18px;
        justify-content: center;
        place-items: center;
        position: absolute;
        right: 2px;
        top: 2px;
        transition:
          background 160ms ease,
          color 160ms ease,
          opacity 140ms ease,
          transform 160ms ease;
        width: 18px;
        z-index: 2;
      }
      .crm-action-rail {
        align-items: center;
        background:
          linear-gradient(145deg, rgba(236, 231, 214, .07), rgba(236, 231, 214, .025)),
          rgba(18, 23, 25, .94);
        border: 0;
        border-radius: 9px;
        box-shadow:
          inset 0 1px 0 rgba(236, 231, 214, .045),
          0 18px 34px -26px rgba(0, 0, 0, .82);
        display: flex;
        gap: 3px;
        height: 26px;
        justify-content: flex-end;
        opacity: 0;
        padding: 1px;
        position: absolute;
        right: 0;
        top: 0;
        transform: scale(.96);
        transform-origin: top right;
        transition:
          opacity 160ms ease,
          transform 180ms cubic-bezier(.16, 1, .3, 1);
        transition-delay: 100ms;
        width: max-content;
      }
      .crm-action-dock:hover .crm-action-rail,
      .crm-action-dock:focus-within .crm-action-rail {
        opacity: 1;
        transform: scale(1);
        transition-delay: 0ms;
      }
      .crm-action-dock:hover .crm-action-pin,
      .crm-action-dock:focus-within .crm-action-pin {
        opacity: 0;
        pointer-events: none;
        transform: scale(.78);
      }
      .crm-action-pin:hover,
      .crm-action-dock:focus-within .crm-action-pin {
        background: rgba(169, 149, 95, .1);
        color: #f1ecd8;
      }
      .crm-action-item {
        align-items: center;
        background: transparent;
        border: 0;
        border-radius: 7px;
        color: rgba(236, 231, 214, .72);
        display: flex;
        font-size: 12px;
        font-weight: 720;
        height: 24px;
        justify-content: center;
        opacity: 0;
        padding: 0;
        pointer-events: none;
        text-decoration: none;
        transform: translateX(8px) scale(.92);
        transition:
          background 160ms ease,
          opacity 160ms ease,
          color 160ms ease,
          transform 160ms ease;
        transition-delay: 100ms;
        white-space: nowrap;
        width: 24px;
      }
      .crm-action-dock:hover .crm-action-item,
      .crm-action-dock:focus-within .crm-action-item {
        opacity: 1;
        pointer-events: auto;
        transform: translateX(0) scale(1);
        transition-delay: 0ms;
      }
      .crm-action-item:hover {
        background: rgba(169, 149, 95, .13);
        color: #f1ecd8;
      }
      .crm-action-item[data-action="close"]:hover {
        background: rgba(203, 105, 86, .14);
        color: #e09b8b;
      }
      .crm-action-icon {
        display: block;
        fill: none;
        height: 13px;
        stroke: currentColor;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 1.8;
        width: 13px;
      }
      .crm-action-pin:active, .crm-action-item:active, .crm-pill:active { transform: translateY(1px) scale(.98); }
      .crm-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 0 16px 14px;
      }
      .crm-tag {
        border: 1px solid transparent;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 720;
        line-height: 1;
        padding: 5px 7px;
      }
      .crm-tag[data-tone="owner-self"] { background: rgba(72, 118, 101, .18); border-color: rgba(106, 154, 135, .32); color: #a9d4bf; }
      .crm-tag[data-tone="owner-pool"] { background: rgba(75, 106, 121, .18); border-color: rgba(111, 146, 160, .32); color: #b1cbd3; }
      .crm-tag[data-tone="owner-other"] { background: rgba(236, 231, 214, .07); border-color: rgba(236, 231, 214, .12); color: rgba(236, 231, 214, .7); }
      .crm-tag[data-tone="lifecycle-lead"] { background: rgba(169, 149, 95, .18); border-color: rgba(169, 149, 95, .34); color: #d8c37d; }
      .crm-tag[data-tone="lifecycle-pc"] { background: rgba(83, 96, 91, .24); border-color: rgba(129, 143, 135, .3); color: #c6d0c7; }
      .crm-tag[data-tone="lifecycle-customer"] { background: rgba(58, 116, 91, .2); border-color: rgba(92, 156, 125, .34); color: #a7d5be; }
      .crm-tag[data-tone="archived"] { background: rgba(117, 104, 77, .18); border-color: rgba(169, 149, 95, .28); color: #c7b679; }
      .crm-tag[data-tone="archive-reason"] { background: rgba(161, 85, 72, .18); border-color: rgba(203, 105, 86, .34); color: #dfa092; }
      .crm-tag[data-tone="custom"],
      .crm-tag[data-tone="priority"] { background: rgba(236, 231, 214, .08); border-color: rgba(236, 231, 214, .14); color: #f1ecd8; }
      .crm-pill {
        align-items: center;
        background:
          linear-gradient(135deg, rgba(169, 149, 95, .18), rgba(66, 94, 88, .16)),
          #151a1c;
        border: 1px solid rgba(236, 231, 214, .12);
        border-radius: 999px;
        box-shadow:
          inset 0 1px 0 rgba(236, 231, 214, .08),
          0 18px 42px -28px rgba(0, 0, 0, .78);
        color: #ece7d6;
        display: none;
        gap: 8px;
        max-width: 340px;
        padding: 9px 11px;
      }
      .crm-pill-title {
        font-size: 12px;
        font-weight: 740;
        max-width: 190px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .crm-pill .crm-badge {
        background: rgba(236, 231, 214, .08);
        border-color: rgba(236, 231, 214, .14);
        color: #f1ecd8;
      }
      :host([data-motion="collapsing"]) .crm-panel,
      :host([data-motion="expanding"]) .crm-panel {
        opacity: 0;
        pointer-events: none;
        transform: translate(12px, -10px) scale(.18);
      }
      :host([data-motion="expanded"]) .crm-panel {
        opacity: 1;
        transform: translate(0, 0) scale(1);
      }
      :host([data-minimized="true"]) {
        display: flex;
        justify-content: flex-end;
      }
      :host([data-minimized="true"]) .crm-panel { display: none; }
      :host([data-minimized="true"]) .crm-pill { display: inline-flex; }
      :host([data-motion="collapsing"]) .crm-panel { display: block; }
      :host([data-motion="collapsing"]) .crm-pill { display: none; }
    </style>
    <div class="crm-panel" role="dialog" aria-label="OES CRM customer context">
      <div class="crm-actions">
        <div class="crm-action-dock" aria-label="Floating Panel 操作">
          <button class="crm-action-pin" data-action="actions-dock" aria-label="Floating Panel 操作" type="button">
            ${actionsDockIcon}
          </button>
          <div class="crm-action-rail" role="toolbar" aria-label="Floating Panel 操作">
            <button class="crm-action-item" data-action="minimize" aria-label="隐藏 Floating Panel" title="隐藏" type="button">${minimizeIcon}</button>
            ${deepLink ? `<a class="crm-action-item" data-action="open-oes" aria-label="打开 OES" href="${escapeHtml(deepLink)}" rel="noopener noreferrer" target="_blank" title="打开 OES">${openOesIcon}</a>` : ''}
            <button class="crm-action-item" data-action="close" aria-label="关闭 Floating Panel" title="关闭" type="button">${closeIcon}</button>
          </div>
        </div>
      </div>
      <div class="crm-panel-scroll">
        <div class="crm-head" data-drag-handle="true">
          <div>
            <div class="crm-kicker">OES CRM</div>
            <div class="crm-title">${escapeHtml(displayName)}</div>
            <div class="crm-meta">
              ${renderMetaItem('国家', country)}
              ${renderMetaItem('优先级', priority)}
            </div>
          </div>
        </div>
        <div class="crm-tags">
          ${renderBadge(ownership.label, ownership.tone)}
          ${renderBadge(lifecycle.label, lifecycle.tone)}
          ${isArchived ? renderBadge('Archived', 'archived') : ''}
          ${isArchived && archiveReason ? renderBadge(archiveReason, 'archive-reason') : ''}
          ${customTags.map((tag) => renderBadge(tag.label, tag.tone)).join('')}
        </div>
      </div>
    </div>
    <button class="crm-pill" data-action="restore" type="button">
      <span class="crm-pill-title">${escapeHtml(displayName)}</span>
      ${renderBadge(ownership.label, ownership.tone)}
      ${renderBadge(lifecycle.label, lifecycle.tone)}
    </button>
  `

  pageDocument.body.appendChild(host)
  const minimize = shadow.querySelector<HTMLButtonElement>('[data-action="minimize"]')
  const restore = shadow.querySelector<HTMLButtonElement>('[data-action="restore"]')
  const close = shadow.querySelector<HTMLButtonElement>('[data-action="close"]')
  const handle = shadow.querySelector<HTMLElement>('[data-drag-handle="true"]')
  let suppressNextRestoreClick = false
  let panelMotionStartTimer: ReturnType<typeof globalThis.setTimeout> | undefined
  let panelMotionTimer: ReturnType<typeof globalThis.setTimeout> | undefined

  // Runs the whole-panel minimize and restore motion from the top-right action anchor.
  function transitionPanelMode(nextMinimized: boolean): void {
    if (panelMotionStartTimer !== undefined) {
      globalThis.clearTimeout?.(panelMotionStartTimer)
      panelMotionStartTimer = undefined
    }
    if (panelMotionTimer !== undefined) {
      globalThis.clearTimeout?.(panelMotionTimer)
      panelMotionTimer = undefined
    }

    if (nextMinimized) {
      host.dataset.minimized = 'true'
      host.dataset.motion = 'collapsing'
      panelMotionTimer = globalThis.setTimeout?.(() => {
        delete host.dataset.motion
        panelMotionTimer = undefined
      }, panelMotionMs)
      return
    }

    host.dataset.minimized = 'false'
    host.dataset.motion = 'expanding'
    panelMotionStartTimer = globalThis.setTimeout?.(() => {
      host.dataset.motion = 'expanded'
      panelMotionStartTimer = undefined
    }, 0)
    panelMotionTimer = globalThis.setTimeout?.(() => {
      delete host.dataset.motion
      panelMotionTimer = undefined
    }, panelMotionMs)
  }

  minimize?.addEventListener('click', () => {
    transitionPanelMode(true)
    writeLegacySessionValue(minimizedKey, '1')
    void writeStorageValue(minimizedKey, true)
  })
  restore?.addEventListener('click', () => {
    if (suppressNextRestoreClick) {
      suppressNextRestoreClick = false
      return
    }
    transitionPanelMode(false)
    writeLegacySessionValue(minimizedKey, '0')
    void writeStorageValue(minimizedKey, false)
  })
  close?.addEventListener('click', () => {
    markClosedInCurrentDocument(closedKey)
    host.remove()
  })
  if (handle) {
    installDrag(host, handle)
  }
  if (restore) {
    installDrag(host, restore, {
      allowActionHandle: true,
      onDragged: () => {
        suppressNextRestoreClick = true
        globalThis.setTimeout?.(() => {
          suppressNextRestoreClick = false
        }, 0)
      }
    })
  }

  return { rendered: true, skipped: false }
}

// Removes the CRM official-site floating panel from the current page.
export function clearCrmOfficialSitePanelInCurrentDocument(input: ClearCrmOfficialSitePanelInput = {}) {
  const pageDocument = input.document ?? globalThis.document
  const host = pageDocument?.getElementById('oes-crm-official-site-panel')
  if (!host) {
    return { removedCount: 0 }
  }

  host.remove()
  return { removedCount: 1 }
}
