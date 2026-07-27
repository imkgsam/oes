import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const commerceUrl = new URL('./useGuestCommerce.ts', import.meta.url)

// This regression check prevents browser storage from changing guest-commerce markup before Vue finishes hydration.
test('guest commerce delays browser-storage hydration until component mount', async () => {
  const commerce = await readFile(commerceUrl, 'utf8')

  assert.match(commerce, /onMounted\(\(\) => nextTick\(hydrateGuestCommerceState\)\)/)
  assert.doesNotMatch(commerce, /\n  hydrateGuestCommerceState\(\)\n\n  const favoriteCount/)
})
