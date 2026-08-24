import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  classifyCapabilityIssue,
  credentialReferenceKeys,
  defaultDeliveryCapabilities,
  planProfileRepair,
  readApprovalTelemetry,
  runEffectiveProfilePreflight,
  verifyEffectiveProfileReport,
  type PreflightProbeAdapter
} from '../src/profile-preflight.ts'
import type {
  ApprovalTelemetry,
  CapabilityName,
  CapabilityObservation,
  EffectiveProfileReport
} from '../src/types.ts'

const fingerprint = 'a'.repeat(64)

class PassingProbe implements PreflightProbeAdapter {
  async observe(name: CapabilityName): Promise<CapabilityObservation> {
    return { name, command: `probe ${name}`, literalOutput: 'PASS', exitCode: 0, result: 'PASS' }
  }
  async credentialReference(): Promise<EffectiveProfileReport['credentialReference']> {
    return {
      reference: 'git-credential:https://github.com',
      keys: ['username', 'password'],
      secretValuesRecorded: false
    }
  }
  async approvalTelemetry(): Promise<ApprovalTelemetry> {
    return {
      eventSource: '/tmp/rollout.jsonl',
      eventSourceSha256: fingerprint,
      approvalPolicy: 'on-request',
      approvalsReviewer: 'auto_review',
      approvalEventCount: 0,
      normalPermissionPromptCount: 0
    }
  }
}

test('actual probe adapter records and verifies every delivery capability with zero normal prompts', async () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-profile-test-'))
  const report = await runEffectiveProfilePreflight(
    {
      ownerTaskId: '/root/fl',
      transitionId: 'handoff:1',
      expectedState: 'HANDOFF_PENDING',
      declaredCapabilities: defaultDeliveryCapabilities(),
      profile: { name: 'oes-profile', permission: 'oes-owner', sha256: fingerprint },
      resultPath: join(root, 'profile-report.json')
    },
    new PassingProbe()
  )
  assert.equal(report.observations.length, 8)
  assert.equal(verifyEffectiveProfileReport(report).telemetry.normalPermissionPromptCount, 0)
})

test('failure routing distinguishes handoff, active-owner profile defect, and genuine expansion', () => {
  assert.equal(
    classifyCapabilityIssue({
      expectedState: 'HANDOFF_PENDING',
      capabilityDeclared: true,
      operation: 'git',
      literalFailure: 'EPERM'
    }),
    'EXECUTION_ENVIRONMENT_NOT_READY'
  )
  assert.equal(
    classifyCapabilityIssue({
      expectedState: 'DELIVERY_ACTIVE',
      capabilityDeclared: true,
      operation: 'git',
      literalFailure: 'EPERM'
    }),
    'EXECUTION_PROFILE_DEFECT'
  )
  assert.equal(
    classifyCapabilityIssue({
      expectedState: 'DELIVERY_ACTIVE',
      capabilityDeclared: false,
      operation: 'host privilege',
      literalFailure: 'denied'
    }),
    'PERMISSION_EXPANSION_REQUIRED'
  )
})

test('repair plans remain bounded and preserve the active owner', () => {
  const plan = planProfileRepair(
    {
      expectedState: 'DELIVERY_ACTIVE',
      capabilityDeclared: true,
      operation: 'localhost',
      literalFailure: 'EPERM'
    },
    { networkDomains: ['127.0.0.1'], allowLocalBinding: true }
  )
  assert.equal(plan.route, 'EXECUTION_PROFILE_DEFECT')
  assert.equal(plan.preserveOwner, true)
  assert.throws(
    () =>
      planProfileRepair(
        {
          expectedState: 'DELIVERY_ACTIVE',
          capabilityDeclared: true,
          operation: 'filesystem',
          literalFailure: 'EPERM'
        },
        { filesystemRoots: ['/'] }
      ),
    /UNBOUNDED_PROFILE_REPAIR_REJECTED/
  )
})

test('telemetry is derived from persisted context and credential output retains keys only', () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-telemetry-test-'))
  const path = join(root, 'rollout.jsonl')
  writeFileSync(
    path,
    [
      JSON.stringify({
        type: 'turn_context',
        payload: { approval_policy: 'on-request', approvals_reviewer: 'auto_review' }
      }),
      JSON.stringify({ type: 'event_msg', payload: { type: 'agent_message' } })
    ].join('\n')
  )
  assert.equal(readApprovalTelemetry(path).normalPermissionPromptCount, 0)
  assert.deepEqual(credentialReferenceKeys('username=alice\npassword=sensitive\n'), [
    'password',
    'username'
  ])
})
