import assert from 'node:assert/strict'
import test from 'node:test'
import { selectLatestFullEvidence } from './schedule-state.mjs'

test('selects only the newest non-expired exact full evidence artifact', () => {
  const oldSha = 'a'.repeat(40)
  const latestSha = 'b'.repeat(40)
  const result = selectLatestFullEvidence([
    { name: `full-evidence-${oldSha}`, created_at: '2026-01-01T00:00:00Z', expired: false },
    { name: `full-evidence-${latestSha}`, created_at: '2026-02-01T00:00:00Z', expired: false },
    { name: `full-evidence-${'c'.repeat(40)}`, created_at: '2026-03-01T00:00:00Z', expired: true },
    { name: 'untrusted-evidence', created_at: '2026-04-01T00:00:00Z', expired: false }
  ])
  assert.equal(result.name, `full-evidence-${latestSha}`)
})
