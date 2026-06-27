/// <reference types="node" />

import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createApp, nextTick, type App } from 'vue'
import {
  accountAvatar,
  avatarInitial,
  displayName,
  tenantName,
  visibleWorkspaces,
  workspaceDisplayName
} from './PopupApp.vue'
import PopupApp from './PopupApp.vue'
import type { SessionContext } from '../auth/types'
import {
  buildSelectedWorkspacePreferenceKey,
  buildWorkspacePreferenceKey,
  MemoryWorkspacePreferenceStorage,
  WorkspacePreferenceStore
} from '../workspaces/workspace-preferences'
import {
  SET_CRM_FLOATING_PANEL_ENABLED_MESSAGE,
  SET_CRM_SIDE_PANEL_ENABLED_MESSAGE,
  SET_CRM_WORKSPACE_RUNTIME_ENABLED_MESSAGE,
  SHOW_CRM_FLOATING_PANEL_MESSAGE
} from '../runtime/messages'

describe('PopupApp display helpers', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
  })

  it('maps visible navigation entries into Chinese workspace labels', () => {
    const context: SessionContext = {
      navigation: {
        visibleEntries: ['extension.designer.workspace']
      }
    }

    expect(visibleWorkspaces(context)).toEqual([
      {
        disabled: false,
        key: 'extension.designer.workspace',
        label: '设计师工作台',
        secondaryLabel: 'Designer Workspace'
      }
    ])
  })

  it('maps the CRM extension workspace without reusing tenant-web CRM entries', () => {
    const context: SessionContext = {
      navigation: {
        defaultEntry: 'extension.crm.workspace',
        visibleEntries: ['crm.accounts', 'crm.pool', 'extension.crm.workspace']
      }
    }

    expect(visibleWorkspaces(context)).toEqual([
      {
        disabled: false,
        key: 'extension.crm.workspace',
        label: 'CRM Sales Workspace',
        secondaryLabel: '浏览器侧客户识别与线索创建'
      }
    ])
    expect(workspaceDisplayName('crm.accounts')).toBe('crm.accounts')
    expect(workspaceDisplayName('crm.pool')).toBe('crm.pool')
  })

  it('stores workspace enablement per tenant account and workspace', async () => {
    const storage = new MemoryWorkspacePreferenceStorage()
    const store = new WorkspacePreferenceStore(storage)
    const crmKey = {
      accountId: 'acc-1',
      tenantId: 'tenant-1',
      workspaceKey: 'extension.crm.workspace'
    }

    expect(buildWorkspacePreferenceKey(crmKey)).toBe(
      'workspace-enabled:tenant-1:acc-1:extension.crm.workspace'
    )
    await expect(store.isEnabled(crmKey)).resolves.toBe(false)

    await store.setEnabled(crmKey, true)

    await expect(store.isEnabled(crmKey)).resolves.toBe(true)
    await expect(
      store.isEnabled({
        accountId: 'acc-2',
        tenantId: 'tenant-1',
        workspaceKey: 'extension.crm.workspace'
      })
    ).resolves.toBe(false)
    await expect(
      store.isEnabled({
        accountId: 'acc-1',
        tenantId: 'tenant-1',
        workspaceKey: 'extension.designer.workspace'
      })
    ).resolves.toBe(false)
  })

  it('stores the explicitly selected workspace per tenant account without enabling capabilities', async () => {
    const storage = new MemoryWorkspacePreferenceStorage()
    const store = new WorkspacePreferenceStore(storage)
    const identity = {
      accountId: 'acc-1',
      tenantId: 'tenant-1'
    }

    expect(buildSelectedWorkspacePreferenceKey(identity)).toBe('workspace-selected:tenant-1:acc-1')
    await expect(store.getSelectedWorkspace(identity)).resolves.toBeNull()

    await store.setSelectedWorkspace(identity, 'extension.crm.workspace')

    await expect(store.getSelectedWorkspace(identity)).resolves.toBe('extension.crm.workspace')
    await expect(store.isEnabled({ ...identity, workspaceKey: 'extension.crm.workspace' })).resolves.toBe(false)

    await store.setSelectedWorkspace(identity, null)

    await expect(store.getSelectedWorkspace(identity)).resolves.toBeNull()
  })

  it('falls back to the designer workspace when navigation has no known workspace entries', () => {
    expect(visibleWorkspaces({ navigation: { visibleEntries: [] } })).toEqual([
      {
        disabled: true,
        key: 'extension.designer.workspace',
        label: '设计师工作台',
        secondaryLabel: 'Designer Workspace'
      }
    ])
  })

  it('keeps user, account, tenant, and avatar fallback labels concise', () => {
    const context: SessionContext = {
      account: { accountId: 'account-1', avatar: 'https://cdn.oes.local/avatar/account-1.webp', name: 'Promptcard Studio' },
      operator: { displayName: 'Mira Tan' },
      tenant: { name: 'OES Lab' }
    }

    expect(accountAvatar(context)).toBe('https://cdn.oes.local/avatar/account-1.webp')
    expect(displayName(context)).toBe('Mira Tan')
    expect(avatarInitial(context)).toBe('M')
    expect(tenantName(context)).toBe('OES Lab')
    expect(workspaceDisplayName('extension.designer.workspace')).toBe('设计师工作台')
  })

  it('keeps the avatar dropdown above the workspace surface', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/popup/styles.css'), 'utf8')

    expect(css).toMatch(/\.avatar-menu\s*{[^}]*z-index:\s*[1-9]/s)
    expect(css).toMatch(/\.dropdown-panel\s*{[^}]*z-index:\s*[1-9]/s)
  })

  it('keeps popup account avatars compact', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/popup/styles.css'), 'utf8')

    expect(css).toMatch(/\.home-topline\s*{[^}]*min-height:\s*36px/s)
    expect(css).toMatch(/\.avatar-button\s*{[^}]*width:\s*34px[^}]*height:\s*34px/s)
    expect(css).toMatch(/\.avatar-button\s*{[^}]*padding:\s*0/s)
    expect(css).toMatch(/\.avatar-button img\s*{[^}]*display:\s*block[^}]*width:\s*100%[^}]*height:\s*100%[^}]*object-fit:\s*cover/s)
    expect(css).toMatch(/\.dropdown-panel\s*{[^}]*top:\s*42px/s)
    expect(css).not.toContain('.menu-avatar')
  })

  it('keeps the production popup surfaces opaque with square panel edges', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/popup/styles.css'), 'utf8')

    expect(css).toMatch(/html,\s*body,\s*#app\s*{[^}]*border-radius:\s*0/s)
    expect(css).toMatch(/\.dropdown-panel\s*{[^}]*background:\s*#1a2022/s)
    expect(css).not.toMatch(/\.dropdown-panel\s*{[^}]*background:\s*#fff/s)
    expect(css).toMatch(/\.selection-card\s*{[^}]*min-height:\s*3[0-9]{2}px/s)
  })

  it('keeps the popup as one visible square shell instead of nested rounded surfaces', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/popup/styles.css'), 'utf8')

    expect(css).toMatch(/\.extension-shell\s*{[^}]*border-radius:\s*0/s)
    expect(css).toMatch(/\.extension-shell\s*{[^}]*padding:\s*0/s)
    expect(css).toMatch(/\.brand-panel\s*{[^}]*background:\s*transparent/s)
    expect(css).toMatch(/\.brand-panel\s*{[^}]*border:\s*0/s)
    expect(css).toMatch(/\.brand-panel\s*{[^}]*box-shadow:\s*none/s)
    expect(css).toMatch(/\.brand-panel::before\s*{[^}]*border-radius:\s*0/s)
    expect(css).toMatch(/\.content-card\s*{[^}]*background:\s*transparent/s)
    expect(css).toMatch(/\.content-card\s*{[^}]*border:\s*0/s)
    expect(css).toMatch(/\.content-card\s*{[^}]*box-shadow:\s*none/s)
    expect(css).toMatch(/\.content-card\s*{[^}]*border-radius:\s*0/s)
    expect(css).toMatch(/\.workspace-hero\s*{[^}]*background:\s*transparent/s)
    expect(css).toMatch(/\.workspace-hero\s*{[^}]*border:\s*0/s)
    expect(css).toMatch(/\.workspace-hero\s*{[^}]*box-shadow:\s*none/s)
    expect(css).toMatch(/\.workspace-hero\s*{[^}]*border-radius:\s*0/s)
  })

  it('uses the compact production extension name', () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'public/manifest.json'), 'utf8')) as {
      action: { default_icon?: Record<string, string>; default_title: string }
      host_permissions?: string[]
      icons: Record<string, string>
      name: string
    }

    expect(manifest.name).toBe('OES BE')
    expect(manifest.action.default_title).toBe('OES BE')
    expect(manifest.icons).toEqual({
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png'
    })
    expect(manifest.action.default_icon).toEqual(manifest.icons)
  })

  it('requests web host access required for CRM current-page signal collection', () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'public/manifest.json'), 'utf8')) as {
      host_permissions?: string[]
      permissions?: string[]
    }

    expect(manifest.permissions).toContain('scripting')
    expect(manifest.permissions).toContain('tabs')
    expect(manifest.host_permissions).toEqual(
      expect.arrayContaining(['http://*/*', 'https://*/*', 'http://localhost:9101/*'])
    )
  })

  it('keeps production popup copy free of demo placeholders and redundant signed-in labels', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/popup/PopupApp.vue'), 'utf8')

    expect(source).not.toContain('csp@ml.lc')
    expect(source).not.toContain('已登录')
    expect(source).toContain('placeholder="邮箱或手机号"')
  })

  it('lands authenticated users on the workspace selector instead of auto-entering a workspace', async () => {
    seedAuthenticatedSession({
      navigation: {
        defaultEntry: 'extension.designer.workspace',
        visibleEntries: ['extension.designer.workspace', 'extension.crm.workspace']
      }
    })

    const { root, unmount } = mountPopup()
    await flush()

    expect(root.textContent).toContain('选择工作台')
    expect(root.textContent).toContain('设计师工作台')
    expect(root.textContent).toContain('CRM Sales Workspace')
    expect(root.textContent).not.toContain('当前工作台')
    expect(root.textContent).not.toContain('最近使用')
    expect(root.textContent).not.toContain('最佳使用')
    expect(root.textContent).not.toContain('Floating Panel')
    expect(root.querySelector('.workspace-entry-action')).toBeNull()
    expect(root.textContent).not.toContain('进入 CRM')
    expect(root.querySelectorAll('.workspace-entry')).toHaveLength(2)
    expect(root.querySelector('.workspace-selector-footer')).toBeNull()
    expect(root.querySelectorAll('input[type="checkbox"]')).toHaveLength(0)

    unmount()
  })

  it('keeps workspace switching and workspace status out of the avatar dropdown', async () => {
    seedAuthenticatedSession({
      account: { accountId: 'account-1', name: 'Promptcard Studio' },
      navigation: {
        defaultEntry: 'extension.designer.workspace',
        visibleEntries: ['extension.designer.workspace', 'extension.crm.workspace']
      },
      operator: { displayName: 'Mira Tan' },
      tenant: { name: 'OES Lab' }
    })

    const { root, unmount } = mountPopup()
    await flush()

    root.querySelector<HTMLButtonElement>('.avatar-button')?.click()
    await flush()

    const dropdown = root.querySelector('.dropdown-panel')
    expect(dropdown?.textContent).toContain('Mira Tan')
    expect(dropdown?.textContent).toContain('OES Lab')
    expect(dropdown?.textContent).not.toContain('Promptcard Studio')
    expect(dropdown?.textContent).not.toContain('能力')
    expect(dropdown?.textContent).toContain('刷新会话')
    expect(dropdown?.textContent).toContain('打开 OES')
    expect(dropdown?.textContent).toContain('插件诊断')
    expect(dropdown?.textContent).toContain('设置')
    expect(dropdown?.textContent).toContain('退出登录')
    expect(dropdown?.textContent).not.toContain('当前工作台')
    expect(dropdown?.textContent).not.toContain('切换工作台')
    expect(dropdown?.textContent).not.toContain('设计师工作台')
    expect(dropdown?.textContent).not.toContain('CRM Sales Workspace')
    expect(dropdown?.querySelector('.menu-avatar')).toBeNull()
    expect(dropdown?.querySelector('.menu-actions')).not.toBeNull()
    expect(dropdown?.querySelector('.menu-meta')).toBeNull()
    expect(dropdown?.querySelector('.menu-section-label')).toBeNull()
    expect(dropdown?.querySelector('.menu-action-grid')).toBeNull()
    expect(dropdown?.querySelector('.menu-session')).toBeNull()
    expect(dropdown?.querySelectorAll('.menu-actions > .menu-action')).toHaveLength(5)
    expect(dropdown?.querySelectorAll('.menu-action:disabled')).toHaveLength(4)
    expect(dropdown?.querySelector('.workspace-menu')).toBeNull()

    unmount()
  })

  it('keeps avatar menu actions visually compact', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/popup/styles.css'), 'utf8')

    expect(css).toMatch(/\.menu-user\s*{[^}]*grid-template-columns:\s*1fr/s)
    expect(css).toMatch(/\.menu-actions\s*{[^}]*border-top:\s*1px solid rgba\(236,\s*231,\s*214,\s*0\.08\)/s)
    expect(css).toMatch(/\.menu-actions\s*{[^}]*gap:\s*7px/s)
    expect(css).toMatch(/\.menu-action\s*{[^}]*width:\s*100%[^}]*height:\s*36px/s)
    expect(css).not.toContain('.menu-action-grid')
    expect(css).not.toContain('.menu-section-label')
    expect(css).not.toContain('.menu-session')
    expect(css).toMatch(/\.menu-logout\s*{[^}]*justify-content:\s*center/s)
  })

  it('enters CRM workspace with all panels disabled by default', async () => {
    seedAuthenticatedSession({
      account: { accountId: 'acc-1' },
      navigation: {
        visibleEntries: ['extension.crm.workspace']
      },
      tenant: { tenantId: 'tenant-1' }
    })

    const { root, unmount } = mountPopup()
    await flush()

    expect(root.textContent).toContain('选择工作台')
    expect(root.textContent).not.toContain('Floating Panel')
    expect(root.textContent).not.toContain('Side Panel')

    await clickWorkspaceEntry(root, 'CRM Sales Workspace')

    expect(root.textContent).toContain('CRM Sales Workspace')
    expect(root.querySelector('.home-topline.has-workspace .workspace-back-button')).not.toBeNull()
    expect(getButtonByAriaLabel(root, '返回工作台选择')?.textContent?.trim()).toBe('')
    expect(root.textContent).not.toContain('浏览器侧客户识别与线索创建')
    expect(root.textContent).toContain('Floating Panel 已关闭')
    expect(root.textContent).toContain('Side Panel 已关闭')
    expect(root.querySelectorAll('input[type="checkbox"]')).toHaveLength(0)
    expect(getButtonByText(root, 'Floating Panel')?.getAttribute('role')).toBe('switch')
    expect(getButtonByText(root, 'Floating Panel')?.getAttribute('aria-checked')).toBe('false')
    expect(getButtonByText(root, 'Side Panel')?.getAttribute('role')).toBe('switch')
    expect(getButtonByText(root, 'Side Panel')?.getAttribute('aria-checked')).toBe('false')

    await clickByAriaLabel(root, '返回工作台选择')

    expect(root.textContent).toContain('选择工作台')
    expect(root.textContent).not.toContain('Floating Panel')
    expect(root.textContent).not.toContain('Side Panel')

    unmount()
  })

  it('does not enable CRM runtime when users enter a non-CRM workspace', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true })
    seedAuthenticatedSession({
      account: { accountId: 'acc-1' },
      navigation: {
        visibleEntries: ['extension.designer.workspace', 'extension.crm.workspace']
      },
      tenant: { tenantId: 'tenant-1' }
    })
    vi.stubGlobal('chrome', {
      runtime: { sendMessage }
    })

    const { root, unmount } = mountPopup()
    await flush()
    await clickByText(root, '设计师工作台')

    expect(root.textContent).toContain('设计师工作台')
    expect(root.textContent).not.toContain('Floating Panel')
    expect(root.textContent).not.toContain('Side Panel')
    expect(sendMessage).not.toHaveBeenCalled()

    unmount()
  })

  it('restores the explicitly selected CRM workspace when the popup is reopened', async () => {
    seedAuthenticatedSession({
      account: { accountId: 'acc-1' },
      navigation: {
        defaultEntry: 'extension.designer.workspace',
        visibleEntries: ['extension.designer.workspace', 'extension.crm.workspace']
      },
      tenant: { tenantId: 'tenant-1' }
    })

    const first = mountPopup()
    await flush()
    await clickWorkspaceEntry(first.root, 'CRM Sales Workspace')
    expect(first.root.textContent).toContain('CRM Sales Workspace')
    first.unmount()

    const second = mountPopup()
    await flush()

    expect(second.root.textContent).toContain('CRM Sales Workspace')
    expect(second.root.textContent).toContain('Floating Panel 已关闭')
    expect(second.root.textContent).toContain('Side Panel 已关闭')
    expect(second.root.textContent).not.toContain('选择工作台')

    second.unmount()
  })

  it('keeps side panel disabled on CRM entry and lets users enable it globally', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true })
    const setOptions = vi.fn().mockResolvedValue(undefined)
    const open = vi.fn().mockResolvedValue(undefined)
    const query = vi.fn().mockResolvedValue([{ id: 7, windowId: 11 }])
    seedAuthenticatedSession({
      account: { accountId: 'acc-1' },
      navigation: {
        visibleEntries: ['extension.crm.workspace']
      },
      tenant: { tenantId: 'tenant-1' }
    })
    vi.stubGlobal('chrome', {
      runtime: { sendMessage },
      sidePanel: { open, setOptions },
      tabs: { query }
    })

    const { root, unmount } = mountPopup()
    await flush()
    await clickWorkspaceEntry(root, 'CRM Sales Workspace')

    expect(sendMessage).toHaveBeenCalledWith({
      enabled: true,
      type: SET_CRM_WORKSPACE_RUNTIME_ENABLED_MESSAGE
    })
    expect(setOptions).not.toHaveBeenCalled()
    expect(open).not.toHaveBeenCalled()
    expect(getButtonByText(root, 'Side Panel')?.getAttribute('aria-checked')).toBe('false')

    await clickByText(root, 'Side Panel 已关闭')

    expect(setOptions).toHaveBeenCalledWith({
      enabled: true,
      path: 'side-panel.html'
    })
    expect(open).toHaveBeenCalledWith({ tabId: 7, windowId: 11 })
    expect(getButtonByText(root, 'Side Panel')?.getAttribute('aria-checked')).toBe('true')

    await clickByText(root, 'Side Panel 已开启')

    expect(setOptions).toHaveBeenLastCalledWith({
      enabled: false,
      path: 'side-panel.html'
    })
    expect(getButtonByText(root, 'Side Panel')?.getAttribute('aria-checked')).toBe('false')

    unmount()
  })

  it('keeps floating panel disabled on CRM entry and lets users enable it globally', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true })
    seedAuthenticatedSession({
      account: { accountId: 'acc-1' },
      navigation: {
        visibleEntries: ['extension.crm.workspace']
      },
      tenant: { tenantId: 'tenant-1' }
    })
    vi.stubGlobal('chrome', {
      runtime: { sendMessage }
    })

    const { root, unmount } = mountPopup()
    await flush()
    await clickWorkspaceEntry(root, 'CRM Sales Workspace')

    expect(sendMessage).toHaveBeenCalledWith({
      enabled: true,
      type: SET_CRM_WORKSPACE_RUNTIME_ENABLED_MESSAGE
    })
    expect(getButtonByText(root, 'Floating Panel')?.getAttribute('aria-checked')).toBe('false')

    await clickByText(root, 'Floating Panel 已关闭')

    expect(sendMessage).toHaveBeenCalledWith({
      enabled: true,
      type: SET_CRM_FLOATING_PANEL_ENABLED_MESSAGE
    })
    expect(getButtonByText(root, 'Floating Panel')?.getAttribute('aria-checked')).toBe('true')

    await clickByText(root, 'Floating Panel 已开启')

    expect(sendMessage).toHaveBeenCalledWith({
      enabled: false,
      type: SET_CRM_FLOATING_PANEL_ENABLED_MESSAGE
    })
    expect(getButtonByText(root, 'Floating Panel')?.getAttribute('aria-checked')).toBe('false')

    unmount()
  })

  it('lets users force-show the floating panel on the current official site after enabling it', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true })
    seedAuthenticatedSession({
      account: { accountId: 'acc-1' },
      navigation: {
        visibleEntries: ['extension.crm.workspace']
      },
      tenant: { tenantId: 'tenant-1' }
    })
    vi.stubGlobal('chrome', {
      runtime: { sendMessage }
    })

    const { root, unmount } = mountPopup()
    await flush()
    await clickWorkspaceEntry(root, 'CRM Sales Workspace')
    await clickByText(root, 'Floating Panel 已关闭')
    await clickByText(root, '显示当前页')

    expect(sendMessage).toHaveBeenCalledWith({
      type: SHOW_CRM_FLOATING_PANEL_MESSAGE
    })

    unmount()
  })

  it('keeps floating panel disabled when the background render fails', async () => {
    const sendMessage = vi.fn().mockImplementation(async (message) => {
      if (message.type === SET_CRM_FLOATING_PANEL_ENABLED_MESSAGE) {
        return { error: 'CRM resolver unavailable' }
      }
      return { ok: true }
    })
    seedAuthenticatedSession({
      account: { accountId: 'acc-1' },
      navigation: {
        visibleEntries: ['extension.crm.workspace']
      },
      tenant: { tenantId: 'tenant-1' }
    })
    vi.stubGlobal('chrome', {
      runtime: { sendMessage }
    })

    const { root, unmount } = mountPopup()
    await flush()
    await clickWorkspaceEntry(root, 'CRM Sales Workspace')
    await clickByText(root, 'Floating Panel 已关闭')

    expect(root.textContent).toContain('CRM resolver unavailable')
    expect(getButtonByText(root, 'Floating Panel')?.getAttribute('aria-checked')).toBe('false')
    expect(localStorage.getItem('workspace-panel-enabled:tenant-1:acc-1:extension.crm.workspace:crm-floating-panel')).not.toBe('true')

    unmount()
  })

  it('starts side-panel enablement and open work concurrently to reduce popup wait time', async () => {
    let resolveSetOptions: (() => void) | undefined
    let resolveOpen: (() => void) | undefined
    const setOptions = vi.fn().mockImplementation(() => new Promise<void>((resolve) => {
      resolveSetOptions = resolve
    }))
    const open = vi.fn().mockImplementation(() => new Promise<void>((resolve) => {
      resolveOpen = resolve
    }))
    seedAuthenticatedSession({
      account: { accountId: 'acc-1' },
      navigation: {
        visibleEntries: ['extension.crm.workspace']
      },
      tenant: { tenantId: 'tenant-1' }
    })
    vi.stubGlobal('chrome', {
      runtime: { sendMessage: vi.fn().mockResolvedValue({ ok: true }) },
      sidePanel: { open, setOptions },
      tabs: { query: vi.fn().mockResolvedValue([{ id: 7, windowId: 11 }]) }
    })

    const { root, unmount } = mountPopup()
    await flush()
    await clickWorkspaceEntry(root, 'CRM Sales Workspace')

    const sidePanelToggle = getButtonByText(root, 'Side Panel 已关闭') as HTMLButtonElement
    sidePanelToggle.click()
    await nextTick()
    await Promise.resolve()

    await vi.waitFor(() => expect(setOptions).toHaveBeenCalledTimes(1))
    expect(open).toHaveBeenCalledTimes(1)

    resolveSetOptions?.()
    resolveOpen?.()
    await flush()
    unmount()
  })

  it('surfaces side panel open failures instead of silently doing nothing', async () => {
    seedAuthenticatedSession({
      account: { accountId: 'acc-1' },
      navigation: {
        visibleEntries: ['extension.crm.workspace']
      },
      tenant: { tenantId: 'tenant-1' }
    })
    vi.stubGlobal('chrome', {
      runtime: { sendMessage: vi.fn().mockResolvedValue({ ok: true }) },
      sidePanel: {
        open: vi.fn().mockRejectedValue(new Error('Side panel was blocked')),
        setOptions: vi.fn().mockResolvedValue(undefined)
      },
      tabs: { query: vi.fn().mockResolvedValue([{ id: 7, windowId: 11 }]) }
    })

    const { root, unmount } = mountPopup()
    await flush()
    await clickWorkspaceEntry(root, 'CRM Sales Workspace')
    await clickByText(root, 'Side Panel 已关闭')

    expect(root.textContent).toContain('Side panel was blocked')

    unmount()
  })
})

function mountPopup(): { root: HTMLElement; unmount: () => void } {
  const root = document.createElement('div')
  document.body.appendChild(root)
  const app: App = createApp(PopupApp)
  app.mount(root)
  return {
    root,
    unmount: () => app.unmount()
  }
}

function getButtonByText(root: HTMLElement, text: string): HTMLButtonElement | undefined {
  return Array.from(root.querySelectorAll('button')).find((item) => item.textContent?.includes(text))
}

function getButtonByAriaLabel(root: HTMLElement, label: string): HTMLButtonElement | undefined {
  return Array.from(root.querySelectorAll('button')).find((item) => item.getAttribute('aria-label') === label)
}


async function clickWorkspaceEntry(root: HTMLElement, label: string): Promise<void> {
  await flush()
  const button = Array.from(root.querySelectorAll<HTMLButtonElement>('.workspace-entry')).find((item) =>
    item.textContent?.includes(label)
  )
  if (!button) {
    throw new Error(`workspace entry not found: ${label}`)
  }
  button.click()
  await flush()
}

async function clickByText(root: HTMLElement, text: string): Promise<void> {
  await flush()
  const button = getButtonByText(root, text)
  if (!button) {
    throw new Error(`button not found: ${text}`)
  }
  ;(button as HTMLButtonElement).click()
  await flush()
}

async function clickByAriaLabel(root: HTMLElement, label: string): Promise<void> {
  await flush()
  const button = getButtonByAriaLabel(root, label)
  if (!button) {
    throw new Error(`button not found: ${label}`)
  }
  button.click()
  await flush()
}

async function flush(): Promise<void> {
  await nextTick()
  await Promise.resolve()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await Promise.resolve()
  await nextTick()
}

function seedAuthenticatedSession(context: SessionContext): void {
  installMemoryLocalStorage()
  localStorage.setItem(
    'oes.browserExtension.authSession',
    JSON.stringify({
      accessToken: 'access-token-1',
      context,
      refreshToken: 'refresh-token-1'
    })
  )
  vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(context))))
}

function installMemoryLocalStorage(): void {
  const values = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => {
      values.set(key, value)
    }
  })
}

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify({ data, success: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  })
}
