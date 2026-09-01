import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  parseParallelShardFlag,
  parseShardFlags,
  partitionWeighted,
  selectWeightedShard
} from './ci-sharding.mjs'

export const ASSIGNED_TEST_SURFACES = Object.freeze([
  Object.freeze({ name: '@oes/common', directory: 'src/common', roots: ['src'], typecheck: true }),
  Object.freeze({
    name: 'api-gateway',
    directory: 'src/services/api-gateway',
    roots: ['src'],
    typecheck: true
  }),
  Object.freeze({
    name: 'auth-service',
    directory: 'src/services/system/auth-service',
    roots: ['src'],
    typecheck: true
  }),
  Object.freeze({
    name: 'public-entry-service',
    directory: 'src/services/system/public-entry-service',
    roots: ['src', 'test/l1', 'test/l3']
  }),
  Object.freeze({
    name: 'crm-service',
    directory: 'src/services/business/crm-service',
    roots: ['src', 'test/l1', 'test/l3']
  }),
  Object.freeze({
    name: 'item-master-service',
    directory: 'src/services/system/item-master-service',
    roots: ['src', 'test/l1', 'test/l3']
  }),
  Object.freeze({
    name: 'permission-service',
    directory: 'src/services/system/permission-service',
    roots: ['src', 'test/l1', 'test/l3']
  }),
  Object.freeze({
    name: 'browser-activity-service',
    directory: 'src/services/system/browser-activity-service',
    roots: ['src', 'test/l1', 'test/l3']
  })
])

/** Recursively returns exact spec paths without relying on Jest's permissive empty-match behavior. */
export function discoverSpecs(repositoryRoot, surface) {
  const packageRoot = path.join(repositoryRoot, surface.directory)
  const specs = []
  for (const relativeRoot of surface.roots) {
    const root = path.join(packageRoot, relativeRoot)
    if (!fs.existsSync(root)) continue
    visit(root, (file) => {
      if (file.endsWith('.spec.ts')) specs.push(path.relative(packageRoot, file))
    })
  }
  return specs.sort()
}

/** Validates every assigned surface has a Jest config and at least one executable spec. */
export function validateMatrix(repositoryRoot = defaultRepositoryRoot()) {
  const names = new Set()
  const inventory = []
  for (const surface of ASSIGNED_TEST_SURFACES) {
    if (names.has(surface.name)) throw new Error(`TEST_MATRIX_DUPLICATE package=${surface.name}`)
    names.add(surface.name)
    const packageRoot = path.join(repositoryRoot, surface.directory)
    const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'))
    if (packageJson.name !== surface.name) {
      throw new Error(
        `TEST_MATRIX_PACKAGE_MISMATCH expected=${surface.name} actual=${packageJson.name}`
      )
    }
    if (!fs.existsSync(path.join(packageRoot, 'jest.config.js'))) {
      throw new Error(`TEST_MATRIX_JEST_CONFIG_MISSING package=${surface.name}`)
    }
    const specs = discoverSpecs(repositoryRoot, surface)
    if (specs.length === 0) throw new Error(`TEST_MATRIX_EMPTY package=${surface.name}`)
    inventory.push(Object.freeze({ ...surface, specs: Object.freeze(specs) }))
  }
  return Object.freeze(inventory)
}

/** Runs every exact unit/component spec and rejects hidden skip/todo/empty results. */
export function selectUnitShard(inventory, shardIndex, shardCount) {
  return selectWeightedShard(
    inventory,
    shardIndex,
    shardCount,
    (entry) => entry.name,
    (entry) => entry.specs.length + (entry.typecheck === true ? 1 : 0)
  )
}

/** Partitions every unit surface for internal concurrency after one shared install/restore. */
export function partitionUnitShards(inventory, shardCount) {
  return partitionWeighted(
    inventory,
    shardCount,
    (entry) => entry.name,
    (entry) => entry.specs.length + (entry.typecheck === true ? 1 : 0)
  )
}

/** Runs every exact unit/component spec assigned to one optional deterministic shard. */
export async function runUnitMatrix(
  repositoryRoot = defaultRepositoryRoot(),
  shardIndex = null,
  shardCount = null,
  parallelShardCount = null
) {
  const completeInventory = validateMatrix(repositoryRoot)
  if (parallelShardCount !== null && shardIndex !== null)
    throw new Error('UNIT_PARALLEL_AND_EXTERNAL_SHARD_CONFLICT')
  const inventory =
    shardIndex === null
      ? completeInventory
      : selectUnitShard(completeInventory, shardIndex, shardCount).items
  const evidenceDirectory = path.join(repositoryRoot, '.tmp', 'oes-test-matrix', 'unit')
  fs.mkdirSync(evidenceDirectory, { recursive: true })
  assertNoTestResidue(repositoryRoot)
  const shards =
    parallelShardCount === null
      ? [Object.freeze({ index: 0, items: inventory })]
      : partitionUnitShards(inventory, parallelShardCount)
  process.stdout.write(
    `UNIT_EXECUTION sharedSetup=true parallelShards=${shards.length} packages=${inventory.length}\n`
  )
  const results = await Promise.allSettled(
    shards.map((shard) => runUnitShardBatch(repositoryRoot, evidenceDirectory, shard))
  )
  const failures = results
    .filter((result) => result.status === 'rejected')
    .map((result) => result.reason)
  if (failures.length > 0)
    throw new AggregateError(failures, `UNIT_SHARD_FAILURES count=${failures.length}`)
  let totalTests = 0
  let totalSuites = 0
  for (const result of results) {
    totalTests += result.value.tests
    totalSuites += result.value.suites
  }
  process.stdout.write(
    `TEST_MATRIX_UNIT=PASS packages=${inventory.length} suites=${totalSuites} tests=${totalTests}\n`
  )
}

/** Runs one weighted unit batch serially while sibling batches execute on the same runner. */
async function runUnitShardBatch(repositoryRoot, evidenceDirectory, shard) {
  let totalTests = 0
  let totalSuites = 0
  const failures = []
  for (const surface of shard.items) {
    try {
      if (surface.typecheck === true)
        await runAsync(
          'pnpm',
          ['--filter', surface.name, 'run', 'test:typecheck'],
          {
            cwd: repositoryRoot
          },
          `unit-${shard.index}-${surface.name}-typecheck`
        )
      const outputFile = path.join(evidenceDirectory, `${safeName(surface.name)}.json`)
      fs.rmSync(outputFile, { force: true })
      const args = [
        '--filter',
        surface.name,
        'exec',
        'jest',
        '--config',
        'jest.config.js',
        '--runInBand',
        '--runTestsByPath',
        ...surface.specs,
        '--json',
        '--outputFile',
        outputFile
      ]
      await runAsync('pnpm', args, { cwd: repositoryRoot }, `unit-${shard.index}-${surface.name}`)
      assertNoTestResidue(repositoryRoot)
      const result = JSON.parse(fs.readFileSync(outputFile, 'utf8'))
      assertJestResult(surface.name, result, surface.specs.length)
      totalTests += result.numTotalTests
      totalSuites += result.numTotalTestSuites
      process.stdout.write(
        `TEST_SURFACE shard=${shard.index} package=${surface.name} suites=${result.numTotalTestSuites} tests=${result.numTotalTests} status=PASS\n`
      )
    } catch (error) {
      failures.push(error)
      process.stdout.write(
        `TEST_SURFACE shard=${shard.index} package=${surface.name} status=FAIL reason=${error instanceof Error ? error.message : String(error)}\n`
      )
    }
  }
  if (failures.length > 0)
    throw new AggregateError(
      failures,
      `UNIT_BATCH_FAILURES shard=${shard.index} count=${failures.length}`
    )
  process.stdout.write(
    `UNIT_SHARD=PASS shard=${shard.index} packages=${shard.items.length} suites=${totalSuites} tests=${totalTests}\n`
  )
  return Object.freeze({ suites: totalSuites, tests: totalTests })
}

/** Fails closed when a certificate fixture leaks its serial state into the repository root. */
export function assertNoTestResidue(repositoryRoot = defaultRepositoryRoot()) {
  const serialPath = path.join(repositoryRoot, '.srl')
  if (fs.existsSync(serialPath)) {
    throw new Error('TEST_MATRIX_RESIDUE path=.srl expected=task-local-certificate-serial')
  }
}

/** Rejects success reports that conceal empty, skipped, todo, or failed tests. */
export function assertJestResult(packageName, result, expectedSuiteFiles) {
  if (
    result.success !== true ||
    result.numFailedTests !== 0 ||
    result.numFailedTestSuites !== 0 ||
    result.numPendingTests !== 0 ||
    result.numTodoTests !== 0 ||
    result.numTotalTests < 1 ||
    result.numTotalTestSuites !== expectedSuiteFiles
  ) {
    throw new Error(
      `TEST_MATRIX_RESULT_INVALID package=${packageName} suites=${result.numTotalTestSuites}/${expectedSuiteFiles} tests=${result.numTotalTests} failed=${result.numFailedTests} pending=${result.numPendingTests} todo=${result.numTodoTests}`
    )
  }
}

/** Executes one test command asynchronously and fails closed on spawn, signal, or non-zero exit. */
function runAsync(command, args, options, label) {
  process.stdout.write(`COMMAND label=${label} ${command} ${args.join(' ')}\n`)
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: 'inherit' })
    child.once('error', reject)
    child.once('close', (status, signal) => {
      process.stdout.write(
        `EXIT label=${label} status=${status ?? 'signal'} signal=${signal ?? 'none'}\n`
      )
      if (status !== 0)
        reject(new Error(`COMMAND_FAILED command=${command} exit=${status ?? signal}`))
      else resolve()
    })
  })
}

/** Visits ordinary files below one repository-owned test root. */
function visit(root, callback) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name)
    if (entry.isDirectory()) visit(target, callback)
    else if (entry.isFile()) callback(target)
  }
}

/** Produces a portable evidence filename for a package name. */
function safeName(value) {
  return value.replaceAll(/[^a-z0-9-]+/giu, '_')
}

/** Resolves the repository root from this versioned script location. */
function defaultRepositoryRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const [command, ...rawArguments] = process.argv.slice(2)
    const { parallelShardCount, remaining: parallelArguments } =
      parseParallelShardFlag(rawArguments)
    const { shardIndex, shardCount, remaining } = parseShardFlags(parallelArguments)
    if (remaining.length > 0) throw new Error(`TEST_MATRIX_ARGUMENT_UNKNOWN value=${remaining[0]}`)
    if (command === 'check') {
      const inventory = validateMatrix()
      for (const surface of inventory) {
        process.stdout.write(
          `TEST_DISCOVERY package=${surface.name} suites=${surface.specs.length}\n`
        )
      }
      process.stdout.write(`TEST_MATRIX_CHECK=PASS packages=${inventory.length}\n`)
    } else if (command === 'unit') {
      await runUnitMatrix(defaultRepositoryRoot(), shardIndex, shardCount, parallelShardCount)
    } else {
      throw new Error('TEST_MATRIX_COMMAND_REQUIRED expected=check|unit')
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
