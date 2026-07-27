<script setup lang="ts">
type WishlistAuthTab = 'sign-in' | 'create-account'

const { isAccountDialogOpen, closeAccountDialog } = useAccountDialog()
const activeTab = ref<WishlistAuthTab>('sign-in')
const dialogRef = ref<HTMLElement | null>(null)

// Restores the default sign-in view and locks only the document scroll while the account dialog is open.
watch(isAccountDialogOpen, async (isOpen) => {
  if (!import.meta.client) return

  document.body.classList.toggle('dxv-wishlist-auth-open', isOpen)
  if (isOpen) {
    activeTab.value = 'sign-in'
    await nextTick()
    dialogRef.value?.focus()
  }
})

// Clears the document lock if the modal unmounts during a route transition.
onBeforeUnmount(() => {
  if (import.meta.client) {
    document.body.classList.remove('dxv-wishlist-auth-open')
  }
})
</script>

<template>
  <Transition name="dxv-wishlist-auth">
    <div v-if="isAccountDialogOpen" class="dxv-wishlist-auth" @click.self="closeAccountDialog">
      <section
        ref="dialogRef"
        class="dxv-wishlist-auth__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dxv-wishlist-auth-title"
        tabindex="-1"
        @keydown.esc="closeAccountDialog"
      >
        <button class="dxv-wishlist-auth__close" type="button" aria-label="Close sign in" @click="closeAccountDialog">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 5L19 19M19 5L5 19" stroke="currentColor" stroke-width="1.2" />
          </svg>
        </button>

        <div class="dxv-wishlist-auth__tabs" role="tablist" aria-label="Account options">
          <button
            id="dxv-wishlist-sign-in-tab"
            class="dxv-wishlist-auth__tab"
            :class="{ 'is-active': activeTab === 'sign-in' }"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'sign-in'"
            aria-controls="dxv-wishlist-sign-in-panel"
            @click="activeTab = 'sign-in'"
          >
            Sign In
            <span class="dxv-wishlist-auth__tab-slider" aria-hidden="true" />
          </button>
          <button
            id="dxv-wishlist-create-account-tab"
            class="dxv-wishlist-auth__tab"
            :class="{ 'is-active': activeTab === 'create-account' }"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'create-account'"
            aria-controls="dxv-wishlist-create-account-panel"
            @click="activeTab = 'create-account'"
          >
            Create Account
            <span class="dxv-wishlist-auth__tab-slider" aria-hidden="true" />
          </button>
        </div>

        <form
          v-if="activeTab === 'sign-in'"
          id="dxv-wishlist-sign-in-panel"
          class="dxv-wishlist-auth__form"
          role="tabpanel"
          aria-labelledby="dxv-wishlist-sign-in-tab"
          @submit.prevent
        >
          <h2 id="dxv-wishlist-auth-title">Sign In to Your Account</h2>
          <label class="dxv-wishlist-auth__field">
            <input type="email" name="email" autocomplete="email" placeholder="Email" required>
            <span>Email</span>
          </label>
          <label class="dxv-wishlist-auth__field">
            <input type="password" name="password" autocomplete="current-password" placeholder="Password" required>
            <span>Password</span>
          </label>
          <div class="dxv-wishlist-auth__form-row">
            <label class="dxv-wishlist-auth__check">
              <input type="checkbox" name="remember">
              <span>Keep me logged in</span>
            </label>
            <button class="dxv-wishlist-auth__text-link" type="button">Forgot password?</button>
          </div>
          <button class="dxv-wishlist-auth__submit" type="submit">Sign In</button>
          <div class="dxv-wishlist-auth__legal">
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/terms-conditions">Terms of Service</a>
          </div>
        </form>

        <form
          v-else
          id="dxv-wishlist-create-account-panel"
          class="dxv-wishlist-auth__form"
          role="tabpanel"
          aria-labelledby="dxv-wishlist-create-account-tab"
          @submit.prevent
        >
          <h2 id="dxv-wishlist-auth-title">Create Your Account</h2>
          <div class="dxv-wishlist-auth__name-row">
            <label class="dxv-wishlist-auth__field">
              <input type="text" name="first-name" autocomplete="given-name" placeholder="First name" required>
              <span>First name</span>
            </label>
            <label class="dxv-wishlist-auth__field">
              <input type="text" name="last-name" autocomplete="family-name" placeholder="Last name" required>
              <span>Last name</span>
            </label>
          </div>
          <label class="dxv-wishlist-auth__field">
            <input type="email" name="email" autocomplete="email" placeholder="Email" required>
            <span>Email</span>
          </label>
          <label class="dxv-wishlist-auth__field">
            <input type="password" name="password" autocomplete="new-password" placeholder="Password" required>
            <span>Password</span>
          </label>
          <label class="dxv-wishlist-auth__field">
            <input type="password" name="confirm-password" autocomplete="new-password" placeholder="Confirm password" required>
            <span>Confirm password</span>
          </label>
          <div class="dxv-wishlist-auth__terms">
            <label class="dxv-wishlist-auth__check">
              <input type="checkbox" name="accept-terms" required>
              <span>
                I agree to the <a href="/terms-conditions">Terms of Service</a> and <a href="/privacy-policy">Privacy Policy</a>.
              </span>
            </label>
          </div>
          <button class="dxv-wishlist-auth__submit" type="submit">Create Account</button>
        </form>
      </section>
    </div>
  </Transition>
</template>

<style>
body.dxv-wishlist-auth-open {
  overflow: hidden;
}

.dxv-wishlist-auth {
  position: fixed;
  inset: 0;
  z-index: 240;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(16, 16, 16, 0.72);
}

.dxv-wishlist-auth__dialog {
  position: relative;
  width: min(504px, 100%);
  background: var(--dxv-white, #ffffff);
  color: var(--dxv-black, #1d1d1d);
  box-shadow: 0 20px 56px rgba(0, 0, 0, 0.28);
  outline: 0;
}

.dxv-wishlist-auth__close {
  position: absolute;
  top: 23px;
  right: 28px;
  z-index: 1;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.dxv-wishlist-auth__close svg {
  width: 22px;
  height: 22px;
}

.dxv-wishlist-auth__tabs {
  display: flex;
  height: 112px;
  justify-content: center;
  border-bottom: 1px solid rgba(29, 29, 29, 0.32);
  padding: 0 62px;
}

.dxv-wishlist-auth__tab {
  position: relative;
  width: 118px;
  border: 0;
  background: transparent;
  color: #757575;
  cursor: pointer;
  font-family: var(--dxv-body, Arial, sans-serif);
  font-size: 1rem;
  font-weight: 300;
  transition: color 300ms ease;
}

.dxv-wishlist-auth__tab-slider {
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 0;
  height: 4px;
  background: #494949;
  transition: width 300ms;
}

.dxv-wishlist-auth__tab.is-active {
  color: #494949;
}

.dxv-wishlist-auth__tab.is-active .dxv-wishlist-auth__tab-slider {
  width: 100%;
}

.dxv-wishlist-auth__form {
  display: grid;
  gap: 20px;
  padding: 52px 51px 48px;
}

.dxv-wishlist-auth__form h2 {
  margin: 0 0 17px;
  color: var(--dxv-black, #1d1d1d);
  font-family: var(--dxv-body, Arial, sans-serif);
  font-size: 1.125rem;
  font-weight: 500;
  letter-spacing: 1.4px;
  line-height: 1.35;
  text-transform: uppercase;
}

.dxv-wishlist-auth__field {
  position: relative;
  display: block;
  width: 100%;
  height: 60px;
}

.dxv-wishlist-auth__name-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.dxv-wishlist-auth__field > span {
  position: absolute;
  top: 50%;
  left: 16px;
  color: #757575;
  font-size: 0.75rem;
  pointer-events: none;
  transform: translate3d(0, -50%, 0) scale(1.5);
  transform-origin: left center;
  transition: transform 200ms ease, top 200ms ease;
}

.dxv-wishlist-auth__form input:not([type="checkbox"]) {
  width: 100%;
  height: 60px;
  border: 1px solid #757575;
  border-radius: 0;
  background: var(--dxv-white, #ffffff);
  color: var(--dxv-black, #1d1d1d);
  padding: 22px 16px 7px;
  font: inherit;
  font-size: 1rem;
  transition: all 200ms ease;
}

.dxv-wishlist-auth__form input:not([type="checkbox"])::placeholder {
  color: transparent;
}

.dxv-wishlist-auth__field > input:focus-visible {
  outline: none;
}

.dxv-wishlist-auth__field > input:focus-visible + span,
.dxv-wishlist-auth__field > input:not(:placeholder-shown) + span {
  top: 13px;
  transform: translate3d(0, -50%, 0) scale(1);
}

.dxv-wishlist-auth__close:focus-visible,
.dxv-wishlist-auth__tab:focus-visible,
.dxv-wishlist-auth__text-link:focus-visible,
.dxv-wishlist-auth__submit:focus-visible,
.dxv-wishlist-auth__legal a:focus-visible,
.dxv-wishlist-auth__terms a:focus-visible,
.dxv-wishlist-auth__check input:focus-visible {
  outline: 2px solid var(--dxv-black, #1d1d1d);
  outline-offset: 3px;
}

.dxv-wishlist-auth__form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 8px;
  font-size: 0.8125rem;
}

.dxv-wishlist-auth__check {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.dxv-wishlist-auth__check input {
  width: 20px;
  height: 20px;
  margin: 0;
  accent-color: var(--dxv-black, #1d1d1d);
}

.dxv-wishlist-auth__terms {
  margin-top: 2px;
  font-size: 0.8125rem;
  line-height: 1.45;
}

.dxv-wishlist-auth__terms .dxv-wishlist-auth__check {
  align-items: flex-start;
}

.dxv-wishlist-auth__terms .dxv-wishlist-auth__check input {
  flex: 0 0 auto;
  margin-top: 1px;
}

.dxv-wishlist-auth__text-link,
.dxv-wishlist-auth__legal a,
.dxv-wishlist-auth__terms a {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.dxv-wishlist-auth__submit {
  min-height: 50px;
  border: 1px solid var(--dxv-black, #1d1d1d);
  background: var(--dxv-black, #1d1d1d);
  color: var(--dxv-white, #ffffff);
  cursor: pointer;
  font: inherit;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 180ms ease, color 180ms ease, transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dxv-wishlist-auth__submit:hover {
  background: var(--dxv-white, #ffffff);
  color: var(--dxv-black, #1d1d1d);
}

.dxv-wishlist-auth__submit:active {
  transform: scale(0.985);
}

.dxv-wishlist-auth__legal {
  display: flex;
  justify-content: space-between;
  margin-top: 17px;
  font-size: 0.8125rem;
}

.dxv-wishlist-auth-enter-active,
.dxv-wishlist-auth-leave-active {
  transition: opacity 220ms ease;
}

.dxv-wishlist-auth-enter-active .dxv-wishlist-auth__dialog,
.dxv-wishlist-auth-leave-active .dxv-wishlist-auth__dialog {
  transition: opacity 240ms ease, transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dxv-wishlist-auth-enter-from,
.dxv-wishlist-auth-leave-to {
  opacity: 0;
}

.dxv-wishlist-auth-enter-from .dxv-wishlist-auth__dialog,
.dxv-wishlist-auth-leave-to .dxv-wishlist-auth__dialog {
  opacity: 0;
  transform: translate3d(0, 14px, 0) scale(0.985);
}

@media (prefers-reduced-motion: reduce) {
  .dxv-wishlist-auth__tab,
  .dxv-wishlist-auth__tab-slider,
  .dxv-wishlist-auth__field > span,
  .dxv-wishlist-auth-enter-active,
  .dxv-wishlist-auth-leave-active,
  .dxv-wishlist-auth-enter-active .dxv-wishlist-auth__dialog,
  .dxv-wishlist-auth-leave-active .dxv-wishlist-auth__dialog {
    transition-duration: 1ms;
  }
}

@media (max-width: 767px) {
  .dxv-wishlist-auth {
    align-items: end;
    padding: 12px;
  }

  .dxv-wishlist-auth__tabs {
    height: 80px;
    padding: 0 44px;
  }

  .dxv-wishlist-auth__close {
    top: 16px;
    right: 16px;
  }

  .dxv-wishlist-auth__form {
    gap: 16px;
    padding: 34px 24px 30px;
  }

  .dxv-wishlist-auth__form-row,
  .dxv-wishlist-auth__legal {
    align-items: flex-start;
    flex-direction: column;
  }

  .dxv-wishlist-auth__name-row {
    gap: 12px;
  }
}
</style>
