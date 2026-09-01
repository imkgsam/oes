import crypto from 'node:crypto'
import { objectFingerprint } from './canonical.ts'
import { fail } from './errors.ts'
import { SpawnCommandRunner, type CommandRunner } from './github-adapter.ts'
import type {
  StageMergeAuthorization,
  StageMergeItem,
  StageMergeItemResult,
  StageMergePlan,
  StageMergeTechnicalRevision,
  StageMergeTechnicalRevisionInput
} from './types.ts'

const SHA = /^[0-9a-f]{40}$/
const DIGEST = /^[0-9a-f]{64}$/
const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Validates a complete immutable Stage merge card before any item can be admitted. */
export function validateStageMergeAuthorization(
  value: StageMergeAuthorization
): StageMergeAuthorization {
  if (
    value.schemaVersion !== 1 ||
    value.kind !== 'OES_STAGE_MERGE_AUTHORIZATION' ||
    value.status !== 'ISSUED' ||
    value.expectedState !== 'STAGE_MERGE_AUTHORIZED' ||
    value.stageRi !== 'PASSED' ||
    value.stopPoint !== 'STOP_SAME_STAGE_SUFFIX_ON_FAILURE'
  )
    fail('STAGE_MERGE_CARD_INVALID', value.stageKey)
  if (!KEY.test(value.stageKey) || value.stageOwnerTaskId.length === 0 || value.stateVersion < 1)
    fail('STAGE_MERGE_IDENTITY_INVALID', value.stageKey)
  for (const field of [
    value.authorizationFingerprint,
    value.confirmationFingerprint,
    value.stageScopeFingerprint,
    value.stageRiskFingerprint,
    value.orderedSetFingerprint
  ])
    if (!DIGEST.test(field)) fail('STAGE_MERGE_FINGERPRINT_INVALID', value.stageKey)
  if (!Array.isArray(value.items) || value.items.length === 0)
    fail('STAGE_MERGE_ITEMS_EMPTY', value.stageKey)
  const identities = new Set<string>()
  const prs = new Set<number>()
  const owners = new Set<string>()
  value.items.forEach((item, index) => {
    validateItem(item, index + 1)
    if (
      identities.has(item.featureKey) ||
      prs.has(item.pullRequestNumber) ||
      owners.has(item.ownerTaskId)
    )
      fail('STAGE_MERGE_ITEM_DUPLICATE', item.featureKey)
    identities.add(item.featureKey)
    prs.add(item.pullRequestNumber)
    owners.add(item.ownerTaskId)
  })
  const expectedSet = objectFingerprint(
    value.items.map((item) => ({
      order: item.order,
      featureKey: item.featureKey,
      ownerTaskId: item.ownerTaskId,
      pullRequestNumber: item.pullRequestNumber,
      integrationBase: item.integrationBase,
      candidateSha: item.candidateSha,
      patchFingerprint: item.patchFingerprint,
      contentFingerprint: item.contentFingerprint,
      scopeFingerprint: item.scopeFingerprint,
      riskFingerprint: item.riskFingerprint,
      requiredChecks: item.requiredChecks,
      featureRi: item.featureRi
    })) as unknown as Record<string, unknown>,
    '__none__'
  )
  if (value.orderedSetFingerprint !== expectedSet)
    fail('STAGE_MERGE_ORDERED_SET_MISMATCH', value.stageKey)
  const expectedAuthorization = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  if (value.authorizationFingerprint !== expectedAuthorization)
    fail('STAGE_MERGE_AUTHORIZATION_FINGERPRINT_MISMATCH', value.stageKey)
  return value
}

/** Selects at most one next Stage item and preserves a verified healthy prefix on failure. */
export function planStageMerge(
  authorizationInput: StageMergeAuthorization,
  results: StageMergeItemResult[],
  technicalRevisions: StageMergeTechnicalRevision[] = [],
  repositoryRoot?: string,
  runner: CommandRunner = new SpawnCommandRunner()
): StageMergePlan {
  const authorization = validateStageMergeAuthorization(authorizationInput)
  if (!Array.isArray(results)) fail('STAGE_MERGE_RESULTS_INVALID', authorization.stageKey)
  if (results.length > authorization.items.length)
    fail('STAGE_MERGE_RESULT_SET_TOO_LARGE', authorization.stageKey)
  const revisions = validateTechnicalRevisions(authorization, technicalRevisions)
  const healthyPrefix: string[] = []
  let failure: StageMergeItemResult | null = null
  for (let index = 0; index < results.length; index += 1) {
    const result = results[index]
    const item = authorization.items[index]
    validateResult(result, item, revisions, repositoryRoot, runner)
    if (failure) fail('STAGE_MERGE_RESULT_AFTER_FAILURE', result.featureKey)
    if (result.state === 'PENDING') {
      if (index !== results.length - 1) fail('STAGE_MERGE_RESULT_AFTER_PENDING', result.featureKey)
      break
    }
    if (result.state === 'FAILED') {
      failure = result
      break
    }
    healthyPrefix.push(result.featureKey)
  }
  if (failure) {
    return {
      status: 'STOPPED_FAILURE',
      healthyPrefix,
      nextItem: null,
      blockedSuffix: authorization.items.slice(failure.order).map((item) => item.featureKey),
      failure
    }
  }
  const nextIndex = healthyPrefix.length
  if (nextIndex === authorization.items.length)
    return { status: 'COMPLETE', healthyPrefix, nextItem: null, blockedSuffix: [], failure: null }
  return {
    status: 'ADMIT_NEXT',
    healthyPrefix,
    nextItem: authorization.items[nextIndex],
    blockedSuffix: authorization.items.slice(nextIndex + 1).map((item) => item.featureKey),
    failure: null
  }
}

/** Binds harmless moving-main refresh to the original Stage card without changing business content. */
export function createTechnicalRevision(
  authorizationInput: StageMergeAuthorization,
  input: StageMergeTechnicalRevisionInput,
  repositoryRoot: string,
  runner: CommandRunner = new SpawnCommandRunner()
): StageMergeTechnicalRevision {
  const authorization = validateStageMergeAuthorization(authorizationInput)
  const item = authorization.items[input.order - 1]
  if (!item || item.featureKey !== input.featureKey)
    fail('STAGE_MERGE_REVISION_ITEM_MISMATCH', input.featureKey)
  if (
    input.previousBase !== item.integrationBase ||
    input.previousHead !== item.candidateSha ||
    input.latestMain === input.previousBase ||
    input.refreshedHead === input.previousHead ||
    !SHA.test(input.latestMain) ||
    !SHA.test(input.refreshedHead)
  )
    fail('STAGE_MERGE_REVISION_SHA_INVALID', input.featureKey)
  if (
    input.scopeFingerprint !== item.scopeFingerprint ||
    input.riskFingerprint !== item.riskFingerprint ||
    input.orderedSetFingerprint !== authorization.orderedSetFingerprint
  )
    fail('STAGE_MERGE_BUSINESS_CONTENT_CHANGED', input.featureKey)

  const remoteMain = readRemoteMain(repositoryRoot, runner)
  if (remoteMain !== input.latestMain)
    fail('STAGE_MERGE_LATEST_MAIN_READBACK_MISMATCH', input.featureKey)
  const previous = readStageMergeCandidateFingerprints(
    repositoryRoot,
    input.previousBase,
    input.previousHead,
    runner
  )
  const refreshed = readStageMergeCandidateFingerprints(
    repositoryRoot,
    input.latestMain,
    input.refreshedHead,
    runner
  )
  if (
    previous.patchFingerprint !== item.patchFingerprint ||
    previous.patchFingerprint !== refreshed.patchFingerprint ||
    previous.contentFingerprint !== item.contentFingerprint ||
    previous.contentFingerprint !== refreshed.contentFingerprint
  )
    fail('STAGE_MERGE_GIT_PATCH_CHANGED', input.featureKey)

  const pullReadback = readPullRequest(repositoryRoot, item.pullRequestNumber, runner)
  if (
    pullReadback.headSha !== input.refreshedHead ||
    pullReadback.baseRef !== 'main' ||
    pullReadback.state !== 'open' ||
    pullReadback.draft
  )
    fail('STAGE_MERGE_PULL_READBACK_MISMATCH', input.featureKey)
  const baselineCheck = readBaselineCheck(repositoryRoot, input.refreshedHead, runner)
  const revision: StageMergeTechnicalRevision = {
    schemaVersion: 1,
    kind: 'OES_STAGE_MERGE_TECHNICAL_REVISION',
    revisionFingerprint: '',
    stageAuthorizationFingerprint: authorization.authorizationFingerprint,
    ...input,
    patchFingerprint: previous.patchFingerprint,
    contentFingerprint: previous.contentFingerprint,
    pullRequestNumber: item.pullRequestNumber,
    pullRequestReadbackFingerprint: objectFingerprint(pullReadback, '__none__'),
    baselineCheckId: baselineCheck.id,
    decision: 'TECHNICALLY_EQUIVALENT'
  }
  revision.revisionFingerprint = objectFingerprint(
    revision as unknown as Record<string, unknown>,
    'revisionFingerprint'
  )
  return revision
}

/** Reads the candidate fingerprints used when the immutable Stage merge card is issued. */
export function readStageMergeCandidateFingerprints(
  repositoryRoot: string,
  baseSha: string,
  headSha: string,
  runner: CommandRunner = new SpawnCommandRunner()
): { baseSha: string; headSha: string; patchFingerprint: string; contentFingerprint: string } {
  if (!SHA.test(baseSha) || !SHA.test(headSha) || baseSha === headSha)
    fail('STAGE_MERGE_CANDIDATE_SHA_INVALID', headSha)
  for (const sha of [baseSha, headSha])
    checked(runner, 'git', ['cat-file', '-e', `${sha}^{commit}`], repositoryRoot)
  checked(runner, 'git', ['merge-base', '--is-ancestor', baseSha, headSha], repositoryRoot)
  return {
    baseSha,
    headSha,
    patchFingerprint: gitDiffFingerprint(repositoryRoot, baseSha, headSha, true, runner),
    contentFingerprint: gitDiffFingerprint(repositoryRoot, baseSha, headSha, false, runner)
  }
}

/** Validates every prior moving-main revision before it can bind an effective PR head. */
function validateTechnicalRevisions(
  authorization: StageMergeAuthorization,
  revisions: StageMergeTechnicalRevision[]
): Map<string, StageMergeTechnicalRevision> {
  if (!Array.isArray(revisions)) fail('STAGE_MERGE_REVISIONS_INVALID', authorization.stageKey)
  const byFingerprint = new Map<string, StageMergeTechnicalRevision>()
  const byFeature = new Set<string>()
  for (const revision of revisions) {
    const item = authorization.items[revision.order - 1]
    if (
      revision.schemaVersion !== 1 ||
      revision.kind !== 'OES_STAGE_MERGE_TECHNICAL_REVISION' ||
      revision.decision !== 'TECHNICALLY_EQUIVALENT' ||
      revision.stageAuthorizationFingerprint !== authorization.authorizationFingerprint ||
      !item ||
      item.featureKey !== revision.featureKey ||
      item.integrationBase !== revision.previousBase ||
      item.candidateSha !== revision.previousHead ||
      item.patchFingerprint !== revision.patchFingerprint ||
      item.contentFingerprint !== revision.contentFingerprint ||
      item.scopeFingerprint !== revision.scopeFingerprint ||
      item.riskFingerprint !== revision.riskFingerprint ||
      item.pullRequestNumber !== revision.pullRequestNumber ||
      authorization.orderedSetFingerprint !== revision.orderedSetFingerprint ||
      !SHA.test(revision.latestMain) ||
      !SHA.test(revision.refreshedHead) ||
      !DIGEST.test(revision.pullRequestReadbackFingerprint) ||
      !Number.isInteger(revision.baselineCheckId) ||
      revision.baselineCheckId < 1
    )
      fail('STAGE_MERGE_REVISION_INVALID', revision.featureKey)
    const expected = objectFingerprint(
      revision as unknown as Record<string, unknown>,
      'revisionFingerprint'
    )
    if (revision.revisionFingerprint !== expected)
      fail('STAGE_MERGE_REVISION_FINGERPRINT_MISMATCH', revision.featureKey)
    if (byFingerprint.has(revision.revisionFingerprint) || byFeature.has(revision.featureKey))
      fail('STAGE_MERGE_REVISION_DUPLICATE', revision.featureKey)
    byFingerprint.set(revision.revisionFingerprint, revision)
    byFeature.add(revision.featureKey)
  }
  return byFingerprint
}

/** Validates one exact ordered Stage card item. */
function validateItem(item: StageMergeItem, expectedOrder: number): void {
  if (
    item.order !== expectedOrder ||
    !KEY.test(item.featureKey) ||
    item.ownerTaskId.length === 0 ||
    !Number.isInteger(item.pullRequestNumber) ||
    item.pullRequestNumber < 1 ||
    !SHA.test(item.integrationBase) ||
    !SHA.test(item.candidateSha) ||
    item.featureRi !== 'PASSED' ||
    item.requiredChecks.length !== 1 ||
    item.requiredChecks[0] !== 'Baseline Checks'
  )
    fail('STAGE_MERGE_ITEM_INVALID', item.featureKey)
  for (const digest of [
    item.patchFingerprint,
    item.contentFingerprint,
    item.scopeFingerprint,
    item.riskFingerprint
  ])
    if (!DIGEST.test(digest)) fail('STAGE_MERGE_ITEM_FINGERPRINT_INVALID', item.featureKey)
}

/** Validates one result against the same positional card item. */
function validateResult(
  result: StageMergeItemResult,
  item: StageMergeItem,
  revisions: Map<string, StageMergeTechnicalRevision>,
  repositoryRoot: string | undefined,
  runner: CommandRunner
): void {
  if (
    result.order !== item.order ||
    result.featureKey !== item.featureKey ||
    result.candidateSha !== item.candidateSha ||
    !SHA.test(result.effectiveHeadSha) ||
    !['PENDING', 'FAILED', 'MERGED_VERIFIED'].includes(result.state)
  )
    fail('STAGE_MERGE_RESULT_BINDING_MISMATCH', item.featureKey)
  if (result.effectiveHeadSha === item.candidateSha) {
    if (result.technicalRevisionFingerprint !== null)
      fail('STAGE_MERGE_RESULT_REVISION_UNEXPECTED', item.featureKey)
  } else {
    if (!result.technicalRevisionFingerprint)
      fail('STAGE_MERGE_RESULT_REVISION_REQUIRED', item.featureKey)
    const revision = revisions.get(result.technicalRevisionFingerprint)
    if (
      !revision ||
      revision.featureKey !== item.featureKey ||
      revision.refreshedHead !== result.effectiveHeadSha
    )
      fail('STAGE_MERGE_RESULT_REVISION_MISMATCH', item.featureKey)
  }
  if (result.state === 'MERGED_VERIFIED') {
    if (
      !result.mergeSha ||
      !SHA.test(result.mergeSha) ||
      result.acceptedMainSha !== result.mergeSha ||
      result.failureCode !== null
    )
      fail('STAGE_MERGE_VERIFIED_RESULT_INVALID', item.featureKey)
    if (!repositoryRoot) fail('STAGE_MERGE_REMOTE_READBACK_REQUIRED', item.featureKey)
    verifyMergedResultReadback(repositoryRoot, item, result, runner)
  } else if (result.state === 'FAILED') {
    if (
      !result.failureCode ||
      result.mergeSha !== null ||
      (result.acceptedMainSha !== null && !SHA.test(result.acceptedMainSha))
    )
      fail('STAGE_MERGE_FAILED_RESULT_INVALID', item.featureKey)
  } else if (
    result.acceptedMainSha !== null ||
    result.mergeSha !== null ||
    result.failureCode !== null
  ) {
    fail('STAGE_MERGE_PENDING_RESULT_INVALID', item.featureKey)
  }
}

/** Re-reads merged PR, merge parents, main ancestry, and main Baseline Checks. */
function verifyMergedResultReadback(
  repositoryRoot: string,
  item: StageMergeItem,
  result: StageMergeItemResult,
  runner: CommandRunner
): void {
  const slug = readRepositorySlug(repositoryRoot, runner)
  const pull = JSON.parse(
    checked(runner, 'gh', ['api', `repos/${slug}/pulls/${item.pullRequestNumber}`], repositoryRoot)
  ) as Record<string, unknown>
  const head = pull.head as Record<string, unknown> | undefined
  if (
    !pull.merged_at ||
    pull.merge_commit_sha !== result.mergeSha ||
    head?.sha !== result.effectiveHeadSha
  )
    fail('STAGE_MERGE_PULL_MERGE_READBACK_MISMATCH', item.featureKey)
  const commit = JSON.parse(
    checked(runner, 'gh', ['api', `repos/${slug}/git/commits/${result.mergeSha}`], repositoryRoot)
  ) as { parents?: Array<{ sha?: string }> }
  if (
    commit.parents?.length !== 2 ||
    commit.parents[1]?.sha !== result.effectiveHeadSha ||
    !SHA.test(String(commit.parents[0]?.sha ?? ''))
  )
    fail('STAGE_MERGE_MERGE_PARENTS_MISMATCH', item.featureKey)
  const remoteMain = readRemoteMain(repositoryRoot, runner)
  const comparison = JSON.parse(
    checked(
      runner,
      'gh',
      ['api', `repos/${slug}/compare/${result.mergeSha}...${remoteMain}`],
      repositoryRoot
    )
  ) as { status?: string }
  if (!['ahead', 'identical'].includes(String(comparison.status)))
    fail('STAGE_MERGE_ACCEPTED_PREFIX_NOT_ON_MAIN', item.featureKey)
  readBaselineCheck(repositoryRoot, result.mergeSha!, runner)
}

/** Reads the exact current remote main head without trusting a caller-provided SHA. */
function readRemoteMain(repositoryRoot: string, runner: CommandRunner): string {
  const output = checked(
    runner,
    'git',
    ['ls-remote', '--heads', 'origin', 'refs/heads/main'],
    repositoryRoot
  )
    .trim()
    .split(/\s+/)
  if (output.length !== 2 || output[1] !== 'refs/heads/main' || !SHA.test(output[0]))
    fail('STAGE_MERGE_REMOTE_MAIN_INVALID', output.join(' '))
  return output[0]
}

/** Hashes the exact Git patch or changed-path/blob inventory for one candidate range. */
function gitDiffFingerprint(
  repositoryRoot: string,
  base: string,
  head: string,
  patch: boolean,
  runner: CommandRunner
): string {
  const args = patch
    ? ['diff', '--binary', '--full-index', '--no-ext-diff', base, head, '--']
    : ['diff', '--raw', '--full-index', '--no-renames', base, head, '--']
  return crypto
    .createHash('sha256')
    .update(checked(runner, 'git', args, repositoryRoot))
    .digest('hex')
}

/** Reads the exact PR head/base/state used for moving-main admission. */
function readPullRequest(
  repositoryRoot: string,
  pullRequestNumber: number,
  runner: CommandRunner
): Record<string, unknown> & { headSha: string; baseRef: string; state: string; draft: boolean } {
  const slug = readRepositorySlug(repositoryRoot, runner)
  const value = JSON.parse(
    checked(runner, 'gh', ['api', `repos/${slug}/pulls/${pullRequestNumber}`], repositoryRoot)
  ) as Record<string, unknown>
  const head = value.head as Record<string, unknown> | undefined
  const base = value.base as Record<string, unknown> | undefined
  return {
    pullRequestNumber,
    headSha: String(head?.sha ?? ''),
    baseRef: String(base?.ref ?? ''),
    state: String(value.state ?? '').toLowerCase(),
    draft: value.draft === true
  }
}

/** Reads the latest Baseline Checks run for the refreshed head and requires success. */
function readBaselineCheck(
  repositoryRoot: string,
  headSha: string,
  runner: CommandRunner
): { id: number } {
  const slug = readRepositorySlug(repositoryRoot, runner)
  const value = JSON.parse(
    checked(
      runner,
      'gh',
      ['api', `repos/${slug}/commits/${headSha}/check-runs?per_page=100`],
      repositoryRoot
    )
  ) as { check_runs?: Array<Record<string, unknown>> }
  const checks = (value.check_runs ?? [])
    .filter((check) => check.name === 'Baseline Checks' && check.head_sha === headSha)
    .sort((left, right) => Number(right.id) - Number(left.id))
  const latest = checks[0]
  if (
    !latest ||
    latest.status !== 'completed' ||
    latest.conclusion !== 'success' ||
    !Number.isInteger(Number(latest.id)) ||
    Number(latest.id) < 1
  )
    fail('STAGE_MERGE_BASELINE_CHECK_NOT_PASSED', headSha)
  return { id: Number(latest.id) }
}

/** Resolves and validates the exact GitHub repository slug from origin. */
function readRepositorySlug(repositoryRoot: string, runner: CommandRunner): string {
  const remote = checked(runner, 'git', ['remote', 'get-url', 'origin'], repositoryRoot).trim()
  const match = remote.match(/(?:github\.com[/:])([^/]+\/[^/]+?)(?:\.git)?$/)
  if (!match) fail('STAGE_MERGE_REMOTE_SLUG_INVALID', remote)
  return match[1]
}

/** Executes one proof command without a shell and preserves fail-closed exit handling. */
function checked(runner: CommandRunner, command: string, args: string[], cwd: string): string {
  const result = runner.run(command, args, cwd)
  if (result.exitCode !== 0)
    fail('STAGE_MERGE_READBACK_FAILED', `${command} ${args.join(' ')} [${result.exitCode}]`)
  return result.stdout
}
