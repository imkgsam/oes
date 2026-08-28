import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const CONTRACT_DIRECTORY = 'src/common/src/contracts'

/** Builds the exact Buf command against one immutable canonical Git commit. */
export function buildBufBreakingArgs(commit) {
  if (!/^[a-f0-9]{40}$/u.test(commit)) throw new Error(`PROTO_BASE_COMMIT_INVALID value=${commit}`)
  return [
    'breaking',
    CONTRACT_DIRECTORY,
    '--against',
    `.git#ref=${commit},subdir=${CONTRACT_DIRECTORY}`
  ]
}

/** Resolves a named base to a commit and requires it to be candidate ancestry. */
export function resolveCanonicalBase(repositoryRoot, requestedBase) {
  if (!requestedBase || !/^[A-Za-z0-9_./-]+$/u.test(requestedBase)) {
    throw new Error(`PROTO_BASE_REF_INVALID value=${requestedBase ?? ''}`)
  }
  const commit = capture('git', ['rev-parse', '--verify', `${requestedBase}^{commit}`], {
    cwd: repositoryRoot
  })
  if (!/^[a-f0-9]{40}$/u.test(commit)) throw new Error('PROTO_BASE_RESOLUTION_INVALID')
  const ancestry = spawnSync('git', ['merge-base', '--is-ancestor', commit, 'HEAD'], {
    cwd: repositoryRoot,
    stdio: 'inherit'
  })
  if (ancestry.error) throw ancestry.error
  if (ancestry.status !== 0) throw new Error(`PROTO_BASE_NOT_ANCESTOR commit=${commit}`)
  return commit
}

/** Runs Buf breaking with literal base/exit evidence. */
export function runProtoBreaking(repositoryRoot, requestedBase) {
  const commit = resolveCanonicalBase(repositoryRoot, requestedBase)
  const args = buildBufBreakingArgs(commit)
  process.stdout.write(`PROTO_BREAKING_BASE requested=${requestedBase} commit=${commit}\n`)
  process.stdout.write(`COMMAND buf ${args.join(' ')}\n`)
  const result = spawnSync('buf', args, { cwd: repositoryRoot, stdio: 'inherit' })
  process.stdout.write(`EXIT status=${result.status ?? 'spawn-error'}\n`)
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`PROTO_BREAKING_FAILED exit=${result.status}`)
  process.stdout.write(`PROTO_BREAKING=PASS base=${commit}\n`)
}

/** Captures one Git scalar and fails on non-zero status. */
function capture(command, args, options) {
  const result = spawnSync(command, args, { ...options, encoding: 'utf8' })
  if (result.error) throw result.error
  if (result.status !== 0)
    throw new Error(`COMMAND_FAILED command=${command} exit=${result.status}`)
  return result.stdout.trim()
}

/** Resolves the repository root from the versioned script path. */
function defaultRepositoryRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    runProtoBreaking(
      defaultRepositoryRoot(),
      process.argv[2] ?? process.env.OES_PROTO_BREAKING_BASE ?? 'origin/main'
    )
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
