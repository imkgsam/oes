import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

/** Proves a merged main tree exactly reuses the successful PR shadow artifact and inputs. */
export function verifyCiMainEquivalence({
  repositoryRoot,
  evidencePath,
  archivePath,
  checksumPath,
  pnpmVersion = command(repositoryRoot, 'pnpm', ['--version'])
}) {
  const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'))
  if (evidence.schemaVersion !== 1 || evidence.kind !== 'OES_CI_PERFORMANCE_EVIDENCE') {
    throw new Error('CI_MAIN_EVIDENCE_KIND_INVALID')
  }
  if (evidence.execution?.mode !== 'OPTIMIZED_SHADOW') {
    throw new Error('CI_MAIN_EVIDENCE_MODE_INVALID')
  }
  if (digest(evidence.workload) !== evidence.workloadFingerprint) {
    throw new Error('CI_MAIN_WORKLOAD_FINGERPRINT_MISMATCH')
  }
  if (digest(evidence.execution) !== evidence.executionFingerprint) {
    throw new Error('CI_MAIN_EXECUTION_FINGERPRINT_MISMATCH')
  }

  const parents = command(repositoryRoot, 'git', ['rev-list', '--parents', '-n', '1', 'HEAD'])
    .split(/\s+/)
    .slice(1)
  if (parents.length !== 2) throw new Error(`CI_MAIN_MERGE_PARENT_COUNT actual=${parents.length}`)
  const [baseSha, headSha] = parents
  const treeSha = command(repositoryRoot, 'git', ['rev-parse', 'HEAD^{tree}'])
  if (evidence.workload.baseSha !== baseSha) throw new Error('CI_MAIN_BASE_SHA_MISMATCH')
  if (evidence.workload.acceptedSourceIdentity !== headSha) {
    throw new Error('CI_MAIN_ACCEPTED_HEAD_MISMATCH')
  }
  if (evidence.workload.sourceTreeSha !== treeSha) throw new Error('CI_MAIN_TREE_MISMATCH')
  if (
    evidence.workload.lockfileDigest !== fileDigest(path.join(repositoryRoot, 'pnpm-lock.yaml'))
  ) {
    throw new Error('CI_MAIN_LOCKFILE_DIGEST_MISMATCH')
  }
  if (evidence.workload.toolchain?.node !== process.version) {
    throw new Error('CI_MAIN_NODE_VERSION_MISMATCH')
  }
  if (evidence.workload.toolchain?.pnpm !== pnpmVersion) {
    throw new Error('CI_MAIN_PNPM_VERSION_MISMATCH')
  }

  const expectedDigest = fs.readFileSync(checksumPath, 'utf8').trim().split(/\s+/)[0]
  if (!/^[0-9a-f]{64}$/.test(expectedDigest)) throw new Error('CI_MAIN_CHECKSUM_INVALID')
  const archiveDigest = fileDigest(archivePath)
  if (archiveDigest !== expectedDigest) throw new Error('CI_MAIN_ARTIFACT_CHECKSUM_MISMATCH')
  if (evidence.execution.artifactDigest !== archiveDigest) {
    throw new Error('CI_MAIN_ARTIFACT_EVIDENCE_MISMATCH')
  }
  if (
    !Array.isArray(evidence.workload.commandInventory) ||
    evidence.workload.commandInventory.length === 0
  ) {
    throw new Error('CI_MAIN_COMMAND_INVENTORY_EMPTY')
  }
  if (
    !Array.isArray(evidence.workload.testInventory) ||
    evidence.workload.testInventory.length === 0
  ) {
    throw new Error('CI_MAIN_TEST_INVENTORY_EMPTY')
  }
  const result = Object.freeze({ archiveDigest, baseSha, headSha, treeSha })
  process.stdout.write(
    `CI_MAIN_EQUIVALENCE=PASS base=${baseSha} head=${headSha} tree=${treeSha} artifact=${archiveDigest}\n`
  )
  return result
}

/** Returns a deterministic SHA-256 for canonical JSON. */
function digest(value) {
  return crypto.createHash('sha256').update(canonical(value)).digest('hex')
}

/** Canonicalizes object keys recursively for evidence self-hash verification. */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

/** Hashes one required file. */
function fileDigest(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

/** Captures one required command scalar. */
function command(cwd, executable, args) {
  const result = spawnSync(executable, args, { cwd, encoding: 'utf8' })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`CI_MAIN_COMMAND_FAILED command=${executable} exit=${result.status}`)
  }
  return result.stdout.trim()
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2)
    const flag = (name) => {
      const index = args.indexOf(name)
      if (index < 0 || !args[index + 1]) throw new Error(`CI_MAIN_ARGUMENT_REQUIRED flag=${name}`)
      return path.resolve(args[index + 1])
    }
    verifyCiMainEquivalence({
      repositoryRoot: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
      evidencePath: flag('--evidence'),
      archivePath: flag('--archive'),
      checksumPath: flag('--checksum')
    })
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
