import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { validateRemoteBinding } from '../binding.ts'
import { validateJsonSchema } from '../schema-validation.ts'
import { stableOwnerTaskTempLeaf } from '../resource-topology.ts'
import type { OwnerResourceBinding, OwnerResourceReference } from '../resource-topology.types.ts'
import { canonicalJson, objectFingerprint, sha256 } from '../canonical.ts'
import { remoteBinding, remoteTrust } from './helpers.ts'
import type {
  RemoteActionAuthorization,
  RemoteAuthorizationRoot,
  RemoteDriverBinding,
  RemoteTrustRoots
} from '../types.ts'

const schema = (name: string) =>
  JSON.parse(
    readFileSync(join(import.meta.dirname, '..', '..', 'schemas', name), 'utf8')
  ) as Record<string, unknown>

/** Creates one sealed stable owner binding for the V2 owner topology. */
function stableOwnerResourceFixture(): {
  binding: OwnerResourceBinding
  reference: OwnerResourceReference
} {
  const referenceRoot = mkdtempSync(join(tmpdir(), 'oes-stable-owner-binding-test-'))
  const ownerClone = '/Users/fixture/.codex/oes/owners/11111111/oes'
  const artifactRoot = '/Users/fixture/.codex/oes/artifacts/11111111/runtime'
  const binding: OwnerResourceBinding = {
    schemaVersion: 1,
    kind: 'OES_OWNER_RESOURCE_BINDING',
    bindingFingerprint: '',
    resourceTopologyVersion: 'owner-exclusive-v2',
    ownerTaskId: '11111111-1111-4111-8111-111111111111',
    directParentTaskId: '22222222-2222-4222-8222-222222222222',
    transitionId: 'stable-owner:1',
    repositoryRoot: ownerClone,
    repositoryRemoteUrl: 'https://github.com/example/oes.git',
    ownerClone,
    ownerGitDirectory: `${ownerClone}/.git`,
    ownerRef: 'refs/heads/codex/delivery/runtime',
    artifactRoot,
    taskTempRoot: `/private/tmp/${stableOwnerTaskTempLeaf('11111111-1111-4111-8111-111111111111')}`,
    deliveryRecord: 'docs/plans/deliveries/runtime.md',
    deliveryRecordCheckpointPath: `${artifactRoot}/delivery-record.md`,
    currentEvidenceManifestPath: `${artifactRoot}/current-evidence-manifest.json`,
    checkpointBundlePath: `${artifactRoot}/checkpoint-bundle.json`,
    gitBundlePath: `${artifactRoot}/owner.bundle`
  }
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  const path = join(referenceRoot, 'owner-resource-binding.json')
  const bytes = `${canonicalJson(binding)}\n`
  writeFileSync(path, bytes)
  return {
    binding,
    reference: { path, sha256: sha256(bytes), fingerprint: binding.bindingFingerprint }
  }
}

/** Reissues the shared fixture authority with the stable fields selected by one binding. */
function sealStableRemoteBinding(binding: RemoteDriverBinding): RemoteDriverBinding {
  const trust = remoteTrust(binding)
  trust.resourceTopologyVersion = 'owner-exclusive-v2'
  trust.ownerResourceBinding = binding.ownerResourceBinding as OwnerResourceReference
  const authority = JSON.parse(
    readFileSync(binding.authorization.path, 'utf8')
  ) as RemoteActionAuthorization
  const root = JSON.parse(
    readFileSync(authority.rootAuthorization.path, 'utf8')
  ) as RemoteAuthorizationRoot
  root.resourceTopologyVersion = 'owner-exclusive-v2'
  root.ownerResourceBinding = binding.ownerResourceBinding
  root.recordFingerprint = objectFingerprint(
    root as unknown as Record<string, unknown>,
    'recordFingerprint'
  )
  const rootBytes = `${canonicalJson(root)}\n`
  writeFileSync(authority.rootAuthorization.path, rootBytes)
  authority.rootAuthorization = {
    path: authority.rootAuthorization.path,
    sha256: sha256(rootBytes),
    fingerprint: root.recordFingerprint
  }
  authority.resourceTopologyVersion = 'owner-exclusive-v2'
  authority.ownerResourceBinding = binding.ownerResourceBinding
  authority.resourceSetFingerprint = objectFingerprint(
    {
      checkpointPath: binding.checkpointPath,
      resultPath: binding.resultPath,
      invalidationPath: binding.invalidationPath,
      pullRequest: binding.pullRequest,
      admission: binding.admission ?? null,
      expectedMergeSha: binding.expectedMergeSha ?? null,
      resourceTopologyVersion: binding.resourceTopologyVersion,
      ownerResourceBinding: binding.ownerResourceBinding
    },
    '__none__'
  )
  authority.authorizationFingerprint = objectFingerprint(
    authority as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  const authorityBytes = `${canonicalJson(authority)}\n`
  writeFileSync(binding.authorization.path, authorityBytes)
  binding.authorization = {
    path: binding.authorization.path,
    sha256: sha256(authorityBytes),
    fingerprint: authority.authorizationFingerprint
  }
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  return binding
}

test('remote binding accepts exact owner-scoped Draft PR publication', () => {
  const binding = remoteBinding()
  assert.equal(
    validateRemoteBinding(binding, remoteTrust(binding)).bindingFingerprint,
    binding.bindingFingerprint
  )
})

test('V2 remote binding requires the profile-sealed owner and action-specific artifacts', () => {
  const binding = remoteBinding()
  assert.equal(
    validateRemoteBinding(binding, remoteTrust(binding)).resourceTopologyVersion,
    'owner-exclusive-v2'
  )
  binding.checkpointPath = join(binding.artifactRoot, 'checkpoint.json')
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  assert.throws(
    () => validateRemoteBinding(binding, remoteTrust(binding)),
    /REMOTE_STABLE_ACTION_PATH_MISMATCH/
  )
})

test('remote binding rejects main as a head ref even with a recomputed fingerprint', () => {
  const binding = remoteBinding({ headRef: 'main' })
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  assert.throws(
    () => validateRemoteBinding(binding, remoteTrust(binding)),
    /(?:INVALID_OWNER_REF|OWNER_RESOURCE_REF_INVALID)/
  )
})

test('remote binding rejects the Git pseudo-ref HEAD', () => {
  const binding = remoteBinding({ headRef: 'HEAD' })
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  assert.throws(
    () => validateRemoteBinding(binding, remoteTrust(binding)),
    /(?:INVALID_OWNER_REF|OWNER_RESOURCE_REF_INVALID)/
  )
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
  assert.throws(
    () => validateRemoteBinding(binding, remoteTrust(binding)),
    /mergeAuthorizationFingerprint/
  )
})
