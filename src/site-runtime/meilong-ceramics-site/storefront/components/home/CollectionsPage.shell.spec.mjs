import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pageUrl = new URL('../../pages/collections/index.vue', import.meta.url)
const layoutUrl = new URL('../../layouts/default.vue', import.meta.url)

// This regression check keeps the Collections content inside the site's shared shell instead of a Kohler-specific page shell.
test('collections uses the shared site header and footer instead of the Kohler reference shell', async () => {
  const [page, layout] = await Promise.all([
    readFile(pageUrl, 'utf8'),
    readFile(layoutUrl, 'utf8'),
  ])

  assert.doesNotMatch(page, /definePageMeta\(\{\s*layout:\s*false\s*\}\)/)
  assert.doesNotMatch(page, /<header class="kohler-header"/)
  assert.doesNotMatch(page, /<footer class="kohler-footer"/)
  assert.match(layout, /<HomeReplicaHeader \/>/)
  assert.match(layout, /<HomeReplicaFooter \/>/)
})
