import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const stylesUrl = new URL('../../assets/css/dxv-home.css', import.meta.url)

// This regression check keeps the hero title aligned with its copy at each compact responsive mode.
test('home hero aligns its title left on small screens and centers it at the medium breakpoint', async () => {
  const styles = await readFile(stylesUrl, 'utf8')

  assert.match(styles, /@media \(max-width: 1279px\)[\s\S]*?\.dxv-hero-copy\s*\{[^}]*right:\s*0[^}]*left:\s*0[^}]*padding:\s*0 24px[^}]*text-align:\s*left[^}]*transform:\s*none/)
  assert.match(styles, /@media \(max-width: 1279px\)[\s\S]*?\.dxv-hero-title\s*\{[^}]*margin:\s*0/)
  assert.match(styles, /@media \(max-width: 1279px\)[\s\S]*?\.dxv-hero-lede\s*\{[^}]*margin:\s*0/)
  assert.match(styles, /@media \(min-width: 1024px\) and \(max-width: 1279px\)[\s\S]*?\.dxv-hero-title\s*\{[^}]*margin:\s*0 auto/)
})
