import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { parseShardFlags, selectWeightedShard } from './ci-sharding.mjs'

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

/** Runs every exact unit/component spec assigned to one optional deterministic shard. */
export function runUnitMatrix(
  repositoryRoot = defaultRepositoryRoot(),
  shardIndex = null,
  shardCount = null
) {
  const completeInventory = validateMatrix(repositoryRoot)
  const inventory =
    shardIndex === null
      ? completeInventory
      : selectUnitShard(completeInventory, shardIndex, shardCount).items
  const evidenceDirectory = path.join(repositoryRoot, '.tmp', 'oes-test-matrix', 'unit')
  fs.mkdirSync(evidenceDirectory, { recursive: true })
  assertNoTestResidue(repositoryRoot)
  let totalTests = 0
  let totalSuites = 0
  for (const surface of inventory) {
    if (surface.typecheck === true) {
      run('pnpm', ['--filter', surface.name, 'run', 'test:typecheck'], { cwd: repositoryRoot })
    }
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
    run('pnpm', args, { cwd: repositoryRoot })
    assertNoTestResidue(repositoryRoot)
    const result = JSON.parse(fs.readFileSync(outputFile, 'utf8'))
    assertJestResult(surface.name, result, surface.specs.length)
    totalTests += result.numTotalTests
    totalSuites += result.numTotalTestSuites
    process.stdout.write(
      `TEST_SURFACE package=${surface.name} suites=${result.numTotalTestSuites} tests=${result.numTotalTests} status=PASS\n`
    )
  }
  process.stdout.write(
    `TEST_MATRIX_UNIT=PASS packages=${inventory.length} suites=${totalSuites} tests=${totalTests}\n`
  )
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

/** Executes one command with literal command and status evidence. */
function run(command, args, options) {
  process.stdout.write(`COMMAND ${command} ${args.join(' ')}\n`)
  const result = spawnSync(command, args, { ...options, stdio: 'inherit' })
  process.stdout.write(`EXIT status=${result.status ?? 'spawn-error'}\n`)
  if (result.error) throw result.error
  if (result.status !== 0)
    throw new Error(`COMMAND_FAILED command=${command} exit=${result.status}`)
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
    const { shardIndex, shardCount, remaining } = parseShardFlags(rawArguments)
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
      runUnitMatrix(defaultRepositoryRoot(), shardIndex, shardCount)
    } else {
      throw new Error('TEST_MATRIX_COMMAND_REQUIRED expected=check|unit')
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
