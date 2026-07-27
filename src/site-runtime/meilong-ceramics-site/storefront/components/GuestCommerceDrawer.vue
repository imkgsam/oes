<script setup lang="ts">
const {
  activeGuestCommerceDrawer,
  favorites,
  cartLines,
  cartSubtotal,
  closeGuestCommerceDrawer,
  isFavorite,
  toggleFavorite,
  setCartLineQuantity,
  removeCartLine,
} = useGuestCommerce()

const dialogRef = ref<HTMLElement | null>(null)
const activeTitle = computed(() => activeGuestCommerceDrawer.value === 'favorites' ? 'Favorites' : 'Cart')
const formattedSubtotal = computed(() => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(cartSubtotal.value))

// Locks only the document scroll while a global commerce drawer is visible and restores focus to the drawer.
watch(activeGuestCommerceDrawer, async (activeDrawer) => {
  if (import.meta.server) {
    return
  }

  document.body.classList.toggle('dxv-guest-commerce-open', Boolean(activeDrawer))
  if (activeDrawer) {
    await nextTick()
    dialogRef.value?.focus()
  }
})

// Clears the document lock if a route transition unmounts the global drawer.
onBeforeUnmount(() => {
  if (import.meta.client) {
    document.body.classList.remove('dxv-guest-commerce-open')
  }
})

// Closes the drawer before a product route transition so navigation never leaves the backdrop locked.
function closeForNavigation() {
  closeGuestCommerceDrawer()
}
</script>

<template>
  <Transition name="dxv-guest-commerce">
    <div
      v-if="activeGuestCommerceDrawer"
      class="dxv-guest-commerce"
      @click.self="closeGuestCommerceDrawer"
    >
      <aside
        ref="dialogRef"
        class="dxv-guest-commerce__panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'dxv-guest-commerce-title'"
        tabindex="-1"
        @keydown.esc="closeGuestCommerceDrawer"
      >
        <header class="dxv-guest-commerce__header">
          <p>YOUR {{ activeTitle.toUpperCase() }}</p>
          <h2 id="dxv-guest-commerce-title">{{ activeTitle }}</h2>
          <button type="button" aria-label="Close" @click="closeGuestCommerceDrawer">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 5L19 19M19 5L5 19" stroke="currentColor" stroke-width="1.35" />
            </svg>
          </button>
        </header>

        <div v-if="activeGuestCommerceDrawer === 'favorites'" class="dxv-guest-commerce__body">
          <div v-if="favorites.length" class="dxv-guest-commerce__list" aria-label="Favorite products">
            <article v-for="product in favorites" :key="product.productKey" class="dxv-guest-commerce__item">
              <NuxtLink :to="product.href" class="dxv-guest-commerce__image" @click="closeForNavigation">
                <img :src="product.image" :alt="product.title">
              </NuxtLink>
              <div class="dxv-guest-commerce__copy">
                <NuxtLink :to="product.href" @click="closeForNavigation">{{ product.title }}</NuxtLink>
                <p>{{ product.price }}</p>
                <button
                  type="button"
                  :aria-label="`Remove ${product.title} from Favorites`"
                  @click="toggleFavorite(product)"
                >
                  Remove
                </button>
              </div>
              <button
                class="dxv-guest-commerce__heart"
                type="button"
                :aria-label="`Remove ${product.title} from Favorites`"
                :aria-pressed="isFavorite(product.productKey)"
                @click="toggleFavorite(product)"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 20.5s-7.5-4.6-9.4-9.2C1.3 8.2 3.2 5 6.6 5c2 0 3.4 1.1 4.2 2.3C11.6 6.1 13 5 15 5c3.4 0 5.3 3.2 4 6.3-1.9 4.6-7 9.2-7 9.2Z" fill="currentColor" stroke="currentColor" stroke-width="1.3" />
                </svg>
              </button>
            </article>
          </div>
          <div v-else class="dxv-guest-commerce__empty">
            <h3>Your Favorites are empty.</h3>
            <p>Save products here to revisit them on this device.</p>
            <button type="button" @click="closeGuestCommerceDrawer">Continue browsing</button>
          </div>
        </div>

        <div v-else class="dxv-guest-commerce__body">
          <div v-if="cartLines.length" class="dxv-guest-commerce__list" aria-label="Cart products">
            <article v-for="line in cartLines" :key="line.cartLineKey" class="dxv-guest-commerce__item">
              <NuxtLink :to="line.href" class="dxv-guest-commerce__image" @click="closeForNavigation">
                <img :src="line.image" :alt="line.title">
              </NuxtLink>
              <div class="dxv-guest-commerce__copy">
                <NuxtLink :to="line.href" @click="closeForNavigation">{{ line.title }}</NuxtLink>
                <p v-if="line.variantLabel" class="dxv-guest-commerce__variant">{{ line.variantLabel }}</p>
                <p>{{ line.price }}</p>
                <div class="dxv-guest-commerce__quantity" :aria-label="`Quantity for ${line.title}`">
                  <button type="button" aria-label="Decrease quantity" @click="setCartLineQuantity(line.cartLineKey, line.quantity - 1)">−</button>
                  <span>{{ line.quantity }}</span>
                  <button type="button" aria-label="Increase quantity" @click="setCartLineQuantity(line.cartLineKey, line.quantity + 1)">+</button>
                </div>
              </div>
              <button
                class="dxv-guest-commerce__remove"
                type="button"
                :aria-label="`Remove ${line.title} from Cart`"
                @click="removeCartLine(line.cartLineKey)"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 5L19 19M19 5L5 19" stroke="currentColor" stroke-width="1.35" />
                </svg>
              </button>
            </article>
          </div>
          <div v-else class="dxv-guest-commerce__empty">
            <h3>Your Cart is empty.</h3>
            <p>Add products when you are ready. Your Cart is saved on this device.</p>
            <button type="button" @click="closeGuestCommerceDrawer">Continue browsing</button>
          </div>
        </div>

        <footer v-if="activeGuestCommerceDrawer === 'cart' && cartLines.length" class="dxv-guest-commerce__footer">
          <div>
            <span>Estimated subtotal</span>
            <strong>{{ formattedSubtotal }}</strong>
          </div>
          <p>Final prices and availability are confirmed at checkout.</p>
          <button type="button" @click="closeGuestCommerceDrawer">Continue browsing</button>
        </footer>
      </aside>
    </div>
  </Transition>
</template>

<style>
body.dxv-guest-commerce-open {
  overflow: hidden;
}

.dxv-guest-commerce {
  position: fixed;
  inset: 0;
  z-index: 250;
  display: flex;
  justify-content: flex-end;
  background: rgba(18, 18, 18, 0.46);
}

.dxv-guest-commerce__panel {
  display: grid;
  width: min(460px, 100%);
  height: 100%;
  grid-template-rows: auto minmax(0, 1fr) auto;
  background: var(--dxv-white, #fff);
  color: var(--dxv-black, #1d1d1d);
  box-shadow: -16px 0 48px rgba(0, 0, 0, 0.18);
  outline: 0;
}

.dxv-guest-commerce__header {
  position: relative;
  min-height: 118px;
  border-bottom: 1px solid rgba(29, 29, 29, 0.2);
  padding: 26px 70px 24px 32px;
}

.dxv-guest-commerce__header p,
.dxv-guest-commerce__header h2,
.dxv-guest-commerce__copy p,
.dxv-guest-commerce__footer p,
.dxv-guest-commerce__empty p {
  margin: 0;
}

.dxv-guest-commerce__header p {
  color: #686868;
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.16em;
}

.dxv-guest-commerce__header h2 {
  margin-top: 7px;
  font-family: var(--dxv-display, Georgia, serif);
  font-size: 2rem;
  font-weight: 400;
  line-height: 1;
}

.dxv-guest-commerce__header > button,
.dxv-guest-commerce__remove,
.dxv-guest-commerce__heart {
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.dxv-guest-commerce__header > button {
  position: absolute;
  top: 29px;
  right: 26px;
  width: 32px;
  height: 32px;
}

.dxv-guest-commerce__header > button svg,
.dxv-guest-commerce__remove svg,
.dxv-guest-commerce__heart svg {
  width: 22px;
  height: 22px;
}

.dxv-guest-commerce__body {
  min-height: 0;
  overflow-y: auto;
}

.dxv-guest-commerce__list {
  display: grid;
  padding: 0 32px;
}

.dxv-guest-commerce__item {
  position: relative;
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr) 28px;
  gap: 16px;
  border-bottom: 1px solid rgba(29, 29, 29, 0.15);
  padding: 22px 0;
}

.dxv-guest-commerce__image {
  display: block;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f4f2ed;
}

.dxv-guest-commerce__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dxv-guest-commerce__copy {
  display: grid;
  align-content: start;
  gap: 8px;
  padding-top: 2px;
}

.dxv-guest-commerce__copy > a {
  color: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.35;
  text-decoration: none;
}

.dxv-guest-commerce__copy p {
  color: #4f4f4f;
  font-size: 0.8125rem;
}

.dxv-guest-commerce__copy .dxv-guest-commerce__variant {
  color: #777;
  font-size: 0.75rem;
}

.dxv-guest-commerce__copy > button {
  width: fit-content;
  padding: 0;
  border: 0;
  border-bottom: 1px solid currentColor;
  background: transparent;
  color: #343434;
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
}

.dxv-guest-commerce__remove,
.dxv-guest-commerce__heart {
  align-self: start;
  width: 28px;
  height: 28px;
}

.dxv-guest-commerce__quantity {
  display: inline-grid;
  width: fit-content;
  grid-template-columns: 28px 34px 28px;
  align-items: center;
  border: 1px solid rgba(29, 29, 29, 0.45);
}

.dxv-guest-commerce__quantity button,
.dxv-guest-commerce__quantity span {
  display: grid;
  min-height: 28px;
  place-items: center;
}

.dxv-guest-commerce__quantity button {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
}

.dxv-guest-commerce__quantity span {
  border-right: 1px solid rgba(29, 29, 29, 0.3);
  border-left: 1px solid rgba(29, 29, 29, 0.3);
  font-size: 0.75rem;
}

.dxv-guest-commerce__empty {
  display: grid;
  min-height: 100%;
  align-content: center;
  justify-items: center;
  gap: 14px;
  padding: 48px 32px;
  text-align: center;
}

.dxv-guest-commerce__empty h3 {
  margin: 0;
  font-family: var(--dxv-display, Georgia, serif);
  font-size: 1.75rem;
  font-weight: 400;
}

.dxv-guest-commerce__empty p,
.dxv-guest-commerce__footer p {
  max-width: 30ch;
  color: #616161;
  font-size: 0.8125rem;
  line-height: 1.55;
}

.dxv-guest-commerce__empty button,
.dxv-guest-commerce__footer > button {
  border: 0;
  background: #1d1d1d;
  color: #fff;
  cursor: pointer;
  font-family: var(--dxv-body, Arial, sans-serif);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.dxv-guest-commerce__empty button {
  margin-top: 8px;
  padding: 14px 20px;
}

.dxv-guest-commerce__footer {
  display: grid;
  gap: 12px;
  border-top: 1px solid rgba(29, 29, 29, 0.2);
  padding: 22px 32px 28px;
}

.dxv-guest-commerce__footer > div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: 0.875rem;
}

.dxv-guest-commerce__footer strong {
  font-weight: 600;
}

.dxv-guest-commerce__footer > button {
  min-height: 48px;
  margin-top: 6px;
}

.dxv-guest-commerce-enter-active,
.dxv-guest-commerce-leave-active {
  transition: opacity 260ms ease;
}

.dxv-guest-commerce-enter-active .dxv-guest-commerce__panel,
.dxv-guest-commerce-leave-active .dxv-guest-commerce__panel {
  transition: transform 340ms cubic-bezier(0.22, 1, 0.36, 1);
}

.dxv-guest-commerce-enter-from,
.dxv-guest-commerce-leave-to {
  opacity: 0;
}

.dxv-guest-commerce-enter-from .dxv-guest-commerce__panel,
.dxv-guest-commerce-leave-to .dxv-guest-commerce__panel {
  transform: translate3d(100%, 0, 0);
}

@media (max-width: 520px) {
  .dxv-guest-commerce__header {
    min-height: 102px;
    padding: 22px 62px 20px 22px;
  }

  .dxv-guest-commerce__header h2 {
    font-size: 1.75rem;
  }

  .dxv-guest-commerce__header > button {
    top: 22px;
    right: 18px;
  }

  .dxv-guest-commerce__list,
  .dxv-guest-commerce__footer {
    padding-right: 22px;
    padding-left: 22px;
  }

  .dxv-guest-commerce__item {
    grid-template-columns: 88px minmax(0, 1fr) 28px;
    gap: 13px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dxv-guest-commerce-enter-active,
  .dxv-guest-commerce-leave-active,
  .dxv-guest-commerce-enter-active .dxv-guest-commerce__panel,
  .dxv-guest-commerce-leave-active .dxv-guest-commerce__panel {
    transition-duration: 1ms;
  }
}
</style>
