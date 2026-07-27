import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const dragRailUrl = new URL('./useDragRail.ts', import.meta.url)
const storefrontRoot = new URL('../', import.meta.url)

// This regression check keeps touch scrolling on the browser's native scrolling path.
test('home rails reserve custom pointer dragging for non-touch input', async () => {
  const [dragRail, productCarousel, homeStyles] = await Promise.all([
    readFile(dragRailUrl, 'utf8'),
    readFile(new URL('components/home/HomeProductCarousel.vue', storefrontRoot), 'utf8'),
    readFile(new URL('assets/css/dxv-home.css', storefrontRoot), 'utf8'),
  ])

  assert.match(dragRail, /if \(event\.pointerType === 'touch'\) return/)
  assert.match(dragRail, /requestAnimationFrame/)
  assert.match(productCarousel, /if \(event\.pointerType === 'touch'\) return/)
  assert.doesNotMatch(homeStyles, /touch-action:\s*pan-y/)
  assert.match(homeStyles, /touch-action:\s*pan-x pan-y/)
})

// This regression check keeps every conventional horizontal rail on the browser-native touch path.
test('sitewide rails reserve custom dragging for mouse and pen input', async () => {
  const [aboutPage, productDetail, productStyles] = await Promise.all([
    readFile(new URL('pages/about.vue', storefrontRoot), 'utf8'),
    readFile(new URL('components/product/KohlerProductDetailReplica.vue', storefrontRoot), 'utf8'),
    readFile(new URL('assets/css/kohler-pdp.css', storefrontRoot), 'utf8'),
  ])

  assert.match(aboutPage, /const beginInstagramDrag = \(event: PointerEvent\) => \{\s*if \(event\.pointerType === 'touch'\) return/)
  assert.match(productDetail, /function handleRelatedRailPointerDown\(event: PointerEvent\) \{\s*if \(event\.pointerType === 'touch'\) return/)
  assert.match(productDetail, /function startReviewMediaThumbDrag\(event: PointerEvent\) \{\s*if \(event\.pointerType === 'touch'\) return/)
  assert.match(productDetail, /function startThumbDrag\(event: PointerEvent\) \{\s*if \(event\.pointerType === 'touch'\) return/)
  assert.match(aboutPage, /\.sm-instagram__rail\s*\{[^}]*touch-action:\s*pan-x pan-y/)
  assert.match(productStyles, /\.kpdp-related-rail\s*\{[^}]*touch-action:\s*pan-x pan-y/)
  assert.match(productStyles, /\.kpdp-review-media-thumbs\s*\{[^}]*touch-action:\s*pan-x pan-y/)
  assert.match(productStyles, /\.kpdp-lightbox-thumbs\s*\{[^}]*touch-action:\s*pan-x pan-y/)
})

// This regression check keeps each Home rail connected to the composable-owned element ref through an explicit template callback.
test('Home rails explicitly register their rendered track with useDragRail', async () => {
  const components = await Promise.all([
    readFile(new URL('components/home/HomeCollectionCarousel.vue', storefrontRoot), 'utf8'),
    readFile(new URL('components/home/HomeDesignMovements.vue', storefrontRoot), 'utf8'),
    readFile(new URL('components/home/HomeInspirationHub.vue', storefrontRoot), 'utf8'),
  ])

  for (const component of components) {
    assert.match(component, /function setDragRailElement\(element: unknown\): void \{\s*track\.value = element as HTMLElement \| null\s*\}/)
    assert.match(component, /:ref="setDragRailElement"/)
    assert.doesNotMatch(component, /\n\s+ref="track"/)
  }
})
