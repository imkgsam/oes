import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearCrmOfficialSitePanelInCurrentDocument,
  renderCrmOfficialSitePanelInCurrentDocument
} from './crm-official-site-panel'
import type { ExtensionCrmResolvedPage } from '../side-panel/crm-types'

describe('CRM official-site floating panel', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', createMemoryLocalStorage())
  })

  it('renders a draggable CRM context panel for an owned account', async () => {
    const document = createDocument('https://swissmadison.com/')

    const result = await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: {
        allowedActions: ['OPEN_OES_DETAIL'],
        deepLinks: { tenantWebCrmAccountUrl: '/crm/accounts/crm-swiss-1' },
        domain: 'swissmadison.com',
        matchedAccount: {
          crmAccountId: 'crm-swiss-1',
          displayName: 'Swiss Madison',
          lifecycleStage: 'LEAD',
          ownerDisplayName: 'Ace Hood',
          ownerKind: 'SELF',
          recordStatus: 'ACTIVE'
        },
        status: 'OWNED_LEAD',
        title: 'Swiss Madison',
        url: 'https://swissmadison.com/'
      },
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const host = document.getElementById('oes-crm-official-site-panel')
    const shadow = host?.shadowRoot

    expect(result).toEqual({ rendered: true, skipped: false })
    expect(shadow?.querySelector('.crm-panel')?.textContent).toContain('Swiss Madison')
    expect(shadow?.querySelector('.crm-panel')?.textContent).toContain('我的')
    expect(shadow?.querySelector('.crm-panel')?.textContent).toContain('Lead')
    expect(shadow?.querySelector<HTMLAnchorElement>('[data-action="open-oes"]')?.href).toBe(
      'http://localhost:5771/crm/accounts/crm-swiss-1'
    )
  })

  it('groups floating panel actions into a compact action dock in the top-right corner', async () => {
    const document = createDocument('https://dock.example/')

    await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: {
        ...createResolvedPage('dock.example', 'Dock Customer'),
        deepLinks: { tenantWebCrmAccountUrl: '/crm/accounts/crm-dock-1' }
      },
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const shadow = document.getElementById('oes-crm-official-site-panel')?.shadowRoot
    const dock = shadow?.querySelector('.crm-action-dock')
    const rail = shadow?.querySelector('.crm-action-rail')
    const openOes = rail?.querySelector<HTMLAnchorElement>('[data-action="open-oes"]')

    expect(dock).not.toBeNull()
    expect(rail).not.toBeNull()
    expect(shadow?.querySelector('[data-action="actions-dock"]')).not.toBeNull()
    expect(shadow?.querySelector('[data-action="actions-dock"] svg.crm-action-icon')).not.toBeNull()
    expect(shadow?.querySelector('.crm-actions-dropdown')).toBeNull()
    expect(shadow?.querySelector('.crm-actions-menu')).toBeNull()
    expect(rail?.querySelector('[data-action="minimize"] svg')).not.toBeNull()
    expect(rail?.querySelector('[data-action="close"] svg')).not.toBeNull()
    expect(openOes?.querySelector('svg')).not.toBeNull()
    expect(rail?.querySelector('[data-action="minimize"]')?.getAttribute('aria-label')).toContain('隐藏')
    expect(rail?.querySelector('[data-action="close"]')?.getAttribute('aria-label')).toContain('关闭')
    expect(openOes?.getAttribute('aria-label')).toContain('打开 OES')
    expect(openOes?.href).toBe('http://localhost:5771/crm/accounts/crm-dock-1')
    expect(shadow?.querySelector('.crm-footer')).toBeNull()
  })

  it('keeps the floating panel compact by removing repeated lower detail rows', async () => {
    const document = createDocument('https://compact.example/')

    await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: createResolvedPage('compact.example', 'Compact Customer'),
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const shadow = document.getElementById('oes-crm-official-site-panel')?.shadowRoot
    const panelText = shadow?.querySelector('.crm-panel')?.textContent ?? ''
    const style = shadow?.querySelector('style')?.textContent ?? ''

    expect(shadow?.querySelector('.crm-body')).toBeNull()
    expect(panelText).not.toContain('Status')
    expect(panelText).not.toContain('Owner')
    expect(panelText).not.toContain('Record')
    expect(style).not.toContain('.crm-body')
    expect(style).not.toContain('border-top: 1px solid rgba(236, 231, 214, .08);')
  })

  it('prioritizes name, country, priority, and CRM tags without showing the domain', async () => {
    const document = createDocument('https://display.example/')
    const resolvedPage: ExtensionCrmResolvedPage & { tags: Array<{ label: string; type: string }> } = {
      ...createResolvedPage('display.example', 'Display Customer'),
      matchedAccount: {
        ...createResolvedPage('display.example', 'Display Customer').matchedAccount!,
        leadCountry: 'US',
        priority: 'A'
      },
      tags: [{ label: '重点客户', type: 'priority' }]
    }

    await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage,
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const shadow = document.getElementById('oes-crm-official-site-panel')?.shadowRoot
    const panel = shadow?.querySelector('.crm-panel')
    const title = shadow?.querySelector('.crm-title')
    const meta = shadow?.querySelector('.crm-meta')
    const tags = Array.from(shadow?.querySelectorAll('.crm-tag') ?? []).map((item) => item.textContent)

    expect(title?.textContent).toBe('Display Customer')
    expect(panel?.textContent).not.toContain('display.example')
    expect(meta?.textContent).toContain('国家')
    expect(meta?.textContent).toContain('US')
    expect(meta?.textContent).toContain('优先级')
    expect(meta?.textContent).toContain('PA')
    expect(tags).toEqual(expect.arrayContaining(['我的', 'Lead', '重点客户']))
    expect(shadow?.querySelector('.crm-domain')).toBeNull()
  })

  it('keeps the injected renderer self-contained for chrome.scripting serialization', async () => {
    const document = createDocument('https://pool.example/')
    const serializedRenderer = new Function(
      'payload',
      `
        return (${renderCrmOfficialSitePanelInCurrentDocument.toString()})(payload)
      `
    )

    await expect(serializedRenderer({
      document,
      resolvedPage: {
        allowedActions: ['OPEN_OES_DETAIL'],
        domain: 'pool.example',
        matchedAccount: {
          crmAccountId: 'crm-pool-1',
          displayName: 'Pool Fixtures',
          lifecycleStage: 'PC',
          ownerKind: 'POOL',
          recordStatus: 'ACTIVE'
        },
        status: 'POOL_LEAD',
        title: 'Pool Fixtures',
        url: 'https://pool.example/'
      },
      tenantWebBaseUrl: 'http://localhost:5771'
    })).resolves.toEqual({ rendered: true, skipped: false })

    expect(document.getElementById('oes-crm-official-site-panel')?.shadowRoot?.textContent).toContain('公海')
    expect(document.getElementById('oes-crm-official-site-panel')?.shadowRoot?.textContent).toContain('PC')
  })

  it('does not render a panel for unmatched CRM pages', async () => {
    const document = createDocument('https://unknown.example/')

    const result = await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: {
        allowedActions: ['CREATE_DRAFT_LEAD'],
        domain: 'unknown.example',
        matchedAccount: null,
        status: 'UNKNOWN',
        title: 'Unknown Example',
        url: 'https://unknown.example/'
      },
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    expect(result).toEqual({ rendered: false, skipped: true })
    expect(document.getElementById('oes-crm-official-site-panel')).toBeNull()
  })

  it('does not let legacy domain-level close state suppress a new official-site page render', async () => {
    localStorage.setItem('oes-crm-panel-closed:swissmadison.com', JSON.stringify(true))
    const currentUrl = 'https://swissmadison.com/collections/psc-console-sinks?srsltid=AfmBOoq5aiPA59jPDeL2CUQoJ_bTK044XsMEo9uxBB1NmV8j-L1UuHre'
    const document = createDocument(currentUrl)

    const result = await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: {
        ...createResolvedPage('swissmadison.com', 'Swiss Madison'),
        title: 'Console Sinks - Swiss Madison',
        url: currentUrl
      },
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    expect(result).toEqual({ rendered: true, skipped: false })
    expect(document.getElementById('oes-crm-official-site-panel')).not.toBeNull()
  })

  it('does not let stale page-level close state suppress a matched Swiss Madison page render', async () => {
    const currentUrl = 'https://swissmadison.com/collections/psc-console-sinks?srsltid=AfmBOoq5aiPA59jPDeL2CUQoJ_bTK044XsMEo9uxBB1NmV8j-L1UuHre'
    localStorage.setItem('oes-crm-panel-closed:page:swissmadison.com/collections/psc-console-sinks', JSON.stringify(true))
    const document = createDocument(currentUrl)

    const result = await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: {
        ...createResolvedPage('swissmadison.com', 'Swiss Madison'),
        title: 'Console Sinks - Swiss Madison',
        url: currentUrl
      },
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    expect(result).toEqual({ rendered: true, skipped: false })
    expect(document.getElementById('oes-crm-official-site-panel')?.shadowRoot?.textContent).toContain('Swiss Madison')
  })

  it('keeps explicit close scoped to the current tab session', async () => {
    const currentUrl = 'https://swissmadison.com/collections/psc-console-sinks'
    const document = createDocument(currentUrl)
    const resolvedPage = {
      ...createResolvedPage('swissmadison.com', 'Swiss Madison'),
      title: 'Console Sinks - Swiss Madison',
      url: currentUrl
    }

    await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage,
      tenantWebBaseUrl: 'http://localhost:5771'
    })
    document
      .getElementById('oes-crm-official-site-panel')
      ?.shadowRoot
      ?.querySelector<HTMLButtonElement>('[data-action="close"]')
      ?.click()

    const result = await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage,
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    expect(result).toEqual({ rendered: false, skipped: true })
    expect(localStorage.getItem('oes-crm-panel-closed:page:swissmadison.com/collections/psc-console-sinks')).toBeNull()
  })

  it('renders again after a page reload even when the previous document explicitly closed it', async () => {
    const currentUrl = 'https://swissmadison.com/collections/psc-console-sinks'
    const resolvedPage = {
      ...createResolvedPage('swissmadison.com', 'Swiss Madison'),
      title: 'Console Sinks - Swiss Madison',
      url: currentUrl
    }
    const firstDocument = createDocument(currentUrl)

    await renderCrmOfficialSitePanelInCurrentDocument({
      document: firstDocument,
      resolvedPage,
      tenantWebBaseUrl: 'http://localhost:5771'
    })
    firstDocument
      .getElementById('oes-crm-official-site-panel')
      ?.shadowRoot
      ?.querySelector<HTMLButtonElement>('[data-action="close"]')
      ?.click()

    const reloadedDocument = createDocument(currentUrl)
    const result = await renderCrmOfficialSitePanelInCurrentDocument({
      document: reloadedDocument,
      resolvedPage,
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    expect(result).toEqual({ rendered: true, skipped: false })
    expect(reloadedDocument.getElementById('oes-crm-official-site-panel')?.shadowRoot?.textContent).toContain('Swiss Madison')
  })

  it('renders public ownership context for other-owned CRM pages without exposing account details', async () => {
    const document = createDocument('https://other-owned.example/')

    const result = await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: {
        allowedActions: [],
        domain: 'other-owned.example',
        matchedAccount: null,
        status: 'OTHER_OWNER_LEAD',
        summary: {
          description: 'CRM status is available.',
          displayName: 'Other Owned Fixtures',
          label: 'OTHER_OWNER_LEAD',
          sensitivity: 'LOW'
        },
        title: 'Other Owned Fixtures',
        url: 'https://other-owned.example/'
      },
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const shadow = document.getElementById('oes-crm-official-site-panel')?.shadowRoot

    expect(result).toEqual({ rendered: true, skipped: false })
    expect(shadow?.textContent).toContain('Other Owned Fixtures')
    expect(shadow?.textContent).toContain('他人')
    expect(shadow?.textContent).toContain('Lead')
    expect(shadow?.querySelector('[data-action="open-oes"]')).toBeNull()
  })

  it('renders a pool floating panel from visible duplicate hints when matched account details are absent', async () => {
    const document = createDocument('https://pool-hint.example/')

    const result = await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: {
        allowedActions: ['OPEN_OES_DETAIL'],
        domain: 'pool-hint.example',
        duplicateHints: [
          {
            confidence: 'HIGH',
            crmAccountId: 'crm-pool-hint-1',
            displayName: 'Pool Hint Fixtures',
            lifecycleStage: 'LEAD',
            matchedFields: ['leadDomain'],
            ownerKind: 'POOL'
          }
        ],
        matchedAccount: null,
        status: 'UNKNOWN',
        summary: {
          description: 'CRM status is available.',
          displayName: 'Pool Hint Fixtures',
          label: 'POOL_LEAD',
          sensitivity: 'LOW'
        },
        title: 'Pool Hint Fixtures',
        url: 'https://pool-hint.example/'
      } as ExtensionCrmResolvedPage,
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const shadow = document.getElementById('oes-crm-official-site-panel')?.shadowRoot

    expect(result).toEqual({ rendered: true, skipped: false })
    expect(shadow?.textContent).toContain('Pool Hint Fixtures')
    expect(shadow?.textContent).toContain('公海')
    expect(shadow?.textContent).toContain('Lead')
    expect(shadow?.querySelector<HTMLAnchorElement>('[data-action="open-oes"]')?.href).toBe(
      'http://localhost:5771/crm/accounts/crm-pool-hint-1'
    )
  })

  it('renders competitor archive reasons as peer-company badges on official sites', async () => {
    const document = createDocument('https://competitor.example/')

    const result = await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: {
        allowedActions: ['OPEN_OES_DETAIL'],
        archiveReason: 'COMPETITOR',
        archivedAt: '2026-06-24T00:00:00.000Z',
        deepLinks: { tenantWebCrmAccountUrl: '/crm/accounts/crm-competitor-1' },
        domain: 'competitor.example',
        matchedAccount: {
          crmAccountId: 'crm-competitor-1',
          displayName: 'Competitor Fixtures',
          lifecycleStage: 'LEAD',
          ownerKind: 'SELF',
          recordStatus: 'ARCHIVED'
        },
        status: 'OWNED_LEAD',
        title: 'Competitor Fixtures',
        url: 'https://competitor.example/'
      },
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const shadow = document.getElementById('oes-crm-official-site-panel')?.shadowRoot

    expect(result).toEqual({ rendered: true, skipped: false })
    expect(shadow?.textContent).toContain('同行')
    expect(shadow?.textContent).not.toContain('COMPETITOR')
  })

  it('supports minimize, restore, close, and clear interactions', async () => {
    const document = createDocument('https://customer.example/')

    await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: {
        allowedActions: ['OPEN_OES_DETAIL'],
        domain: 'customer.example',
        matchedAccount: {
          crmAccountId: 'crm-customer-1',
          displayName: 'Northline Bath',
          lifecycleStage: 'CUSTOMER',
          ownerKind: 'SELF',
          recordStatus: 'ARCHIVED',
          archiveReason: 'LOW_VALUE'
        },
        status: 'CUSTOMER',
        title: 'Northline Bath',
        url: 'https://customer.example/'
      },
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const host = document.getElementById('oes-crm-official-site-panel')
    const shadow = host?.shadowRoot
    shadow?.querySelector<HTMLButtonElement>('[data-action="minimize"]')?.click()
    expect(host?.dataset.minimized).toBe('true')

    shadow?.querySelector<HTMLButtonElement>('[data-action="restore"]')?.click()
    expect(host?.dataset.minimized).toBe('false')

    shadow?.querySelector<HTMLButtonElement>('[data-action="close"]')?.click()
    expect(document.getElementById('oes-crm-official-site-panel')).toBeNull()

    await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: {
        allowedActions: ['OPEN_OES_DETAIL'],
        domain: 'customer.example',
        matchedAccount: {
          crmAccountId: 'crm-customer-1',
          displayName: 'Northline Bath',
          lifecycleStage: 'CUSTOMER',
          ownerKind: 'SELF',
          recordStatus: 'ARCHIVED',
          archiveReason: 'LOW_VALUE'
        },
        status: 'CUSTOMER',
        title: 'Northline Bath',
        url: 'https://customer.example/'
      },
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    expect(document.getElementById('oes-crm-official-site-panel')).toBeNull()
    expect(clearCrmOfficialSitePanelInCurrentDocument({ document })).toEqual({ removedCount: 0 })
  })

  it('does not start dragging when close or minimize buttons receive pointer input', async () => {
    const document = createDocument('https://buttons.example/')

    await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: createResolvedPage('buttons.example', 'Button Safe Customer'),
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const host = document.getElementById('oes-crm-official-site-panel') as HTMLElement
    const close = host.shadowRoot?.querySelector<HTMLButtonElement>('[data-action="close"]')
    const minimize = host.shadowRoot?.querySelector<HTMLButtonElement>('[data-action="minimize"]')

    close?.dispatchEvent(createPointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1 }))
    close?.dispatchEvent(createPointerEvent('pointermove', { clientX: 40, clientY: 20, pointerId: 1 }))
    close?.dispatchEvent(createPointerEvent('pointerup', { clientX: 40, clientY: 20, pointerId: 1 }))
    minimize?.dispatchEvent(createPointerEvent('pointerdown', { clientX: 120, clientY: 120, pointerId: 2 }))
    minimize?.dispatchEvent(createPointerEvent('pointermove', { clientX: 20, clientY: 20, pointerId: 2 }))
    minimize?.dispatchEvent(createPointerEvent('pointerup', { clientX: 20, clientY: 20, pointerId: 2 }))

    expect(host.style.right).toBe('24px')
    expect(host.style.bottom).toBe('24px')
  })

  it('uses shadow host selectors for minimized panel styling', async () => {
    const document = createDocument('https://minimize-style.example/')

    await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: createResolvedPage('minimize-style.example', 'Minimize Style Customer'),
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const style = document.getElementById('oes-crm-official-site-panel')?.shadowRoot?.querySelector('style')?.textContent

    expect(style).toContain(':host([data-minimized="true"]) .crm-panel')
    expect(style).toContain(':host([data-minimized="true"]) .crm-pill')
  })

  it('animates the whole floating panel toward the top-right action anchor when minimizing and restoring', async () => {
    vi.useFakeTimers()
    const document = createDocument('https://panel-motion.example/')

    await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: createResolvedPage('panel-motion.example', 'Panel Motion Customer'),
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const host = document.getElementById('oes-crm-official-site-panel') as HTMLElement
    const shadow = host.shadowRoot
    const style = shadow?.querySelector('style')?.textContent ?? ''

    expect(style).toMatch(/\.crm-panel\s*{[^}]*transform-origin:\s*calc\(100% - 24px\)\s*24px/s)
    expect(style).toContain(':host([data-motion="collapsing"]) .crm-panel')
    expect(style).toContain(':host([data-motion="expanding"]) .crm-panel')
    expect(style).toContain(':host([data-minimized="true"]) .crm-pill')

    shadow?.querySelector<HTMLButtonElement>('[data-action="minimize"]')?.click()

    expect(host.dataset.motion).toBe('collapsing')
    expect(host.dataset.minimized).toBe('true')

    vi.advanceTimersByTime(190)

    expect(host.dataset.motion).toBeUndefined()
    expect(host.dataset.minimized).toBe('true')

    shadow?.querySelector<HTMLButtonElement>('[data-action="restore"]')?.click()

    expect(host.dataset.motion).toBe('expanding')
    expect(host.dataset.minimized).toBe('false')

    vi.advanceTimersByTime(190)

    expect(host.dataset.motion).toBeUndefined()
    vi.useRealTimers()
  })

  it('keeps the injected floating panel on the dark ops visual system', async () => {
    const document = createDocument('https://dark-style.example/')

    await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: createResolvedPage('dark-style.example', 'Dark Style Customer'),
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const style = document.getElementById('oes-crm-official-site-panel')?.shadowRoot?.querySelector('style')?.textContent

    expect(style).toContain('#202729')
    expect(style).toContain('#151a1c')
    expect(style).toContain('#a9955f')
    expect(style).not.toContain('rgba(255, 255, 255, 0.96)')
    expect(style).not.toContain('background: #fff')
  })

  it('animates the floating panel action dock on hover and keyboard focus', async () => {
    const document = createDocument('https://dock-style.example/')

    await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: createResolvedPage('dock-style.example', 'Dock Style Customer'),
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const style = document.getElementById('oes-crm-official-site-panel')?.shadowRoot?.querySelector('style')?.textContent

    expect(style).toContain('.crm-action-dock:hover .crm-action-rail')
    expect(style).toContain('.crm-action-dock:focus-within .crm-action-rail')
    expect(style).toMatch(/\.crm-action-rail\s*{[^}]*opacity:\s*0[^}]*transform:\s*scale\(\.96\)[^}]*transition-delay:\s*100ms/s)
    expect(style).toMatch(/\.crm-action-dock:hover \.crm-action-rail,[^}]*\.crm-action-dock:focus-within \.crm-action-rail\s*{[^}]*opacity:\s*1[^}]*transform:\s*scale\(1\)[^}]*transition-delay:\s*0ms/s)
    expect(style).not.toContain('transform: translateY(-3px) scale(.96);')
    expect(style).toMatch(/\.crm-action-item\s*{[^}]*transition:[^}]*transform 160ms ease[^}]*transition-delay:\s*100ms/s)
    expect(style).toMatch(/\.crm-action-dock:hover \.crm-action-item,[^}]*\.crm-action-dock:focus-within \.crm-action-item\s*{[^}]*transition-delay:\s*0ms/s)
  })

  it('keeps the floating panel height bounded while scrolling overflowing content', async () => {
    const document = createDocument('https://bounded-height.example/')

    await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: {
        ...createResolvedPage('bounded-height.example', 'Bounded Height Customer'),
        tags: [
          { label: 'Tag A', type: 'custom' },
          { label: 'Tag B', type: 'custom' },
          { label: 'Tag C', type: 'custom' },
          { label: 'Tag D', type: 'custom' }
        ]
      } as ExtensionCrmResolvedPage & { tags: Array<{ label: string; type: string }> },
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const shadow = document.getElementById('oes-crm-official-site-panel')?.shadowRoot
    const style = shadow?.querySelector('style')?.textContent ?? ''

    expect(shadow?.querySelector('.crm-panel-scroll')).not.toBeNull()
    expect(style).toMatch(/\.crm-panel\s*{[^}]*min-height:\s*168px[^}]*max-height:\s*min\(420px,\s*calc\(100vh - 32px\)\)[^}]*overflow:\s*visible/s)
    expect(style).toMatch(/\.crm-panel-scroll\s*{[^}]*max-height:\s*min\(420px,\s*calc\(100vh - 32px\)\)[^}]*overflow-y:\s*auto/s)
  })

  it('keeps the floating panel action dock selectable without hover gaps or clipping', async () => {
    const document = createDocument('https://selectable-dock.example/')

    await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: createResolvedPage('selectable-dock.example', 'Selectable Dock Customer'),
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const shadow = document.getElementById('oes-crm-official-site-panel')?.shadowRoot
    const style = shadow?.querySelector('style')?.textContent ?? ''

    expect(style).toMatch(/\.crm-action-dock\s*{[^}]*position:\s*relative[^}]*height:\s*26px[^}]*width:\s*80px/s)
    expect(style).toMatch(/\.crm-action-pin\s*{[^}]*border:\s*0[^}]*height:\s*18px[^}]*width:\s*18px/s)
    expect(style).not.toContain('.crm-action-pin span')
    expect(style).toMatch(/\.crm-action-icon\s*{[^}]*height:\s*13px[^}]*width:\s*13px/s)
    expect(style).toMatch(/\.crm-action-dock:hover \.crm-action-pin,[^}]*\.crm-action-dock:focus-within \.crm-action-pin\s*{[^}]*pointer-events:\s*none/s)
    expect(style).toMatch(/\.crm-action-rail\s*{[^}]*border:\s*0[^}]*position:\s*absolute[^}]*right:\s*0[^}]*top:\s*0[^}]*width:\s*max-content/s)
    expect(style).not.toContain('width: 92px')
    expect(style).not.toContain('.crm-actions-menu::before')
    expect(style).toMatch(/\.crm-action-item\s*{[^}]*border:\s*0[^}]*height:\s*24px[^}]*width:\s*24px/s)
  })

  it('restores dragged position after re-rendering another tab or refreshing the page', async () => {
    const firstTab = createDocument('https://position.example/')

    await renderCrmOfficialSitePanelInCurrentDocument({
      document: firstTab,
      resolvedPage: createResolvedPage('position.example', 'Position Customer'),
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const firstHost = firstTab.getElementById('oes-crm-official-site-panel') as HTMLElement
    const firstHandle = firstHost.shadowRoot?.querySelector<HTMLElement>('[data-drag-handle="true"]')
    firstHandle?.dispatchEvent(createPointerEvent('pointerdown', { clientX: 300, clientY: 300, pointerId: 1 }))
    firstHandle?.dispatchEvent(createPointerEvent('pointermove', { clientX: 260, clientY: 250, pointerId: 1 }))
    firstHandle?.dispatchEvent(createPointerEvent('pointerup', { clientX: 260, clientY: 250, pointerId: 1 }))

    expect(firstHost.style.right).toBe('64px')
    expect(firstHost.style.bottom).toBe('74px')

    const secondTab = createDocument('https://other-position.example/')
    await renderCrmOfficialSitePanelInCurrentDocument({
      document: secondTab,
      resolvedPage: createResolvedPage('other-position.example', 'Other Position Customer'),
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const secondHost = secondTab.getElementById('oes-crm-official-site-panel') as HTMLElement
    expect(secondHost.style.right).toBe('64px')
    expect(secondHost.style.bottom).toBe('74px')

    await renderCrmOfficialSitePanelInCurrentDocument({
      document: firstTab,
      resolvedPage: createResolvedPage('position.example', 'Position Customer'),
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const refreshedHost = firstTab.getElementById('oes-crm-official-site-panel') as HTMLElement
    expect(refreshedHost.style.right).toBe('64px')
    expect(refreshedHost.style.bottom).toBe('74px')
  })

  it('keeps restored positions inside the current viewport when old storage is off-screen', async () => {
    vi.stubGlobal('innerWidth', 390)
    vi.stubGlobal('innerHeight', 640)
    localStorage.setItem('oes-crm-official-site-panel-position:v1', JSON.stringify({
      bottom: 2000,
      right: 2000
    }))
    const document = createDocument('https://swissmadison.com/')

    await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: createResolvedPage('swissmadison.com', 'Swiss Madison'),
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const host = document.getElementById('oes-crm-official-site-panel') as HTMLElement
    expect(Number.parseFloat(host.style.right)).toBeLessThanOrEqual(342)
    expect(Number.parseFloat(host.style.bottom)).toBeLessThanOrEqual(592)
    expect(Number.parseFloat(host.style.right)).toBeGreaterThanOrEqual(12)
    expect(Number.parseFloat(host.style.bottom)).toBeGreaterThanOrEqual(12)
  })

  it('keeps the minimized floating pill draggable without restoring the full panel', async () => {
    const document = createDocument('https://minimized-drag.example/')

    await renderCrmOfficialSitePanelInCurrentDocument({
      document,
      resolvedPage: createResolvedPage('minimized-drag.example', 'Minimized Drag Customer'),
      tenantWebBaseUrl: 'http://localhost:5771'
    })

    const host = document.getElementById('oes-crm-official-site-panel') as HTMLElement
    const shadow = host.shadowRoot
    shadow?.querySelector<HTMLButtonElement>('[data-action="minimize"]')?.click()

    const pill = shadow?.querySelector<HTMLButtonElement>('[data-action="restore"]')
    pill?.dispatchEvent(createPointerEvent('pointerdown', { clientX: 300, clientY: 300, pointerId: 1 }))
    pill?.dispatchEvent(createPointerEvent('pointermove', { clientX: 250, clientY: 240, pointerId: 1 }))
    pill?.dispatchEvent(createPointerEvent('pointerup', { clientX: 250, clientY: 240, pointerId: 1 }))
    pill?.click()

    expect(host.dataset.minimized).toBe('true')
    expect(host.style.right).toBe('74px')
    expect(host.style.bottom).toBe('84px')
  })
})

// Creates a minimal resolved CRM page fixture for floating-panel interaction tests.
function createResolvedPage(domain: string, displayName: string): ExtensionCrmResolvedPage {
  return {
    allowedActions: ['OPEN_OES_DETAIL'],
    domain,
    matchedAccount: {
      crmAccountId: `crm-${domain}`,
      displayName,
      lifecycleStage: 'LEAD',
      ownerKind: 'SELF',
      recordStatus: 'ACTIVE'
    },
    status: 'OWNED_LEAD',
    title: displayName,
    url: `https://${domain}/`
  }
}

// Creates pointer events with coordinates because the DOM test environment lacks a full PointerEvent.
function createPointerEvent(
  type: string,
  init: { clientX: number; clientY: number; pointerId: number }
): Event {
  const event = new Event(type, { bubbles: true, cancelable: true }) as Event & {
    clientX: number
    clientY: number
    pointerId: number
  }
  Object.defineProperties(event, {
    clientX: { value: init.clientX },
    clientY: { value: init.clientY },
    pointerId: { value: init.pointerId }
  })
  return event
}

// Provides deterministic localStorage behavior for panel persistence tests.
function createMemoryLocalStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => {
      values.delete(key)
    },
    setItem: (key: string, value: string) => {
      values.set(key, String(value))
    }
  }
}

function createDocument(url: string): Document {
  const page = document.implementation.createHTMLDocument('Customer Page')
  page.body.innerHTML = '<main><h1>Customer Page</h1></main>'
  Object.defineProperty(page, 'location', {
    value: new URL(url)
  })
  return page
}
