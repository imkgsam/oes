import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentDirectory = new URL('./', import.meta.url)
const headerUrl = new URL('./home/HomeReplicaHeader.vue', componentDirectory)
const layoutUrl = new URL('../layouts/default.vue', componentDirectory)

// This integration contract keeps Header commerce actions guest-friendly and independent from account access.
test('header opens shared Favorites and Cart drawers without an account gate', async () => {
  const [header, layout] = await Promise.all([
    readFile(headerUrl, 'utf8'),
    readFile(layoutUrl, 'utf8'),
  ])

  assert.match(header, /const \{ openGuestCommerceDrawer \} = useGuestCommerce\(\)/)
  assert.match(header, /aria-label="Favorites" @click="openGuestCommerceDrawer\('favorites'\)"/)
  assert.match(header, /aria-label="Cart" @click="openGuestCommerceDrawer\('cart'\)"/)
  assert.doesNotMatch(header, /openWishlistSignIn/)
  assert.match(layout, /<GuestCommerceDrawer\s*\/>/)
})
