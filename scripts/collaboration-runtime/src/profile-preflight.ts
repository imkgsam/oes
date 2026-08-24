import {
  chmodSync,
  closeSync,
  constants,
  openSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync
} from 'node:fs'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { dirname, isAbsolute, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { DatabaseSync } from 'node:sqlite'
import { assertPathWithin, canonicalJson, sha256, writeJsonAtomic } from './canonical.ts'
import { validateProfileReportEnvelope } from './binding.ts'
import { fail } from './errors.ts'
import {
  CAPABILITY_NAMES,
  type ApprovalTelemetry,
  type CapabilityName,
  type CapabilityObservation,
  type EffectiveProfileReport,
  type RemoteTrustRoots
} from './types.ts'

export type CapabilityFailureRoute =
  | 'EXECUTION_ENVIRONMENT_NOT_READY'
  | 'EXECUTION_PROFILE_DEFECT'
  | 'PERMISSION_EXPANSION_REQUIRED'

export interface CapabilityIssue {
  expectedState: 'HANDOFF_PENDING' | 'DELIVERY_ACTIVE'
  capabilityDeclared: boolean
  operation: string
  literalFailure: string
}

export interface ProfileRepairPlan {
  route: CapabilityFailureRoute
  preserveOwner: boolean
  sameTransitionRetry: boolean
  additions: { filesystemRoots: string[]; networkDomains: string[]; allowLocalBinding: boolean }
  retainedDenies: string[]
}

export interface PreflightProbeAdapter {
  observe(name: CapabilityName): Promise<CapabilityObservation>
  credentialReference(): Promise<EffectiveProfileReport['credentialReference']>
  approvalTelemetry(): Promise<ApprovalTelemetry>
}

export interface PreflightRequest {
  ownerTaskId: string
  transitionId: string
  expectedState: EffectiveProfileReport['expectedState']
  declaredCapabilities: CapabilityName[]
  profile: EffectiveProfileReport['profile']
  resultPath: string
}

export interface SystemProbeOptions {
  repositoryRoot: string
  smokeRoot: string
  telemetryEventSource: string
  git?: string
  pnpm?: string
}

/** Routes a capability failure without converting an existing authorization into a new gate. */
export function classifyCapabilityIssue(issue: CapabilityIssue): CapabilityFailureRoute {
  if (!issue.capabilityDeclared) return 'PERMISSION_EXPANSION_REQUIRED'
  return issue.expectedState === 'HANDOFF_PENDING'
    ? 'EXECUTION_ENVIRONMENT_NOT_READY'
    : 'EXECUTION_PROFILE_DEFECT'
}

/** Produces a minimal same-transition repair while retaining protected denies. */
export function planProfileRepair(
  issue: CapabilityIssue,
  requested: { filesystemRoots?: string[]; networkDomains?: string[]; allowLocalBinding?: boolean }
): ProfileRepairPlan {
  const route = classifyCapabilityIssue(issue)
  const roots = [...new Set(requested.filesystemRoots ?? [])]
  const domains = [...new Set(requested.networkDomains ?? [])]
  if (
    roots.some((root) => root === '/' || root.includes('**')) ||
    domains.some((domain) => domain === '*')
  )
    fail('UNBOUNDED_PROFILE_REPAIR_REJECTED', issue.operation)
  return {
    route,
    preserveOwner: issue.expectedState === 'DELIVERY_ACTIVE',
    sameTransitionRetry: route !== 'PERMISSION_EXPANSION_REQUIRED',
    additions: {
      filesystemRoots: roots.sort(),
      networkDomains: domains.sort(),
      allowLocalBinding: requested.allowLocalBinding === true
    },
    retainedDenies: [
      'secret values',
      'private keys',
      'production/shared data',
      'cross-owner resources',
      'host/system privilege'
    ]
  }
}

/** Extracts credential field names while discarding all credential values. */
export function credentialReferenceKeys(output: string): string[] {
  const approved = new Set(['username', 'password'])
  return [
    ...new Set(
      output
        .split(/\r?\n/)
        .map((line) => line.split('=', 1)[0])
        .filter((key) => approved.has(key))
    )
  ].sort()
}

/** Reads Codex rollout telemetry and counts approval events and normal user prompts. */
export function readApprovalTelemetry(eventSource: string): ApprovalTelemetry {
  const bytes = readFileSync(eventSource)
  let approvalPolicy: string | undefined
  let approvalsReviewer: string | undefined
  let approvalEventCount = 0
  let normalPermissionPromptCount = 0
  for (const line of bytes.toString('utf8').split(/\r?\n/)) {
    if (!line) continue
    let event: Record<string, unknown>
    try {
      event = JSON.parse(line) as Record<string, unknown>
    } catch {
      continue
    }
    const payload =
      event.payload && typeof event.payload === 'object'
        ? (event.payload as Record<string, unknown>)
        : undefined
    if (event.type === 'turn_context' && payload) {
      approvalPolicy = String(payload.approval_policy)
      approvalsReviewer = String(payload.approvals_reviewer)
    }
    const payloadType = payload?.type
    if (
      ['exec_approval_request', 'apply_patch_approval_request', 'mcp_approval_request'].includes(
        String(payloadType)
      )
    )
      approvalEventCount += 1
    if (['request_user_input', 'user_approval_request'].includes(String(payloadType)))
      normalPermissionPromptCount += 1
  }
  if (approvalPolicy !== 'on-request' || approvalsReviewer !== 'auto_review')
    fail('APPROVAL_TELEMETRY_PROFILE_MISMATCH', `${approvalPolicy}/${approvalsReviewer}`)
  return {
    eventSource,
    eventSourceSha256: sha256(bytes),
    approvalPolicy: 'on-request',
    approvalsReviewer: 'auto_review',
    approvalEventCount,
    normalPermissionPromptCount
  }
}

/** Strictly compares one persisted observation evidence record to its report entry. */
function verifyObservationEvidence(observation: CapabilityObservation): void {
  const allowed = [
    'name',
    'command',
    'literalOutput',
    'exitCode',
    'result',
    'evidencePath',
    'evidenceSha256'
  ]
  const extras = Object.keys(observation).filter((key) => !allowed.includes(key))
  if (extras.length) fail('UNDECLARED_CAPABILITY_OBSERVATION_FIELD', extras.join(','))
  const bytes = readFileSync(observation.evidencePath)
  if (sha256(bytes) !== observation.evidenceSha256)
    fail('CAPABILITY_EVIDENCE_SHA_MISMATCH', observation.name)
  const persisted = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>
  const expected = {
    name: observation.name,
    command: observation.command,
    literalOutput: observation.literalOutput,
    exitCode: observation.exitCode,
    result: observation.result
  }
  if (canonicalJson(persisted) !== canonicalJson(expected))
    fail('CAPABILITY_EVIDENCE_READBACK_MISMATCH', observation.name)
}

/** Validates exact probes, persisted evidence, profile bytes, credential keys and telemetry. */
export function verifyEffectiveProfileReport(
  input: EffectiveProfileReport
): EffectiveProfileReport {
  const report = validateProfileReportEnvelope(input)
  if (sha256(readFileSync(report.profile.path)) !== report.profile.sha256)
    fail('PROFILE_BYTES_SHA_MISMATCH', report.profile.path)
  const declared = new Set(report.declaredCapabilities)
  const observed = new Map<CapabilityName, CapabilityObservation>()
  for (const observation of report.observations) {
    if (!CAPABILITY_NAMES.includes(observation.name)) fail('UNKNOWN_CAPABILITY', observation.name)
    if (observed.has(observation.name)) fail('DUPLICATE_CAPABILITY_OBSERVATION', observation.name)
    verifyObservationEvidence(observation)
    observed.set(observation.name, observation)
  }
  for (const capability of declared) {
    const observation = observed.get(capability)
    if (!observation) fail('CAPABILITY_OBSERVATION_MISSING', capability)
    if (observation.exitCode !== 0 || observation.result !== 'PASS')
      fail('DECLARED_CAPABILITY_FAILED', `${capability}: ${observation.literalOutput}`)
  }
  if (observed.size !== declared.size)
    fail('UNDECLARED_CAPABILITY_OBSERVATION', String(observed.size))
  const credentialKeys = [...report.credentialReference.keys].sort()
  const credentialExtras = Object.keys(report.credentialReference).filter(
    (key) => !['reference', 'keys', 'secretValuesRecorded'].includes(key)
  )
  if (
    credentialExtras.length ||
    report.credentialReference.secretValuesRecorded !== false ||
    canonicalJson(credentialKeys) !== canonicalJson(['password', 'username'])
  )
    fail('CREDENTIAL_REFERENCE_INVALID', report.credentialReference.reference)
  const actualTelemetry = readApprovalTelemetry(report.telemetry.eventSource)
  const telemetryExtras = Object.keys(report.telemetry).filter(
    (key) =>
      ![
        'eventSource',
        'eventSourceSha256',
        'approvalPolicy',
        'approvalsReviewer',
        'approvalEventCount',
        'normalPermissionPromptCount'
      ].includes(key)
  )
  if (
    telemetryExtras.length ||
    canonicalJson(actualTelemetry) !== canonicalJson(report.telemetry) ||
    report.telemetry.normalPermissionPromptCount !== 0
  )
    fail('APPROVAL_TELEMETRY_INVALID', String(report.telemetry.normalPermissionPromptCount))
  return report
}

/** Proves the current owner process cannot replace the installed profile or its trust directory. */
function requireProfileReadOnlyControl(profilePath: string, authorizationRoot: string): void {
  assertPathWithin(dirname(profilePath), authorizationRoot)
  assertPathWithin(realpathSync(dirname(profilePath)), realpathSync(authorizationRoot))
  let fileWritable = false
  try {
    const fd = openSync(profilePath, constants.O_WRONLY | constants.O_APPEND)
    closeSync(fd)
    fileWritable = true
  } catch {}
  if (fileWritable) fail('INSTALLED_PROFILE_CALLER_WRITABLE', profilePath)

  let metadataWritable = false
  try {
    chmodSync(profilePath, statSync(profilePath).mode)
    metadataWritable = true
  } catch {}
  if (metadataWritable) fail('INSTALLED_PROFILE_CALLER_CONTROLLED', profilePath)

  const probe = join(dirname(profilePath), `.oes-runtime-trust-probe-${process.pid}`)
  let directoryWritable = false
  try {
    const fd = openSync(probe, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600)
    closeSync(fd)
    directoryWritable = true
  } catch {}
  if (directoryWritable) {
    try {
      unlinkSync(probe)
    } catch {}
    fail('INSTALLED_PROFILE_DIRECTORY_CALLER_WRITABLE', dirname(profilePath))
  }

  const authorizationProbe = join(
    authorizationRoot,
    `.oes-authorization-write-probe-${process.pid}`
  )
  let authorizationWritable = false
  try {
    const fd = openSync(
      authorizationProbe,
      constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY,
      0o600
    )
    closeSync(fd)
    authorizationWritable = true
  } catch {}
  if (authorizationWritable) {
    try {
      unlinkSync(authorizationProbe)
    } catch {}
    fail('AUTHORIZATION_ROOT_CALLER_WRITABLE', authorizationRoot)
  }

  let authorizationMetadataWritable = false
  try {
    chmodSync(authorizationRoot, statSync(authorizationRoot).mode)
    authorizationMetadataWritable = true
  } catch {}
  if (authorizationMetadataWritable) fail('AUTHORIZATION_ROOT_CALLER_CONTROLLED', authorizationRoot)
}

/** Loads remote trust roots only from a hash-verified installed effective profile. */
export function loadRemoteTrustRootsFromProfileReport(
  input: EffectiveProfileReport
): RemoteTrustRoots {
  const report = verifyEffectiveProfileReport(input)
  if (
    report.expectedState !== 'DELIVERY_ACTIVE' ||
    canonicalJson([...report.declaredCapabilities].sort()) !==
      canonicalJson([...CAPABILITY_NAMES].sort())
  )
    fail('REMOTE_RUNTIME_PROFILE_NOT_FULLY_ACCEPTED', report.ownerTaskId)
  const profileText = readFileSync(report.profile.path, 'utf8')
  let section = ''
  const collaboration = new Map<string, string>()
  const permissions = new Map<string, string>()
  for (const rawLine of profileText.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const sectionMatch = /^\[([^\]]+)\]$/.exec(line)
    if (sectionMatch) {
      section = sectionMatch[1]
      continue
    }
    const assignment =
      /^("(?:[^"\\]|\\.)*"|[A-Za-z_][A-Za-z0-9_]*)\s*=\s*("(?:[^"\\]|\\.)*")$/.exec(line)
    if (!assignment) continue
    const key = assignment[1].startsWith('"') ? JSON.parse(assignment[1]) : assignment[1]
    const value = JSON.parse(assignment[2]) as string
    if (section === 'collaboration_runtime') {
      if (collaboration.has(key)) fail('DUPLICATE_RUNTIME_TRUST_SETTING', key)
      collaboration.set(key, value)
    }
    if (section.endsWith('.filesystem')) permissions.set(key, value)
  }
  const authorizationRoot = collaboration.get('trusted_authorization_root') ?? ''
  const admissionRoot = collaboration.get('serial_admission_root') ?? ''
  if (!isAbsolute(authorizationRoot) || !isAbsolute(admissionRoot))
    fail('INSTALLED_RUNTIME_TRUST_ROOT_INVALID', report.profile.path)
  if (
    authorizationRoot === admissionRoot ||
    permissions.get(authorizationRoot) !== 'read' ||
    permissions.get(admissionRoot) !== 'write'
  )
    fail('INSTALLED_RUNTIME_TRUST_PERMISSION_INVALID', report.profile.path)
  if (profileText.includes(`${JSON.stringify(authorizationRoot)} = true`))
    fail('AUTHORIZATION_ROOT_MUST_NOT_BE_WORKSPACE_ROOT', authorizationRoot)
  requireProfileReadOnlyControl(report.profile.path, authorizationRoot)
  return {
    authorizationRoot,
    admissionRoot,
    profilePath: report.profile.path,
    profileSha256: report.profile.sha256,
    ownerTaskId: report.ownerTaskId,
    profileExpectedState: report.expectedState
  }
}

/** Executes every declared probe, verifies the complete report, and atomically records it. */
export async function runEffectiveProfilePreflight(
  request: PreflightRequest,
  adapter: PreflightProbeAdapter
): Promise<EffectiveProfileReport> {
  const observations: CapabilityObservation[] = []
  for (const capability of request.declaredCapabilities)
    observations.push(await adapter.observe(capability))
  const report: EffectiveProfileReport = {
    schemaVersion: 1,
    kind: 'OES_EFFECTIVE_PROFILE_REPORT',
    ownerTaskId: request.ownerTaskId,
    transitionId: request.transitionId,
    expectedState: request.expectedState,
    declaredCapabilities: [...request.declaredCapabilities],
    profile: request.profile,
    observations,
    credentialReference: await adapter.credentialReference(),
    telemetry: await adapter.approvalTelemetry()
  }
  verifyEffectiveProfileReport(report)
  writeJsonAtomic(request.resultPath, report)
  return verifyEffectiveProfileReport(report)
}

/** Executes the canonical harmless capability smoke with literal persisted evidence. */
export class SystemPreflightProbeAdapter implements PreflightProbeAdapter {
  readonly options: Required<SystemProbeOptions>
  private credentialKeys: string[] | null = null

  constructor(options: SystemProbeOptions) {
    this.options = { ...options, git: options.git ?? 'git', pnpm: options.pnpm ?? 'pnpm' }
  }

  async observe(name: CapabilityName): Promise<CapabilityObservation> {
    await mkdir(this.options.smokeRoot, { recursive: true })
    try {
      let command = ''
      let literalOutput = ''
      if (name === 'filesystemWrite') {
        const path = join(this.options.smokeRoot, 'filesystem-probe.txt')
        command = `write-read ${path}`
        await writeFile(path, 'OES_PROFILE_FILESYSTEM_PASS\n')
        literalOutput = readFileSync(path, 'utf8').trim()
      } else if (name === 'gitSwitchAddCommit') {
        const clone = await mkdtemp(join(this.options.smokeRoot, 'git-probe-'))
        command = 'git clone --no-local; switch; add; commit'
        this.run(
          this.options.git,
          ['clone', '--no-local', '--no-hardlinks', this.options.repositoryRoot, clone],
          this.options.smokeRoot
        )
        this.run(this.options.git, ['switch', '-c', 'codex/runtime-profile-probe'], clone)
        this.run(this.options.git, ['config', 'user.name', 'OES Runtime Probe'], clone)
        this.run(this.options.git, ['config', 'user.email', 'runtime-probe@oes.local'], clone)
        writeFileSync(join(clone, 'runtime-profile-probe.txt'), 'probe\n')
        this.run(this.options.git, ['add', 'runtime-profile-probe.txt'], clone)
        this.run(this.options.git, ['commit', '-m', 'test: runtime profile git probe'], clone)
        literalOutput = `commit=${this.run(this.options.git, ['rev-parse', 'HEAD'], clone).trim()};status=${JSON.stringify(this.run(this.options.git, ['status', '--porcelain'], clone))}`
        rmSync(clone, { recursive: true })
      } else if (name === 'standardBuildTest') {
        command =
          'pnpm proto:lint; proto:gen; --filter @oes/common build; collaboration-runtime:check'
        const outputs = [
          this.run(this.options.pnpm, ['proto:lint'], this.options.repositoryRoot),
          this.run(this.options.pnpm, ['proto:gen'], this.options.repositoryRoot),
          this.run(
            this.options.pnpm,
            ['--filter', '@oes/common', 'build'],
            this.options.repositoryRoot
          ),
          this.run(this.options.pnpm, ['collaboration-runtime:check'], this.options.repositoryRoot)
        ]
        literalOutput = outputs.map((output) => output.trim()).join('\n---\n')
      } else if (name === 'taskOwnedDatabase') {
        const path = join(this.options.smokeRoot, 'profile-probe.sqlite')
        command = `node:sqlite task-owned ${path}`
        const db = new DatabaseSync(path)
        db.exec("CREATE TABLE probe(value TEXT NOT NULL); INSERT INTO probe VALUES ('PASS')")
        literalOutput = String(
          (db.prepare('SELECT value FROM probe').get() as { value: string }).value
        )
        db.close()
      } else if (name === 'localhostBind') {
        command = 'listen 127.0.0.1:0'
        literalOutput = await new Promise<string>((resolve, reject) => {
          const server = createServer()
          server.once('error', reject)
          server.listen(0, '127.0.0.1', () => {
            const address = server.address()
            server.close((error) =>
              error
                ? reject(error)
                : resolve(`127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`)
            )
          })
        })
      } else if (name === 'approvedNetworkRead') {
        command = 'git ls-remote --heads origin refs/heads/main'
        literalOutput = this.run(
          this.options.git,
          ['ls-remote', '--heads', 'origin', 'refs/heads/main'],
          this.options.repositoryRoot
        ).trim()
      } else if (name === 'credentialReference') {
        command = 'git credential fill (keys only)'
        this.credentialKeys = this.readCredentialKeys()
        literalOutput = `keys=${this.credentialKeys.join(',')};valuesRecorded=false`
      } else {
        command = `read telemetry ${this.options.telemetryEventSource}`
        const telemetry = readApprovalTelemetry(this.options.telemetryEventSource)
        literalOutput = `policy=${telemetry.approvalPolicy};reviewer=${telemetry.approvalsReviewer};normalPermissionPromptCount=${telemetry.normalPermissionPromptCount}`
      }
      return this.persistObservation({ name, command, literalOutput, exitCode: 0, result: 'PASS' })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return this.persistObservation({
        name,
        command: `probe ${name}`,
        literalOutput: message,
        exitCode: 1,
        result: 'FAIL'
      })
    }
  }

  async credentialReference(): Promise<EffectiveProfileReport['credentialReference']> {
    const keys = this.credentialKeys ?? this.readCredentialKeys()
    return { reference: 'git-credential:https://github.com', keys, secretValuesRecorded: false }
  }

  async approvalTelemetry(): Promise<ApprovalTelemetry> {
    return readApprovalTelemetry(this.options.telemetryEventSource)
  }

  /** Executes one exact subprocess and returns combined non-secret output. */
  private run(command: string, args: string[], cwd: string): string {
    const result = spawnSync(command, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    })
    if (result.status !== 0)
      throw new Error(
        `${command} ${args.join(' ')} [${result.status ?? 1}] ${(result.stderr ?? '').trim()}`
      )
    return `${result.stdout ?? ''}${result.stderr ?? ''}`
  }

  /** Reads credential helper output in memory and immediately retains field names only. */
  private readCredentialKeys(): string[] {
    const result = spawnSync(this.options.git, ['credential', 'fill'], {
      encoding: 'utf8',
      input: 'protocol=https\nhost=github.com\n\n',
      stdio: ['pipe', 'pipe', 'pipe']
    })
    if (result.status !== 0) throw new Error(`git credential fill [${result.status ?? 1}]`)
    return credentialReferenceKeys(result.stdout ?? '')
  }

  /** Writes and hashes one literal observation before returning it. */
  private persistObservation(
    base: Omit<CapabilityObservation, 'evidencePath' | 'evidenceSha256'>
  ): CapabilityObservation {
    const evidencePath = join(this.options.smokeRoot, `${base.name}.json`)
    const bytes = `${canonicalJson(base)}\n`
    writeFileSync(evidencePath, bytes, { mode: 0o600 })
    return { ...base, evidencePath, evidenceSha256: sha256(bytes) }
  }
}

/** Provides the full default capability set used by root delivery handoff smoke. */
export function defaultDeliveryCapabilities(): CapabilityName[] {
  return [...CAPABILITY_NAMES]
}
