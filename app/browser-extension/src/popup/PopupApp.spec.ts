/// <reference types="node" />

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  accountAvatar,
  avatarInitial,
  displayName,
  tenantName,
  visibleWorkspaces,
  workspaceDisplayName
} from './PopupApp.vue'
import type { SessionContext } from '../auth/types'

describe('PopupApp display helpers', () => {
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

  it('keeps the production popup surfaces opaque and rounded', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/popup/styles.css'), 'utf8')

    expect(css).toMatch(/html,\s*body,\s*#app\s*{[^}]*border-radius:\s*2[0-9]px/s)
    expect(css).toMatch(/\.dropdown-panel\s*{[^}]*background:\s*#fff/s)
    expect(css).toMatch(/\.selection-card\s*{[^}]*min-height:\s*3[0-9]{2}px/s)
  })

  it('keeps the popup as one visible rounded shell instead of nested rounded surfaces', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/popup/styles.css'), 'utf8')

    expect(css).toMatch(/\.extension-shell\s*{[^}]*border-radius:\s*2[0-9]px/s)
    expect(css).toMatch(/\.extension-shell\s*{[^}]*padding:\s*0/s)
    expect(css).toMatch(/\.brand-panel\s*{[^}]*background:\s*transparent/s)
    expect(css).toMatch(/\.brand-panel\s*{[^}]*border:\s*0/s)
    expect(css).toMatch(/\.brand-panel\s*{[^}]*box-shadow:\s*none/s)
    expect(css).not.toMatch(/\.brand-panel\s*{[^}]*border-radius:\s*2[0-9]px/s)
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

  it('keeps production popup copy free of demo placeholders and redundant signed-in labels', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/popup/PopupApp.vue'), 'utf8')

    expect(source).not.toContain('csp@ml.lc')
    expect(source).not.toContain('已登录')
    expect(source).toContain('placeholder="邮箱或手机号"')
  })
})
