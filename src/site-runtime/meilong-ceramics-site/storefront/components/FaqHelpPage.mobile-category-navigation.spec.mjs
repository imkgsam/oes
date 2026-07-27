import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentUrl = new URL('./FaqHelpPage.vue', import.meta.url)

// This regression test keeps every FAQ category link on the smooth anchor path while preserving the mobile swipe rail.
test('FAQ category navigation uses smooth anchors and preserves the mobile swipe rail', async () => {
  const component = await readFile(componentUrl, 'utf8')

  assert.match(component, /class="dxv-faq-page__mobile-category-rail"/)
  assert.match(component, /@click\.prevent="jumpToCategory\(category\.id\)"/)
  assert.match(component, /class="dxv-faq-page__category-links"[\s\S]*?@click\.prevent="jumpToCategory\(category\.id\)"/)
  assert.match(component, /category\.scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\)/)
  assert.match(component, /:aria-current="selectedCategoryId === category\.id \? 'page' : undefined"/)
  assert.match(component, /\.dxv-faq-page__mobile-category-rail\s*\{[\s\S]*?overflow-x:\s*auto;[\s\S]*?scroll-snap-type:\s*x proximity;/)
  assert.match(component, /\.dxv-faq-page__mobile-category-rail\s*\{[\s\S]*?touch-action:\s*pan-x pan-y;[\s\S]*?-webkit-overflow-scrolling:\s*touch;/)
  assert.match(component, /\.dxv-faq-page__mobile-category-rail a\s*\{[\s\S]*?flex:\s*0 0 auto;[\s\S]*?white-space:\s*nowrap;/)
  assert.match(component, /\.dxv-faq-page__category-links\s*\{\s*display:\s*none;/)
  assert.match(component, /@media \(max-width: 760px\)[\s\S]*?\.dxv-faq-page__category-nav\s*\{[\s\S]*?padding:\s*26px 0 44px;/)
  assert.doesNotMatch(component, /class="dxv-faq-page__category-select"/)
})
