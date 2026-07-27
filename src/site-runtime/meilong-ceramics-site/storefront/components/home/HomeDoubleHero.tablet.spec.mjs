import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const stylesUrl = new URL('../../assets/css/dxv-home.css', import.meta.url)

// This regression check gives the tablet Featured Rooms image more visual weight without changing the desktop or phone compositions.
test('tablet Featured Rooms panel uses a taller responsive media frame', async () => {
  const styles = await readFile(stylesUrl, 'utf8')

  assert.match(styles, /@media \(min-width: 768px\) and \(max-width: 1023px\) \{[\s\S]*?\.dxv-double-hero\s*\{[^}]*height:\s*auto[^}]*min-height:\s*0/)
  assert.match(styles, /@media \(min-width: 768px\) and \(max-width: 1023px\) \{[\s\S]*?\.dxv-double-panel\s*\{[^}]*height:\s*auto[^}]*min-height:\s*0/)
  assert.match(styles, /@media \(min-width: 768px\) and \(max-width: 1023px\) \{[\s\S]*?\.dxv-double-panel picture\s*\{[^}]*height:\s*clamp\(400px, 52vw, 480px\)[^}]*flex:\s*0 0 clamp\(400px, 52vw, 480px\)/)
})
