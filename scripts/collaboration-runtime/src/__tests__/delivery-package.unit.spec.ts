import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { canonicalJson, objectFingerprint, sha256 } from '../canonical.ts'
import {
  createAggregateDeliveryPackage,
  createAggregateRvInput,
  createDeliveryPackage,
  loadAggregateDeliveryPackageReference,
  planPackageCleanup,
  renderPackagePrSummary,
  validateAggregateDeliveryPackage,
  validateAggregateRvInput,
  validateDeliveryPackage,
  type AggregateDeliveryPackage,
  type DeliveryPackage
} from '../delivery-package.ts'
import { validateJsonSchema } from '../schema-validation.ts'

const schema = (name: string) =>
  JSON.parse(
    readFileSync(join(import.meta.dirname, '..', '..', 'schemas', name), 'utf8')
  ) as Record<string, unknown>

const reference = (path: string, fill: string) => ({
  path,
  sha256: fill.repeat(64),
  fingerprint: fill.repeat(64)
})
const pending = () => ({ status: 'PENDING' as const, basisFingerprint: null, evidence: null })
const notApplicable = () => ({
  status: 'NOT_APPLICABLE' as const,
  basisFingerprint: null,
  evidence: null
})

/** Writes one self-sealed evidence fixture and returns its immutable reference. */
function persistedEvidence(root: string, name: string) {
  mkdirSync(root, { recursive: true })
  const value = {
    schemaVersion: 2,
    kind: 'OES_PACKAGE_TEST_EVIDENCE',
    evidenceFingerprint: '',
    result: 'PASSED'
  }
  value.evidenceFingerprint = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'evidenceFingerprint'
  )
  const path = join(root, name)
  const bytes = `${canonicalJson(value)}\n`
  writeFileSync(path, bytes, { flag: 'wx' })
  return { path, sha256: sha256(bytes), fingerprint: value.evidenceFingerprint }
}

/** Creates one representative repository DP draft. */
function repositoryDraft(): Parameters<typeof createDeliveryPackage>[0] {
  return {
    packageVersion: 1,
    evidenceGeneration: 1,
    deliveryKey: 'runtime',
    ownerTaskId: '/root/do-runtime',
    executionMode: 'REPOSITORY',
    artifactRoot: '/stable/artifacts/do-runtime',
    packagePath: '/stable/artifacts/do-runtime/delivery-package.json',
    activation: {
      confirmationFingerprint: 'a'.repeat(64),
      objective: 'Deliver the collaboration runtime',
      scope: ['runtime and schemas'],
      nonGoals: ['merge'],
      acceptance: ['focused checks pass'],
      designReferences: [reference('/stable/design/proposal.json', 'b')],
      protectedScope: ['unrelated product code'],
      dependencies: [],
      writeSet: ['scripts/collaboration-runtime/**'],
      risk: { level: 'HIGH', reasons: ['lifecycle contract'] },
      rollback: ['apply the reverse patch']
    },
    execution: {
      slices: [{ sliceId: 'runtime', status: 'COMPLETE' }],
      repository: {
        baseSha: '1'.repeat(40),
        candidateSha: '2'.repeat(40),
        branch: 'codex/delivery/runtime',
        worktree: '/stable/owners/do-runtime/oes',
        pullRequestNumber: 75,
        mergeQueueEntryId: null,
        mergeSha: null
      },
      hostLocal: null,
      selfTest: {
        status: 'PASSED',
        basisFingerprint: null,
        evidence: reference('/stable/artifacts/do-runtime/self-test.json', 'c')
      },
      rv: pending(),
      ci: pending(),
      postCheck: pending(),
      remainingRisk: [],
      cleanup: 'PENDING'
    }
  }
}

/** Converts a sealed DP back to an update draft without computed fields. */
function deliveryUpdate(value: DeliveryPackage): Parameters<typeof createDeliveryPackage>[0] {
  const {
    schemaVersion: _schemaVersion,
    kind: _kind,
    packageFingerprint: _packageFingerprint,
    activationFingerprint: _activationFingerprint,
    evidenceBasisFingerprint: _evidenceBasisFingerprint,
    invalidatedEvidence: _invalidatedEvidence,
    ...draft
  } = structuredClone(value)
  return draft
}

/** Creates one representative repository ADP draft. */
function aggregateDraft(): Parameters<typeof createAggregateDeliveryPackage>[0] {
  return {
    packageVersion: 1,
    evidenceGeneration: 1,
    coordinationKey: 'release',
    ownerTaskId: '/root/co-release',
    executionMode: 'REPOSITORY',
    artifactRoot: '/stable/artifacts/co-release',
    packagePath: '/stable/artifacts/co-release/aggregate-delivery-package.json',
    confirmationFingerprint: 'd'.repeat(64),
    deliveryPackages: ['api', 'web'].map((deliveryKey, index) => ({
      deliveryKey,
      ownerTaskId: `/root/co-release/do-${deliveryKey}`,
      packagePath: `/stable/artifacts/do-${deliveryKey}/delivery-package.json`,
      packageSha256: String(index + 3).repeat(64),
      packageFingerprint: String(index + 5).repeat(64),
      acceptedCandidateSha: String(index + 2).repeat(40),
      acceptedOperationFingerprint: null
    })),
    dependencyOrder: ['api', 'web'],
    integrationContract: ['api before web'],
    aggregateAcceptance: ['combined journey passes'],
    execution: {
      repository: {
        baseSha: '1'.repeat(40),
        aggregateCandidateSha: '9'.repeat(40),
        aggregateBranch: 'codex/coordination/release',
        pullRequestNumber: 76,
        mergeQueueEntryId: null,
        mergeSha: null
      },
      hostLocal: null,
      aggregateRv: pending(),
      aggregateCi: pending(),
      postCheck: pending(),
      remainingRisk: [],
      cleanup: 'PENDING'
    }
  }
}

/** Converts a sealed ADP back to an update draft without computed fields. */
function aggregateUpdate(
  value: AggregateDeliveryPackage
): Parameters<typeof createAggregateDeliveryPackage>[0] {
  const {
    schemaVersion: _schemaVersion,
    kind: _kind,
    packageFingerprint: _packageFingerprint,
    evidenceBasisFingerprint: _evidenceBasisFingerprint,
    invalidatedEvidence: _invalidatedEvidence,
    ...draft
  } = structuredClone(value)
  return draft
}

test('repository DP is stable-artifact state and PR body is only a generated summary', () => {
  const value = validateDeliveryPackage(createDeliveryPackage(repositoryDraft()))
  validateJsonSchema(schema('delivery-package.schema.json'), value)
  assert.equal(value.execution.selfTest.basisFingerprint, value.evidenceBasisFingerprint)
  assert.match(renderPackagePrSummary(value), /Delivery Package summary/)
  assert.doesNotMatch(renderPackagePrSummary(value), /designReferences|evidenceGeneration/)
  assert.deepEqual(planPackageCleanup(value, '/repository/oes'), {
    packagePath: value.packagePath,
    repositoryDiff: [],
    decision: 'REMOVE_EXTERNAL_PACKAGE'
  })
})

test('scope, design, dependency, and candidate changes invalidate bound DP evidence', () => {
  const first = createDeliveryPackage(repositoryDraft())
  const nextDraft = deliveryUpdate(first)
  nextDraft.packageVersion += 1
  nextDraft.activation.confirmationFingerprint = 'f'.repeat(64)
  nextDraft.activation.scope = ['runtime, schemas, and docs']
  nextDraft.activation.designReferences = [reference('/stable/design/revised.json', 'e')]
  nextDraft.activation.dependencies = [
    {
      deliveryKey: 'foundation',
      acceptedCandidateSha: '7'.repeat(40),
      acceptedOperationFingerprint: null
    }
  ]
  if (!nextDraft.execution.repository) throw new Error('repository fixture absent')
  nextDraft.execution.repository.candidateSha = '8'.repeat(40)
  const next = createDeliveryPackage(nextDraft, first)
  assert.deepEqual(next.invalidatedEvidence, [
    'SCOPE_CHANGED',
    'DESIGN_CHANGED',
    'DEPENDENCY_CHANGED',
    'CANDIDATE_CHANGED'
  ])
  assert.equal(next.execution.selfTest.status, 'INVALIDATED')
  assert.equal(next.execution.selfTest.evidence, null)
  const unconfirmed = deliveryUpdate(first)
  unconfirmed.packageVersion += 1
  unconfirmed.activation.scope = ['changed without confirmation']
  assert.throws(
    () => createDeliveryPackage(unconfirmed, first),
    /DELIVERY_PACKAGE_ACTIVATION_RECONFIRMATION_REQUIRED/
  )
})

test('host-local DP uses the same schema without Git candidate, PR, Merge Queue, or remote CI', () => {
  const draft = repositoryDraft()
  draft.executionMode = 'HOST_LOCAL'
  draft.activation.writeSet = []
  draft.activation.dependencies = []
  draft.execution.repository = null
  draft.execution.hostLocal = {
    cohesiveOperation: 'refresh one local fixture database',
    operationFingerprint: '8'.repeat(64),
    repositoryModified: false,
    resourceKinds: ['database']
  }
  draft.execution.ci = notApplicable()
  const value = createDeliveryPackage(draft)
  validateJsonSchema(schema('delivery-package.schema.json'), value)
  assert.equal(value.execution.repository, null)
  assert.equal(value.execution.ci.status, 'NOT_APPLICABLE')
  const invalid = deliveryUpdate(value)
  if (!invalid.execution.hostLocal) throw new Error('host-local fixture absent')
  ;(invalid.execution.hostLocal as { repositoryModified: boolean }).repositoryModified = true
  assert.throws(() => createDeliveryPackage(invalid), /HOST_LOCAL_PACKAGE_OPERATION_INVALID/)
})

test('ADP binds every DP, dependency order, integration contract, accepted candidates, and exact RV input', () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-package-rv-test-'))
  const childReferences = ['api', 'web'].map((deliveryKey, index) => {
    const draft = repositoryDraft()
    draft.deliveryKey = deliveryKey
    draft.ownerTaskId = `/root/co-release/do-${deliveryKey}`
    draft.artifactRoot = join(root, deliveryKey)
    draft.packagePath = join(draft.artifactRoot, 'delivery-package.json')
    draft.execution.selfTest = {
      status: 'PASSED',
      basisFingerprint: null,
      evidence: persistedEvidence(draft.artifactRoot, 'self-test.json')
    }
    if (!draft.execution.repository) throw new Error('repository fixture absent')
    draft.execution.repository.branch = `codex/delivery/${deliveryKey}`
    draft.execution.repository.worktree = join(root, 'owners', deliveryKey, 'oes')
    draft.execution.repository.candidateSha = String(index + 2).repeat(40)
    draft.execution.rv = {
      status: 'PASSED',
      basisFingerprint: null,
      evidence: persistedEvidence(draft.artifactRoot, 'rv.json')
    }
    if (deliveryKey === 'web')
      draft.activation.dependencies = [
        {
          deliveryKey: 'api',
          acceptedCandidateSha: '2'.repeat(40),
          acceptedOperationFingerprint: null
        }
      ]
    const value = createDeliveryPackage(draft)
    const bytes = `${canonicalJson(value)}\n`
    mkdirSync(value.artifactRoot, { recursive: true })
    writeFileSync(value.packagePath, bytes, { flag: 'wx' })
    return {
      deliveryKey,
      ownerTaskId: value.ownerTaskId,
      packagePath: value.packagePath,
      packageSha256: sha256(bytes),
      packageFingerprint: value.packageFingerprint,
      acceptedCandidateSha: value.execution.repository?.candidateSha ?? null,
      acceptedOperationFingerprint: null
    }
  })
  const draft = aggregateDraft()
  draft.artifactRoot = join(root, 'coordination')
  draft.packagePath = join(draft.artifactRoot, 'aggregate-delivery-package.json')
  draft.deliveryPackages = childReferences
  const value = validateAggregateDeliveryPackage(
    createAggregateDeliveryPackage(draft)
  )
  validateJsonSchema(schema('aggregate-delivery-package.schema.json'), value)
  const aggregateBytes = `${canonicalJson(value)}\n`
  mkdirSync(value.artifactRoot, { recursive: true })
  writeFileSync(value.packagePath, aggregateBytes, { flag: 'wx' })
  const aggregateReference = {
    path: value.packagePath,
    sha256: sha256(aggregateBytes),
    fingerprint: value.packageFingerprint
  }
  const trusted = loadAggregateDeliveryPackageReference(aggregateReference)
  assert.throws(
    () =>
      createAggregateRvInput(
        { ...aggregateReference, sha256: 'f'.repeat(64) },
        trusted
      ),
    /AGGREGATE_RV_TRUSTED_PACKAGE_REQUIRED/
  )
  const input = createAggregateRvInput(aggregateReference, trusted)
  validateJsonSchema(schema('aggregate-rv-input.schema.json'), input)
  assert.equal(input.aggregateCandidateSha, '9'.repeat(40))
  assert.doesNotThrow(() => validateAggregateRvInput(input, aggregateReference, trusted))
  const wrongCandidate = { ...input, aggregateCandidateSha: '8'.repeat(40), inputFingerprint: '' }
  wrongCandidate.inputFingerprint = objectFingerprint(
    wrongCandidate as unknown as Record<string, unknown>,
    'inputFingerprint'
  )
  assert.throws(
    () => validateAggregateRvInput(wrongCandidate, aggregateReference, trusted),
    /AGGREGATE_RV_EXACT_INPUT_MISMATCH/
  )

  const changedDraft = aggregateUpdate(value)
  changedDraft.packageVersion += 1
  if (!changedDraft.execution.repository) throw new Error('repository fixture absent')
  changedDraft.execution.repository.aggregateCandidateSha = '8'.repeat(40)
  const changed = createAggregateDeliveryPackage(changedDraft, value)
  assert.equal(changed.execution.aggregateRv.status, 'INVALIDATED')
  assert.throws(
    () => createAggregateRvInput(aggregateReference, changed),
    /AGGREGATE_RV_TRUSTED_PACKAGE_REQUIRED/
  )

  const firstPackage = JSON.parse(
    readFileSync(childReferences[0].packagePath, 'utf8')
  ) as DeliveryPackage
  const selfTestPath = firstPackage.execution.selfTest.evidence?.path
  if (!selfTestPath) throw new Error('self-test fixture reference absent')
  writeFileSync(selfTestPath, '{}\n')
  assert.throws(
    () => loadAggregateDeliveryPackageReference(aggregateReference),
    /PACKAGE_EVIDENCE_REFERENCE_SHA_MISMATCH/
  )
})

test('host-local ADP requires two independent packages plus parallelism or cross-operation integration', () => {
  const draft = aggregateDraft()
  draft.executionMode = 'HOST_LOCAL'
  draft.deliveryPackages = draft.deliveryPackages.map((item, index) => ({
    ...item,
    acceptedCandidateSha: null,
    acceptedOperationFingerprint: String(index + 7).repeat(64)
  }))
  draft.execution.repository = null
  draft.execution.hostLocal = {
    operationSetFingerprint: '9'.repeat(64),
    repositoryModified: false,
    realParallelism: true,
    crossOperationIntegration: false
  }
  draft.execution.aggregateCi = notApplicable()
  const value = createAggregateDeliveryPackage(draft)
  validateJsonSchema(schema('aggregate-delivery-package.schema.json'), value)
  const invalid = aggregateUpdate(value)
  if (!invalid.execution.hostLocal) throw new Error('host-local aggregate fixture absent')
  invalid.execution.hostLocal.realParallelism = false
  assert.throws(
    () => createAggregateDeliveryPackage(invalid),
    /AGGREGATE_HOST_LOCAL_CONTRACT_INVALID/
  )
  const duplicateOwner = aggregateDraft()
  duplicateOwner.deliveryPackages[1].ownerTaskId = duplicateOwner.deliveryPackages[0].ownerTaskId
  assert.throws(
    () => createAggregateDeliveryPackage(duplicateOwner),
    /AGGREGATE_PACKAGE_DP_OWNER_INVALID/
  )
})

test('DP and ADP cleanup reject active package files under the repository tree', () => {
  const draft = repositoryDraft()
  draft.artifactRoot = '/repository/oes/docs/plans/deliveries/runtime'
  draft.packagePath = `${draft.artifactRoot}/delivery-package.json`
  const value = createDeliveryPackage(draft)
  assert.throws(
    () => planPackageCleanup(value, '/repository/oes'),
    /PACKAGE_CLEANUP_REPOSITORY_PATH_FORBIDDEN/
  )
})
