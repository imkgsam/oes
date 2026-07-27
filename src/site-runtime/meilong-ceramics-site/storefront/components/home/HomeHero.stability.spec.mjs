import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentDirectory = new URL('./', import.meta.url)
const stylesUrl = new URL('../../assets/css/dxv-home.css', import.meta.url)
const aboutPageUrl = new URL('../../pages/about.vue', import.meta.url)
const collectionsPageUrl = new URL('../../pages/collections/index.vue', import.meta.url)

// This regression check keeps the first-screen hero free from delayed reveal and scroll-driven image movement.
test('home hero remains visually stable while the page scrolls', async () => {
  const [hero, motion, styles, aboutPage, collectionsPage] = await Promise.all([
    readFile(new URL('./HomeHero.vue', componentDirectory), 'utf8'),
    readFile(new URL('./HomeMotion.client.vue', componentDirectory), 'utf8'),
    readFile(stylesUrl, 'utf8'),
    readFile(aboutPageUrl, 'utf8'),
    readFile(collectionsPageUrl, 'utf8'),
  ])

  assert.doesNotMatch(hero, /class="dxv-hero dxv-reveal"/)
  assert.doesNotMatch(hero, /dxv-parallax/)
  assert.doesNotMatch(motion, /gsap\.to\('\.dxv-parallax img'/)
  assert.doesNotMatch(motion, /import\('gsap'\)/)
  assert.match(styles, /\.dxv-hero\s*\{[^}]*min-height:\s*100svh/)
  assert.doesNotMatch(styles, /\.dxv-hero\s*\{[^}]*min-height:\s*100dvh/)
  assert.match(motion, /dataset\.revealInitial/)
  assert.match(styles, /\.dxv-reveal\[data-animated\]\[data-reveal-initial\]\s*\{[^}]*transition:\s*none/)
  assert.match(aboutPage, /sm-reveal--initial/)
  assert.match(collectionsPage, /kohler-animate--initial/)
  assert.match(collectionsPage, /\.kohler-hero--first\s*\{[^}]*min-height:\s*100svh/)
  assert.doesNotMatch(collectionsPage, /\.kohler-hero--first\s*\{[^}]*100dvh/)
})
