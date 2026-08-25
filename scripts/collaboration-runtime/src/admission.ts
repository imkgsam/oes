import {
  closeSync,
  existsSync,
  fsyncSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync
} from 'node:fs'
import { dirname } from 'node:path'
import { mkdirSync } from 'node:fs'
import { canonicalJson, readJson } from './canonical.ts'
import { fail } from './errors.ts'
import type { RemoteDriverBinding } from './types.ts'

interface AdmissionLockRecord {
  schemaVersion: 1
  kind: 'OES_SERIAL_ADMISSION_LOCK'
  bindingFingerprint: string
  singleUseNonce: string
  transitionId: string
  candidateSha: string
}

/** Serializes a latest-main merge admission and lets only the same binding resume a crash. */
export class SerialAdmissionLock {
  readonly binding: RemoteDriverBinding
  readonly path: string

  constructor(binding: RemoteDriverBinding) {
    if (binding.admission?.mode !== 'serial-latest-main' || !binding.admission.lockPath) {
      fail('SERIAL_ADMISSION_BINDING_REQUIRED', binding.action)
    }
    this.binding = binding
    this.path = binding.admission.lockPath
  }

  /** Acquires a new exact lock or resumes the same binding's existing lock. */
  acquire(): 'ACQUIRED' | 'RESUMED' {
    const expected: AdmissionLockRecord = {
      schemaVersion: 1,
      kind: 'OES_SERIAL_ADMISSION_LOCK',
      bindingFingerprint: this.binding.bindingFingerprint,
      singleUseNonce: this.binding.singleUseNonce,
      transitionId: this.binding.transitionId,
      candidateSha: this.binding.candidateSha
    }
    mkdirSync(dirname(this.path), { recursive: true })
    try {
      const descriptor = openSync(this.path, 'wx', 0o600)
      try {
        writeFileSync(descriptor, `${canonicalJson(expected)}\n`, 'utf8')
        fsyncSync(descriptor)
      } finally {
        closeSync(descriptor)
      }
      return 'ACQUIRED'
    } catch (error: unknown) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'EEXIST') throw error
      const current = readJson<AdmissionLockRecord>(this.path)
      if (canonicalJson(current) !== canonicalJson(expected))
        fail('SERIAL_ADMISSION_BUSY', this.path)
      return 'RESUMED'
    }
  }

  /** Releases only the lock still owned by the exact verified binding. */
  release(): void {
    if (!existsSync(this.path)) return
    const current = readJson<AdmissionLockRecord>(this.path)
    if (
      current.bindingFingerprint !== this.binding.bindingFingerprint ||
      current.singleUseNonce !== this.binding.singleUseNonce
    ) {
      fail('SERIAL_ADMISSION_RELEASE_MISMATCH', this.path)
    }
    unlinkSync(this.path)
    if (existsSync(this.path)) fail('SERIAL_ADMISSION_RELEASE_FAILED', this.path)
  }
}
