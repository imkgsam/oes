import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const stylesUrl = new URL('../assets/css/main.css', import.meta.url)

// This regression check keeps the mobile Inspiration introduction readable without consuming an excessive first viewport.
test('mobile Inspiration intro uses fluid readable typography', async () => {
  const styles = await readFile(stylesUrl, 'utf8')

  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.westelm-kids-inspiration__intro\s*\{[^}]*padding:\s*32px 24px 28px/)
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.westelm-kids-inspiration__intro > p\s*\{[^}]*font-size:\s*0\.8125rem[^}]*line-height:\s*1\.35/)
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.westelm-kids-inspiration__intro h1\s*\{[^}]*font-size:\s*clamp\(2\.5rem, 7\.2vw, 3\.25rem\)[^}]*line-height:\s*1\.08/)
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.westelm-kids-inspiration__intro > span\s*\{[^}]*font-size:\s*clamp\(1rem, 3vw, 1\.125rem\)[^}]*line-height:\s*1\.5/)
  assert.doesNotMatch(styles, /\.westelm-kids-inspiration__intro > p\s*\{[^}]*font-size:\s*0\.72rem/)
  assert.doesNotMatch(styles, /\.westelm-kids-inspiration__intro > span\s*\{[^}]*font-size:\s*0\.875rem/)
})
