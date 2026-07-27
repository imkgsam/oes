import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentUrl = new URL('./HomeSocialStrip.vue', import.meta.url)
const stylesUrl = new URL('../../assets/css/dxv-home.css', import.meta.url)

// This regression check keeps the social invitation responsive: centered and compact on phones, editorially left-aligned on larger viewports.
test('home social invitation keeps a compact mobile heading and a left-aligned desktop content column', async () => {
  const [component, styles] = await Promise.all([
    readFile(componentUrl, 'utf8'),
    readFile(stylesUrl, 'utf8'),
  ])

  assert.match(component, /<section class="dxv-social-strip dxv-reveal" aria-label="Follow MAIDSTONE \| DXV on Instagram">/)
  assert.match(component, /<p class="dxv-social-strip__eyebrow">Follow Us<\/p>/)
  assert.match(component, /<h2>Join the community and get inspired\.<\/h2>/)
  assert.match(component, /href="https:\/\/www\.instagram\.com\/maidstonedxv"/)
  assert.match(component, /target="_blank"\s+rel="noopener noreferrer"/)
  assert.match(styles, /\.dxv-social-strip\s*\{[^}]*background:\s*#000000[^}]*color:\s*var\(--dxv-white\)/)
  assert.match(styles, /\.dxv-social-strip__inner\s*\{[^}]*width:\s*min\(calc\(100% - 48px\), 680px\)[^}]*text-align:\s*center/)
  assert.match(styles, /\.dxv-social-strip__body\s*\{[^}]*max-width:\s*480px[^}]*font-size:\s*0\.9375rem/)
  assert.match(styles, /@media \(min-width: 768px\)[\s\S]*?\.dxv-social-strip__inner\s*\{[^}]*width:\s*min\(calc\(100% - 96px\), 1104px\)[^}]*justify-items:\s*start[^}]*text-align:\s*left/)
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.dxv-social-strip h2\s*\{[^}]*font-size:\s*clamp\(1\.875rem, 5\.4vw, 2rem\)/)
  assert.doesNotMatch(styles, /@media \(max-width: 520px\)[\s\S]*?\.dxv-social-strip h2\s*\{[^}]*font-size:\s*2\.25rem/)
})
