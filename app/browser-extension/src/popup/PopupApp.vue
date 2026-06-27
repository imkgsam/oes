<template>
  <main class="extension-shell">
    <section class="brand-panel" aria-label="OES 浏览器插件">
      <section v-if="screen.kind === 'loading'" class="content-card">
        <div class="skeleton title"></div>
        <div class="skeleton line"></div>
        <div class="skeleton line short"></div>
        <p class="muted">{{ screen.message }}</p>
      </section>

      <section v-else-if="screen.kind === 'authenticated'" class="home-view">
        <header class="home-topline" :class="{ 'has-workspace': selectedWorkspace }">
          <button
            v-if="selectedWorkspace"
            class="workspace-back-button"
            type="button"
            aria-label="返回工作台选择"
            title="返回工作台选择"
            @click="clearSelectedWorkspace"
          >
            <span class="workspace-back-icon" aria-hidden="true"></span>
          </button>
          <div ref="menuRoot" class="avatar-menu">
            <button
              class="avatar-button"
              type="button"
              :aria-expanded="menuOpen"
              aria-haspopup="menu"
              aria-label="打开账户菜单"
              @click="toggleMenu"
            >
              <img
                v-if="accountAvatar(screen.context)"
                :alt="`${displayName(screen.context)} 头像`"
                :src="accountAvatar(screen.context)"
              />
              <span v-else>{{ avatarInitial(screen.context) }}</span>
            </button>

            <div v-if="menuOpen" class="dropdown-panel" role="menu">
              <div class="menu-user">
                <div>
                  <strong>{{ displayName(screen.context) }}</strong>
                  <small>{{ tenantName(screen.context) }}</small>
                </div>
              </div>

              <div class="menu-actions" aria-label="账户能力">
                <button
                  v-for="action in frozenMenuActions"
                  :key="action"
                  class="menu-action"
                  disabled
                  role="menuitem"
                  type="button"
                >
                  {{ action }}
                </button>
                <button
                  class="menu-action menu-logout"
                  :disabled="busy"
                  role="menuitem"
                  type="button"
                  @click="handleLogout"
                >
                  {{ busy ? '退出中' : '退出登录' }}
                </button>
              </div>
            </div>
          </div>
        </header>

        <section v-if="!selectedWorkspace" class="workspace-selector" aria-label="选择工作台">
          <div class="selector-heading">
            <span class="label">Workspace</span>
            <h1>选择工作台</h1>
          </div>

          <div class="workspace-list" role="list">
            <button
              v-for="(workspace, index) in visibleWorkspacesForTemplate(screen.context)"
              :key="workspace.key"
              class="workspace-entry"
              :class="{ disabled: workspace.disabled }"
              :disabled="workspace.disabled"
              :style="{ '--entry-index': index }"
              type="button"
              role="listitem"
              @click="selectWorkspace(workspace.key)"
            >
              <span class="workspace-entry-mark" aria-hidden="true">{{ workspaceInitial(workspace.label) }}</span>
              <span class="workspace-entry-copy">
                <strong>{{ workspace.label }}</strong>
                <small>{{ workspace.secondaryLabel }}</small>
              </span>
            </button>
          </div>
        </section>

        <div v-else class="workspace-hero">
          <h1>{{ selectedWorkspace.label }}</h1>
          <div v-if="isCrmWorkspaceSelected" class="workspace-enable-row">
            <button
              class="workspace-panel-toggle"
              :class="{ active: sidePanelEnabled }"
              :disabled="busy"
              :aria-checked="sidePanelEnabled"
              role="switch"
              type="button"
              @click="handleToggleSidePanel"
            >
              Side Panel {{ sidePanelEnabled ? '已开启' : '已关闭' }}
            </button>
            <button
              class="workspace-panel-toggle"
              :class="{ active: floatingPanelEnabled }"
              :disabled="busy"
              :aria-checked="floatingPanelEnabled"
              role="switch"
              type="button"
              @click="handleToggleFloatingPanel"
            >
              Floating Panel {{ floatingPanelEnabled ? '已开启' : '已关闭' }}
            </button>
            <button
              v-if="floatingPanelEnabled"
              class="workspace-panel-toggle"
              :disabled="busy"
              type="button"
              @click="handleShowFloatingPanel"
            >
              显示当前页
            </button>
          </div>
          <p v-if="workspaceError" class="error-text">{{ workspaceError }}</p>
        </div>
      </section>

      <section v-else-if="screen.kind === 'account-selection'" class="content-card selection-card">
        <p class="eyebrow">选择账号</p>
        <h1>选择登录身份</h1>
        <p v-if="screen.message" class="error-text">{{ screen.message }}</p>

        <button
          v-for="option in screen.options"
          :key="option.accountId"
          class="account-option"
          :disabled="busy"
          type="button"
          @click="handleSelectAccount(option)"
        >
          <span>
            <strong>{{ option.displayName ?? '工作台账号' }}</strong>
            <small>{{ option.tenantName ?? option.tenantId ?? '租户账号' }}</small>
          </span>
          <span class="option-arrow">进入</span>
        </button>

        <button class="ghost-button" type="button" @click="resetToLogin">换一个登录</button>
      </section>

      <section v-else-if="screen.kind === 'mfa'" class="content-card">
        <p class="eyebrow">安全验证</p>
        <h1>输入验证码</h1>
        <p class="muted">
          {{ screen.challenge.destination ? `验证码已发送至 ${screen.challenge.destination}` : '使用已配置的验证方式。' }}
        </p>
        <p v-if="screen.message" class="error-text">{{ screen.message }}</p>

        <form class="login-form" @submit.prevent="handleCompleteMfa">
          <label>
            <span>验证方式</span>
            <select v-model="mfaFactor">
              <option
                v-for="factor in availableFactors(screen.challenge)"
                :key="factor"
                :value="factor"
              >
                {{ factor }}
              </option>
            </select>
          </label>

          <label>
            <span>验证码</span>
            <input v-model.trim="mfaCode" autocomplete="one-time-code" inputmode="numeric" placeholder="000000" />
          </label>

          <button class="primary-button" :disabled="busy || !mfaCode" type="submit">
            {{ busy ? '验证中' : '继续' }}
          </button>
        </form>

        <button class="ghost-button" type="button" @click="resetToLogin">返回登录</button>
      </section>

      <section v-else class="content-card login-card">
        <div class="login-mark" aria-hidden="true">
          <img src="/icons/icon-48.png" alt="" />
        </div>
        <p class="eyebrow">OES BE</p>
        <h1>登录</h1>
        <p v-if="screen.error" class="error-text">{{ screen.error }}</p>

        <form class="login-form" @submit.prevent="handleLogin">
          <label>
            <span>邮箱或手机号</span>
            <input v-model.trim="identifier" autocomplete="username" placeholder="邮箱或手机号" type="text" />
          </label>

          <label>
            <span>密码</span>
            <input v-model="password" autocomplete="current-password" placeholder="请输入密码" type="password" />
          </label>

          <button class="primary-button" :disabled="busy || !canSubmitLogin" type="submit">
            {{ busy ? '登录中' : '登录' }}
          </button>
        </form>
      </section>
    </section>
  </main>
</template>

<script lang="ts">
import type { SessionContext } from '../auth/types'
export {
  activeWorkspace,
  visibleWorkspaces,
  workspaceDisplayName
} from '../workspaces/workspace-registry'

// Returns the concise user-facing name shown in the popup header and account menu.
export function displayName(context: SessionContext): string {
  return context.operator?.displayName ?? context.account?.name ?? 'OES 用户'
}

// Returns the selected account name without exposing account ids as primary UI copy.
export function accountName(context: SessionContext): string {
  return context.account?.name ?? context.operator?.displayName ?? '工作台账号'
}

// Returns the OES-resolved current account avatar URL without inventing a frontend fallback image.
export function accountAvatar(context: SessionContext): string | undefined {
  const avatar = context.account?.avatar?.trim()
  return avatar || undefined
}

// Returns the tenant label used in the account dropdown.
export function tenantName(context: SessionContext): string {
  return context.tenant?.name ?? '默认租户'
}

// Builds a compact avatar fallback from the current session context.
export function avatarInitial(context: SessionContext): string {
  return displayName(context).trim().charAt(0).toUpperCase() || 'O'
}

</script>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

import { AuthSessionController } from '../auth/auth-session'
import { ExtensionAuthApi } from '../auth/api'
import { ExtensionAuthStorage } from '../auth/storage'
import type { AccountOption, AuthChallenge, AuthScreen, MfaFactor, SessionContext as AuthSessionContext } from '../auth/types'
import { BrowserActivityCollector } from '../runtime/browser-activity-collector'
import { BrowserActivityRuntime } from '../runtime/browser-activity-runtime'
import {
  SET_CRM_FLOATING_PANEL_ENABLED_MESSAGE,
  SET_CRM_SIDE_PANEL_ENABLED_MESSAGE,
  SET_CRM_WORKSPACE_RUNTIME_ENABLED_MESSAGE,
  SHOW_CRM_FLOATING_PANEL_MESSAGE
} from '../runtime/messages'
import {
  CRM_WORKSPACE_KEY,
  visibleWorkspaces as visibleWorkspacesForTemplate
} from '../workspaces/workspace-registry'
import {
  CRM_FLOATING_PANEL_PREFERENCE_KEY,
  CRM_SIDE_PANEL_PREFERENCE_KEY,
  WorkspacePreferenceStore
} from '../workspaces/workspace-preferences'

const controller = new AuthSessionController({
  api: new ExtensionAuthApi(),
  browserActivityRuntime: new BrowserActivityRuntime({
    collector: new BrowserActivityCollector(),
    storage: new ExtensionAuthStorage()
  }),
  storage: new ExtensionAuthStorage()
})
const workspacePreferences = new WorkspacePreferenceStore()

const busy = ref(false)
const floatingPanelEnabled = ref(false)
const sidePanelEnabled = ref(false)
const identifier = ref('')
const mfaCode = ref('')
const mfaFactor = ref<MfaFactor>('TOTP')
const password = ref('')
const screen = ref<AuthScreen>({ kind: 'loading', message: '正在检查会话' })
const menuOpen = ref(false)
const menuRoot = ref<HTMLElement | null>(null)
const selectedWorkspaceKey = ref<string | null>(null)
const workspaceError = ref('')
const frozenMenuActions = ['刷新会话', '打开 OES', '插件诊断', '设置'] as const

const canSubmitLogin = computed(() => identifier.value.length > 3 && password.value.length > 0)
const selectedWorkspace = computed(() => {
  if (screen.value.kind !== 'authenticated' || !selectedWorkspaceKey.value) {
    return null
  }

  return visibleWorkspacesForTemplate(screen.value.context).find(
    (workspace) => workspace.key === selectedWorkspaceKey.value
  ) ?? null
})
const isCrmWorkspaceSelected = computed(() => selectedWorkspace.value?.key === CRM_WORKSPACE_KEY)

onMounted(async () => {
  screen.value = await controller.restore()
  await hydrateWorkspaceSelection(screen.value)
  hydrateMfaDefaults(screen.value)
  document.addEventListener('click', closeMenuOnOutsideClick)
  document.addEventListener('keydown', closeMenuOnEscape)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenuOnOutsideClick)
  document.removeEventListener('keydown', closeMenuOnEscape)
})

// Submits the extension-only email/password login flow.
async function handleLogin() {
  if (!canSubmitLogin.value || busy.value) {
    return
  }

  busy.value = true
  screen.value = await controller.login({
    credential: password.value,
    identifier: identifier.value,
    method: resolvePasswordLoginMethod(identifier.value)
  })
  await resetWorkspaceSelection(screen.value)
  hydrateMfaDefaults(screen.value)
  busy.value = false
}

// Completes the current MFA challenge with the selected factor and entered code.
async function handleCompleteMfa() {
  if (screen.value.kind !== 'mfa' || !mfaCode.value || busy.value) {
    return
  }

  busy.value = true
  screen.value = await controller.completeMfa({
    challengeId: screen.value.challenge.challengeId,
    code: mfaCode.value,
    factor: mfaFactor.value,
    factorChallengeId: screen.value.challenge.factorChallengeId,
    loginMethod: screen.value.loginMethod
  })
  await resetWorkspaceSelection(screen.value)
  hydrateMfaDefaults(screen.value)
  busy.value = false
}

// Selects one browser-extension eligible account after primary authentication.
async function handleSelectAccount(option: AccountOption) {
  if (screen.value.kind !== 'account-selection' || busy.value) {
    return
  }

  busy.value = true
  screen.value = await controller.selectAccount(option, {
    loginMethod: screen.value.loginMethod,
    userId: screen.value.userId
  })
  await resetWorkspaceSelection(screen.value)
  hydrateMfaDefaults(screen.value)
  busy.value = false
}

// Logs out remotely when possible and always clears the extension-local session.
async function handleLogout() {
  if (busy.value) {
    return
  }

  const previousContext = screen.value.kind === 'authenticated' ? screen.value.context : null
  const previousWorkspaceKey = selectedWorkspaceKey.value
  busy.value = true
  menuOpen.value = false
  if (previousContext && previousWorkspaceKey) {
    await disableWorkspaceCapabilities(previousWorkspaceKey, previousContext)
  }
  screen.value = await controller.logout()
  floatingPanelEnabled.value = false
  sidePanelEnabled.value = false
  selectedWorkspaceKey.value = null
  workspaceError.value = ''
  if (previousContext) {
    await workspacePreferences.setSelectedWorkspace(toWorkspaceSelectionIdentity(previousContext), null)
    await workspacePreferences.setPanelEnabled(toSidePanelPreferenceIdentity(previousContext), false)
    await workspacePreferences.setPanelEnabled(toFloatingPanelPreferenceIdentity(previousContext), false)
  }
  await setCrmRuntimeEnabled(false)
  password.value = ''
  mfaCode.value = ''
  busy.value = false
}

// Toggles the extension-global floating panel runtime for all supported tabs.
async function handleToggleFloatingPanel() {
  if (screen.value.kind !== 'authenticated') {
    return
  }

  const nextEnabled = !floatingPanelEnabled.value
  busy.value = true
  workspaceError.value = ''
  try {
    await sendRuntimeCommand({
      enabled: nextEnabled,
      type: SET_CRM_FLOATING_PANEL_ENABLED_MESSAGE
    })
    await workspacePreferences.setPanelEnabled(toFloatingPanelPreferenceIdentity(screen.value.context), nextEnabled)
    floatingPanelEnabled.value = nextEnabled
  } catch (caught) {
    workspaceError.value = caught instanceof Error ? caught.message : '切换 Floating Panel 失败'
  } finally {
    busy.value = false
  }
}

// Forces the active official site to render the CRM floating panel and shows runtime failures in the popup.
async function handleShowFloatingPanel() {
  if (screen.value.kind !== 'authenticated') {
    return
  }

  busy.value = true
  workspaceError.value = ''
  try {
    await sendRuntimeCommand({
      type: SHOW_CRM_FLOATING_PANEL_MESSAGE
    })
    floatingPanelEnabled.value = true
  } catch (caught) {
    workspaceError.value = caught instanceof Error ? caught.message : '显示当前页 Floating Panel 失败'
  } finally {
    busy.value = false
  }
}

// Applies the extension-global side-panel default while preserving Chrome's user-activation requirement on open.
async function setSidePanelEnabled(enabled: boolean) {
  const sidePanel = globalThis.chrome?.sidePanel
  const tabs = globalThis.chrome?.tabs
  if (sidePanel && tabs) {
    const setOptionsPromise = sidePanel.setOptions({
      enabled,
      path: 'side-panel.html'
    })
    if (!enabled) {
      await setOptionsPromise
      return
    }
    const [tab] = await tabs.query({ active: true, currentWindow: true })
    const openPromise = tab?.id
      ? sidePanel.open({ tabId: tab.id, windowId: tab.windowId })
      : tab?.windowId
        ? sidePanel.open({ windowId: tab.windowId })
        : Promise.resolve()
    await Promise.all([setOptionsPromise, openPromise])
    return
  }

  await sendRuntimeCommand({
    enabled,
    type: SET_CRM_SIDE_PANEL_ENABLED_MESSAGE
  })
}

// Keeps the side panel enabled or disabled consistently for every browser tab.
async function handleToggleSidePanel() {
  if (screen.value.kind !== 'authenticated') {
    return
  }

  const nextEnabled = !sidePanelEnabled.value
  busy.value = true
  workspaceError.value = ''
  try {
    await setSidePanelEnabled(nextEnabled)
    await workspacePreferences.setPanelEnabled(toSidePanelPreferenceIdentity(screen.value.context), nextEnabled)
    sidePanelEnabled.value = nextEnabled
  } catch (caught) {
    workspaceError.value = caught instanceof Error ? caught.message : '切换 CRM 侧边栏失败'
  } finally {
    busy.value = false
  }
}

async function setCrmRuntimeEnabled(enabled: boolean) {
  await sendRuntimeCommand({
    enabled,
    type: SET_CRM_WORKSPACE_RUNTIME_ENABLED_MESSAGE
  })
}

async function sendRuntimeCommand(message:
  | { enabled: boolean; type: typeof SET_CRM_WORKSPACE_RUNTIME_ENABLED_MESSAGE }
  | { enabled: boolean; type: typeof SET_CRM_SIDE_PANEL_ENABLED_MESSAGE }
  | { enabled: boolean; type: typeof SET_CRM_FLOATING_PANEL_ENABLED_MESSAGE }
  | { type: typeof SHOW_CRM_FLOATING_PANEL_MESSAGE }
) {
  if (!globalThis.chrome?.runtime?.sendMessage) {
    return
  }

  const response = await chrome.runtime.sendMessage(message) as { error?: string } | undefined
  if (response?.error) {
    throw new Error(response.error)
  }
}

// Toggles the account dropdown anchored to the session avatar.
function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

// Selects a workspace only after an explicit user click on the selector or menu.
async function selectWorkspace(workspaceKey: string) {
  if (screen.value.kind !== 'authenticated' || busy.value) {
    return
  }

  const workspace = visibleWorkspacesForTemplate(screen.value.context).find((item) => item.key === workspaceKey)
  if (!workspace || workspace.disabled) {
    return
  }

  const previousWorkspaceKey = selectedWorkspaceKey.value
  busy.value = true
  try {
    if (previousWorkspaceKey && previousWorkspaceKey !== workspace.key) {
      await disableWorkspaceCapabilities(previousWorkspaceKey, screen.value.context)
    }
    selectedWorkspaceKey.value = workspace.key
    menuOpen.value = false
    workspaceError.value = ''
    await workspacePreferences.setSelectedWorkspace(toWorkspaceSelectionIdentity(screen.value.context), workspace.key)
    await enableWorkspaceCapabilities(workspace.key, screen.value.context)
  } catch (caught) {
    workspaceError.value = caught instanceof Error ? caught.message : '进入工作台失败'
  } finally {
    busy.value = false
  }
}

// Returns the popup to navigation-only workspace selection and disables the active workspace capabilities.
async function clearSelectedWorkspace() {
  const workspaceKey = selectedWorkspaceKey.value
  if (screen.value.kind === 'authenticated') {
    if (workspaceKey) {
      await disableWorkspaceCapabilities(workspaceKey, screen.value.context)
    }
    await workspacePreferences.setSelectedWorkspace(toWorkspaceSelectionIdentity(screen.value.context), null)
  }
  selectedWorkspaceKey.value = null
  floatingPanelEnabled.value = false
  sidePanelEnabled.value = false
  workspaceError.value = ''
}

// Closes the account dropdown after clicking outside of its bounds.
function closeMenuOnOutsideClick(event: MouseEvent) {
  if (!menuOpen.value || !menuRoot.value) {
    return
  }

  if (!menuRoot.value.contains(event.target as Node)) {
    menuOpen.value = false
  }
}

// Closes the account dropdown from the keyboard without disturbing the current screen.
function closeMenuOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    menuOpen.value = false
  }
}

function resetToLogin() {
  screen.value = { kind: 'login' }
  mfaCode.value = ''
  password.value = ''
  selectedWorkspaceKey.value = null
  floatingPanelEnabled.value = false
  sidePanelEnabled.value = false
  workspaceError.value = ''
}

function hydrateMfaDefaults(nextScreen: AuthScreen) {
  if (nextScreen.kind !== 'mfa') {
    return
  }

  mfaFactor.value = nextScreen.challenge.defaultFactor ?? availableFactors(nextScreen.challenge)[0] ?? 'TOTP'
}

// Clears workspace selection whenever auth state changes so login never auto-enters a workspace.
async function resetWorkspaceSelection(nextScreen: AuthScreen) {
  selectedWorkspaceKey.value = null
  floatingPanelEnabled.value = false
  sidePanelEnabled.value = false
  workspaceError.value = ''
  if (nextScreen.kind === 'authenticated') {
    await workspacePreferences.setSelectedWorkspace(toWorkspaceSelectionIdentity(nextScreen.context), null)
    await disableWorkspaceCapabilities(CRM_WORKSPACE_KEY, nextScreen.context)
    return
  }
  await setCrmRuntimeEnabled(false)
}

// Restores only a prior explicit workspace entry; fresh authenticated sessions still land on the selector.
async function hydrateWorkspaceSelection(nextScreen: AuthScreen) {
  selectedWorkspaceKey.value = null
  floatingPanelEnabled.value = false
  sidePanelEnabled.value = false
  workspaceError.value = ''
  if (nextScreen.kind !== 'authenticated') {
    return
  }

  const selected = await workspacePreferences.getSelectedWorkspace(
    toWorkspaceSelectionIdentity(nextScreen.context)
  )
  const workspace = visibleWorkspacesForTemplate(nextScreen.context).find(
    (item) => item.key === selected && !item.disabled
  )
  if (!workspace) {
    await workspacePreferences.setSelectedWorkspace(toWorkspaceSelectionIdentity(nextScreen.context), null)
    return
  }

  selectedWorkspaceKey.value = workspace.key
  await hydrateSelectedWorkspacePreference()
}

// Hydrates CRM capability enablement only after the CRM workspace has been explicitly selected.
async function hydrateSelectedWorkspacePreference() {
  if (screen.value.kind !== 'authenticated' || selectedWorkspace.value?.key !== CRM_WORKSPACE_KEY) {
    floatingPanelEnabled.value = false
    sidePanelEnabled.value = false
    return
  }

  const floatingPreference = await workspacePreferences.getPanelEnabled(
    toFloatingPanelPreferenceIdentity(screen.value.context)
  )
  floatingPanelEnabled.value = floatingPreference === true
  sidePanelEnabled.value = await workspacePreferences.isPanelEnabled(
    toSidePanelPreferenceIdentity(screen.value.context)
  )
}

// Enables the selected workspace while keeping workspace-owned panel surfaces opt-in.
async function enableWorkspaceCapabilities(workspaceKey: string, context: AuthSessionContext): Promise<void> {
  await workspacePreferences.setEnabled(toWorkspacePreferenceIdentity(context, workspaceKey), true)
  if (workspaceKey !== CRM_WORKSPACE_KEY) {
    floatingPanelEnabled.value = false
    sidePanelEnabled.value = false
    return
  }

  await workspacePreferences.setPanelEnabled(toSidePanelPreferenceIdentity(context), false)
  await workspacePreferences.setPanelEnabled(toFloatingPanelPreferenceIdentity(context), false)
  await setCrmRuntimeEnabled(true)
  floatingPanelEnabled.value = false
  sidePanelEnabled.value = false
}

// Disables the selected workspace and removes any active browser-extension capabilities.
async function disableWorkspaceCapabilities(workspaceKey: string, context: AuthSessionContext): Promise<void> {
  await workspacePreferences.setEnabled(toWorkspacePreferenceIdentity(context, workspaceKey), false)
  if (workspaceKey !== CRM_WORKSPACE_KEY) {
    return
  }

  await workspacePreferences.setPanelEnabled(toFloatingPanelPreferenceIdentity(context), false)
  await workspacePreferences.setPanelEnabled(toSidePanelPreferenceIdentity(context), false)
  await Promise.all([
    setCrmRuntimeEnabled(false),
    setSidePanelEnabled(false)
  ])
}

function toWorkspacePreferenceIdentity(context: AuthSessionContext, workspaceKey = CRM_WORKSPACE_KEY) {
  return {
    accountId: context.account?.accountId,
    tenantId: context.tenant?.tenantId,
    workspaceKey
  }
}

function toFloatingPanelPreferenceIdentity(context: AuthSessionContext) {
  return {
    ...toWorkspacePreferenceIdentity(context),
    panelKey: CRM_FLOATING_PANEL_PREFERENCE_KEY
  }
}

function toSidePanelPreferenceIdentity(context: AuthSessionContext) {
  return {
    ...toWorkspacePreferenceIdentity(context),
    panelKey: CRM_SIDE_PANEL_PREFERENCE_KEY
  }
}

function toWorkspaceSelectionIdentity(context: AuthSessionContext) {
  return {
    accountId: context.account?.accountId,
    tenantId: context.tenant?.tenantId
  }
}

// Chooses the public login endpoint method while keeping terminal policy enforcement on PASSWORD.
function resolvePasswordLoginMethod(value: string) {
  return value.includes('@') ? 'EMAIL_PASSWORD' : 'PHONE_PASSWORD'
}

function availableFactors(challenge: AuthChallenge): MfaFactor[] {
  const factors = challenge.availableFactors?.map((factor) => factor.type) ?? []
  return factors.length ? factors : [challenge.defaultFactor ?? 'TOTP']
}

// Produces a compact monogram for workspace selector entries without adding decorative icons.
function workspaceInitial(label: string): string {
  return label.trim().charAt(0).toUpperCase() || 'O'
}

</script>
