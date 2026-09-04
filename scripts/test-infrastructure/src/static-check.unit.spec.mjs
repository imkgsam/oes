import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { runStaticRule, runStaticRules } from './static-check.mjs'

test('static runner executes rules with the Node test harness', () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-static-runner-'))
  try {
    writeFileSync(
      join(root, 'passing.static.check.mjs'),
      "import test from 'node:test'; test('passes', () => {})\n"
    )
    writeFileSync(
      join(root, 'failing.static.check.mjs'),
      "import test from 'node:test'; test('fails', () => { throw new Error('sentinel') })\n"
    )

    assert.equal(runStaticRule(root, 'passing.static.check.mjs', { stdio: 'pipe' }), 0)
    assert.notEqual(runStaticRule(root, 'failing.static.check.mjs', { stdio: 'pipe' }), 0)
    assert.deepEqual(
      runStaticRules(root, ['passing.static.check.mjs', 'failing.static.check.mjs'], {
        stdio: 'pipe'
      }),
      ['STATIC_RULE_FAILED failing.static.check.mjs exit=1']
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
