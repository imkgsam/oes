import assert from 'node:assert/strict'
import test, { after } from 'node:test'

let stateRecords = new Map()
let storageRecords = new Map()

const runtimeGlobalNames = ['useState', 'computed', 'onMounted', 'nextTick', 'window']
const originalRuntimeGlobalDescriptors = new Map(
  runtimeGlobalNames.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
)

// Installs Nuxt and browser test doubles at runtime without extending TypeScript's inferred global declarations.
Object.defineProperties(globalThis, {
  useState: {
    configurable: true,
    value: (key, initializer) => {
      if (!stateRecords.has(key)) {
        stateRecords.set(key, { value: initializer() })
      }

      return stateRecords.get(key)
    },
  },
  computed: {
    configurable: true,
    value: (getter) => ({ get value() { return getter() } }),
  },
  onMounted: {
    configurable: true,
    value: (callback) => callback(),
  },
  nextTick: {
    configurable: true,
    value: (callback) => callback(),
  },
  window: {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key) => storageRecords.get(key) ?? null,
        setItem: (key, value) => storageRecords.set(key, value),
      },
    },
  },
})

// Restores every prior descriptor so this test module cannot leak its runtime doubles into later tests.
after(() => {
  for (const [name, descriptor] of originalRuntimeGlobalDescriptors) {
    if (descriptor) {
      Object.defineProperty(globalThis, name, descriptor)
    } else {
      Reflect.deleteProperty(globalThis, name)
    }
  }
})

const { useGuestCommerce } = await import('../../../composables/useGuestCommerce.ts')

// Resets the Nuxt-state and browser-storage stubs so each guest-commerce behavior starts as a new visitor.
function resetGuestCommerce() {
  stateRecords = new Map()
  storageRecords = new Map()
}

const basin = {
  productKey: 'maidstone-pedestal-basin',
  title: 'Pedestal Basin',
  href: '/products/maidstone-pedestal-basin',
  image: '/images/basin.jpg',
  price: '$915.00',
}

// This behavior contract makes Favorites idempotent and keeps their guest state persisted on the current device.
test('guest Favorites toggle by product identity and persist locally', () => {
  resetGuestCommerce()
  const commerce = useGuestCommerce()

  commerce.toggleFavorite(basin)
  commerce.toggleFavorite({ ...basin, title: 'Renamed card rendering' })

  assert.equal(commerce.favoriteCount.value, 0)
  assert.match(storageRecords.get('dxv-guest-commerce-v1'), /"favorites":\[\]/)

  commerce.toggleFavorite(basin)

  assert.equal(commerce.favoriteCount.value, 1)
  assert.equal(commerce.isFavorite(basin.productKey), true)
  assert.match(storageRecords.get('dxv-guest-commerce-v1'), /maidstone-pedestal-basin/)
})

// This behavior contract merges matching variants, maintains the cart count, and removes a line at quantity zero.
test('guest Cart combines matching variants and updates subtotal', () => {
  resetGuestCommerce()
  const commerce = useGuestCommerce()
  const brassBasin = { ...basin, variantKey: 'PDS-21-BRASS', variantLabel: 'Brushed brass' }

  commerce.addToCart(brassBasin, 2)
  commerce.addToCart(brassBasin, 3)
  commerce.addToCart({ ...basin, variantKey: 'PDS-21-CHROME', price: '$100.00' }, 1)

  assert.equal(commerce.cartLines.value.length, 2)
  assert.equal(commerce.cartItemCount.value, 6)
  assert.equal(commerce.cartSubtotal.value, 4675)

  commerce.setCartLineQuantity('maidstone-pedestal-basin::PDS-21-BRASS', 0)

  assert.equal(commerce.cartLines.value.length, 1)
  assert.equal(commerce.cartItemCount.value, 1)
})
