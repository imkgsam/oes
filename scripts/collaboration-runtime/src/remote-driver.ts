import { existsSync } from 'node:fs'
import { RemoteCheckpointStore } from './checkpoint-store.ts'
import { SerialAdmissionLock } from './admission.ts'
import { loadRemoteBinding, validateRemoteBinding } from './binding.ts'
import { objectFingerprint, readJson, writeJsonAtomic } from './canonical.ts'
import { fail } from './errors.ts'
import type {
  RemoteAction,
  RemoteDriverBinding,
  RemoteDriverResult,
  RemoteReceipt,
  RemoteTruth,
  RemoteVerification
} from './types.ts'

const MUTATING_ACTIONS = new Set<RemoteAction>(['publish-pr', 'merge-pr', 'cleanup'])

export interface RemoteAdapter {
  preflight(binding: RemoteDriverBinding, truth: RemoteTruth): Promise<void>
  readTruth(binding: RemoteDriverBinding): Promise<RemoteTruth>
  mutate(binding: RemoteDriverBinding, truth: RemoteTruth): Promise<RemoteReceipt>
  verify(binding: RemoteDriverBinding, truth: RemoteTruth): Promise<RemoteVerification>
}

export interface RemoteDriverHooks {
  afterRemoteMutation?: (receipt: RemoteReceipt) => Promise<void> | void
}

/** Determines whether remote truth already proves the bound mutation occurred. */
export function remoteMutationSatisfied(binding: RemoteDriverBinding, truth: RemoteTruth): boolean {
  if (binding.action === 'publish-pr') {
    return (
      truth.branchHead === binding.candidateSha &&
      truth.pullRequest?.state === 'OPEN' &&
      truth.pullRequest.draft === true &&
      truth.pullRequest.baseRef === 'main' &&
      truth.pullRequest.headRef === binding.headRef &&
      truth.pullRequest.headSha === binding.candidateSha
    )
  }
  if (binding.action === 'merge-pr') {
    const exactPull = truth.pullRequest?.headSha === binding.candidateSha
    if (binding.admission?.mode === 'merge-queue') {
      return Boolean(
        exactPull && (truth.pullRequest?.state === 'MERGED' || truth.mergeQueueEntry !== null)
      )
    }
    return Boolean(
      exactPull &&
      truth.pullRequest?.state === 'MERGED' &&
      truth.pullRequest.mergeCommitSha !== null
    )
  }
  if (binding.action === 'cleanup') return truth.branchHead === null
  return true
}

/** Builds a non-secret receipt from exact remote truth. */
function receiptFromTruth(
  binding: RemoteDriverBinding,
  truth: RemoteTruth,
  mutationPerformed: boolean,
  recoveredFromRemoteTruth: boolean
): RemoteReceipt {
  return {
    action: binding.action,
    mutationPerformed,
    recoveredFromRemoteTruth,
    branchHead: truth.branchHead,
    pullRequestNumber: truth.pullRequest?.number ?? null,
    mergeCommitSha: truth.pullRequest?.mergeCommitSha ?? null,
    cleanupResources: binding.cleanupResources
  }
}

/** Verifies a persisted terminal result still belongs to the exact binding. */
function readVerifiedResult(binding: RemoteDriverBinding): RemoteDriverResult {
  if (!existsSync(binding.resultPath)) fail('VERIFIED_RESULT_ABSENT', binding.resultPath)
  const result = readJson<RemoteDriverResult>(binding.resultPath)
  if (
    result.kind !== 'OES_REMOTE_DRIVER_RESULT' ||
    result.bindingFingerprint !== binding.bindingFingerprint ||
    result.singleUseNonce !== binding.singleUseNonce ||
    result.status !== 'REMOTE_VERIFIED'
  ) {
    fail('VERIFIED_RESULT_BINDING_MISMATCH', binding.resultPath)
  }
  return result
}

/** Executes one exact remote action with monotonic checkpoints and remote-truth recovery. */
export class RemoteDriver {
  readonly adapter: RemoteAdapter
  readonly hooks: RemoteDriverHooks

  constructor(adapter: RemoteAdapter, hooks: RemoteDriverHooks = {}) {
    this.adapter = adapter
    this.hooks = hooks
  }

  /** Runs or idempotently resumes an exact binding. */
  async run(input: RemoteDriverBinding): Promise<RemoteDriverResult> {
    const binding = validateRemoteBinding(input)
    const admission =
      binding.action === 'merge-pr' && binding.admission?.mode === 'serial-latest-main'
        ? new SerialAdmissionLock(binding)
        : null
    admission?.acquire()
    const result = await this.runBound(binding)
    if (result.status === 'REMOTE_VERIFIED') admission?.release()
    return result
  }

  /** Runs the checkpoint transaction after any required serial admission is held. */
  private async runBound(binding: RemoteDriverBinding): Promise<RemoteDriverResult> {
    const store = new RemoteCheckpointStore(binding)
    let checkpoint = store.read()
    if (checkpoint?.stage === 'REMOTE_VERIFIED') return readVerifiedResult(binding)

    let truth = await this.adapter.readTruth(binding)
    if (!checkpoint) {
      await this.adapter.preflight(binding, truth)
      truth = await this.adapter.readTruth(binding)
      checkpoint = store.advance('REMOTE_PREFLIGHT_VERIFIED', truth, null)
    }

    const mutating = MUTATING_ACTIONS.has(binding.action)
    let receipt = checkpoint.receipt
    if (checkpoint.stage === 'REMOTE_PREFLIGHT_VERIFIED') {
      if (mutating) {
        const alreadySatisfied = remoteMutationSatisfied(binding, truth)
        if (!alreadySatisfied) {
          receipt = await this.adapter.mutate(binding, truth)
          await this.hooks.afterRemoteMutation?.(receipt)
          truth = await this.adapter.readTruth(binding)
          if (!remoteMutationSatisfied(binding, truth))
            fail('REMOTE_MUTATION_NOT_OBSERVED', binding.action)
          receipt = receiptFromTruth(binding, truth, true, false)
        } else {
          receipt = receiptFromTruth(binding, truth, false, true)
        }
      } else {
        receipt = receiptFromTruth(binding, truth, false, false)
      }
      checkpoint = store.advance('REMOTE_MUTATION_RECORDED', truth, receipt)
    } else if (mutating && !remoteMutationSatisfied(binding, truth)) {
      fail('REMOTE_TRUTH_DRIFT_AFTER_MUTATION', binding.action)
    }

    receipt = checkpoint.receipt ?? receipt
    if (!receipt) fail('REMOTE_RECEIPT_ABSENT', binding.action)
    if (checkpoint.stage === 'REMOTE_MUTATION_RECORDED') {
      checkpoint = store.advance('REMOTE_VERIFICATION_PENDING', truth, receipt)
    }

    truth = await this.adapter.readTruth(binding)
    const verification = await this.adapter.verify(binding, truth)
    if (!verification.passed) {
      const pending: RemoteDriverResult = {
        schemaVersion: 1,
        kind: 'OES_REMOTE_DRIVER_RESULT',
        bindingFingerprint: binding.bindingFingerprint,
        action: binding.action,
        ownerTaskId: binding.owner.taskId,
        singleUseNonce: binding.singleUseNonce,
        status: 'REMOTE_VERIFICATION_PENDING',
        stage: 'REMOTE_VERIFICATION_PENDING',
        receipt,
        verification,
        remoteTruth: truth,
        remoteMutation: mutating
      }
      writeJsonAtomic(binding.resultPath, pending)
      return pending
    }

    checkpoint = store.advance('REMOTE_VERIFIED', truth, receipt)
    const result: RemoteDriverResult = {
      schemaVersion: 1,
      kind: 'OES_REMOTE_DRIVER_RESULT',
      bindingFingerprint: binding.bindingFingerprint,
      action: binding.action,
      ownerTaskId: binding.owner.taskId,
      singleUseNonce: binding.singleUseNonce,
      status: 'REMOTE_VERIFIED',
      stage: checkpoint.stage,
      receipt,
      verification,
      remoteTruth: truth,
      remoteMutation: mutating
    }
    writeJsonAtomic(binding.resultPath, result)
    const reread = readJson<RemoteDriverResult>(binding.resultPath)
    if (
      objectFingerprint(reread as unknown as Record<string, unknown>, '__none__') !==
      objectFingerprint(result as unknown as Record<string, unknown>, '__none__')
    ) {
      fail('REMOTE_RESULT_READBACK_MISMATCH', binding.resultPath)
    }
    return result
  }
}

/** Loads and executes one binding through a supplied adapter. */
export async function runRemoteBinding(
  path: string,
  adapter: RemoteAdapter
): Promise<RemoteDriverResult> {
  return new RemoteDriver(adapter).run(loadRemoteBinding(path))
}
