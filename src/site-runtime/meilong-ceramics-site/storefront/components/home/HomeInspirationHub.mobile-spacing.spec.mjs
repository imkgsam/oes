import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const stylesUrl = new URL('../../assets/css/dxv-home.css', import.meta.url)

// This regression check retains page gutters while allowing native horizontal swiping on every small screen.
test('mobile Inspiration Hub cards retain padded horizontal rail scrolling', async () => {
  const styles = await readFile(stylesUrl, 'utf8')

  assert.match(
    styles,
    /@media \(max-width: 767px\)[\s\S]*?\.dxv-inspiration-track\s*\{[\s\S]*?grid-auto-flow:\s*column[\s\S]*?padding:\s*0 16px[\s\S]*?overflow-x:\s*auto[\s\S]*?touch-action:\s*pan-x pan-y/,
  )
  assert.match(
    styles,
    /@media \(max-width: 767px\)[\s\S]*?\.dxv-inspiration-track\s*\{[^}]*scroll-padding-inline:\s*16px/,
  )
})
