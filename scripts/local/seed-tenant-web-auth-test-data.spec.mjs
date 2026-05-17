import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('./seed-tenant-web-auth-test-data.mjs', import.meta.url), 'utf8')

test('tenant-web auth seed clears party registration idempotency records before deleting parties', () => {
  const idempotencyCleanupIndex = source.indexOf('partyRegistrationIdempotency.deleteMany')
  const partyDeleteIndex = source.indexOf('party.deleteMany')

  assert.notEqual(idempotencyCleanupIndex, -1)
  assert.notEqual(partyDeleteIndex, -1)
  assert.ok(idempotencyCleanupIndex < partyDeleteIndex)
})

test('tenant-web auth seed maps legacy party fixture names to current legalName schema', () => {
  assert.match(source, /legalName:\s*seed\.legalName \?\? seed\.canonicalName \?\? seed\.displayName/)
})
