import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { buildCiPerformanceEvidence } from './ci-performance-evidence.mjs'
import { verifyCiMainEquivalence } from './ci-main-equivalence.mjs'

test('main equivalence binds two merge parents, exact tree, toolchain, lockfile, and artifact', () => {
  const fixture = createFixture()
  try {
    assert.doesNotThrow(() => verifyCiMainEquivalence(fixture.input))
    const evidence = JSON.parse(fs.readFileSync(fixture.evidencePath, 'utf8'))
    evidence.workload.sourceTreeSha = '0'.repeat(40)
    evidence.workloadFingerprint = digest(evidence.workload)
    fs.writeFileSync(fixture.evidencePath, JSON.stringify(evidence))
    assert.throws(() => verifyCiMainEquivalence(fixture.input), /CI_MAIN_TREE_MISMATCH/)
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true })
  }
})

test('main equivalence rejects artifact corruption even when the checksum file is unchanged', () => {
  const fixture = createFixture()
  try {
    fs.appendFileSync(fixture.archivePath, 'corrupt')
    assert.throws(
      () => verifyCiMainEquivalence(fixture.input),
      /CI_MAIN_ARTIFACT_CHECKSUM_MISMATCH/
    )
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true })
  }
})

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-ci-main-equivalence-'))
  run(root, 'git', ['init', '-b', 'main'])
  run(root, 'git', ['config', 'user.email', 'ci@example.invalid'])
  run(root, 'git', ['config', 'user.name', 'CI Fixture'])
  fs.writeFileSync(path.join(root, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n')
  fs.writeFileSync(path.join(root, 'base.txt'), 'base\n')
  run(root, 'git', ['add', '.'])
  run(root, 'git', ['commit', '-m', 'base'])
  run(root, 'git', ['checkout', '-b', 'feature'])
  fs.writeFileSync(path.join(root, 'feature.txt'), 'feature\n')
  run(root, 'git', ['add', '.'])
  run(root, 'git', ['commit', '-m', 'feature'])
  const headSha = run(root, 'git', ['rev-parse', 'HEAD'])
  run(root, 'git', ['checkout', 'main'])
  fs.writeFileSync(path.join(root, 'main.txt'), 'main\n')
  run(root, 'git', ['add', '.'])
  run(root, 'git', ['commit', '-m', 'main advance'])
  const baseSha = run(root, 'git', ['rev-parse', 'HEAD'])
  run(root, 'git', ['merge', '--no-ff', 'feature', '-m', 'merge feature'])
  const treeSha = run(root, 'git', ['rev-parse', 'HEAD^{tree}'])
  const archivePath = path.join(root, 'prepared-build.tar.gz')
  fs.writeFileSync(archivePath, 'prepared build fixture')
  const artifactDigest = fileDigest(archivePath)
  const checksumPath = path.join(root, 'prepared-build.sha256')
  fs.writeFileSync(checksumPath, `${artifactDigest}  prepared-build.tar.gz\n`)
  const evidence = buildCiPerformanceEvidence({
    mode: 'OPTIMIZED_SHADOW',
    sourceSha: '1'.repeat(40),
    sourceTreeSha: treeSha,
    baseSha,
    acceptedSourceIdentity: headSha,
    acceptedResultIdentity: '1'.repeat(40),
    changedPaths: ['feature.txt'],
    riskClass: 'STANDARD',
    stagePullRequests: [],
    commandInventory: ['build', 'test'],
    testInventory: ['test:one'],
    lockfileDigest: fileDigest(path.join(root, 'pnpm-lock.yaml')),
    toolchain: { node: process.version, pnpm: '10.33.0', buf: 'buf-action-v1' },
    cacheDisposition: 'WARM',
    workflowRevision: '2'.repeat(64),
    eventTopology: 'pull_request',
    shardStrategy: 'weighted-unit-2-l2-3-v1',
    cacheStrategy: 'exact-pnpm-lockfile-key',
    artifactStrategy: 'content-addressed-prepared-build-v1',
    artifactDigest
  })
  const evidencePath = path.join(root, 'optimized-shadow.json')
  fs.writeFileSync(evidencePath, JSON.stringify(evidence))
  return {
    root,
    archivePath,
    evidencePath,
    input: { repositoryRoot: root, evidencePath, archivePath, checksumPath, pnpmVersion: '10.33.0' }
  }
}

function run(cwd, executable, args) {
  const result = spawnSync(executable, args, { cwd, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim()
}

function fileDigest(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function digest(value) {
  return crypto.createHash('sha256').update(canonical(value)).digest('hex')
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`)
      .join(',')}}`
  return JSON.stringify(value)
}
