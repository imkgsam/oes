<template>
  <main class="extension-shell">
    <section class="brand-panel" aria-label="OES 浏览器插件">
      <div class="shell-glow shell-glow-a"></div>
      <div class="shell-glow shell-glow-b"></div>

      <section v-if="screen.kind === 'loading'" class="content-card">
        <div class="skeleton title"></div>
        <div class="skeleton line"></div>
        <div class="skeleton line short"></div>
        <p class="muted">{{ screen.message }}</p>
      </section>

      <section v-else-if="screen.kind === 'authenticated'" class="home-view">
        <header class="home-topline">
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
                <div class="menu-avatar" aria-hidden="true">
                  <img v-if="accountAvatar(screen.context)" :src="accountAvatar(screen.context)" alt="" />
                  <span v-else>{{ avatarInitial(screen.context) }}</span>
                </div>
                <div>
                  <strong>{{ displayName(screen.context) }}</strong>
                  <small>{{ accountName(screen.context) }}</small>
                </div>
              </div>

              <dl class="menu-meta">
                <div>
                  <dt>租户</dt>
                  <dd>{{ tenantName(screen.context) }}</dd>
                </div>
                <div>
                  <dt>当前工作台</dt>
                  <dd>{{ activeWorkspace(screen.context).label }}</dd>
                </div>
              </dl>

              <div class="workspace-menu">
                <span class="menu-label">切换工作台</span>
                <button
                  v-for="workspace in visibleWorkspaces(screen.context)"
                  :key="workspace.key"
                  class="workspace-option"
                  :class="{ active: workspace.key === activeWorkspace(screen.context).key }"
                  :disabled="workspace.disabled || workspace.key === activeWorkspace(screen.context).key"
                  type="button"
                >
                  <span>{{ workspace.label }}</span>
                  <small>{{ workspace.secondaryLabel }}</small>
                </button>
              </div>

              <button class="menu-logout" :disabled="busy" role="menuitem" type="button" @click="handleLogout">
                {{ busy ? '退出中' : '退出登录' }}
              </button>
            </div>
          </div>
        </header>

        <div class="workspace-hero">
          <span class="label">当前工作台</span>
          <h1>{{ activeWorkspace(screen.context).label }}</h1>
          <p>{{ activeWorkspace(screen.context).secondaryLabel }}</p>
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

export interface WorkspaceOption {
  disabled: boolean
  key: string
  label: string
  secondaryLabel: string
}

const DESIGNER_WORKSPACE_KEY = 'extension.designer.workspace'
const WORKSPACE_DISPLAY_MAP: Record<string, Omit<WorkspaceOption, 'disabled' | 'key'>> = {
  [DESIGNER_WORKSPACE_KEY]: {
    label: '设计师工作台',
    secondaryLabel: 'Designer Workspace'
  }
}

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

// Converts a backend navigation entry key into stable Chinese display copy.
export function workspaceDisplayName(entry: string): string {
  return WORKSPACE_DISPLAY_MAP[entry]?.label ?? entry
}

// Derives visible workspace options from navigation entries while preserving future workspace extensibility.
export function visibleWorkspaces(context: SessionContext): WorkspaceOption[] {
  const entries = context.navigation?.visibleEntries ?? []
  const workspaces = entries
    .filter((entry) => entry in WORKSPACE_DISPLAY_MAP)
    .map((entry) => ({
      disabled: false,
      key: entry,
      ...WORKSPACE_DISPLAY_MAP[entry]
    }))

  if (workspaces.length) {
    return workspaces
  }

  return [
    {
      disabled: true,
      key: DESIGNER_WORKSPACE_KEY,
      ...WORKSPACE_DISPLAY_MAP[DESIGNER_WORKSPACE_KEY]
    }
  ]
}

// Selects the current workspace display model from the visible navigation state.
export function activeWorkspace(context: SessionContext): WorkspaceOption {
  const defaultEntry = context.navigation?.defaultEntry
  const workspaces = visibleWorkspaces(context)
  return workspaces.find((workspace) => workspace.key === defaultEntry) ?? workspaces[0]
}
</script>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

import { AuthSessionController } from '../auth/auth-session'
import { ExtensionAuthApi } from '../auth/api'
import { ExtensionAuthStorage } from '../auth/storage'
import type { AccountOption, AuthChallenge, AuthScreen, MfaFactor } from '../auth/types'

const controller = new AuthSessionController({
  api: new ExtensionAuthApi(),
  storage: new ExtensionAuthStorage()
})

const busy = ref(false)
const identifier = ref('')
const mfaCode = ref('')
const mfaFactor = ref<MfaFactor>('TOTP')
const password = ref('')
const screen = ref<AuthScreen>({ kind: 'loading', message: '正在检查会话' })
const menuOpen = ref(false)
const menuRoot = ref<HTMLElement | null>(null)

const canSubmitLogin = computed(() => identifier.value.length > 3 && password.value.length > 0)

onMounted(async () => {
  screen.value = await controller.restore()
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
  hydrateMfaDefaults(screen.value)
  busy.value = false
}

// Logs out remotely when possible and always clears the extension-local session.
async function handleLogout() {
  if (busy.value) {
    return
  }

  busy.value = true
  menuOpen.value = false
  screen.value = await controller.logout()
  password.value = ''
  mfaCode.value = ''
  busy.value = false
}

// Toggles the account dropdown anchored to the session avatar.
function toggleMenu() {
  menuOpen.value = !menuOpen.value
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
}

function hydrateMfaDefaults(nextScreen: AuthScreen) {
  if (nextScreen.kind !== 'mfa') {
    return
  }

  mfaFactor.value = nextScreen.challenge.defaultFactor ?? availableFactors(nextScreen.challenge)[0] ?? 'TOTP'
}

// Chooses the public login endpoint method while keeping terminal policy enforcement on PASSWORD.
function resolvePasswordLoginMethod(value: string) {
  return value.includes('@') ? 'EMAIL_PASSWORD' : 'PHONE_PASSWORD'
}

function availableFactors(challenge: AuthChallenge): MfaFactor[] {
  const factors = challenge.availableFactors?.map((factor) => factor.type) ?? []
  return factors.length ? factors : [challenge.defaultFactor ?? 'TOTP']
}
</script>
