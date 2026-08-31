import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  writeFileSync
} from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import {
  assertPathWithin,
  canonicalJson,
  objectFingerprint,
  sha256,
  writeJsonAtomic
} from './canonical.ts'
import { fail } from './errors.ts'
import type { RemoteTrustRoots, TrustedAuthorizationReference } from './types.ts'

export interface LocalCommandResult {
  stdout: string
  stderr: string
  exitCode: number
}

export interface LocalCommandRunner {
  run(command: string, args: string[], cwd: string): LocalCommandResult
}

export interface LocalMainSyncBinding {
  schemaVersion: 1
  kind: 'OES_LOCAL_MAIN_SYNC_BINDING'
  bindingFingerprint: string
  action: 'inspect' | 'sync'
  repositoryRoot: string
  remote: 'origin'
  branch: 'main'
  expectedRemoteUrl: string
  expectedRemoteMainSha: string
  ownerTaskId: string | null
  transitionId: string | null
  singleUseNonce: string | null
  humanConfirmationFingerprint: string | null
  confirmation: TrustedAuthorizationReference | null
}

export interface LocalMainSyncConfirmation {
  schemaVersion: 1
  kind: 'OES_LOCAL_MAIN_SYNC_CONFIRMATION'
  confirmationFingerprint: string
  status: 'ISSUED'
  ownerTaskId: string
  transitionId: string
  action: 'sync'
  repositoryRoot: string
  remote: 'origin'
  branch: 'main'
  expectedRemoteUrl: string
  expectedRemoteMainSha: string
  singleUseNonce: string
}

export interface LocalMainObservation {
  repositoryRoot: string
  branch: string
  clean: boolean
  operationMarkers: string[]
  remoteUrl: string
  localMainSha: string
  remoteMainSha: string
  ahead: number
  behind: number
}

export interface LocalMainInspection {
  status: 'SYNC_ELIGIBLE' | 'ALREADY_SYNCED' | 'PRESERVE_NO_CARD'
  reasons: string[]
  observation: LocalMainObservation
}

export interface LocalMainSyncResult {
  status: 'SYNCED'
  before: LocalMainObservation
  after: LocalMainObservation
}

interface LocalMainSyncCheckpoint {
  schemaVersion: 1
  kind: 'OES_LOCAL_MAIN_SYNC_CHECKPOINT'
  checkpointFingerprint: string
  confirmationFingerprint: string
  ownerTaskId: string
  transitionId: string
  singleUseNonce: string
  stage: 'CLAIMED' | 'STARTED' | 'COMPLETED'
  before: LocalMainObservation | null
  after: LocalMainObservation | null
}

/** Validates that one local-main action remains bound to an exact project root and remote SHA. */
export function validateLocalMainBinding(binding: LocalMainSyncBinding): LocalMainSyncBinding {
  if (!binding || typeof binding !== 'object') fail('LOCAL_MAIN_BINDING_REQUIRED', String(binding))
  if (binding.schemaVersion !== 1 || binding.kind !== 'OES_LOCAL_MAIN_SYNC_BINDING')
    fail('LOCAL_MAIN_BINDING_KIND_INVALID', String(binding.repositoryRoot))
  if (typeof binding.repositoryRoot !== 'string' || !isAbsolute(binding.repositoryRoot))
    fail('LOCAL_MAIN_ROOT_NOT_ABSOLUTE', String(binding.repositoryRoot))
  if (!['inspect', 'sync'].includes(binding.action))
    fail('LOCAL_MAIN_ACTION_INVALID', String(binding.action))
  if (binding.remote !== 'origin' || binding.branch !== 'main')
    fail('LOCAL_MAIN_EXACT_REF_REQUIRED', `${binding.remote}/${binding.branch}`)
  if (typeof binding.expectedRemoteUrl !== 'string' || !binding.expectedRemoteUrl.trim())
    fail('LOCAL_MAIN_REMOTE_URL_REQUIRED', binding.repositoryRoot)
  if (
    typeof binding.expectedRemoteMainSha !== 'string' ||
    !/^[0-9a-f]{40}$/u.test(binding.expectedRemoteMainSha)
  )
    fail('LOCAL_MAIN_REMOTE_SHA_INVALID', String(binding.expectedRemoteMainSha))
  if (
    binding.action === 'sync' &&
    (typeof binding.ownerTaskId !== 'string' ||
      !binding.ownerTaskId.trim() ||
      typeof binding.transitionId !== 'string' ||
      !binding.transitionId.trim() ||
      !/^[0-9a-f]{64}$/u.test(binding.singleUseNonce ?? '') ||
      !/^[0-9a-f]{64}$/u.test(binding.humanConfirmationFingerprint ?? ''))
  )
    fail('LOCAL_MAIN_EXACT_TRANSITION_BINDING_REQUIRED', binding.repositoryRoot)
  if (
    binding.action === 'sync' &&
    !/^[0-9a-f]{64}$/u.test(binding.humanConfirmationFingerprint ?? '')
  )
    fail('LOCAL_MAIN_HUMAN_CONFIRMATION_REQUIRED', binding.repositoryRoot)
  if (
    binding.action === 'sync' &&
    (!binding.confirmation ||
      !isAbsolute(binding.confirmation.path) ||
      !/^[0-9a-f]{64}$/u.test(binding.confirmation.sha256) ||
      binding.confirmation.fingerprint !== binding.humanConfirmationFingerprint)
  )
    fail('LOCAL_MAIN_TRUSTED_CONFIRMATION_REQUIRED', binding.repositoryRoot)
  if (
    binding.action === 'inspect' &&
    (binding.ownerTaskId !== null ||
      binding.transitionId !== null ||
      binding.singleUseNonce !== null ||
      binding.humanConfirmationFingerprint !== null ||
      binding.confirmation !== null)
  )
    fail('LOCAL_MAIN_INSPECTION_MUST_BE_READ_ONLY', binding.repositoryRoot)
  const expected = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  if (expected !== binding.bindingFingerprint)
    fail('LOCAL_MAIN_BINDING_FINGERPRINT_MISMATCH', binding.repositoryRoot)
  return structuredClone(binding)
}

/** Reopens one profile-read-only confirmation and binds it to exact realpath/root/ref/SHA/action. */
function loadTrustedLocalMainConfirmation(
  binding: LocalMainSyncBinding,
  trust: RemoteTrustRoots
): LocalMainSyncConfirmation {
  if (
    trust.profileExpectedState !== 'DELIVERY_ACTIVE' ||
    !isAbsolute(trust.authorizationRoot) ||
    !isAbsolute(trust.admissionRoot)
  )
    fail('LOCAL_MAIN_TRUST_CONTEXT_INVALID', trust.ownerTaskId)
  const reference = binding.confirmation
  if (!reference) fail('LOCAL_MAIN_TRUSTED_CONFIRMATION_REQUIRED', binding.repositoryRoot)
  const referenceExtras = Object.keys(reference).filter(
    (key) => !['path', 'sha256', 'fingerprint'].includes(key)
  )
  if (referenceExtras.length)
    fail('LOCAL_MAIN_CONFIRMATION_REFERENCE_FIELDS_INVALID', referenceExtras.sort().join(','))
  assertPathWithin(trust.authorizationRoot, reference.path)
  assertPathWithin(realpathSync(trust.authorizationRoot), realpathSync(reference.path))
  const bytes = readFileSync(reference.path)
  if (sha256(bytes) !== reference.sha256)
    fail('LOCAL_MAIN_CONFIRMATION_SHA_MISMATCH', reference.path)
  const confirmation = JSON.parse(bytes.toString('utf8')) as LocalMainSyncConfirmation
  const confirmationExtras = Object.keys(confirmation).filter(
    (key) =>
      ![
        'schemaVersion',
        'kind',
        'confirmationFingerprint',
        'status',
        'ownerTaskId',
        'transitionId',
        'action',
        'repositoryRoot',
        'remote',
        'branch',
        'expectedRemoteUrl',
        'expectedRemoteMainSha',
        'singleUseNonce'
      ].includes(key)
  )
  if (confirmationExtras.length)
    fail('LOCAL_MAIN_CONFIRMATION_FIELDS_INVALID', confirmationExtras.sort().join(','))
  if (
    confirmation.schemaVersion !== 1 ||
    confirmation.kind !== 'OES_LOCAL_MAIN_SYNC_CONFIRMATION' ||
    confirmation.status !== 'ISSUED' ||
    confirmation.action !== 'sync' ||
    confirmation.remote !== 'origin' ||
    confirmation.branch !== 'main'
  )
    fail('LOCAL_MAIN_CONFIRMATION_KIND_INVALID', reference.path)
  if (
    !confirmation.ownerTaskId.trim() ||
    !confirmation.transitionId.trim() ||
    !/^[0-9a-f]{64}$/u.test(confirmation.singleUseNonce) ||
    !/^[0-9a-f]{64}$/u.test(confirmation.confirmationFingerprint) ||
    confirmation.ownerTaskId !== trust.ownerTaskId ||
    confirmation.transitionId !== trust.profileTransitionId ||
    confirmation.ownerTaskId !== binding.ownerTaskId ||
    confirmation.transitionId !== binding.transitionId ||
    confirmation.singleUseNonce !== binding.singleUseNonce
  )
    fail('LOCAL_MAIN_CONFIRMATION_TRANSITION_INVALID', reference.path)
  if (
    reference.fingerprint !== confirmation.confirmationFingerprint ||
    binding.humanConfirmationFingerprint !== confirmation.confirmationFingerprint ||
    objectFingerprint(
      confirmation as unknown as Record<string, unknown>,
      'confirmationFingerprint'
    ) !== confirmation.confirmationFingerprint
  )
    fail('LOCAL_MAIN_CONFIRMATION_FINGERPRINT_MISMATCH', reference.path)
  const repositoryRealpath = realpathSync(binding.repositoryRoot)
  if (
    repositoryRealpath !== resolve(binding.repositoryRoot) ||
    confirmation.repositoryRoot !== repositoryRealpath ||
    confirmation.expectedRemoteUrl !== binding.expectedRemoteUrl ||
    confirmation.expectedRemoteMainSha !== binding.expectedRemoteMainSha
  )
    fail('LOCAL_MAIN_CONFIRMATION_BINDING_MISMATCH', binding.repositoryRoot)
  return structuredClone(confirmation)
}

/** Validates one monotonic local-main checkpoint derived from the trusted confirmation. */
function validateLocalMainCheckpoint(
  checkpoint: LocalMainSyncCheckpoint,
  confirmation: LocalMainSyncConfirmation
): LocalMainSyncCheckpoint {
  if (
    !checkpoint ||
    checkpoint.schemaVersion !== 1 ||
    checkpoint.kind !== 'OES_LOCAL_MAIN_SYNC_CHECKPOINT' ||
    !['CLAIMED', 'STARTED', 'COMPLETED'].includes(checkpoint.stage) ||
    checkpoint.confirmationFingerprint !== confirmation.confirmationFingerprint ||
    checkpoint.ownerTaskId !== confirmation.ownerTaskId ||
    checkpoint.transitionId !== confirmation.transitionId ||
    checkpoint.singleUseNonce !== confirmation.singleUseNonce
  )
    fail('LOCAL_MAIN_CHECKPOINT_INVALID', confirmation.confirmationFingerprint)
  const shapeValid =
    (checkpoint.stage === 'CLAIMED' && checkpoint.before === null && checkpoint.after === null) ||
    (checkpoint.stage === 'STARTED' && checkpoint.before !== null && checkpoint.after === null) ||
    (checkpoint.stage === 'COMPLETED' && checkpoint.before !== null && checkpoint.after !== null)
  if (!shapeValid) fail('LOCAL_MAIN_CHECKPOINT_INVALID', confirmation.confirmationFingerprint)
  if (
    objectFingerprint(checkpoint as unknown as Record<string, unknown>, 'checkpointFingerprint') !==
    checkpoint.checkpointFingerprint
  )
    fail('LOCAL_MAIN_CHECKPOINT_FINGERPRINT_MISMATCH', confirmation.confirmationFingerprint)
  return structuredClone(checkpoint)
}

/** Evaluates whether the designated checkout can display a separate ff-only sync card. */
export function evaluateLocalMainObservation(
  observation: LocalMainObservation,
  expectedRemoteMainSha: string,
  expectedRemoteUrl: string
): LocalMainInspection {
  const reasons: string[] = []
  if (observation.branch !== 'main') reasons.push('BRANCH_NOT_MAIN')
  if (!observation.clean) reasons.push('WORKTREE_DIRTY')
  if (observation.operationMarkers.length > 0) reasons.push('GIT_OPERATION_ACTIVE')
  if (observation.remoteUrl !== expectedRemoteUrl) reasons.push('REMOTE_URL_CHANGED')
  if (observation.remoteMainSha !== expectedRemoteMainSha) reasons.push('REMOTE_MAIN_CHANGED')
  if (observation.ahead > 0 && observation.behind > 0) reasons.push('LOCAL_MAIN_DIVERGED')
  else if (observation.ahead > 0) reasons.push('LOCAL_MAIN_AHEAD')
  if (reasons.length > 0)
    return { status: 'PRESERVE_NO_CARD', reasons, observation: structuredClone(observation) }
  if (observation.behind === 0 && observation.localMainSha === observation.remoteMainSha)
    return { status: 'ALREADY_SYNCED', reasons: [], observation: structuredClone(observation) }
  if (observation.ahead === 0 && observation.behind > 0)
    return { status: 'SYNC_ELIGIBLE', reasons: [], observation: structuredClone(observation) }
  return {
    status: 'PRESERVE_NO_CARD',
    reasons: ['FF_ONLY_PATH_UNPROVEN'],
    observation: structuredClone(observation)
  }
}

/** Implements guarded inspection and explicitly confirmed ff-only convergence of local main. */
export class LocalMainController {
  readonly runner: LocalCommandRunner

  constructor(runner: LocalCommandRunner) {
    this.runner = runner
  }

  /** Reads branch, cleanliness, operation state and exact local/remote relation without fetching. */
  inspect(bindingInput: LocalMainSyncBinding): LocalMainInspection {
    const binding = validateLocalMainBinding(bindingInput)
    const observation = this.observe(binding.repositoryRoot)
    return evaluateLocalMainObservation(
      observation,
      binding.expectedRemoteMainSha,
      binding.expectedRemoteUrl
    )
  }

  /** Rechecks, fetches exact origin/main, fast-forwards once, and verifies read-after-write. */
  sync(bindingInput: LocalMainSyncBinding, trust: RemoteTrustRoots): LocalMainSyncResult {
    const binding = validateLocalMainBinding(bindingInput)
    if (binding.action !== 'sync') fail('LOCAL_MAIN_SYNC_ACTION_REQUIRED', binding.repositoryRoot)
    const confirmation = loadTrustedLocalMainConfirmation(binding, trust)
    const checkpointRoot = join(trust.admissionRoot, 'local-main-sync')
    mkdirSync(checkpointRoot, { recursive: true })
    const checkpointIdentity = sha256(
      canonicalJson({
        ownerTaskId: confirmation.ownerTaskId,
        singleUseNonce: confirmation.singleUseNonce
      })
    )
    const checkpointPath = join(checkpointRoot, `${checkpointIdentity}.json`)
    let checkpoint = this.checkpoint(confirmation, 'CLAIMED', null, null)
    let createdClaim = false
    let descriptor: number | null = null
    try {
      descriptor = openSync(checkpointPath, 'wx', 0o600)
      writeFileSync(descriptor, `${canonicalJson(checkpoint)}\n`, 'utf8')
      fsyncSync(descriptor)
      createdClaim = true
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      checkpoint = validateLocalMainCheckpoint(
        JSON.parse(readFileSync(checkpointPath, 'utf8')) as LocalMainSyncCheckpoint,
        confirmation
      )
    } finally {
      if (descriptor !== null) closeSync(descriptor)
    }
    if (!createdClaim && checkpoint.stage === 'CLAIMED')
      fail('LOCAL_MAIN_CHECKPOINT_CLAIM_IN_PROGRESS', confirmation.confirmationFingerprint)
    const before = this.observe(binding.repositoryRoot)
    const beforeDecision = evaluateLocalMainObservation(
      before,
      binding.expectedRemoteMainSha,
      binding.expectedRemoteUrl
    )
    if (!createdClaim) {
      if (checkpoint.stage === 'COMPLETED' && checkpoint.before) {
        if (
          beforeDecision.status !== 'ALREADY_SYNCED' ||
          before.localMainSha !== confirmation.expectedRemoteMainSha
        )
          fail('LOCAL_MAIN_COMPLETED_REPLAY_DRIFT', binding.repositoryRoot)
        return { status: 'SYNCED', before: checkpoint.before, after: before }
      }
      if (
        checkpoint.stage === 'STARTED' &&
        checkpoint.before &&
        beforeDecision.status === 'ALREADY_SYNCED' &&
        before.localMainSha === confirmation.expectedRemoteMainSha
      ) {
        const completed = this.checkpoint(confirmation, 'COMPLETED', checkpoint.before, before)
        writeJsonAtomic(checkpointPath, completed)
        return { status: 'SYNCED', before: checkpoint.before, after: before }
      }
    }
    if (beforeDecision.status !== 'SYNC_ELIGIBLE')
      fail('LOCAL_MAIN_SYNC_PRECONDITION_FAILED', beforeDecision.reasons.join(','))

    if (createdClaim) {
      checkpoint = this.checkpoint(confirmation, 'STARTED', before, null)
      writeJsonAtomic(checkpointPath, checkpoint)
    }

    this.checked(
      'git',
      ['fetch', '--no-tags', binding.remote, binding.branch],
      binding.repositoryRoot
    )
    const refreshed = this.observe(binding.repositoryRoot)
    const refreshedDecision = evaluateLocalMainObservation(
      refreshed,
      binding.expectedRemoteMainSha,
      binding.expectedRemoteUrl
    )
    if (refreshedDecision.status !== 'SYNC_ELIGIBLE')
      fail('LOCAL_MAIN_SYNC_REFRESH_FAILED', refreshedDecision.reasons.join(','))

    this.checked(
      'git',
      ['merge', '--ff-only', `refs/remotes/${binding.remote}/${binding.branch}`],
      binding.repositoryRoot
    )
    const after = this.observe(binding.repositoryRoot)
    const afterDecision = evaluateLocalMainObservation(
      after,
      binding.expectedRemoteMainSha,
      binding.expectedRemoteUrl
    )
    if (
      afterDecision.status !== 'ALREADY_SYNCED' ||
      after.localMainSha !== binding.expectedRemoteMainSha ||
      after.remoteMainSha !== binding.expectedRemoteMainSha
    )
      fail('LOCAL_MAIN_SYNC_READBACK_FAILED', binding.repositoryRoot)
    writeJsonAtomic(checkpointPath, this.checkpoint(confirmation, 'COMPLETED', before, after))
    return { status: 'SYNCED', before, after }
  }

  /** Seals one monotonic local-main checkpoint for response-loss recovery. */
  private checkpoint(
    confirmation: LocalMainSyncConfirmation,
    stage: 'CLAIMED' | 'STARTED' | 'COMPLETED',
    before: LocalMainObservation | null,
    after: LocalMainObservation | null
  ): LocalMainSyncCheckpoint {
    const checkpoint: LocalMainSyncCheckpoint = {
      schemaVersion: 1,
      kind: 'OES_LOCAL_MAIN_SYNC_CHECKPOINT',
      checkpointFingerprint: '',
      confirmationFingerprint: confirmation.confirmationFingerprint,
      ownerTaskId: confirmation.ownerTaskId,
      transitionId: confirmation.transitionId,
      singleUseNonce: confirmation.singleUseNonce,
      stage,
      before: structuredClone(before),
      after: structuredClone(after)
    }
    checkpoint.checkpointFingerprint = objectFingerprint(
      checkpoint as unknown as Record<string, unknown>,
      'checkpointFingerprint'
    )
    return checkpoint
  }

  /** Reads one complete observation from the designated checkout. */
  private observe(repositoryRoot: string): LocalMainObservation {
    const exactRoot = realpathSync(repositoryRoot)
    if (exactRoot !== resolve(repositoryRoot)) fail('LOCAL_MAIN_ROOT_SYMLINK_DRIFT', repositoryRoot)
    const branch = this.checked('git', ['branch', '--show-current'], exactRoot).trim()
    const clean = this.checked('git', ['status', '--porcelain'], exactRoot).trim() === ''
    const remoteUrl = this.checked('git', ['remote', 'get-url', 'origin'], exactRoot).trim()
    const localMainSha = this.checked('git', ['rev-parse', 'HEAD'], exactRoot).trim()
    const remoteMainSha = this.checked(
      'git',
      ['rev-parse', 'refs/remotes/origin/main'],
      exactRoot
    ).trim()
    if (!/^[0-9a-f]{40}$/u.test(localMainSha) || !/^[0-9a-f]{40}$/u.test(remoteMainSha))
      fail('LOCAL_MAIN_OBSERVED_SHA_INVALID', `${localMainSha}:${remoteMainSha}`)
    const relation = this.checked(
      'git',
      ['rev-list', '--left-right', '--count', 'HEAD...refs/remotes/origin/main'],
      exactRoot
    )
      .trim()
      .split(/\s+/u)
      .map(Number)
    if (relation.length !== 2 || relation.some((value) => !Number.isInteger(value) || value < 0))
      fail('LOCAL_MAIN_RELATION_INVALID', relation.join(':'))
    const operationMarkers = [
      'MERGE_HEAD',
      'CHERRY_PICK_HEAD',
      'REVERT_HEAD',
      'BISECT_LOG',
      'rebase-merge',
      'rebase-apply'
    ].filter((marker) => {
      const path = this.checked('git', ['rev-parse', '--git-path', marker], exactRoot).trim()
      return existsSync(isAbsolute(path) ? path : resolve(exactRoot, path))
    })
    return {
      repositoryRoot: exactRoot,
      branch,
      clean,
      operationMarkers,
      remoteUrl,
      localMainSha,
      remoteMainSha,
      ahead: relation[0] as number,
      behind: relation[1] as number
    }
  }

  /** Runs one exact git command and preserves the checkout on failure. */
  private checked(command: string, args: string[], cwd: string): string {
    const result = this.runner.run(command, args, cwd)
    if (result.exitCode !== 0)
      fail(
        'LOCAL_MAIN_COMMAND_FAILED',
        `${command} ${args.join(' ')} [${result.exitCode}] ${result.stderr.trim()}`
      )
    return result.stdout
  }
}
