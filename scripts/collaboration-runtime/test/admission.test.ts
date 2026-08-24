import test from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { SerialAdmissionLock } from '../src/admission.ts'
import { objectFingerprint } from '../src/canonical.ts'
import { validateRemoteBinding } from '../src/binding.ts'
import { remoteBinding } from './helpers.ts'

/** Creates one exact Human-authorized serial merge binding. */
function mergeBinding() {
  const binding = remoteBinding({
    action: 'merge-pr',
    pullRequest: {
      baseRef: 'main',
      draft: false,
      number: 7,
      requiredChecks: ['Baseline Checks'],
      title: 'Runtime',
      body: ''
    },
    mergeAuthorizationFingerprint: 'f'.repeat(64)
  })
  binding.admission = {
    mode: 'serial-latest-main',
    lockPath: join(binding.artifactRoot, 'latest-main.lock'),
    mergeGroupSha: null
  }
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  return validateRemoteBinding(binding)
}

test('serial latest-main admission allows only the exact binding to resume', () => {
  const first = mergeBinding()
  const lock = new SerialAdmissionLock(first)
  assert.equal(lock.acquire(), 'ACQUIRED')
  assert.equal(new SerialAdmissionLock(first).acquire(), 'RESUMED')

  const contender = { ...first, candidateSha: '9'.repeat(40), singleUseNonce: 'nonce-2' }
  contender.bindingFingerprint = objectFingerprint(
    contender as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  assert.throws(() => new SerialAdmissionLock(contender).acquire(), /SERIAL_ADMISSION_BUSY/)
  lock.release()
  assert.equal(new SerialAdmissionLock(contender).acquire(), 'ACQUIRED')
  new SerialAdmissionLock(contender).release()
})
