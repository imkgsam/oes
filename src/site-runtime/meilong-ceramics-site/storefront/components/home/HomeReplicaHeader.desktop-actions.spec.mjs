import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentUrl = new URL('./HomeReplicaHeader.vue', import.meta.url)
const stylesUrl = new URL('../../assets/css/dxv-home.css', import.meta.url)

// This regression check keeps desktop header icon actions compact and consistent with mobile tactile feedback.
test('desktop header icon actions share compact spacing and mobile-style feedback', async () => {
  const [component, styles] = await Promise.all([
    readFile(componentUrl, 'utf8'),
    readFile(stylesUrl, 'utf8'),
  ])

  assert.match(component, /class="dxv-action-link dxv-icon-action" type="button" aria-label="Open search modal"/)
  assert.match(component, /class="dxv-action-link dxv-icon-action dxv-favorites-button" type="button" aria-label="Favorites"/)
  assert.match(component, /class="dxv-cart-button" type="button" aria-label="Cart"/)
  assert.match(styles, /\.dxv-header-actions\s*\{[^}]*gap:\s*16px/)
  assert.match(styles, /\.dxv-action-link\.dxv-icon-action::after\s*\{[^}]*display:\s*none/)
  assert.match(styles, /@media \(hover: hover\)\s*\{[\s\S]*?\.dxv-action-link\.dxv-icon-action:hover,\s*\.dxv-cart-button:hover\s*\{[^}]*transform:\s*translate3d\(0, -1px, 0\)/)
  assert.match(styles, /\.dxv-action-link\.dxv-icon-action:active,\s*\.dxv-cart-button:active\s*\{[^}]*transform:\s*scale\(0\.92\)/)
})
