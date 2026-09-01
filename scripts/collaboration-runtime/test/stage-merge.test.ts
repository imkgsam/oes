import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { objectFingerprint } from '../src/canonical.ts'
import { createTechnicalRevision, planStageMerge } from '../src/stage-merge.ts'
import type { CommandRunner } from '../src/github-adapter.ts'
import { validateJsonSchema } from '../src/schema-validation.ts'
import type { StageMergeAuthorization, StageMergeItemResult } from '../src/types.ts'

/** Creates one complete two-item immutable Stage merge card. */
function card(): StageMergeAuthorization {
  const digestCharacters = ['5', '6', '7', '8', '9', 'a', 'b', 'c']
  const items = ['alpha', 'beta'].map((featureKey, index) => ({
    order: index + 1,
    featureKey,
    ownerTaskId: `/root/sl/fl-${featureKey}`,
    pullRequestNumber: 100 + index,
    integrationBase: `${index + 1}`.repeat(40),
    candidateSha: `${index + 3}`.repeat(40),
    patchFingerprint: digestCharacters[index].repeat(64),
    contentFingerprint: digestCharacters[index + 2].repeat(64),
    scopeFingerprint: digestCharacters[index + 4].repeat(64),
    riskFingerprint: digestCharacters[index + 6].repeat(64),
    requiredChecks: ['Baseline Checks'] as ['Baseline Checks'],
    featureRi: 'PASSED' as const
  }))
  const value: StageMergeAuthorization = {
    schemaVersion: 1,
    kind: 'OES_STAGE_MERGE_AUTHORIZATION',
    authorizationFingerprint: '',
    status: 'ISSUED',
    expectedState: 'STAGE_MERGE_AUTHORIZED',
    stateVersion: 1,
    stageKey: 'stage-one',
    stageOwnerTaskId: '/root/sl',
    transitionId: 'stage:merge:1',
    confirmationFingerprint: 'a'.repeat(64),
    stageScopeFingerprint: 'b'.repeat(64),
    stageRiskFingerprint: 'c'.repeat(64),
    orderedSetFingerprint: objectFingerprint(
      items as unknown as Record<string, unknown>,
      '__none__'
    ),
    stageRi: 'PASSED',
    stopPoint: 'STOP_SAME_STAGE_SUFFIX_ON_FAILURE',
    items
  }
  value.authorizationFingerprint = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  return value
}

/** Creates one exact terminal result for a card item. */
function merged(value: StageMergeAuthorization, index: number): StageMergeItemResult {
  const item = value.items[index]
  return {
    order: item.order,
    featureKey: item.featureKey,
    candidateSha: item.candidateSha,
    effectiveHeadSha: item.candidateSha,
    technicalRevisionFingerprint: null,
    state: 'MERGED_VERIFIED',
    acceptedMainSha: `${index + 7}`.repeat(40),
    mergeSha: `${index + 7}`.repeat(40),
    failureCode: null
  }
}

test('Stage merge admits one item at a time and completes only the full ordered set', () => {
  const value = card()
  assert.equal(planStageMerge(value, []).nextItem?.featureKey, 'alpha')
  const afterAlpha = planStageMerge(
    value,
    [merged(value, 0)],
    [],
    '/fixture',
    mergedReadbackRunner(value, '7'.repeat(40))
  )
  assert.equal(afterAlpha.status, 'ADMIT_NEXT')
  assert.deepEqual(afterAlpha.healthyPrefix, ['alpha'])
  assert.equal(afterAlpha.nextItem?.featureKey, 'beta')
  assert.equal(
    planStageMerge(
      value,
      [merged(value, 0), merged(value, 1)],
      [],
      '/fixture',
      mergedReadbackRunner(value, '8'.repeat(40))
    ).status,
    'COMPLETE'
  )
})

test('Stage merge failure preserves the healthy prefix and blocks the same-Stage suffix', () => {
  const value = card()
  const failed: StageMergeItemResult = {
    order: 2,
    featureKey: 'beta',
    candidateSha: value.items[1].candidateSha,
    effectiveHeadSha: value.items[1].candidateSha,
    technicalRevisionFingerprint: null,
    state: 'FAILED',
    acceptedMainSha: value.items[0].candidateSha,
    mergeSha: null,
    failureCode: 'BASELINE_CHECKS_FAILED'
  }
  const plan = planStageMerge(
    value,
    [merged(value, 0), failed],
    [],
    '/fixture',
    mergedReadbackRunner(value, '7'.repeat(40))
  )
  assert.equal(plan.status, 'STOPPED_FAILURE')
  assert.deepEqual(plan.healthyPrefix, ['alpha'])
  assert.equal(plan.nextItem, null)
  assert.throws(() => planStageMerge(value, [failed]), /STAGE_MERGE_RESULT_BINDING_MISMATCH/)
})

test('moving-main revision accepts only unchanged card content and ordering', () => {
  const value = card()
  const item = value.items[0]
  const patch = 'exact feature patch\n'
  const content = ':100644 100644 a b M\tfeature.ts\n'
  item.patchFingerprint = crypto.createHash('sha256').update(patch).digest('hex')
  item.contentFingerprint = crypto.createHash('sha256').update(content).digest('hex')
  value.orderedSetFingerprint = objectFingerprint(
    value.items as unknown as Record<string, unknown>,
    '__none__'
  )
  value.authorizationFingerprint = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  const input = {
    featureKey: item.featureKey,
    order: item.order,
    previousBase: item.integrationBase,
    latestMain: 'd'.repeat(40),
    previousHead: item.candidateSha,
    refreshedHead: 'e'.repeat(40),
    scopeFingerprint: item.scopeFingerprint,
    riskFingerprint: item.riskFingerprint,
    orderedSetFingerprint: value.orderedSetFingerprint
  }
  const runner = revisionRunner(input.latestMain, input.refreshedHead, patch, content)
  const revision = createTechnicalRevision(value, input, '/fixture', runner)
  assert.equal(revision.decision, 'TECHNICALLY_EQUIVALENT')
  const revisedResult: StageMergeItemResult = {
    ...merged(value, 0),
    effectiveHeadSha: input.refreshedHead,
    technicalRevisionFingerprint: revision.revisionFingerprint
  }
  const admissionRunner = revisedMergedReadbackRunner(value, input, patch, content, '7'.repeat(40))
  assert.equal(
    planStageMerge(value, [revisedResult], [revision], '/fixture', admissionRunner).nextItem
      ?.featureKey,
    'beta'
  )
  assert.throws(
    () =>
      createTechnicalRevision(
        value,
        { ...input, scopeFingerprint: 'f'.repeat(64) },
        '/fixture',
        runner
      ),
    /STAGE_MERGE_BUSINESS_CONTENT_CHANGED/
  )
  assert.throws(
    () => planStageMerge(value, [{ ...revisedResult, technicalRevisionFingerprint: null }]),
    /REVISION_REQUIRED/
  )
})

test('Stage merge readback binds every first parent to the authorized ordered history', () => {
  const value = card()
  const wrongOrder = mergedReadbackRunner(
    value,
    '8'.repeat(40),
    new Map(),
    new Map([
      ['alpha', '8'.repeat(40)],
      ['beta', '1'.repeat(40)]
    ])
  )
  assert.throws(
    () => planStageMerge(value, [merged(value, 0), merged(value, 1)], [], '/fixture', wrongOrder),
    /STAGE_MERGE_MERGE_PARENTS_MISMATCH/
  )
})

test('moving-main rejects a refreshed feature head that rewrites previous history', () => {
  const value = card()
  const item = value.items[0]
  const patch = 'exact feature patch\n'
  const content = ':100644 100644 a b M\tfeature.ts\n'
  item.patchFingerprint = crypto.createHash('sha256').update(patch).digest('hex')
  item.contentFingerprint = crypto.createHash('sha256').update(content).digest('hex')
  value.orderedSetFingerprint = objectFingerprint(
    value.items as unknown as Record<string, unknown>,
    '__none__'
  )
  value.authorizationFingerprint = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  const input = {
    featureKey: item.featureKey,
    order: item.order,
    previousBase: item.integrationBase,
    latestMain: 'd'.repeat(40),
    previousHead: item.candidateSha,
    refreshedHead: 'e'.repeat(40),
    scopeFingerprint: item.scopeFingerprint,
    riskFingerprint: item.riskFingerprint,
    orderedSetFingerprint: value.orderedSetFingerprint
  }
  const baseRunner = revisionRunner(input.latestMain, input.refreshedHead, patch, content)
  const rejectingRunner: CommandRunner = {
    run(command, args, cwd) {
      if (
        command === 'git' &&
        args.join(' ') === `merge-base --is-ancestor ${input.previousHead} ${input.refreshedHead}`
      )
        return { stdout: '', stderr: '', exitCode: 1 }
      return baseRunner.run(command, args, cwd)
    }
  }
  assert.throws(
    () => createTechnicalRevision(value, input, '/fixture', rejectingRunner),
    /STAGE_MERGE_REFRESH_NOT_FAST_FORWARD/
  )

  const revision = createTechnicalRevision(value, input, '/fixture', baseRunner)
  const revisedResult: StageMergeItemResult = {
    ...merged(value, 0),
    effectiveHeadSha: input.refreshedHead,
    technicalRevisionFingerprint: revision.revisionFingerprint
  }
  const forgedAdmissionRunner = revisedMergedReadbackRunner(
    value,
    input,
    patch,
    content,
    '7'.repeat(40),
    false
  )
  assert.throws(
    () => planStageMerge(value, [revisedResult], [revision], '/fixture', forgedAdmissionRunner),
    /STAGE_MERGE_REFRESH_NOT_FAST_FORWARD/
  )
})

test('Stage merge rejects unknown result states before they can extend the healthy prefix', () => {
  const value = card()
  const unknown = { ...merged(value, 0), state: 'ANY_UNKNOWN_STATE' }
  assert.throws(
    () => planStageMerge(value, [unknown as unknown as StageMergeItemResult]),
    /STAGE_MERGE_RESULT_BINDING_MISMATCH/
  )
})

test('Stage merge JSON schema and runtime reject incomplete or reordered cards', () => {
  const value = card()
  const schema = JSON.parse(
    readFileSync(
      join(import.meta.dirname, '..', 'schemas', 'stage-merge-authorization.schema.json'),
      'utf8'
    )
  ) as Record<string, unknown>
  assert.doesNotThrow(() => validateJsonSchema(schema, value))
  assert.throws(() => validateJsonSchema(schema, { ...value, stageRi: 'PENDING' }), /const/)
  value.items.reverse()
  assert.throws(() => planStageMerge(value, []), /STAGE_MERGE_ITEM_INVALID|FINGERPRINT/)
})

/** Supplies exact local Git and GitHub readback for the moving-main fixture. */
function revisionRunner(
  latestMain: string,
  refreshedHead: string,
  patch: string,
  content: string
): CommandRunner {
  return {
    run(command, args) {
      if (command === 'git' && args[0] === 'ls-remote')
        return { stdout: `${latestMain}\trefs/heads/main\n`, stderr: '', exitCode: 0 }
      if (command === 'git' && args.join(' ') === 'remote get-url origin')
        return { stdout: 'git@github.com:ORG/REPO.git\n', stderr: '', exitCode: 0 }
      if (command === 'git' && args[0] === 'diff')
        return { stdout: args.includes('--raw') ? content : patch, stderr: '', exitCode: 0 }
      if (command === 'git' && ['cat-file', 'merge-base'].includes(args[0]))
        return { stdout: '', stderr: '', exitCode: 0 }
      if (command === 'gh' && args[1]?.includes('/pulls/'))
        return {
          stdout: JSON.stringify({
            state: 'open',
            draft: false,
            head: { sha: refreshedHead },
            base: { ref: 'main' }
          }),
          stderr: '',
          exitCode: 0
        }
      if (command === 'gh' && args[1]?.includes('/check-runs'))
        return {
          stdout: JSON.stringify({
            check_runs: [
              {
                id: 44,
                name: 'Baseline Checks',
                head_sha: refreshedHead,
                status: 'completed',
                conclusion: 'success'
              }
            ]
          }),
          stderr: '',
          exitCode: 0
        }
      return { stdout: '', stderr: `unexpected ${command} ${args.join(' ')}`, exitCode: 1 }
    }
  }
}

/** Combines immutable Git equivalence facts with the final merged PR/main readback. */
function revisedMergedReadbackRunner(
  value: StageMergeAuthorization,
  input: {
    previousHead: string
    latestMain: string
    refreshedHead: string
  },
  patch: string,
  content: string,
  currentMain: string,
  fastForward = true
): CommandRunner {
  const revision = revisionRunner(input.latestMain, input.refreshedHead, patch, content)
  const merged = mergedReadbackRunner(
    value,
    currentMain,
    new Map([[value.items[0].featureKey, input.refreshedHead]]),
    new Map([[value.items[0].featureKey, input.latestMain]])
  )
  return {
    run(command, args, cwd) {
      if (
        command === 'git' &&
        args.join(' ') ===
          `merge-base --is-ancestor ${input.previousHead} ${input.refreshedHead}` &&
        !fastForward
      )
        return { stdout: '', stderr: '', exitCode: 1 }
      if (command === 'git' && ['cat-file', 'diff', 'merge-base'].includes(args[0]))
        return revision.run(command, args, cwd)
      return merged.run(command, args, cwd)
    }
  }
}

/** Supplies exact merged PR/main/check readback for every completed prefix item. */
function mergedReadbackRunner(
  value: StageMergeAuthorization,
  currentMain: string,
  effectiveHeads: Map<string, string> = new Map(),
  firstParents: Map<string, string> = new Map()
): CommandRunner {
  return {
    run(command, args) {
      if (command === 'git' && args[0] === 'ls-remote')
        return { stdout: `${currentMain}\trefs/heads/main\n`, stderr: '', exitCode: 0 }
      if (command === 'git' && args.join(' ') === 'remote get-url origin')
        return { stdout: 'git@github.com:ORG/REPO.git\n', stderr: '', exitCode: 0 }
      if (command !== 'gh') return { stdout: '', stderr: 'unexpected command', exitCode: 1 }
      const route = args[1] ?? ''
      const item = value.items.find((candidate) =>
        route.includes(`/pulls/${candidate.pullRequestNumber}`)
      )
      if (item) {
        const mergeSha = `${item.order + 6}`.repeat(40)
        return {
          stdout: JSON.stringify({
            merged_at: '2026-09-01T00:00:00Z',
            merge_commit_sha: mergeSha,
            head: { sha: effectiveHeads.get(item.featureKey) ?? item.candidateSha }
          }),
          stderr: '',
          exitCode: 0
        }
      }
      const commitItem = value.items.find((candidate) =>
        route.includes(`/git/commits/${`${candidate.order + 6}`.repeat(40)}`)
      )
      if (commitItem)
        return {
          stdout: JSON.stringify({
            parents: [
              {
                sha:
                  firstParents.get(commitItem.featureKey) ??
                  (commitItem.order === 1
                    ? commitItem.integrationBase
                    : `${commitItem.order + 5}`.repeat(40))
              },
              { sha: effectiveHeads.get(commitItem.featureKey) ?? commitItem.candidateSha }
            ]
          }),
          stderr: '',
          exitCode: 0
        }
      if (route.includes('/compare/'))
        return { stdout: JSON.stringify({ status: 'identical' }), stderr: '', exitCode: 0 }
      if (route.includes('/check-runs')) {
        const headSha = route.split('/commits/')[1].split('/check-runs')[0]
        return {
          stdout: JSON.stringify({
            check_runs: [
              {
                id: 50,
                name: 'Baseline Checks',
                head_sha: headSha,
                status: 'completed',
                conclusion: 'success'
              }
            ]
          }),
          stderr: '',
          exitCode: 0
        }
      }
      return { stdout: '', stderr: `unexpected ${route}`, exitCode: 1 }
    }
  }
}
