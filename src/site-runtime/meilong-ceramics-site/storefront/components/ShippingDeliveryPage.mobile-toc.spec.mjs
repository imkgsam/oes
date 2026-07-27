import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pageUrl = new URL('../pages/shipping-delivery.vue', import.meta.url)

// This regression test keeps the mobile shipping table of contents aligned with the FAQ swipe-rail pattern.
test('Shipping mobile table of contents uses the FAQ-style selectable swipe rail', async () => {
  const page = await readFile(pageUrl, 'utf8')

  assert.match(page, /class="dxv-shipping-policy__contents-rail"/)
  assert.match(page, /@click\.prevent="jumpToSection\(section\.id\)"/)
  assert.match(page, /:aria-current="activeSectionId === section\.id \? 'page' : undefined"/)
  assert.match(page, /\.dxv-shipping-policy__contents-rail\s*\{[\s\S]*?overflow-x:\s*auto;[\s\S]*?scroll-snap-type:\s*x proximity;[\s\S]*?touch-action:\s*pan-x pan-y;/)
  assert.match(page, /\.dxv-shipping-policy__contents-rail a\s*\{[\s\S]*?flex:\s*0 0 auto;[\s\S]*?white-space:\s*nowrap;/)
  assert.match(page, /<strong>Parcel delivery\.<\/strong>/)
  assert.match(page, /<strong>Freight delivery\.<\/strong>/)
  assert.doesNotMatch(page, /dxv-shipping-policy__method-grid/)
  assert.doesNotMatch(page, /dxv-shipping-policy__section--emphasis/)
})
