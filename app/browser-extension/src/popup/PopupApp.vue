<template>
  <main class="extension-shell">
    <section class="brand-panel" aria-label="OES browser extension login">
      <div class="ambient ambient-a"></div>
      <div class="ambient ambient-b"></div>

      <header class="topline">
        <div class="brand-mark">OES</div>
        <div class="terminal-pill">BROWSER_EXTENSION</div>
      </header>

      <section v-if="screen.kind === 'loading'" class="content-card">
        <div class="skeleton title"></div>
        <div class="skeleton line"></div>
        <div class="skeleton line short"></div>
        <p class="muted">{{ screen.message }}</p>
      </section>

      <section v-else-if="screen.kind === 'authenticated'" class="content-card signed-in">
        <div class="status-row">
          <span class="status-dot"></span>
          <span>Signed in</span>
        </div>
        <h1>{{ displayName(screen.context) }}</h1>
        <p class="muted">{{ tenantName(screen.context) }}</p>

        <div class="workspace-strip">
          <div>
            <span class="label">Default entry</span>
            <strong>{{ screen.context.navigation?.defaultEntry ?? 'Not assigned' }}</strong>
          </div>
          <div>
            <span class="label">Actions</span>
            <strong>{{ actionCount(screen.context) }}</strong>
          </div>
        </div>

        <div class="entry-list" v-if="visibleEntries(screen.context).length">
          <span v-for="entry in visibleEntries(screen.context)" :key="entry">{{ entry }}</span>
        </div>

        <button class="secondary-button" :disabled="busy" type="button" @click="handleLogout">
          {{ busy ? 'Signing out' : 'Sign out' }}
        </button>
      </section>

      <section v-else-if="screen.kind === 'account-selection'" class="content-card">
        <p class="eyebrow">Choose workspace account</p>
        <h1>Select your context</h1>
        <p class="muted">Only accounts allowed for browser extension login are shown.</p>
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
            <strong>{{ option.displayName ?? 'Workspace account' }}</strong>
            <small>{{ option.tenantName ?? option.tenantId ?? 'Tenant account' }}</small>
          </span>
          <span class="option-arrow">Select</span>
        </button>

        <button class="ghost-button" type="button" @click="resetToLogin">Use another login</button>
      </section>

      <section v-else-if="screen.kind === 'mfa'" class="content-card">
        <p class="eyebrow">Verification</p>
        <h1>Enter MFA code</h1>
        <p class="muted">
          {{ screen.challenge.destination ? `Code sent to ${screen.challenge.destination}` : 'Use your configured MFA factor.' }}
        </p>
        <p v-if="screen.message" class="error-text">{{ screen.message }}</p>

        <form class="login-form" @submit.prevent="handleCompleteMfa">
          <label>
            <span>Factor</span>
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
            <span>Code</span>
            <input v-model.trim="mfaCode" autocomplete="one-time-code" inputmode="numeric" placeholder="000000" />
          </label>

          <button class="primary-button" :disabled="busy || !mfaCode" type="submit">
            {{ busy ? 'Verifying' : 'Continue' }}
          </button>
        </form>

        <button class="ghost-button" type="button" @click="resetToLogin">Back to login</button>
      </section>

      <section v-else class="content-card">
        <p class="eyebrow">OES Terminal</p>
        <h1>Sign in to your workspace</h1>
        <p class="muted">Use the account enabled for browser extension access.</p>
        <p v-if="screen.error" class="error-text">{{ screen.error }}</p>

        <form class="login-form" @submit.prevent="handleLogin">
          <label>
            <span>Email or phone</span>
            <input v-model.trim="identifier" autocomplete="username" placeholder="csp@ml.lc or +8613900000108" type="text" />
          </label>

          <label>
            <span>Password</span>
            <input v-model="password" autocomplete="current-password" placeholder="Your OES password" type="password" />
          </label>

          <button class="primary-button" :disabled="busy || !canSubmitLogin" type="submit">
            {{ busy ? 'Signing in' : 'Sign in' }}
          </button>
        </form>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { AuthSessionController } from '../auth/auth-session'
import { ExtensionAuthApi } from '../auth/api'
import { ExtensionAuthStorage } from '../auth/storage'
import type { AccountOption, AuthChallenge, AuthScreen, MfaFactor, SessionContext } from '../auth/types'

const controller = new AuthSessionController({
  api: new ExtensionAuthApi(),
  storage: new ExtensionAuthStorage()
})

const busy = ref(false)
const identifier = ref('')
const mfaCode = ref('')
const mfaFactor = ref<MfaFactor>('TOTP')
const password = ref('')
const screen = ref<AuthScreen>({ kind: 'loading', message: 'Checking saved session' })

const canSubmitLogin = computed(() => identifier.value.length > 3 && password.value.length > 0)

onMounted(async () => {
  screen.value = await controller.restore()
  hydrateMfaDefaults(screen.value)
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
  screen.value = await controller.logout()
  password.value = ''
  mfaCode.value = ''
  busy.value = false
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

function displayName(context: SessionContext): string {
  return context.operator?.displayName ?? context.account?.name ?? 'OES user'
}

function tenantName(context: SessionContext): string {
  return context.tenant?.name ?? context.account?.scopeLevel ?? 'Extension workspace'
}

function actionCount(context: SessionContext): string {
  return String(context.access?.actionCodes?.length ?? 0)
}

function visibleEntries(context: SessionContext): string[] {
  return (context.navigation?.visibleEntries ?? []).slice(0, 4)
}
</script>
