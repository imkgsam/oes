import test from 'node:test'
import assert from 'node:assert/strict'
import {
  appendFileSync,
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync
} from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { canonicalJson, sha256 } from '../src/canonical.ts'
import { validateJsonSchema } from '../src/schema-validation.ts'
import {
  classifyCapabilityIssue,
  credentialReferenceKeys,
  defaultDeliveryCapabilities,
  effectivePermissionSandboxFingerprint,
  loadRemoteTrustRootsFromProfileReport,
  planProfileRepair,
  readApprovalTelemetry,
  runEffectiveProfilePreflight,
  SystemPreflightProbeAdapter,
  verifyEffectiveProfileReport,
  type ApprovalTelemetryExpectation,
  type PreflightProbeAdapter
} from '../src/profile-preflight.ts'
import {
  approvalPair,
  renderOwnerProfileLaunch,
  type OwnerProfileRenderRequest,
  type OwnerProfileRenderResult
} from '../src/profile-policy.ts'
import type {
  ApprovalMode,
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
const profileLaunchReceiptSchema = JSON.parse(
  readFileSync(
    join(import.meta.dirname, '..', 'schemas', 'profile-launch-receipt.schema.json'),
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

  async approvalTelemetry(expectation: ApprovalTelemetryExpectation): Promise<ApprovalTelemetry> {
    return readApprovalTelemetry(this.telemetryPath, expectation)
  }
}

const MANAGED_PERMISSION = {
  permission_profile: {
    type: 'managed',
    name: 'oes-project-owner',
    file_system: { type: 'restricted', entries: [] },
    network: 'restricted'
  },
  sandbox_policy: { type: 'workspace-write' },
  file_system_sandbox_policy: { kind: 'restricted', entries: [] },
  active_permission_profile: { id: 'oes-project-owner' }
}

/** Returns the mode-independent managed/restricted permission fingerprint used by fixtures. */
function managedFingerprint(): string {
  return effectivePermissionSandboxFingerprint(MANAGED_PERMISSION)
}

/** Returns the complete v2 expectation bound to one issuer-owned telemetry root. */
function approvalExpectation(
  trustedAuthorizationRoot: string,
  approvalMode: ApprovalMode = 'ON_REQUEST_AUTO_REVIEW'
): ApprovalTelemetryExpectation {
  return {
    approvalMode,
    expectedEffectivePermissionSandboxFingerprint: managedFingerprint(),
    expectedActivePermissionProfileId: 'oes-project-owner',
    trustedAuthorizationRoot
  }
}

/** Persists complete rollout contexts for one closed approval mode. */
function telemetry(root: string, approvalMode: ApprovalMode = 'ON_REQUEST_AUTO_REVIEW'): string {
  const path = join(root, 'rollout.jsonl')
  const pair = approvalPair(approvalMode)
  writeFileSync(
    path,
    [
      JSON.stringify({
        ordinal: 1,
        type: 'turn_context',
        payload: {
          turn_id: 'turn-1',
          approval_policy: pair.approvalPolicy,
          approvals_reviewer: pair.approvalsReviewer,
          ...MANAGED_PERMISSION
        }
      }),
      JSON.stringify({
        ordinal: 2,
        type: 'turn_context',
        payload: {
          turn_id: 'turn-2',
          approval_policy: pair.approvalPolicy,
          approvals_reviewer: pair.approvalsReviewer,
          ...MANAGED_PERMISSION
        }
      }),
      JSON.stringify({ type: 'event_msg', payload: { type: 'agent_message' } })
    ].join('\n')
  )
  return path
}

/** Renders one complete v2 installed profile and launch receipt fixture. */
function renderedProfile(
  root: string,
  ownerTaskId: string,
  transitionId: string,
  approvalMode: ApprovalMode = 'ON_REQUEST_AUTO_REVIEW',
  profileGeneration = 1,
  predecessorLaunchReceipt: OwnerProfileRenderResult['launchReceipt'] | null = null
): OwnerProfileRenderResult {
  const installedRoot = join(root, 'installed')
  const values = {
    OWNER_PATH: join(root, 'owner'),
    ARTIFACT_PATH: join(root, 'artifacts'),
    TASK_TEMP_PATH: join(root, 'task-temp'),
    REPOSITORY_ROOT: process.cwd(),
    TRUSTED_AUTHORIZATION_ROOT: join(installedRoot, 'trusted-authorizations'),
    SERIAL_ADMISSION_ROOT: join(root, 'serial-admission'),
    OWNER_GIT_DIRECTORY: join(root, 'owner', '.git'),
    USER_GIT_CONFIG: join(root, 'user.gitconfig'),
    CREDENTIAL_STORE_PATH: join(root, 'credential-store'),
    PACKAGE_CACHE_PATH: join(root, 'package-cache'),
    RESOURCE_TOPOLOGY_VERSION: 'pre-cutover-v1',
    OWNER_RESOURCE_BINDING_PATH: '',
    OWNER_RESOURCE_BINDING_SHA256: '',
    OWNER_RESOURCE_BINDING_FINGERPRINT: ''
  }
  for (const value of [
    values.OWNER_PATH,
    values.ARTIFACT_PATH,
    values.TASK_TEMP_PATH,
    values.CREDENTIAL_STORE_PATH,
    values.TRUSTED_AUTHORIZATION_ROOT,
    values.SERIAL_ADMISSION_ROOT,
    values.PACKAGE_CACHE_PATH
  ])
    mkdirSync(value, { recursive: true })
  writeFileSync(values.USER_GIT_CONFIG, '[credential]\n\thelper =\n')
  return renderOwnerProfileLaunch({
    approvalMode,
    ownerTaskId,
    transitionId,
    profileGeneration,
    predecessorLaunchReceipt,
    expectedEffectivePermissionSandboxFingerprint: managedFingerprint(),
    templatePath: join(import.meta.dirname, '..', 'profile', 'oes-project-owner.config.toml'),
    installedProfilePath: join(installedRoot, `profile-${profileGeneration}.toml`),
    launchReceiptPath: join(installedRoot, `launch-receipt-${profileGeneration}.json`),
    templateValues: values
  })
}

/** Writes the issuer snapshot beneath the profile-sealed authorization root. */
function trustedTelemetry(
  rendered: OwnerProfileRenderResult,
  approvalMode: ApprovalMode = 'ON_REQUEST_AUTO_REVIEW'
): string {
  return telemetry(
    join(dirname(rendered.installedProfile.path), 'trusted-authorizations'),
    approvalMode
  )
}

test('actual probe adapter records and verifies every delivery capability with zero normal prompts', async () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-profile-test-'))
  const rendered = renderedProfile(root, '/root/fl', 'handoff:1')
  const telemetryPath = trustedTelemetry(rendered)
  const report = await runEffectiveProfilePreflight(
    {
      ownerTaskId: '/root/fl',
      transitionId: 'handoff:1',
      approvalMode: 'ON_REQUEST_AUTO_REVIEW',
      launchReceipt: rendered.launchReceipt,
      expectedState: 'HANDOFF_PENDING',
      declaredCapabilities: defaultDeliveryCapabilities(),
      profile: {
        name: 'oes-profile',
        permission: 'oes-owner',
        path: rendered.installedProfile.path,
        sha256: rendered.installedProfile.sha256
      },
      resultPath: join(root, 'profile-report.json')
    },
    new PassingProbe(root, telemetryPath)
  )
  assert.equal(report.observations.length, 8)
  assert.equal(verifyEffectiveProfileReport(report).telemetry.normalPermissionPromptCount, 0)
  for (const changed of [
    { ...report, ownerTaskId: '/root/fl/rebound' },
    { ...report, transitionId: 'handoff:stale' }
  ])
    assert.throws(
      () => verifyEffectiveProfileReport(changed),
      /PROFILE_OWNER_TRANSITION_READBACK_MISMATCH/
    )
})

test('v2 writer supports NEVER_USER with zero approval events and executable schema readback', async () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-profile-never-test-'))
  const rendered = renderedProfile(root, '/root/fl', 'handoff:never', 'NEVER_USER')
  const telemetryPath = trustedTelemetry(rendered, 'NEVER_USER')
  const report = await runEffectiveProfilePreflight(
    {
      ownerTaskId: '/root/fl',
      transitionId: 'handoff:never',
      approvalMode: 'NEVER_USER',
      launchReceipt: rendered.launchReceipt,
      expectedState: 'HANDOFF_PENDING',
      declaredCapabilities: ['filesystemWrite'],
      profile: {
        name: 'oes-profile',
        permission: 'oes-owner',
        path: rendered.installedProfile.path,
        sha256: rendered.installedProfile.sha256
      },
      resultPath: join(root, 'profile-report.json')
    },
    new PassingProbe(root, telemetryPath)
  )
  assert.equal(report.schemaVersion, 2)
  assert.equal(report.approvalMode, 'NEVER_USER')
  assert.equal(report.telemetry.approvalPolicy, 'never')
  assert.equal(report.telemetry.approvalsReviewer, 'user')
  assert.equal(report.telemetry.approvalEventCount, 0)
  assert.equal(report.telemetry.contexts?.length, 2)
  validateJsonSchema(effectiveProfileSchema, report)
})

test('all v2 contexts reject permission drift, unmanaged access, and NEVER_USER approval events', () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-profile-context-drift-test-'))
  const pair = approvalPair('NEVER_USER')
  const base = {
    approval_policy: pair.approvalPolicy,
    approvals_reviewer: pair.approvalsReviewer,
    ...MANAGED_PERMISSION
  }
  const expectation = approvalExpectation(root, 'NEVER_USER')
  const driftPath = join(root, 'drift.jsonl')
  writeFileSync(
    driftPath,
    [
      JSON.stringify({ ordinal: 1, type: 'turn_context', payload: { turn_id: 'a', ...base } }),
      JSON.stringify({
        ordinal: 2,
        type: 'turn_context',
        payload: {
          turn_id: 'b',
          ...base,
          active_permission_profile: { id: 'drifted-profile' }
        }
      })
    ].join('\n')
  )
  assert.throws(
    () => readApprovalTelemetry(driftPath, expectation),
    /EFFECTIVE_PERMISSION_SANDBOX_UNMANAGED/
  )

  const unmanagedPath = join(root, 'unmanaged.jsonl')
  writeFileSync(
    unmanagedPath,
    JSON.stringify({
      ordinal: 1,
      type: 'turn_context',
      payload: {
        turn_id: 'a',
        ...base,
        permission_profile: { type: 'disabled' },
        sandbox_policy: { type: 'danger-full-access' }
      }
    })
  )
  assert.throws(
    () => readApprovalTelemetry(unmanagedPath, expectation),
    /EFFECTIVE_PERMISSION_SANDBOX_UNMANAGED/
  )

  const approvalPath = telemetry(root, 'NEVER_USER')
  writeFileSync(
    approvalPath,
    `${readFileSync(approvalPath, 'utf8')}\n${JSON.stringify({ type: 'event_msg', payload: { type: 'exec_approval_request' } })}`
  )
  assert.throws(
    () => readApprovalTelemetry(approvalPath, expectation),
    /NEVER_USER_APPROVAL_EVENT_FORBIDDEN/
  )
})

test('v2 preflight rejects unrestricted effective filesystem telemetry end to end', async () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-profile-unrestricted-test-'))
  const rendered = renderedProfile(root, '/root/fl', 'handoff:unrestricted', 'NEVER_USER')
  const eventSource = join(
    dirname(rendered.installedProfile.path),
    'trusted-authorizations',
    'unrestricted.jsonl'
  )
  writeFileSync(
    eventSource,
    JSON.stringify({
      ordinal: 1,
      type: 'turn_context',
      payload: {
        turn_id: 'turn-unrestricted',
        approval_policy: 'never',
        approvals_reviewer: 'user',
        ...MANAGED_PERMISSION,
        file_system_sandbox_policy: { kind: 'unrestricted' }
      }
    })
  )

  await assert.rejects(
    runEffectiveProfilePreflight(
      {
        ownerTaskId: '/root/fl',
        transitionId: 'handoff:unrestricted',
        approvalMode: 'NEVER_USER',
        launchReceipt: rendered.launchReceipt,
        expectedState: 'HANDOFF_PENDING',
        declaredCapabilities: ['filesystemWrite'],
        profile: {
          name: 'oes-profile',
          permission: 'oes-owner',
          path: rendered.installedProfile.path,
          sha256: rendered.installedProfile.sha256
        },
        resultPath: join(root, 'profile-report.json')
      },
      new PassingProbe(root, eventSource)
    ),
    /EFFECTIVE_PERMISSION_SANDBOX_UNMANAGED/
  )
})

test('effective fingerprint normalizes only the launcher arg0 filename', () => {
  const withPrompt = (path: string) => ({
    ...MANAGED_PERMISSION,
    permission_profile: {
      ...MANAGED_PERMISSION.permission_profile,
      file_system: {
        type: 'restricted',
        entries: [
          { access: 'read', path: { type: 'path', path } },
          { access: 'write', path: { type: 'path', path: '/owner' } }
        ]
      }
    },
    file_system_sandbox_policy: {
      kind: 'restricted',
      entries: [{ access: 'read', path: { type: 'path', path } }]
    }
  })
  assert.equal(
    effectivePermissionSandboxFingerprint(withPrompt('/codex-home/tmp/arg0/codex-arg0AAA')),
    effectivePermissionSandboxFingerprint(withPrompt('/codex-home/tmp/arg0/codex-arg0BBB'))
  )
  assert.notEqual(
    effectivePermissionSandboxFingerprint(withPrompt('/codex-home/tmp/other/codex-arg0AAA')),
    effectivePermissionSandboxFingerprint(withPrompt('/codex-home/tmp/other/codex-arg0BBB'))
  )
})

test('renderer derives pairs atomically and enforces monotonic same-owner successors', () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-profile-successor-test-'))
  const first = renderedProfile(root, '/root/fl', 'profile:1')
  const second = renderedProfile(
    root,
    '/root/fl',
    'profile:2',
    'NEVER_USER',
    2,
    first.launchReceipt
  )
  validateJsonSchema(
    profileLaunchReceiptSchema,
    JSON.parse(readFileSync(second.launchReceipt.path, 'utf8'))
  )
  assert.equal(second.approvalPolicy, 'never')
  assert.equal(second.approvalsReviewer, 'user')
  const invariantLines = (path: string) =>
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .filter(
        (line) =>
          !/^(approval_policy|approvals_reviewer|transition_id|approval_mode)\s*=/.test(line.trim())
      )
  assert.deepEqual(
    invariantLines(first.installedProfile.path),
    invariantLines(second.installedProfile.path)
  )
  assert.throws(
    () => renderedProfile(root, '/root/fl', 'profile:4', 'NEVER_USER', 4, first.launchReceipt),
    /PROFILE_RENDER_SUCCESSOR_NOT_MONOTONIC/
  )
  const invalidRequest = {
    approvalMode: 'NEVER_USER',
    ownerTaskId: '/root/fl',
    transitionId: 'profile:3',
    profileGeneration: 3,
    predecessorLaunchReceipt: second.launchReceipt,
    expectedEffectivePermissionSandboxFingerprint: managedFingerprint(),
    templatePath: join(import.meta.dirname, '..', 'profile', 'oes-project-owner.config.toml'),
    installedProfilePath: join(root, 'installed', 'profile-3.toml'),
    launchReceiptPath: join(root, 'installed', 'launch-receipt-3.json'),
    templateValues: {},
    approvalPolicy: 'never'
  } as unknown as OwnerProfileRenderRequest
  assert.throws(
    () => renderOwnerProfileLaunch(invalidRequest),
    /PROFILE_RENDER_REQUEST_FIELDS_INVALID/
  )
})

test('v1 reader remains frozen to on-request auto-review and v2 fields stay forbidden', async () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-profile-v1-reader-test-'))
  const rendered = renderedProfile(root, '/root/fl', 'legacy:source')
  const telemetryPath = trustedTelemetry(rendered)
  const v2 = await runEffectiveProfilePreflight(
    {
      ownerTaskId: '/root/fl',
      transitionId: 'legacy:source',
      approvalMode: 'ON_REQUEST_AUTO_REVIEW',
      launchReceipt: rendered.launchReceipt,
      expectedState: 'HANDOFF_PENDING',
      declaredCapabilities: ['filesystemWrite'],
      profile: {
        name: 'oes-profile',
        permission: 'oes-owner',
        path: rendered.installedProfile.path,
        sha256: rendered.installedProfile.sha256
      },
      resultPath: join(root, 'v2.json')
    },
    new PassingProbe(root, telemetryPath)
  )
  const {
    approvalMode: _mode,
    launchReceipt: _receipt,
    effectivePermissionSandboxFingerprint: _effective,
    telemetry: v2Telemetry,
    ...common
  } = v2
  const {
    approvalMode: _telemetryMode,
    effectivePermissionSandboxFingerprint: _telemetryEffective,
    eventSourceFingerprint: _telemetrySource,
    contexts: _contexts,
    ...legacyTelemetry
  } = v2Telemetry
  const v1: EffectiveProfileReport = { ...common, schemaVersion: 1, telemetry: legacyTelemetry }
  assert.equal(verifyEffectiveProfileReport(v1).schemaVersion, 1)
  validateJsonSchema(effectiveProfileSchema, v1)
  assert.throws(
    () => validateJsonSchema(effectiveProfileSchema, { ...v1, approvalMode: 'NEVER_USER' }),
    /not/
  )
  const neverPath = telemetry(root, 'NEVER_USER')
  assert.throws(() => readApprovalTelemetry(neverPath), /APPROVAL_TELEMETRY_PROFILE_MISMATCH/)
})

test('profile verification reopens evidence, profile bytes, and telemetry', async () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-profile-reopen-test-'))
  const rendered = renderedProfile(root, '/root/fl', 'handoff:2')
  const telemetryPath = trustedTelemetry(rendered)
  const report = await runEffectiveProfilePreflight(
    {
      ownerTaskId: '/root/fl',
      transitionId: 'handoff:2',
      approvalMode: 'ON_REQUEST_AUTO_REVIEW',
      launchReceipt: rendered.launchReceipt,
      expectedState: 'HANDOFF_PENDING',
      declaredCapabilities: ['filesystemWrite'],
      profile: {
        name: 'oes-profile',
        permission: 'oes-owner',
        path: rendered.installedProfile.path,
        sha256: rendered.installedProfile.sha256
      },
      resultPath: join(root, 'report.json')
    },
    new PassingProbe(root, telemetryPath)
  )
  writeFileSync(report.telemetry.eventSource, '')
  assert.throws(() => verifyEffectiveProfileReport(report), /APPROVAL_TELEMETRY_CONTEXT_MISSING/)
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

test('system adapter consumes issuer-owned telemetry and detects a late approval event', async () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-telemetry-snapshot-test-'))
  const trustedRoot = join(root, 'trusted-authorizations')
  mkdirSync(trustedRoot, { recursive: true })
  const issuerSnapshot = telemetry(trustedRoot, 'NEVER_USER')
  const adapter = new SystemPreflightProbeAdapter({
    repositoryRoot: process.cwd(),
    smokeRoot: root,
    telemetryEventSource: issuerSnapshot
  })
  const expectation = approvalExpectation(trustedRoot, 'NEVER_USER')
  const sealed = await adapter.approvalTelemetry(expectation)
  assert.equal(sealed.eventSource, issuerSnapshot)
  assert.equal(
    sealed.eventSourceFingerprint,
    sha256(
      canonicalJson({
        eventSource: issuerSnapshot,
        eventSourceSha256: sealed.eventSourceSha256
      })
    )
  )
  appendFileSync(
    issuerSnapshot,
    `\n${JSON.stringify({ type: 'event_msg', payload: { type: 'exec_approval_request' } })}\n`
  )
  assert.throws(
    () => readApprovalTelemetry(sealed.eventSource, expectation),
    /NEVER_USER_APPROVAL_EVENT_FORBIDDEN/
  )

  const callerPath = telemetry(root, 'NEVER_USER')
  const callerAdapter = new SystemPreflightProbeAdapter({
    repositoryRoot: process.cwd(),
    smokeRoot: root,
    telemetryEventSource: callerPath
  })
  await assert.rejects(
    callerAdapter.approvalTelemetry(expectation),
    /ARTIFACT_PATH_OUTSIDE_BOUND_ROOT/
  )
})

test('system adapter performs actual filesystem, SQLite, and telemetry probes', async () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-system-probe-test-'))
  const trustedRoot = join(root, 'trusted-authorizations')
  mkdirSync(trustedRoot, { recursive: true })
  const adapter = new SystemPreflightProbeAdapter({
    repositoryRoot: process.cwd(),
    smokeRoot: root,
    telemetryEventSource: telemetry(trustedRoot)
  })
  for (const capability of [
    'filesystemWrite',
    'taskOwnedDatabase',
    'approvalTelemetry'
  ] as CapabilityName[]) {
    const observation = await adapter.observe(capability, approvalExpectation(trustedRoot))
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
    '#!/bin/sh\ncat >/dev/null\nprintf "protocol=https\\nhost=github.com\\nusername=fixture\\npassword=redacted\\n"\nprintf "password=stderr-secret\\n" >&2\n'
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
  assert.doesNotMatch(observation.literalOutput, /fixture|redacted|stderr-secret/)
  assert.deepEqual((await adapter.credentialReference()).keys, ['password', 'username'])
})

test('failed system probes preserve combined stdout and stderr diagnostics', async () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-probe-diagnostics-test-'))
  const fakeNode = join(root, 'node')
  writeFileSync(
    fakeNode,
    '#!/bin/sh\nprintf "STDOUT_DIAGNOSTIC\\n"\nprintf "STDERR_DIAGNOSTIC\\n" >&2\nexit 7\n'
  )
  chmodSync(fakeNode, 0o700)
  const adapter = new SystemPreflightProbeAdapter({
    repositoryRoot: process.cwd(),
    smokeRoot: root,
    telemetryEventSource: telemetry(root),
    node: fakeNode
  })
  const observation = await adapter.observe('standardBuildTest')
  assert.equal(observation.result, 'FAIL')
  assert.match(observation.literalOutput, /STDOUT_DIAGNOSTIC/)
  assert.match(observation.literalOutput, /STDERR_DIAGNOSTIC/)
  assert.match(observation.literalOutput, /\[7\]/)
})

test('caller-writable profile reports cannot select remote trust roots', async () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-runtime-trust-profile-test-'))
  const rendered = renderedProfile(root, '/root/fl', 'delivery:1')
  const telemetryPath = trustedTelemetry(rendered)
  const report = await runEffectiveProfilePreflight(
    {
      ownerTaskId: '/root/fl',
      transitionId: 'delivery:1',
      approvalMode: 'ON_REQUEST_AUTO_REVIEW',
      launchReceipt: rendered.launchReceipt,
      expectedState: 'DELIVERY_ACTIVE',
      declaredCapabilities: defaultDeliveryCapabilities(),
      profile: {
        name: 'installed',
        permission: 'owner',
        path: rendered.installedProfile.path,
        sha256: rendered.installedProfile.sha256
      },
      resultPath: join(root, 'report.json')
    },
    new PassingProbe(root, telemetryPath)
  )
  for (const changed of [
    { ...report, ownerTaskId: '/root/fl/rebound' },
    { ...report, transitionId: 'delivery:stale' }
  ])
    assert.throws(
      () => loadRemoteTrustRootsFromProfileReport(changed),
      /PROFILE_OWNER_TRANSITION_READBACK_MISMATCH/
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
