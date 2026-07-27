import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentUrl = new URL('./HomeAboutBanner.vue', import.meta.url)
const pageUrl = new URL('../../pages/index.vue', import.meta.url)
const stylesUrl = new URL('../../assets/css/dxv-home.css', import.meta.url)

// This regression check keeps the reference About Banner video, copy, CTA, and placement after Inspiration Hub.
test('home About Banner preserves its reference video, copy, CTA, and placement after Inspiration Hub', async () => {
  const [component, page, styles] = await Promise.all([
    readFile(componentUrl, 'utf8'),
    readFile(pageUrl, 'utf8'),
    readFile(stylesUrl, 'utf8'),
  ])

  assert.match(component, /<section class="dxv-about-banner dxv-reveal" aria-label="About Swiss Madison">/)
  assert.doesNotMatch(component, /<HomeResponsiveImage/)
  assert.match(component, /<video\s+class="dxv-about-banner__media"[^>]*autoplay[^>]*muted[^>]*loop[^>]*playsinline[^>]*preload="metadata"/)
  assert.match(component, /<source :src="media\.video" type="video\/mp4" \/>/)
  assert.match(component, /65be6ef608e14bb38a06ed61e1ebdacf\.HD-1080p-7\.2Mbps-66159988\.mp4/)
  assert.match(component, /cdn\.shopify\.com\/s\/files\/1\/1585\/4485\/files\/preview_images\/65be6ef608e14bb38a06ed61e1ebdacf\.thumbnail\.0000000000_1920x\.jpg\?v=1767203403/)
  assert.match(component, /<a class="dxv-about-banner__link" href="\/about">/)
  assert.match(component, /<h2>Well made, forever\.<\/h2>/)
  assert.match(component, /Born in Brooklyn, NY, we saw a world of uninspired bathrooms, so we reimagined what they\s+could be\./)
  assert.match(component, /<span>Discover Swiss Madison<\/span>/)
  assert.doesNotMatch(component, /dxv-about-banner__link"[\s\S]*?<svg/)
  assert.match(page, /<HomeInspirationHub :items="inspirationCards" \/>\s*<HomeAboutBanner \/>\s*<HomeSocialStrip \/>/)
  assert.match(styles, /\.dxv-about-banner\s*\{[^}]*position:\s*relative[^}]*min-height:\s*clamp\(520px, 55vw, 720px\)[^}]*overflow:\s*hidden/)
  assert.match(styles, /\.dxv-about-banner__media\s*\{[^}]*position:\s*absolute[^}]*inset:\s*0[^}]*object-fit:\s*cover/)
  assert.doesNotMatch(styles, /\.dxv-about-banner::before\s*\{/)
  assert.match(styles, /\.dxv-about-banner__content\s*\{[^}]*width:\s*min\(calc\(100% - 48px\), 320px\)[^}]*padding:\s*clamp\(100px, 10\.4vw, 140px\) 0 80px/)
  assert.match(styles, /\.dxv-about-banner h2\s*\{[^}]*color:\s*#121212[^}]*font-family:\s*var\(--dxv-body\)[^}]*font-size:\s*clamp\(1\.625rem, 2vw, 2\.25rem\)/)
  assert.match(styles, /\.dxv-about-banner__lede\s*\{[^}]*max-width:\s*320px[^}]*font-size:\s*0\.875rem[^}]*font-weight:\s*400/)
  assert.match(styles, /\.dxv-about-banner__link\s*\{[^}]*width:\s*260px[^}]*height:\s*46px[^}]*border-radius:\s*41px[^}]*text-transform:\s*none[^}]*transition:[^}]*transform/)
  assert.match(styles, /\.dxv-home \.dxv-about-banner__link\s*\{[^}]*color:\s*var\(--dxv-white\)/)
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.dxv-about-banner\s*\{[^}]*min-height:\s*clamp\(460px, 128vw, 600px\)/)
})
