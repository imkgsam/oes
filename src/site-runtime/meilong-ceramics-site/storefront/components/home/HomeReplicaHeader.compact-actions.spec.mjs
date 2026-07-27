import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentUrl = new URL('./HomeReplicaHeader.vue', import.meta.url)
const stylesUrl = new URL('../../assets/css/dxv-home.css', import.meta.url)

// This regression check keeps compact header actions aligned without adding a hover background treatment.
test('compact header preserves aligned actions without hover-circle backgrounds', async () => {
  const [component, styles] = await Promise.all([
    readFile(componentUrl, 'utf8'),
    readFile(stylesUrl, 'utf8'),
  ])

  assert.match(component, /class="dxv-mobile-menu-button"/)
  assert.match(component, /class="dxv-mobile-search-button"/)
  assert.match(component, /class="dxv-mobile-favorites-button" type="button" aria-label="Favorites"/)
  assert.match(component, /class="dxv-mobile-cart-button" type="button" aria-label="Cart"/)
  assert.doesNotMatch(component, /class="dxv-mobile-bookmark-button"/)
  assert.match(component, /<path d="M2 5H22" stroke="currentColor" stroke-width="1.6" \/>/)
  assert.match(styles, /\.dxv-mobile-menu-button,\s*\.dxv-mobile-search-button,\s*\.dxv-mobile-favorites-button,\s*\.dxv-mobile-cart-button\s*\{[^}]*top:\s*50%[^}]*width:\s*40px[^}]*height:\s*40px[^}]*margin-top:\s*-20px/)
  assert.match(styles, /\.dxv-mobile-search-button svg,\s*\.dxv-mobile-favorites-button svg,\s*\.dxv-mobile-cart-button svg\s*\{[^}]*width:\s*32px[^}]*height:\s*32px/)
  assert.doesNotMatch(styles, /\.dxv-mobile-menu-button::before|\.dxv-mobile-search-button::before|\.dxv-mobile-favorites-button::before|\.dxv-mobile-cart-button::before/)
  assert.doesNotMatch(styles, /\.dxv-mobile-menu-button:hover svg,[\s\S]*?\.dxv-mobile-cart-button:hover svg/)
  assert.match(styles, /@media \(hover: hover\)[\s\S]*?\.dxv-mobile-menu-button:hover,[\s\S]*?\.dxv-mobile-cart-button:hover\s*\{[^}]*transform:\s*translate3d\(0, -1px, 0\)/)
  assert.match(styles, /\.dxv-favorites-button span,\s*\.dxv-cart-button span,\s*\.dxv-mobile-favorites-button span,\s*\.dxv-mobile-cart-button span\s*\{[^}]*position:\s*absolute[^}]*border-radius:\s*999px/)
  assert.match(styles, /@media \(min-width: 768px\) and \(max-width: 1023px\)[\s\S]*?\.dxv-mobile-cart-button\s*\{[^}]*right:\s*20px/)
})

// This regression check prevents Search scroll locking from shrinking stable-gutter page content a second time.
test('search scroll lock relies on the stable gutter without body padding compensation', async () => {
  const [component, styles] = await Promise.all([
    readFile(componentUrl, 'utf8'),
    readFile(stylesUrl, 'utf8'),
  ])

  assert.match(styles, /\.dxv-modal-lock\s*\{[^}]*overflow-y:\s*hidden[^}]*scrollbar-gutter:\s*stable/)
  assert.doesNotMatch(styles, /\.dxv-modal-lock body\s*\{/)
  assert.doesNotMatch(component, /--dxv-scrollbar-compensation/)
  assert.doesNotMatch(component, /window\.innerWidth\s*-\s*root\.clientWidth/)
})

// This regression check keeps Search content consistent and compact instead of changing its information at tablet breakpoints.
test('search uses one compact content model across desktop tablet and mobile', async () => {
  const [component, styles] = await Promise.all([
    readFile(componentUrl, 'utf8'),
    readFile(stylesUrl, 'utf8'),
  ])

  assert.match(component, /class="dxv-search-image"/)
  assert.match(styles, /\.dxv-search-content\s*\{[^}]*height:\s*auto[^}]*max-height:\s*min\(540px, calc\(100dvh - 16px\)\)/)
  assert.match(styles, /\.dxv-search-form\s*\{[^}]*height:\s*84px/)
  assert.match(styles, /\.dxv-search-categories\s*\{[^}]*grid-template-columns:\s*minmax\(180px, 0\.8fr\) minmax\(260px, 1\.2fr\) minmax\(160px, 0\.85fr\)[^}]*height:\s*220px/)
  assert.match(styles, /\.dxv-search-card\s*\{[^}]*gap:\s*6px[^}]*padding:\s*14px 24px/)
  assert.match(styles, /@media \(max-width: 639px\)[\s\S]*?\.dxv-search-categories\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(styles, /@media \(max-width: 639px\)[\s\S]*?\.dxv-search-image\s*\{[^}]*display:\s*block[^}]*height:\s*96px/)
  assert.doesNotMatch(styles, /\.dxv-search-image\s*\{[^}]*display:\s*none/)
  assert.doesNotMatch(styles, /\.dxv-search-card\s*\{[^}]*height:\s*246px/)
})
