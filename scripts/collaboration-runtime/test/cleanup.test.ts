import test from 'node:test'
import assert from 'node:assert/strict'
import {
  planChildSelfCleanup,
  verifyChildCleanupResults,
  verifyCleanupOnlyDeletion
} from '../src/cleanup.ts'
import { cleanupAuthorization } from './helpers.ts'

const key = (kind: string, path: string, sha: string | null) => `${kind}:${path}:${sha ?? 'NONE'}`

test('child cleanup narrows to exact owner resources and preserves SHA mismatch', () => {
  const authorization = cleanupAuthorization()
  const plan = planChildSelfCleanup(authorization, '/root/sl/fl-alpha', [
    {
      kind: 'remote-branch',
      path: 'codex/feature/alpha',
      expectedSha: '1'.repeat(40),
      exists: true,
      clean: true,
      actualSha: '1'.repeat(40)
    },
    {
      kind: 'worktree',
      path: '/tmp/fl-alpha',
      expectedSha: '1'.repeat(40),
      exists: true,
      clean: true,
      actualSha: '9'.repeat(40)
    }
  ])
  assert.deepEqual(
    plan.map((item) => item.decision),
    ['REMOVE', 'PRESERVE_FAILURE']
  )
  assert.throws(
    () =>
      verifyChildCleanupResults(authorization, {
        '/root/sl/fl-alpha': plan,
        '/root/sl/fl-beta': [
          {
            resource: authorization.terminalFeatures[1].resources[0],
            decision: 'ALREADY_ABSENT',
            reason: 'absent'
          }
        ]
      }),
    /STAGE_CLEANUP_PARTIAL_FAILURE/
  )
})

test('verified prior child resource is not repeated during partial retry', () => {
  const authorization = cleanupAuthorization()
  const completed = [key('remote-branch', 'codex/feature/alpha', '1'.repeat(40))]
  const plan = planChildSelfCleanup(authorization, '/root/sl/fl-alpha', [], completed)
  assert.equal(plan[0].decision, 'SKIP_COMPLETED')
  assert.equal(plan[1].decision, 'ALREADY_ABSENT')
  verifyChildCleanupResults(authorization, {
    '/root/sl/fl-alpha': plan,
    '/root/sl/fl-beta': [
      {
        resource: authorization.terminalFeatures[1].resources[0],
        decision: 'ALREADY_ABSENT',
        reason: 'absent'
      }
    ]
  })
})

test('cleanup-only diff must delete exactly the terminal Feature Packets', () => {
  const authorization = cleanupAuthorization()
  verifyCleanupOnlyDeletion(authorization, [
    'docs/plans/features/beta.md',
    'docs/plans/features/alpha.md'
  ])
  assert.throws(
    () =>
      verifyCleanupOnlyDeletion(authorization, [
        'docs/plans/features/alpha.md',
        'docs/governance/codex-execution-model.md'
      ]),
    /CLEANUP_ONLY_DIFF_SCOPE_MISMATCH/
  )
})
