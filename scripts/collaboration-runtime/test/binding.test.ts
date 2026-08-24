import test from 'node:test'
import assert from 'node:assert/strict'
import { validateRemoteBinding, validateStageCleanupAuthorization } from '../src/binding.ts'
import { objectFingerprint } from '../src/canonical.ts'
import { cleanupAuthorization, remoteBinding } from './helpers.ts'

test('remote binding accepts exact owner-scoped Draft PR publication', () => {
  const binding = remoteBinding()
  assert.equal(validateRemoteBinding(binding).bindingFingerprint, binding.bindingFingerprint)
})

test('remote binding rejects main as a head ref even with a recomputed fingerprint', () => {
  const binding = remoteBinding({ headRef: 'main' })
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  assert.throws(() => validateRemoteBinding(binding), /INVALID_OWNER_REF/)
})

test('merge binding requires exact Human authorization and Merge Commit method', () => {
  const binding = remoteBinding({
    action: 'merge-pr',
    pullRequest: {
      baseRef: 'main',
      draft: false,
      number: 7,
      requiredChecks: ['Baseline Checks'],
      title: 'Runtime',
      body: ''
    }
  })
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  assert.throws(() => validateRemoteBinding(binding), /mergeAuthorizationFingerprint/)
})

test('Stage cleanup authorization fingerprint and packet set are exact', () => {
  const authorization = cleanupAuthorization()
  assert.equal(validateStageCleanupAuthorization(authorization).stageKey, 'stage-1')
  authorization.allowedDeletedFeaturePackets = ['docs/plans/features/alpha.md']
  authorization.authorizationFingerprint = objectFingerprint(
    authorization as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  assert.throws(
    () => validateStageCleanupAuthorization(authorization),
    /CLEANUP_PACKET_SET_MISMATCH/
  )
})

test('self-hashed owner and state changes fail trusted authorization CAS', () => {
  const binding = remoteBinding()
  binding.owner = { role: 'Feature Lead', taskId: '/root/not-current-owner' }
  binding.expectedState = 'UNAUTHORIZED_STATE'
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  assert.throws(() => validateRemoteBinding(binding), /REMOTE_AUTHORIZATION_CAS_MISMATCH/)
})

test('empty Stage cleanup batch is rejected consistently with schema', () => {
  const authorization = cleanupAuthorization()
  authorization.terminalFeatures = []
  authorization.allowedDeletedFeaturePackets = []
  authorization.authorizationFingerprint = objectFingerprint(
    authorization as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  assert.throws(
    () => validateStageCleanupAuthorization(authorization),
    /CLEANUP_TERMINAL_FEATURES_REQUIRED/
  )
})
