import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentUrl = new URL('./HomeInspirationHub.vue', import.meta.url)
const stylesUrl = new URL('../../assets/css/dxv-home.css', import.meta.url)

// This regression check gives each story action its own link and underline interaction.
test('desktop story actions reveal an underline only for the hovered action link', async () => {
  const [component, styles] = await Promise.all([
    readFile(componentUrl, 'utf8'),
    readFile(stylesUrl, 'utf8'),
  ])

  assert.match(component, /<article v-for="item in items" :key="item.title" class="dxv-story-card">/)
  assert.match(component, /<a class="dxv-story-card__media" :href="item.href" draggable="false">/)
  assert.match(component, /<div class="dxv-story-actions">[\s\S]*?<a class="dxv-story-cta dxv-story-cta-desktop" :href="item.href">Discover More<\/a>[\s\S]*?<a class="dxv-story-cta dxv-story-cta-mobile" :href="item.href">Read More<\/a>[\s\S]*?<\/div>/)
  assert.match(styles, /\.dxv-story-actions\s*\{[^}]*display:\s*flex[^}]*gap:\s*12px 20px/)
  assert.match(styles, /\.dxv-story-actions a::after\s*\{[^}]*transform:\s*scaleX\(0\)/)
  assert.match(styles, /\.dxv-story-actions a:hover::after,\s*\.dxv-story-actions a:focus-visible::after\s*\{[^}]*transform:\s*scaleX\(1\)/)
  assert.doesNotMatch(styles, /\.dxv-story-card:hover \.dxv-story-actions/)
  assert.match(styles, /@media \(min-width: 1024px\)[\s\S]*?\.dxv-story-cta-mobile\s*\{[^}]*display:\s*inline-flex/)
})

// This regression check keeps every small-screen Inspiration Hub on a touch-friendly, one-row story rail.
test('small-screen Inspiration Hub shows its full intro and horizontal story rail', async () => {
  const styles = await readFile(stylesUrl, 'utf8')

  assert.match(styles, /@media \(min-width: 768px\) and \(max-width: 1023px\)[\s\S]*?\.dxv-inspiration-intro\s*\{[^}]*min-height:\s*176px/)
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.dxv-inspiration\s*\{[^}]*height:\s*auto[^}]*min-height:\s*0[^}]*overflow:\s*visible/)
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.dxv-inspiration-track\s*\{[^}]*grid-auto-flow:\s*column[^}]*grid-auto-columns:\s*min\(360px, calc\(100vw - 48px\)\)[^}]*grid-template-columns:\s*none[^}]*overflow-x:\s*auto[^}]*scroll-snap-type:\s*x mandatory[^}]*touch-action:\s*pan-x pan-y/)
})

// This regression check gives every small-screen story the same editorial rows so action baselines stay aligned.
test('small-screen story cards reserve equal title and description rows', async () => {
  const styles = await readFile(stylesUrl, 'utf8')

  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.dxv-story-copy\s*\{[^}]*display:\s*flex[^}]*min-height:\s*199px/)
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.dxv-story-copy h3\s*\{[^}]*min-height:\s*50\.4px[^}]*-webkit-line-clamp:\s*2/)
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.dxv-story-copy p\s*\{[^}]*min-height:\s*90px[^}]*-webkit-line-clamp:\s*4/)
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.dxv-story-actions\s*\{[^}]*margin-top:\s*auto/)
})

// This regression check keeps compact tablets on the native, one-row rail without oversized stories.
test('compact tablets retain a compact horizontally scrollable Inspiration Hub rail', async () => {
  const styles = await readFile(stylesUrl, 'utf8')

  assert.match(
    styles,
    /\/\* Keeps compact tablets on a one-row Inspiration Hub rail while capping visual media\. \*\/[\s\S]*?\.dxv-inspiration-track\s*\{[^}]*grid-auto-flow:\s*column[^}]*grid-auto-columns:\s*clamp\(320px, 52vw, 390px\)[^}]*grid-template-columns:\s*none[^}]*overflow-x:\s*auto[^}]*scroll-snap-type:\s*x mandatory[^}]*touch-action:\s*pan-x pan-y/,
  )
  assert.match(
    styles,
    /\/\* Keeps compact tablets on a one-row Inspiration Hub rail while capping visual media\. \*\/[\s\S]*?\.dxv-story-card\s*\{[^}]*grid-template-rows:\s*clamp\(250px, 43vw, 320px\) auto/,
  )
})
