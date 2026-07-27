import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const stylesUrl = new URL('../../assets/css/dxv-home.css', import.meta.url)

// This regression check caps compact-tablet Movement cards while preserving their one-row native scrolling rail.
test('small-screen Design Movements caps rail card width before the three-column tablet layout', async () => {
  const styles = await readFile(stylesUrl, 'utf8')

  assert.match(
    styles,
    /@media \(max-width: 767px\)[\s\S]*?\.dxv-movement-grid\s*\{[^}]*grid-auto-columns:\s*min\(360px, calc\(100vw - 48px\)\)/
  )
  assert.match(
    styles,
    /@media \(max-width: 767px\)[\s\S]*?\.dxv-movement-card\s*\{[^}]*aspect-ratio:\s*3 \/ 4/
  )
})
