import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const stylesUrl = new URL('../../assets/css/dxv-home.css', import.meta.url)

// This regression check keeps the accordion below tablet width while using the full footer layout from the tablet breakpoint.
test('footer switches from its mobile accordion to the full multi-column layout at tablet width', async () => {
  const styles = await readFile(stylesUrl, 'utf8')

  assert.match(styles, /\.dxv-footer-links\s*\{[^}]*gap:\s*12px/)
  assert.match(
    styles,
    /@media \(max-width: 767px\) \{\s+\.dxv-site-layout \.dxv-footer \{[^}]*padding:\s*48px 16px 24px/
  )
  assert.doesNotMatch(
    styles,
    /@media \(max-width: 1023px\) \{\s+\.dxv-site-layout \.dxv-footer \{/
  )
  assert.match(
    styles,
    /\.dxv-site-layout \.dxv-footer-about\.mobile-open \.dxv-footer-links\s*\{[^}]*gap:\s*12px/
  )
  assert.match(
    styles,
    /\.dxv-site-layout \.dxv-footer-support\.mobile-open \.dxv-footer-links\s*\{[^}]*gap:\s*8px 18px/
  )
  assert.match(
    styles,
    /@media \(min-width: 768px\) \{\s+\.dxv-site-layout \.dxv-footer \{[\s\S]*?\.dxv-site-layout \.dxv-footer-grid\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*296\.7px 296\.4px minmax\(0, 1fr\) 344\.9px/
  )
  assert.match(
    styles,
    /@media \(min-width: 768px\) and \(max-width: 1023px\) \{\s+\.dxv-site-layout \.dxv-footer \{[\s\S]*?\.dxv-site-layout \.dxv-footer-grid\s*\{[^}]*grid-template-columns:\s*210\.8px 210\.8px minmax\(0, 1fr\) 267\.6px/
  )
})
