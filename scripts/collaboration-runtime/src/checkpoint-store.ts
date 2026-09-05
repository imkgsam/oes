import { existsSync } from 'node:fs'
import { objectFingerprint, readJson, writeJsonAtomic } from './canonical.ts'
import { fail } from './errors.ts'
import {
  REMOTE_PHASES,
  type RemoteCheckpoint,
  type RemoteDriverBinding,
  type RemoteReceipt,
  type RemotePhase,
  type RemoteTruth
} from './types.ts'

/** Persists monotonic remote checkpoints for one exact binding. */
export class RemoteCheckpointStore {
  readonly binding: RemoteDriverBinding

  constructor(binding: RemoteDriverBinding) {
    this.binding = binding
  }

  /** Reads and validates the current checkpoint when present. */
  read(): RemoteCheckpoint | null {
    if (!existsSync(this.binding.checkpointPath)) return null
    const checkpoint = readJson<RemoteCheckpoint>(this.binding.checkpointPath)
    if (checkpoint.kind !== 'OES_REMOTE_DRIVER_CHECKPOINT' || checkpoint.schemaVersion !== 1) {
      fail('INVALID_CHECKPOINT_KIND', this.binding.checkpointPath)
    }
    const exactKeys = [
      'schemaVersion',
      'kind',
      'bindingFingerprint',
      'action',
      'singleUseNonce',
      'phase',
      'receipt',
      'remoteTruthFingerprint',
      'updatedAt'
    ]
    if (Object.keys(checkpoint).some((key) => !exactKeys.includes(key)))
      fail('CHECKPOINT_UNDECLARED_FIELD', this.binding.checkpointPath)
    if (
      checkpoint.bindingFingerprint !== this.binding.bindingFingerprint ||
      checkpoint.action !== this.binding.action ||
      checkpoint.singleUseNonce !== this.binding.singleUseNonce
    ) {
      fail('CHECKPOINT_BINDING_MISMATCH', this.binding.checkpointPath)
    }
    if (!REMOTE_PHASES.includes(checkpoint.phase))
      fail('CHECKPOINT_PHASE_INVALID', String(checkpoint.phase))
    if (!/^[0-9a-f]{64}$/.test(checkpoint.remoteTruthFingerprint))
      fail('CHECKPOINT_TRUTH_FINGERPRINT_INVALID', this.binding.checkpointPath)
    if (checkpoint.phase === 'REMOTE_PREFLIGHT_VERIFIED' && checkpoint.receipt !== null)
      fail('CHECKPOINT_PREMATURE_RECEIPT', this.binding.checkpointPath)
    if (checkpoint.phase !== 'REMOTE_PREFLIGHT_VERIFIED') {
      if (!checkpoint.receipt || checkpoint.receipt.action !== this.binding.action)
        fail('CHECKPOINT_RECEIPT_MISMATCH', this.binding.checkpointPath)
    }
    return checkpoint
  }

  /** Advances exactly one monotonic checkpoint phase with atomic readback. */
  advance(phase: RemotePhase, truth: RemoteTruth, receipt: RemoteReceipt | null): RemoteCheckpoint {
    const current = this.read()
    const nextIndex = REMOTE_PHASES.indexOf(phase)
    const currentIndex = current ? REMOTE_PHASES.indexOf(current.phase) : -1
    if (nextIndex < currentIndex || nextIndex > currentIndex + 1) {
      fail('INVALID_CHECKPOINT_TRANSITION', `${current?.phase ?? 'NONE'} -> ${phase}`)
    }
    if (nextIndex === currentIndex) return current as RemoteCheckpoint
    const checkpoint: RemoteCheckpoint = {
      schemaVersion: 1,
      kind: 'OES_REMOTE_DRIVER_CHECKPOINT',
      bindingFingerprint: this.binding.bindingFingerprint,
      action: this.binding.action,
      singleUseNonce: this.binding.singleUseNonce,
      phase,
      receipt,
      remoteTruthFingerprint: objectFingerprint(
        truth as unknown as Record<string, unknown>,
        '__none__'
      ),
      updatedAt: new Date().toISOString()
    }
    writeJsonAtomic(this.binding.checkpointPath, checkpoint)
    return this.read() as RemoteCheckpoint
  }
}
