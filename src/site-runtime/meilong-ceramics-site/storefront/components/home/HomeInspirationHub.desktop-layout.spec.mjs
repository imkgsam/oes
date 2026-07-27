import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const stylesUrl = new URL('../../assets/css/dxv-home.css', import.meta.url)

// This regression check keeps desktop Inspiration Hub cards fully visible with aligned editorial copy and actions.
test('desktop Inspiration Hub reserves fixed text rows without a vertical rail overflow', async () => {
  const styles = await readFile(stylesUrl, 'utf8')

  assert.match(
    styles,
    /@media \(min-width: 1024px\) and \(max-width: 1279px\) \{[\s\S]*?\.dxv-inspiration\s*\{[\s\S]*?padding:\s*20px 0 48px/
  )
  assert.match(styles, /@media \(min-width: 1024px\) \{[\s\S]*?\.dxv-inspiration\s*\{[^}]*padding-top:\s*32px/)
  assert.match(styles, /\.dxv-inspiration-track\s*\{[^}]*overflow-y:\s*hidden/)
  assert.match(styles, /\.dxv-story-copy h3\s*\{[^}]*min-height:\s*39\.2px[^}]*-webkit-line-clamp:\s*2/)
  assert.match(styles, /\.dxv-story-copy p\s*\{[^}]*min-height:\s*76\.8px[^}]*-webkit-line-clamp:\s*4/)
  assert.match(styles, /\.dxv-story-actions\s*\{[^}]*margin-top:\s*auto/)
})
