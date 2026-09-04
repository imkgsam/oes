import assert from 'node:assert/strict'
import test from 'node:test'
import { buildBufBreakingArgs } from '../proto-breaking.mjs'

test('Buf breaking command binds an immutable commit and contract subdirectory', () => {
  const commit = 'a'.repeat(40)
  assert.deepEqual(buildBufBreakingArgs(commit), [
    'breaking',
    'src/common/src/contracts',
    '--against',
    `.git#ref=${commit},subdir=src/common/src/contracts`
  ])
})

test('Buf breaking command rejects branch names at the immutable command boundary', () => {
  assert.throws(() => buildBufBreakingArgs('origin/main'), /PROTO_BASE_COMMIT_INVALID/u)
})
