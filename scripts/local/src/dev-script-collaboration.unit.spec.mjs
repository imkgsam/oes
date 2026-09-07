import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

test('development aliases delegate every backend scope to the unified runtime launcher', () => {
  const scripts = JSON.parse(fs.readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')).scripts
  assert.deepEqual(
    Object.fromEntries(['backend:system', 'backend:business', 'backend', 'dev:system', 'dev:business', 'dev:all', 'dev'].map((name) => [name, scripts[name]])),
    {
      'backend:system': 'node scripts/local-runtime/launcher.mjs dev --scope system',
      'backend:business': 'node scripts/local-runtime/launcher.mjs dev --scope business',
      backend: 'node scripts/local-runtime/launcher.mjs dev --scope full',
      'dev:system': 'node scripts/local-runtime/launcher.mjs dev --scope system',
      'dev:business': 'node scripts/local-runtime/launcher.mjs dev --scope business',
      'dev:all': 'node scripts/local-runtime/launcher.mjs dev --scope full',
      dev: 'node scripts/local-runtime/launcher.mjs dev --scope full'
    }
  )
})
