import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { discoverL2Packages } from './l2-test-runner.mjs'
import { validateMatrix } from './test-matrix.mjs'

const MODES = new Set(['LEGACY_CONTROL', 'OPTIMIZED_SHADOW', 'OPTIMIZED_ACTIVE'])

/** Creates paired workload/execution identities without mixing topology into workload identity. */
export function buildCiPerformanceEvidence(input) {
  if (!MODES.has(input.mode)) throw new Error(`CI_EVIDENCE_MODE_INVALID mode=${input.mode}`)
  const workload = {
    sourceSha: input.sourceSha,
    sourceTreeSha: input.sourceTreeSha,
    baseSha: input.baseSha,
    acceptedSourceIdentity: input.acceptedSourceIdentity,
    acceptedResultIdentity: input.acceptedResultIdentity,
    changedPaths: [...input.changedPaths].sort(),
    riskClass: input.riskClass,
    stagePullRequests: [...input.stagePullRequests],
    commandInventory: [...input.commandInventory],
    testInventory: [...input.testInventory].sort(),
    lockfileDigest: input.lockfileDigest,
    toolchain: input.toolchain,
    cacheDisposition: input.cacheDisposition
  }
  const execution = {
    workflowRevision: input.workflowRevision,
    eventTopology: input.eventTopology,
    mode: input.mode,
    shardStrategy: input.shardStrategy,
    cacheStrategy: input.cacheStrategy,
    artifactStrategy: input.artifactStrategy,
    artifactDigest: input.artifactDigest ?? null
  }
  return Object.freeze({
    schemaVersion: 1,
    kind: 'OES_CI_PERFORMANCE_EVIDENCE',
    workloadFingerprint: digest(workload),
    executionFingerprint: digest(execution),
    workload,
    execution
  })
}

/** Generates one ordinary CI artifact for the exact checked-out source. */
export function generateCiPerformanceEvidence(
  repositoryRoot,
  mode,
  outputPath,
  environment = process.env
) {
  const sourceSha = git(repositoryRoot, ['rev-parse', 'HEAD'])
  const base = validSha(environment.OES_CI_BASE_SHA)
    ? environment.OES_CI_BASE_SHA
    : gitAllowFailure(repositoryRoot, ['rev-parse', `${sourceSha}^`]) || sourceSha
  const changedPaths = gitAllowFailure(repositoryRoot, ['diff', '--name-only', base, sourceSha])
    .split('\n')
    .filter(Boolean)
  const unit = validateMatrix(repositoryRoot)
  const l2 = discoverL2Packages(repositoryRoot)
  const workflowFiles = [
    '.github/workflows/ci.yml',
    '.github/workflows/ci-optimized-shadow.yml',
    'scripts/local/ci-performance-evidence.mjs',
    'scripts/local/ci-sharding.mjs'
  ].filter((file) => fs.existsSync(path.join(repositoryRoot, file)))
  const evidence = buildCiPerformanceEvidence({
    mode,
    sourceSha,
    sourceTreeSha: git(repositoryRoot, ['rev-parse', 'HEAD^{tree}']),
    baseSha: base,
    acceptedSourceIdentity: environment.OES_ACCEPTED_SOURCE_IDENTITY || sourceSha,
    acceptedResultIdentity: environment.OES_ACCEPTED_RESULT_IDENTITY || sourceSha,
    changedPaths,
    riskClass: changedPaths.some((file) =>
      /^(src\/common|docs\/architecture|docs\/adr|scripts\/collaboration-runtime)/.test(file)
    )
      ? 'HIGH'
      : 'STANDARD',
    stagePullRequests: (environment.OES_STAGE_PULL_REQUESTS || '').split(',').filter(Boolean),
    commandInventory: [
      'pnpm proto:lint',
      'pnpm generated:all',
      'pnpm proto:breaking',
      'pnpm build:prepared',
      'pnpm test:matrix:check',
      'pnpm test:design-gap',
      'pnpm test:tooling',
      'pnpm test:unit',
      'pnpm collaboration-runtime:check',
      'node --test scripts/local/foundation-trusted-grpc-atomic-group.spec.mjs',
      'pnpm test:l2'
    ],
    testInventory: [
      ...unit.flatMap((entry) => entry.specs.map((spec) => `unit:${entry.name}:${spec}`)),
      ...l2.flatMap((entry) => entry.specs.map((spec) => `l2:${entry.name}:${spec}`))
    ],
    lockfileDigest: fileDigest(path.join(repositoryRoot, 'pnpm-lock.yaml')),
    toolchain: {
      node: process.version,
      pnpm: environment.OES_PNPM_VERSION || '10.33.0',
      buf: environment.OES_BUF_VERSION || 'buf-action-v1'
    },
    cacheDisposition: environment.OES_CACHE_DISPOSITION || 'UNKNOWN',
    workflowRevision: digest(
      workflowFiles.map((file) => [file, fileDigest(path.join(repositoryRoot, file))])
    ),
    eventTopology: environment.GITHUB_EVENT_NAME || 'local',
    shardStrategy:
      mode === 'LEGACY_CONTROL' ? 'legacy-static-plus-single-l2' : 'weighted-unit-2-l2-3-v1',
    cacheStrategy: 'exact-pnpm-lockfile-key',
    artifactStrategy: mode === 'LEGACY_CONTROL' ? 'none' : 'content-addressed-prepared-build-v1',
    artifactDigest: environment.OES_PREPARED_ARTIFACT_DIGEST || null
  })
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${canonical(evidence)}\n`)
  process.stdout.write(`CI_WORKLOAD_FINGERPRINT=${evidence.workloadFingerprint}\n`)
  process.stdout.write(`CI_EXECUTION_FINGERPRINT=${evidence.executionFingerprint}\n`)
  process.stdout.write(`CI_EXECUTION_MODE=${mode}\n`)
  return evidence
}

/** Returns a deterministic lowercase SHA-256 for one JSON value. */
function digest(value) {
  return crypto.createHash('sha256').update(canonical(value)).digest('hex')
}

/** Canonicalizes object keys recursively for stable evidence hashing. */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`)
      .join(',')}}`
  return JSON.stringify(value)
}

/** Hashes one required input file. */
function fileDigest(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

/** Captures one successful Git scalar. */
function git(repositoryRoot, args) {
  const result = spawnSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`CI_EVIDENCE_GIT_FAILED command=${args.join(' ')}`)
  return result.stdout.trim()
}

/** Captures a Git diff while treating an absent synthetic parent as an empty changed-path set. */
function gitAllowFailure(repositoryRoot, args) {
  const result = spawnSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' })
  return result.status === 0 ? result.stdout.trim() : ''
}

/** Checks one full Git object id supplied by event context. */
function validSha(value) {
  return typeof value === 'string' && /^[0-9a-f]{40}$/.test(value) && !/^0+$/.test(value)
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2)
    const modeIndex = args.indexOf('--mode')
    const outputIndex = args.indexOf('--output')
    if (modeIndex < 0 || outputIndex < 0) throw new Error('CI_EVIDENCE_ARGUMENTS_REQUIRED')
    generateCiPerformanceEvidence(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
      args[modeIndex + 1],
      path.resolve(args[outputIndex + 1])
    )
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
