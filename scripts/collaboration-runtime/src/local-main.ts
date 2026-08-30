import { existsSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { objectFingerprint } from './canonical.ts'
import { fail } from './errors.ts'

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
  humanConfirmationFingerprint: string | null
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
    !/^[0-9a-f]{64}$/u.test(binding.humanConfirmationFingerprint ?? '')
  )
    fail('LOCAL_MAIN_HUMAN_CONFIRMATION_REQUIRED', binding.repositoryRoot)
  if (binding.action === 'inspect' && binding.humanConfirmationFingerprint !== null)
    fail('LOCAL_MAIN_INSPECTION_MUST_BE_READ_ONLY', binding.repositoryRoot)
  const expected = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  if (expected !== binding.bindingFingerprint)
    fail('LOCAL_MAIN_BINDING_FINGERPRINT_MISMATCH', binding.repositoryRoot)
  return structuredClone(binding)
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
  sync(bindingInput: LocalMainSyncBinding): LocalMainSyncResult {
    const binding = validateLocalMainBinding(bindingInput)
    if (binding.action !== 'sync') fail('LOCAL_MAIN_SYNC_ACTION_REQUIRED', binding.repositoryRoot)
    const before = this.observe(binding.repositoryRoot)
    const beforeDecision = evaluateLocalMainObservation(
      before,
      binding.expectedRemoteMainSha,
      binding.expectedRemoteUrl
    )
    if (beforeDecision.status !== 'SYNC_ELIGIBLE')
      fail('LOCAL_MAIN_SYNC_PRECONDITION_FAILED', beforeDecision.reasons.join(','))

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
    return { status: 'SYNCED', before, after }
  }

  /** Reads one complete observation from the designated checkout. */
  private observe(repositoryRoot: string): LocalMainObservation {
    const exactRoot = resolve(repositoryRoot)
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
