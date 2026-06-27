export interface WorkspacePreferenceIdentity {
  accountId?: string
  tenantId?: string | null
  workspaceKey: string
}

export const CRM_SIDE_PANEL_PREFERENCE_KEY = 'crm-side-panel'
export const CRM_FLOATING_PANEL_PREFERENCE_KEY = 'crm-floating-panel'

export interface WorkspaceSelectionIdentity {
  accountId?: string
  tenantId?: string | null
}

export interface WorkspacePanelPreferenceIdentity extends WorkspacePreferenceIdentity {
  panelKey: string
}

export interface WorkspacePreferenceStorage {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
}

// Builds the local preference key that isolates enablement by tenant, account, and workspace.
export function buildWorkspacePreferenceKey(identity: WorkspacePreferenceIdentity): string {
  return [
    'workspace-enabled',
    normalizeKeyPart(identity.tenantId),
    normalizeKeyPart(identity.accountId),
    identity.workspaceKey
  ].join(':')
}

// Builds the local preference key that remembers only the explicitly entered workspace.
export function buildSelectedWorkspacePreferenceKey(identity: WorkspaceSelectionIdentity): string {
  return [
    'workspace-selected',
    normalizeKeyPart(identity.tenantId),
    normalizeKeyPart(identity.accountId)
  ].join(':')
}

// Builds the local preference key for a workspace-owned panel surface shared by all tabs.
export function buildWorkspacePanelPreferenceKey(identity: WorkspacePanelPreferenceIdentity): string {
  return [
    'workspace-panel-enabled',
    normalizeKeyPart(identity.tenantId),
    normalizeKeyPart(identity.accountId),
    identity.workspaceKey,
    identity.panelKey
  ].join(':')
}

// Stores browser-extension workspace enablement as a local user preference.
export class WorkspacePreferenceStore {
  constructor(private readonly storage: WorkspacePreferenceStorage = new ChromeWorkspacePreferenceStorage()) {}

  async getSelectedWorkspace(identity: WorkspaceSelectionIdentity): Promise<string | null> {
    const value = await this.storage.get(buildSelectedWorkspacePreferenceKey(identity))
    return typeof value === 'string' && value.trim() ? value : null
  }

  async isEnabled(identity: WorkspacePreferenceIdentity): Promise<boolean> {
    return (await this.storage.get(buildWorkspacePreferenceKey(identity))) === true
  }

  async getPanelEnabled(identity: WorkspacePanelPreferenceIdentity): Promise<boolean | null> {
    const value = await this.storage.get(buildWorkspacePanelPreferenceKey(identity))
    return typeof value === 'boolean' ? value : null
  }

  async isPanelEnabled(identity: WorkspacePanelPreferenceIdentity): Promise<boolean> {
    return (await this.getPanelEnabled(identity)) === true
  }

  async setEnabled(identity: WorkspacePreferenceIdentity, enabled: boolean): Promise<void> {
    await this.storage.set(buildWorkspacePreferenceKey(identity), enabled)
  }

  async setPanelEnabled(identity: WorkspacePanelPreferenceIdentity, enabled: boolean): Promise<void> {
    await this.storage.set(buildWorkspacePanelPreferenceKey(identity), enabled)
  }

  async setSelectedWorkspace(identity: WorkspaceSelectionIdentity, workspaceKey: string | null): Promise<void> {
    await this.storage.set(buildSelectedWorkspacePreferenceKey(identity), workspaceKey)
  }
}

// Persists workspace preferences through chrome.storage.local with a localStorage fallback.
export class ChromeWorkspacePreferenceStorage implements WorkspacePreferenceStorage {
  async get(key: string): Promise<unknown> {
    const storage = resolveChromeStorage()
    if (storage) {
      const result = await storage.get(key)
      return result[key]
    }

    const raw = globalThis.localStorage?.getItem(key)
    return raw ? JSON.parse(raw) : undefined
  }

  async set(key: string, value: unknown): Promise<void> {
    const storage = resolveChromeStorage()
    if (storage) {
      await storage.set({ [key]: value })
      return
    }

    globalThis.localStorage?.setItem(key, JSON.stringify(value))
  }
}

// Provides deterministic preference persistence for unit tests.
export class MemoryWorkspacePreferenceStorage implements WorkspacePreferenceStorage {
  private readonly values = new Map<string, unknown>()

  async get(key: string): Promise<unknown> {
    return this.values.get(key)
  }

  async set(key: string, value: unknown): Promise<void> {
    this.values.set(key, value)
  }
}

function resolveChromeStorage(): chrome.storage.StorageArea | undefined {
  return globalThis.chrome?.storage?.local
}

function normalizeKeyPart(value: string | null | undefined): string {
  return value?.trim() || 'none'
}
