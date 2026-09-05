import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { validateJsonSchema } from '../schema-validation.ts'
import { cleanupAuthorization, remoteBinding } from './helpers.ts'

const schema = (name: string) =>
  JSON.parse(
    readFileSync(join(import.meta.dirname, '..', '..', 'schemas', name), 'utf8')
  ) as Record<string, unknown>

test('executable schemas accept representative runtime bindings and coordination authorizations', () => {
  const binding = remoteBinding()
  const authority = JSON.parse(readFileSync(binding.authorization.path, 'utf8')) as {
    rootAuthorization: { path: string }
  }
  const rootAuthorization = JSON.parse(
    readFileSync(authority.rootAuthorization.path, 'utf8')
  ) as Record<string, unknown>
  validateJsonSchema(schema('remote-binding.schema.json'), binding)
  validateJsonSchema(schema('remote-authorization.schema.json'), authority)
  validateJsonSchema(schema('remote-authorization-root.schema.json'), rootAuthorization)
  const coordination = cleanupAuthorization()
  validateJsonSchema(schema('coordination-cleanup-authorization.schema.json'), coordination)
  validateJsonSchema(schema('coordination-child-cleanup-authorization.schema.json'), {
    schemaVersion: 2,
    kind: 'OES_COORDINATION_CHILD_CLEANUP_AUTHORIZATION',
    authorizationFingerprint: 'a'.repeat(64),
    status: 'ISSUED',
    rootAuthorization: {
      path: '/trusted/coordination.json',
      sha256: 'b'.repeat(64),
      fingerprint: coordination.authorizationFingerprint
    },
    expectedState: coordination.expectedState,
    stateVersion: coordination.stateVersion,
    coordinationKey: coordination.coordinationKey,
    coordinationOwnerTaskId: coordination.coordinationOwnerTaskId,
    ownerTaskId: coordination.terminalDeliveries[0].ownerTaskId,
    transitionId: coordination.transitionId,
    confirmationFingerprint: coordination.confirmationFingerprint,
    ownerResourceBinding: coordination.terminalDeliveries[0].ownerResourceBinding,
    resources: coordination.terminalDeliveries[0].resources,
    postcondition: 'CHILD_SELF_CLEANUP'
  })
  validateJsonSchema(schema('coordination-cleanup-current-authorization.schema.json'), {
    schemaVersion: 2,
    kind: 'OES_COORDINATION_CLEANUP_CURRENT_AUTHORIZATION',
    recordFingerprint: 'c'.repeat(64),
    status: 'ACTIVE',
    purpose: 'COORDINATION_CLEANUP_VERIFY',
    rootAuthorization: {
      path: '/trusted/coordination.json',
      sha256: 'b'.repeat(64),
      fingerprint: coordination.authorizationFingerprint
    },
    childAuthorization: null,
    coordinationKey: coordination.coordinationKey,
    coordinationOwnerTaskId: coordination.coordinationOwnerTaskId,
    ownerTaskId: coordination.coordinationOwnerTaskId,
    expectedState: coordination.expectedState,
    stateVersion: coordination.stateVersion,
    transitionId: coordination.transitionId,
    confirmationFingerprint: coordination.confirmationFingerprint,
    postcondition: 'CURRENT_COORDINATION_CLEANUP'
  })
})

test('Proposal history and local-main bindings have executable closed schemas', () => {
  validateJsonSchema(schema('proposal-history.schema.json'), {
    audience: 'PROJECT_ROLE',
    history: [
      {
        schemaVersion: 1,
        kind: 'PROPOSAL_TRANSPORT',
        envelope: {
          schemaVersion: 1,
          kind: 'OES_UD_PROPOSAL',
          proposalId: 'proposal-001',
          proposalFingerprint: 'a'.repeat(64),
          scope: 'Continuous optimization',
          source: { role: 'DA', taskId: '/root/design' },
          returnTaskId: '/root/do',
          supersedesProposalId: null
        }
      }
    ]
  })
  validateJsonSchema(schema('local-main-sync-binding.schema.json'), {
    schemaVersion: 1,
    kind: 'OES_LOCAL_MAIN_SYNC_BINDING',
    bindingFingerprint: 'a'.repeat(64),
    action: 'sync',
    repositoryRoot: '/fixture/oes',
    remote: 'origin',
    branch: 'main',
    expectedRemoteUrl: 'https://github.com/example/oes.git',
    expectedRemoteMainSha: 'b'.repeat(40),
    ownerTaskId: '/root/do',
    transitionId: 'local-main:1',
    singleUseNonce: 'e'.repeat(64),
    humanConfirmationFingerprint: 'c'.repeat(64),
    confirmation: {
      path: '/trusted/local-main-confirmation.json',
      sha256: 'd'.repeat(64),
      fingerprint: 'c'.repeat(64)
    }
  })
  validateJsonSchema(schema('local-main-sync-confirmation.schema.json'), {
    schemaVersion: 1,
    kind: 'OES_LOCAL_MAIN_SYNC_CONFIRMATION',
    confirmationFingerprint: 'c'.repeat(64),
    status: 'ISSUED',
    ownerTaskId: '/root/do',
    transitionId: 'local-main:1',
    action: 'sync',
    repositoryRoot: '/fixture/oes',
    remote: 'origin',
    branch: 'main',
    expectedRemoteUrl: 'https://github.com/example/oes.git',
    expectedRemoteMainSha: 'b'.repeat(40),
    singleUseNonce: 'e'.repeat(64)
  })
  validateJsonSchema(schema('ci-rerun-receipt.schema.json'), {
    schemaVersion: 1,
    kind: 'OES_CI_FAILED_JOB_RERUN_RECEIPT',
    receiptFingerprint: 'a'.repeat(64),
    idempotencyKey: 'b'.repeat(64),
    ownerTaskId: '/root/do',
    transitionId: 'ci:1',
    observationFingerprint: 'd'.repeat(64),
    candidateSha: 'c'.repeat(40),
    workflowRunId: 'workflow-run-42',
    failedJobId: 'failed-job-7',
    action: 'RERUN_FAILED_JOB_ONCE'
  })
  validateJsonSchema(schema('ci-failure-observation.schema.json'), {
    schemaVersion: 1,
    kind: 'OES_CI_FAILED_JOB_OBSERVATION',
    observationFingerprint: 'd'.repeat(64),
    status: 'VERIFIED',
    ownerTaskId: '/root/do',
    transitionId: 'ci:1',
    candidateSha: 'c'.repeat(40),
    workflowRun: {
      id: 'workflow-run-42',
      headSha: 'c'.repeat(40),
      status: 'completed',
      conclusion: 'failure'
    },
    failedJob: {
      id: 'failed-job-7',
      workflowRunId: 'workflow-run-42',
      headSha: 'c'.repeat(40),
      status: 'completed',
      conclusion: 'failure',
      failureKind: 'infrastructure'
    }
  })
})

test('V2 coordination cleanup schemas reject repository-content and protected-branch targets', () => {
  const value = cleanupAuthorization()
  const invalid = structuredClone(value)
  invalid.terminalDeliveries[0].resources[0].path = 'main'
  assert.throws(
    () => validateJsonSchema(schema('coordination-cleanup-authorization.schema.json'), invalid),
    /pattern/
  )
  const extra = structuredClone(value) as unknown as Record<string, unknown>
  extra.cleanupOnlyBranch = 'codex/cleanup/release'
  assert.throws(
    () => validateJsonSchema(schema('coordination-cleanup-authorization.schema.json'), extra),
    /additionalProperties/
  )
})

test('executable schema validation fails closed on unknown keywords', () => {
  assert.throws(
    () => validateJsonSchema({ type: 'object', unknownKeyword: true }, {}),
    /JSON_SCHEMA_KEYWORD_UNSUPPORTED/
  )
})
