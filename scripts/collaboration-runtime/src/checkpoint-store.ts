import { existsSync } from 'node:fs'
import { objectFingerprint, readJson, writeJsonAtomic } from './canonical.ts'
import { fail } from './errors.ts'
import {
  REMOTE_STAGES,
  type RemoteCheckpoint,
  type RemoteDriverBinding,
  type RemoteReceipt,
  type RemoteStage,
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
    if (
      checkpoint.bindingFingerprint !== this.binding.bindingFingerprint ||
      checkpoint.action !== this.binding.action ||
      checkpoint.singleUseNonce !== this.binding.singleUseNonce
    ) {
      fail('CHECKPOINT_BINDING_MISMATCH', this.binding.checkpointPath)
    }
    return checkpoint
  }

  /** Advances exactly one monotonic checkpoint stage with atomic readback. */
  advance(stage: RemoteStage, truth: RemoteTruth, receipt: RemoteReceipt | null): RemoteCheckpoint {
    const current = this.read()
    const nextIndex = REMOTE_STAGES.indexOf(stage)
    const currentIndex = current ? REMOTE_STAGES.indexOf(current.stage) : -1
    if (nextIndex < currentIndex || nextIndex > currentIndex + 1) {
      fail('INVALID_CHECKPOINT_TRANSITION', `${current?.stage ?? 'NONE'} -> ${stage}`)
    }
    if (nextIndex === currentIndex) return current as RemoteCheckpoint
    const checkpoint: RemoteCheckpoint = {
      schemaVersion: 1,
      kind: 'OES_REMOTE_DRIVER_CHECKPOINT',
      bindingFingerprint: this.binding.bindingFingerprint,
      action: this.binding.action,
      singleUseNonce: this.binding.singleUseNonce,
      stage,
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
