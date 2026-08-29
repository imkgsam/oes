import test from 'node:test'
import assert from 'node:assert/strict'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { canonicalJson, sha256 } from '../src/canonical.ts'
import { validateJsonSchema } from '../src/schema-validation.ts'
import {
  classifyCapabilityIssue,
  credentialReferenceKeys,
  defaultDeliveryCapabilities,
  loadRemoteTrustRootsFromProfileReport,
  planProfileRepair,
  readApprovalTelemetry,
  runEffectiveProfilePreflight,
  SystemPreflightProbeAdapter,
  verifyEffectiveProfileReport,
  type PreflightProbeAdapter
} from '../src/profile-preflight.ts'
import type {
  ApprovalTelemetry,
  CapabilityName,
  CapabilityObservation,
  EffectiveProfileReport
} from '../src/types.ts'

const effectiveProfileSchema = JSON.parse(
  readFileSync(
    join(import.meta.dirname, '..', 'schemas', 'effective-profile-report.schema.json'),
    'utf8'
  )
) as Record<string, unknown>

class PassingProbe implements PreflightProbeAdapter {
  readonly root: string
  readonly telemetryPath: string

  constructor(root: string, telemetryPath: string) {
    this.root = root
    this.telemetryPath = telemetryPath
  }

  async observe(name: CapabilityName): Promise<CapabilityObservation> {
    const base = {
      name,
      command: `probe ${name}`,
      literalOutput: 'PASS',
      exitCode: 0,
      result: 'PASS' as const
    }
    const evidencePath = join(this.root, `${name}.json`)
    const bytes = `${canonicalJson(base)}\n`
    writeFileSync(evidencePath, bytes)
    return { ...base, evidencePath, evidenceSha256: sha256(bytes) }
  }

  async credentialReference(): Promise<EffectiveProfileReport['credentialReference']> {
    return {
      reference: 'git-credential:https://github.com',
      keys: ['username', 'password'],
      secretValuesRecorded: false
    }
  }

  async approvalTelemetry(): Promise<ApprovalTelemetry> {
    return readApprovalTelemetry(this.telemetryPath)
  }
}

function telemetry(root: string): string {
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
  return path
}

test('actual probe adapter records and verifies every delivery capability with zero normal prompts', async () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-profile-test-'))
  const telemetryPath = telemetry(root)
  const profilePath = join(root, 'profile.toml')
  writeFileSync(profilePath, 'approval_policy="on-request"\n')
  const report = await runEffectiveProfilePreflight(
    {
      ownerTaskId: '/root/fl',
      transitionId: 'handoff:1',
      expectedState: 'HANDOFF_PENDING',
      declaredCapabilities: defaultDeliveryCapabilities(),
      profile: {
        name: 'oes-profile',
        permission: 'oes-owner',
        path: profilePath,
        sha256: sha256(readFileSync(profilePath))
      },
      resultPath: join(root, 'profile-report.json')
    },
    new PassingProbe(root, telemetryPath)
  )
  assert.equal(report.observations.length, 8)
  assert.equal(verifyEffectiveProfileReport(report).telemetry.normalPermissionPromptCount, 0)
})

test('profile verification reopens evidence, profile bytes, and telemetry', async () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-profile-reopen-test-'))
  const telemetryPath = telemetry(root)
  const profilePath = join(root, 'profile.toml')
  writeFileSync(profilePath, 'profile=true\n')
  const report = await runEffectiveProfilePreflight(
    {
      ownerTaskId: '/root/fl',
      transitionId: 'handoff:2',
      expectedState: 'HANDOFF_PENDING',
      declaredCapabilities: ['filesystemWrite'],
      profile: {
        name: 'oes-profile',
        permission: 'oes-owner',
        path: profilePath,
        sha256: sha256(Buffer.from('profile=true\n'))
      },
      resultPath: join(root, 'report.json')
    },
    new PassingProbe(root, telemetryPath)
  )
  writeFileSync(report.telemetry.eventSource, '')
  assert.throws(() => verifyEffectiveProfileReport(report), /APPROVAL_TELEMETRY_PROFILE_MISMATCH/)
})

test('effective profile schema pairs stable topology with one sealed owner binding', () => {
  const value = {
    schemaVersion: 1,
    kind: 'OES_EFFECTIVE_PROFILE_REPORT',
    ownerTaskId: '/root/fl',
    transitionId: 'handoff:stable',
    expectedState: 'HANDOFF_PENDING',
    declaredCapabilities: ['filesystemWrite'],
    profile: { name: 'profile', permission: 'owner', path: '/profile', sha256: 'a'.repeat(64) },
    observations: [
      {
        name: 'filesystemWrite',
        command: 'probe',
        literalOutput: 'PASS',
        exitCode: 0,
        result: 'PASS',
        evidencePath: '/evidence',
        evidenceSha256: 'b'.repeat(64)
      }
    ],
    credentialReference: {
      reference: 'git',
      keys: ['username', 'password'],
      secretValuesRecorded: false
    },
    telemetry: {
      eventSource: '/telemetry',
      eventSourceSha256: 'c'.repeat(64),
      approvalPolicy: 'on-request',
      approvalsReviewer: 'auto_review',
      approvalEventCount: 0,
      normalPermissionPromptCount: 0
    },
    resourceTopology: {
      resourceTopologyVersion: 'pre-cutover-v1',
      ownerResourceBinding: null
    }
  }
  validateJsonSchema(effectiveProfileSchema, value)
  value.resourceTopology.resourceTopologyVersion = 'stable-owner-exclusive-v1'
  assert.throws(() => validateJsonSchema(effectiveProfileSchema, value), /type|required/)
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
  const path = telemetry(root)
  assert.equal(readApprovalTelemetry(path).normalPermissionPromptCount, 0)
  assert.deepEqual(credentialReferenceKeys('username=alice\npassword=sensitive\n'), [
    'password',
    'username'
  ])
})

test('system adapter performs actual filesystem, SQLite, and telemetry probes', async () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-system-probe-test-'))
  const adapter = new SystemPreflightProbeAdapter({
    repositoryRoot: process.cwd(),
    smokeRoot: root,
    telemetryEventSource: telemetry(root)
  })
  for (const capability of [
    'filesystemWrite',
    'taskOwnedDatabase',
    'approvalTelemetry'
  ] as CapabilityName[]) {
    const observation = await adapter.observe(capability)
    assert.equal(observation.result, 'PASS')
    assert.equal(observation.exitCode, 0)
    assert.equal(sha256(readFileSync(observation.evidencePath)), observation.evidenceSha256)
  }
})

test('standard git credential fill keeps only approved reference keys', async () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-credential-system-test-'))
  const fakeGit = join(root, 'git')
  writeFileSync(
    fakeGit,
    '#!/bin/sh\ncat >/dev/null\nprintf "protocol=https\\nhost=github.com\\nusername=fixture\\npassword=redacted\\n"\n'
  )
  chmodSync(fakeGit, 0o700)
  const adapter = new SystemPreflightProbeAdapter({
    repositoryRoot: process.cwd(),
    smokeRoot: root,
    telemetryEventSource: telemetry(root),
    git: fakeGit
  })
  const observation = await adapter.observe('credentialReference')
  assert.equal(observation.result, 'PASS')
  assert.deepEqual((await adapter.credentialReference()).keys, ['password', 'username'])
})

test('caller-writable profile reports cannot select remote trust roots', async () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-runtime-trust-profile-test-'))
  const authorizationRoot = join(root, 'trusted-authorizations')
  const admissionRoot = join(root, 'serial-admission')
  mkdirSync(authorizationRoot)
  mkdirSync(admissionRoot)
  const telemetryPath = telemetry(root)
  const profilePath = join(root, 'installed-profile.toml')
  const profile = [
    '[collaboration_runtime]',
    `trusted_authorization_root = ${JSON.stringify(authorizationRoot)}`,
    `serial_admission_root = ${JSON.stringify(admissionRoot)}`,
    '[permissions.owner.filesystem]',
    `${JSON.stringify(authorizationRoot)} = "read"`,
    `${JSON.stringify(admissionRoot)} = "write"`,
    ''
  ].join('\n')
  writeFileSync(profilePath, profile)
  const report = await runEffectiveProfilePreflight(
    {
      ownerTaskId: '/root/fl',
      transitionId: 'delivery:1',
      expectedState: 'DELIVERY_ACTIVE',
      declaredCapabilities: defaultDeliveryCapabilities(),
      profile: {
        name: 'installed',
        permission: 'owner',
        path: profilePath,
        sha256: sha256(profile)
      },
      resultPath: join(root, 'report.json')
    },
    new PassingProbe(root, telemetryPath)
  )
  process.env.OES_REMOTE_AUTHORIZATION_ROOT = join(root, 'caller-selected')
  try {
    assert.throws(
      () => loadRemoteTrustRootsFromProfileReport(report),
      /INSTALLED_PROFILE_CALLER_WRITABLE|INSTALLED_PROFILE_CALLER_CONTROLLED/
    )
  } finally {
    delete process.env.OES_REMOTE_AUTHORIZATION_ROOT
  }
})
