import crypto from 'node:crypto'
import { isAbsolute } from 'node:path'
import { verifyTrustedReference } from './binding.ts'
import { assertPathWithin, canonicalJson, objectFingerprint } from './canonical.ts'
import { fail } from './errors.ts'
import { SpawnCommandRunner, type CommandRunner } from './github-adapter.ts'
import { loadOwnerResourceBindingReference } from './resource-topology.ts'
import type {
  CoordinationDeliveryCandidate,
  CoordinationIntegrationAuthorization,
  CoordinationIntegrationItemResult,
  CoordinationIntegrationPlan,
  CoordinationIntegrationResultSet,
  CoordinationScopedRvResult,
  RemoteTrustRoots,
  TrustedAuthorizationReference
} from './types.ts'

const SHA = /^[0-9a-f]{40}$/
const DIGEST = /^[0-9a-f]{64}$/
const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const AGGREGATE_BRANCH = /^codex\/coordination\/[a-z0-9]+(?:-[a-z0-9]+)*$/
const trustedAuthorizations = new WeakMap<object, string>()
const trustedResultSets = new WeakSet<object>()

/** Reopens one CO integration authorization and every scoped-RV result from the profile trust root. */
export function loadTrustedCoordinationIntegrationAuthorization(
  reference: TrustedAuthorizationReference,
  trust: RemoteTrustRoots
): { authorization: CoordinationIntegrationAuthorization; repositoryRoot: string } {
  const value = validateCoordinationIntegrationAuthorization(
    verifyTrustedReference(
      reference,
      trust.authorizationRoot,
      'authorizationFingerprint'
    ) as unknown as CoordinationIntegrationAuthorization
  )
  if (value.coordinationOwnerTaskId !== trust.ownerTaskId || !trust.ownerResourceBinding)
    fail('COORDINATION_INTEGRATION_PROFILE_OWNER_MISMATCH', value.coordinationKey)
  const ownerBinding = loadOwnerResourceBindingReference(trust.ownerResourceBinding)
  assertPathWithin(ownerBinding.artifactRoot, trust.ownerResourceBinding.path)
  if (
    ownerBinding.ownerTaskId !== value.coordinationOwnerTaskId ||
    ownerBinding.ownerRef !== `refs/heads/${value.aggregateBranch}` ||
    ownerBinding.repositoryRoot !== ownerBinding.ownerClone
  )
    fail('COORDINATION_INTEGRATION_OWNER_RESOURCE_MISMATCH', value.coordinationKey)
  for (const item of value.items) validateScopedRv(item, value, trust)
  const frozen = deepFreeze(value)
  trustedAuthorizations.set(frozen, ownerBinding.ownerClone)
  return { authorization: frozen, repositoryRoot: ownerBinding.ownerClone }
}

/** Reopens the issuer-owned integration result set bound to the exact authorization. */
export function loadTrustedCoordinationIntegrationResults(
  reference: TrustedAuthorizationReference,
  authorization: CoordinationIntegrationAuthorization,
  trust: RemoteTrustRoots
): CoordinationIntegrationItemResult[] {
  if (!trustedAuthorizations.has(authorization))
    fail('COORDINATION_INTEGRATION_TRUSTED_AUTHORIZATION_REQUIRED', authorization.coordinationKey)
  const set = verifyTrustedReference(
    reference,
    trust.authorizationRoot,
    'resultSetFingerprint'
  ) as unknown as CoordinationIntegrationResultSet
  requireExactKeys(
    set,
    [
      'schemaVersion',
      'kind',
      'resultSetFingerprint',
      'authorizationFingerprint',
      'coordinationKey',
      'coordinationOwnerTaskId',
      'transitionId',
      'results'
    ],
    'coordinationIntegrationResultSet'
  )
  if (
    set.schemaVersion !== 2 ||
    set.kind !== 'OES_COORDINATION_INTEGRATION_RESULT_SET' ||
    set.authorizationFingerprint !== authorization.authorizationFingerprint ||
    set.coordinationKey !== authorization.coordinationKey ||
    set.coordinationOwnerTaskId !== authorization.coordinationOwnerTaskId ||
    set.transitionId !== authorization.transitionId ||
    !Array.isArray(set.results)
  )
    fail('COORDINATION_INTEGRATION_RESULT_SET_BINDING_MISMATCH', authorization.coordinationKey)
  set.results.forEach((result, index) => validateResultShape(result, index))
  const frozen = deepFreeze(set.results)
  trustedResultSets.add(frozen)
  return frozen
}

/** Requires a protected scoped-RV record for the exact candidate and content fingerprints. */
function validateScopedRv(
  item: CoordinationDeliveryCandidate,
  authorization: CoordinationIntegrationAuthorization,
  trust: RemoteTrustRoots
): void {
  const rv = verifyTrustedReference(
    item.scopedRv,
    trust.authorizationRoot,
    'resultFingerprint'
  ) as unknown as CoordinationScopedRvResult
  requireExactKeys(
    rv,
    [
      'schemaVersion',
      'kind',
      'resultFingerprint',
      'status',
      'coordinationKey',
      'deliveryKey',
      'deliveryOwnerTaskId',
      'reviewerTaskId',
      'candidateSha',
      'patchFingerprint',
      'contentFingerprint'
    ],
    `coordinationScopedRv.${item.deliveryKey}`
  )
  if (
    rv.schemaVersion !== 2 ||
    rv.kind !== 'OES_COORDINATION_SCOPED_RV_RESULT' ||
    rv.status !== 'PASSED' ||
    !DIGEST.test(rv.resultFingerprint) ||
    rv.coordinationKey !== authorization.coordinationKey ||
    rv.deliveryKey !== item.deliveryKey ||
    rv.deliveryOwnerTaskId !== item.ownerTaskId ||
    rv.reviewerTaskId === item.ownerTaskId ||
    !rv.reviewerTaskId.startsWith(`${item.ownerTaskId}/`) ||
    rv.candidateSha !== item.candidateSha ||
    rv.patchFingerprint !== item.patchFingerprint ||
    rv.contentFingerprint !== item.contentFingerprint
  )
    fail('COORDINATION_SCOPED_RV_BINDING_MISMATCH', item.deliveryKey)
}

/** Deep-freezes trusted integration records so caller mutation drops the trust mark. */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

/** Validates one CO integration authorization and its ordered, RV-approved DO candidates. */
export function validateCoordinationIntegrationAuthorization(
  value: CoordinationIntegrationAuthorization
): CoordinationIntegrationAuthorization {
  requireExactKeys(
    value,
    [
      'schemaVersion',
      'kind',
      'authorizationFingerprint',
      'status',
      'expectedState',
      'stateVersion',
      'coordinationKey',
      'coordinationOwnerTaskId',
      'transitionId',
      'confirmationFingerprint',
      'baseSha',
      'aggregateBranch',
      'prTopology',
      'independentPrExceptionConfirmed',
      'orderedSetFingerprint',
      'items'
    ],
    'coordinationIntegrationAuthorization'
  )
  if (
    value.schemaVersion !== 2 ||
    value.kind !== 'OES_COORDINATION_INTEGRATION_AUTHORIZATION' ||
    value.status !== 'ISSUED' ||
    value.expectedState !== 'COORDINATION_INTEGRATION_AUTHORIZED' ||
    !Number.isSafeInteger(value.stateVersion) ||
    value.stateVersion < 1 ||
    !KEY.test(value.coordinationKey) ||
    !value.coordinationOwnerTaskId ||
    !value.transitionId ||
    !DIGEST.test(value.confirmationFingerprint) ||
    !SHA.test(value.baseSha) ||
    !AGGREGATE_BRANCH.test(value.aggregateBranch) ||
    value.aggregateBranch !== `codex/coordination/${value.coordinationKey}` ||
    !['AGGREGATE', 'INDEPENDENT'].includes(value.prTopology) ||
    !Array.isArray(value.items) ||
    value.items.length < 2
  )
    fail('COORDINATION_INTEGRATION_AUTHORIZATION_INVALID', value.coordinationKey)

  const keys = new Set<string>()
  const owners = new Set<string>()
  value.items.forEach((item, index) => validateItem(item, index, keys, owners, value))
  for (const item of value.items)
    for (const dependency of item.dependencies)
      if (
        !keys.has(dependency) ||
        value.items.findIndex((candidate) => candidate.deliveryKey === dependency) >= item.order
      )
        fail(
          'COORDINATION_INTEGRATION_DEPENDENCY_ORDER_INVALID',
          `${item.deliveryKey}:${dependency}`
        )

  if (value.prTopology === 'INDEPENDENT') {
    if (
      !value.independentPrExceptionConfirmed ||
      value.items.some((item) => !item.independentlyReleasable)
    )
      fail('COORDINATION_INDEPENDENT_PR_EXCEPTION_UNPROVEN', value.coordinationKey)
  } else if (value.independentPrExceptionConfirmed) {
    fail('COORDINATION_UNUSED_INDEPENDENT_PR_CONFIRMATION', value.coordinationKey)
  }

  const expectedSet = objectFingerprint(
    value.items as unknown as Record<string, unknown>,
    '__none__'
  )
  if (value.orderedSetFingerprint !== expectedSet)
    fail('COORDINATION_INTEGRATION_ORDERED_SET_MISMATCH', value.coordinationKey)
  const expected = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  if (value.authorizationFingerprint !== expected)
    fail('COORDINATION_INTEGRATION_AUTHORIZATION_FINGERPRINT_MISMATCH', value.coordinationKey)
  return value
}

/** Validates a candidate as one independently owned delivery with scoped RV evidence. */
function validateItem(
  item: CoordinationDeliveryCandidate,
  index: number,
  keys: Set<string>,
  owners: Set<string>,
  authorization: CoordinationIntegrationAuthorization
): void {
  requireExactKeys(
    item,
    [
      'order',
      'deliveryKey',
      'ownerTaskId',
      'baseSha',
      'candidateSha',
      'patchFingerprint',
      'contentFingerprint',
      'dependencies',
      'scopedRv',
      'independentlyReleasable'
    ],
    `coordinationIntegrationItem.${index}`
  )
  if (
    item.order !== index ||
    !KEY.test(item.deliveryKey) ||
    keys.has(item.deliveryKey) ||
    !item.ownerTaskId ||
    owners.has(item.ownerTaskId) ||
    !SHA.test(item.baseSha) ||
    !SHA.test(item.candidateSha) ||
    !DIGEST.test(item.patchFingerprint) ||
    !DIGEST.test(item.contentFingerprint) ||
    !item.scopedRv ||
    typeof item.scopedRv !== 'object' ||
    Object.keys(item.scopedRv).sort().join(',') !== 'fingerprint,path,sha256' ||
    !isAbsolute(item.scopedRv.path) ||
    !DIGEST.test(item.scopedRv.sha256) ||
    !DIGEST.test(item.scopedRv.fingerprint) ||
    typeof item.independentlyReleasable !== 'boolean' ||
    !Array.isArray(item.dependencies) ||
    new Set(item.dependencies).size !== item.dependencies.length ||
    item.dependencies.some((dependency) => !KEY.test(dependency))
  )
    fail('COORDINATION_INTEGRATION_ITEM_INVALID', `${index}:${item.deliveryKey}`)
  if (item.baseSha !== authorization.baseSha)
    fail('COORDINATION_INTEGRATION_BASE_MISMATCH', item.deliveryKey)
  keys.add(item.deliveryKey)
  owners.add(item.ownerTaskId)
}

/** Validates the exact wire shape of one protected integration result. */
function validateResultShape(value: CoordinationIntegrationItemResult, index: number): void {
  requireExactKeys(
    value,
    ['order', 'deliveryKey', 'candidateSha', 'state', 'integratedSha', 'failureCode'],
    `coordinationIntegrationResult.${index}`
  )
  if (
    !Number.isSafeInteger(value.order) ||
    value.order < 0 ||
    !KEY.test(value.deliveryKey) ||
    !SHA.test(value.candidateSha) ||
    !['PENDING', 'FAILED', 'INTEGRATED_VERIFIED'].includes(value.state) ||
    (value.integratedSha !== null && !SHA.test(value.integratedSha)) ||
    (value.failureCode !== null && !value.failureCode)
  )
    fail('COORDINATION_INTEGRATION_RESULT_INVALID', `${index}:${value.deliveryKey}`)
}

/** Selects one next DO candidate for CO integration and never creates or merges a pull request. */
export function planCoordinationIntegration(
  authorizationInput: CoordinationIntegrationAuthorization,
  results: CoordinationIntegrationItemResult[],
  repositoryRoot: string,
  runner: CommandRunner = new SpawnCommandRunner()
): CoordinationIntegrationPlan {
  const authorization = validateCoordinationIntegrationAuthorization(authorizationInput)
  if (
    trustedAuthorizations.get(authorizationInput) !== repositoryRoot ||
    !trustedResultSets.has(results)
  )
    fail('COORDINATION_INTEGRATION_TRUSTED_INPUT_REQUIRED', authorization.coordinationKey)
  for (const item of authorization.items) verifyCandidateGit(item, repositoryRoot, runner)
  if (!Array.isArray(results) || results.length > authorization.items.length)
    fail('COORDINATION_INTEGRATION_RESULTS_INVALID', authorization.coordinationKey)
  const integratedPrefix: string[] = []
  let failure: CoordinationIntegrationItemResult | null = null
  let aggregateTip = authorization.baseSha
  for (let index = 0; index < results.length; index += 1) {
    const result = results[index]
    validateResultShape(result, index)
    const item = authorization.items[index]
    if (
      result.order !== item.order ||
      result.deliveryKey !== item.deliveryKey ||
      result.candidateSha !== item.candidateSha ||
      !['PENDING', 'FAILED', 'INTEGRATED_VERIFIED'].includes(result.state)
    )
      fail('COORDINATION_INTEGRATION_RESULT_BINDING_MISMATCH', item.deliveryKey)
    if (failure) fail('COORDINATION_INTEGRATION_RESULT_AFTER_FAILURE', item.deliveryKey)
    if (result.state === 'PENDING') {
      if (
        index !== results.length - 1 ||
        result.integratedSha !== null ||
        result.failureCode !== null
      )
        fail('COORDINATION_INTEGRATION_PENDING_RESULT_INVALID', item.deliveryKey)
      break
    }
    if (result.state === 'FAILED') {
      if (result.integratedSha !== null || !result.failureCode)
        fail('COORDINATION_INTEGRATION_FAILED_RESULT_INVALID', item.deliveryKey)
      failure = result
      break
    }
    if (!result.integratedSha || !SHA.test(result.integratedSha) || result.failureCode !== null)
      fail('COORDINATION_INTEGRATION_VERIFIED_RESULT_INVALID', item.deliveryKey)
    verifyIntegratedResult(
      authorization,
      item,
      result.integratedSha,
      aggregateTip,
      repositoryRoot,
      runner
    )
    aggregateTip = result.integratedSha
    integratedPrefix.push(item.deliveryKey)
  }
  if (authorization.prTopology === 'AGGREGATE' && integratedPrefix.length) {
    const branchTip = checked(
      runner,
      'git',
      ['rev-parse', `refs/heads/${authorization.aggregateBranch}`],
      repositoryRoot
    ).trim()
    if (branchTip !== aggregateTip)
      fail('COORDINATION_INTEGRATION_AGGREGATE_REF_MISMATCH', authorization.aggregateBranch)
  }
  if (failure)
    return {
      status: 'STOPPED_FAILURE',
      integratedPrefix,
      nextItem: null,
      blockedSuffix: authorization.items.slice(failure.order + 1).map((item) => item.deliveryKey),
      aggregateBranch: authorization.aggregateBranch,
      pullRequestCount: authorization.prTopology === 'AGGREGATE' ? 1 : authorization.items.length,
      failure
    }
  const next = authorization.items[integratedPrefix.length] ?? null
  if (next)
    return {
      status: 'INTEGRATE_NEXT',
      integratedPrefix,
      nextItem: next,
      blockedSuffix: authorization.items.slice(next.order + 1).map((item) => item.deliveryKey),
      aggregateBranch: authorization.aggregateBranch,
      pullRequestCount: authorization.prTopology === 'AGGREGATE' ? 1 : authorization.items.length,
      failure: null
    }
  return {
    status:
      authorization.prTopology === 'AGGREGATE'
        ? 'AGGREGATE_CANDIDATE_READY'
        : 'INDEPENDENT_PRS_READY',
    integratedPrefix,
    nextItem: null,
    blockedSuffix: [],
    aggregateBranch: authorization.aggregateBranch,
    pullRequestCount: authorization.prTopology === 'AGGREGATE' ? 1 : authorization.items.length,
    failure: null
  }
}

/** Recomputes the exact candidate patch and content fingerprints from Git. */
function verifyCandidateGit(
  item: CoordinationDeliveryCandidate,
  repositoryRoot: string,
  runner: CommandRunner
): void {
  if (item.baseSha === item.candidateSha)
    fail('COORDINATION_INTEGRATION_EMPTY_CANDIDATE', item.deliveryKey)
  checked(runner, 'git', ['cat-file', '-e', `${item.baseSha}^{commit}`], repositoryRoot)
  checked(runner, 'git', ['cat-file', '-e', `${item.candidateSha}^{commit}`], repositoryRoot)
  checked(
    runner,
    'git',
    ['merge-base', '--is-ancestor', item.baseSha, item.candidateSha],
    repositoryRoot
  )
  const patch = gitDiffFingerprint(repositoryRoot, item.baseSha, item.candidateSha, true, runner)
  const content = gitDiffFingerprint(repositoryRoot, item.baseSha, item.candidateSha, false, runner)
  if (patch !== item.patchFingerprint || content !== item.contentFingerprint)
    fail('COORDINATION_INTEGRATION_CANDIDATE_FINGERPRINT_MISMATCH', item.deliveryKey)
}

/** Re-reads the exact aggregate merge commit or independent candidate before readiness. */
function verifyIntegratedResult(
  authorization: CoordinationIntegrationAuthorization,
  item: CoordinationDeliveryCandidate,
  integratedSha: string,
  previousTip: string,
  repositoryRoot: string,
  runner: CommandRunner
): void {
  checked(runner, 'git', ['cat-file', '-e', `${integratedSha}^{commit}`], repositoryRoot)
  if (authorization.prTopology === 'INDEPENDENT') {
    if (integratedSha !== item.candidateSha)
      fail('COORDINATION_INTEGRATION_INDEPENDENT_HEAD_MISMATCH', item.deliveryKey)
    return
  }
  const parts = checked(
    runner,
    'git',
    ['rev-list', '--parents', '-n', '1', integratedSha],
    repositoryRoot
  )
    .trim()
    .split(/\s+/)
  if (
    parts.length !== 3 ||
    parts[0] !== integratedSha ||
    parts[1] !== previousTip ||
    parts[2] !== item.candidateSha
  )
    fail('COORDINATION_INTEGRATION_MERGE_CHAIN_MISMATCH', item.deliveryKey)
}

/** Hashes the exact Git patch or changed-path/blob inventory for one DO candidate. */
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
  return crypto.createHash('sha256').update(checked(runner, 'git', args, repositoryRoot)).digest('hex')
}

/** Executes one read-only Git proof command and fails closed on any nonzero status. */
function checked(
  runner: CommandRunner,
  command: string,
  args: string[],
  cwd: string
): string {
  const result = runner.run(command, args, cwd)
  if (result.exitCode !== 0)
    fail('COORDINATION_INTEGRATION_GIT_READBACK_FAILED', `${command} ${args.join(' ')}`)
  return result.stdout
}

/** Returns the stable ordered-set fingerprint used when issuing the CO authorization. */
export function coordinationOrderedSetFingerprint(items: CoordinationDeliveryCandidate[]): string {
  return objectFingerprint(JSON.parse(canonicalJson(items)) as Record<string, unknown>, '__none__')
}

/** Requires an object to contain exactly the declared integration fields. */
function requireExactKeys(value: unknown, allowed: string[], field: string): void {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    fail('COORDINATION_INTEGRATION_OBJECT_INVALID', field)
  if (canonicalJson(Object.keys(value).sort()) !== canonicalJson([...allowed].sort()))
    fail('COORDINATION_INTEGRATION_OBJECT_SHAPE_INVALID', field)
}
