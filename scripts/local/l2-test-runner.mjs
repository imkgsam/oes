import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { loadDatabaseContext } from './database-lifecycle.mjs'
import { parseEnvironmentFile } from './worktree-env.mjs'
import { assertJestResult, assertNoTestResidue } from './test-matrix.mjs'
import { parseParallelShardFlag, parseShardFlags, partitionWeighted } from './ci-sharding.mjs'

export const L2_JEST_TIMEOUT_MS = 30_000
export const L2_SERIAL_CONFLICT_GROUPS = Object.freeze([
  Object.freeze(['collaboration-service', 'notification-service'])
])

/** Discovers every versioned service L2 spec and binds it to its owning package. */
export function discoverL2Packages(repositoryRoot = defaultRepositoryRoot()) {
  const servicesRoot = path.join(repositoryRoot, 'src', 'services')
  const groups = new Map()
  visit(servicesRoot, (file) => {
    if (!file.endsWith('.spec.ts') || !file.includes(`${path.sep}test${path.sep}l2${path.sep}`)) {
      return
    }
    const packageRoot = findPackageRoot(file, servicesRoot)
    if (!packageRoot)
      throw new Error(`L2_PACKAGE_NOT_FOUND file=${path.relative(repositoryRoot, file)}`)
    const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'))
    const current = groups.get(packageJson.name) ?? {
      name: packageJson.name,
      packageRoot,
      specs: []
    }
    current.specs.push(path.relative(packageRoot, file))
    groups.set(packageJson.name, current)
  })
  const inventory = [...groups.values()]
    .map((entry) => Object.freeze({ ...entry, specs: Object.freeze(entry.specs.sort()) }))
    .sort((left, right) => left.name.localeCompare(right.name))
  if (inventory.length === 0) throw new Error('L2_INVENTORY_EMPTY')
  for (const entry of inventory) {
    if (!fs.existsSync(path.join(entry.packageRoot, 'jest.config.js'))) {
      throw new Error(`L2_JEST_CONFIG_MISSING package=${entry.name}`)
    }
  }
  return Object.freeze(inventory)
}

/** Builds one loopback-only service database URL from lifecycle-owned state. */
export function serviceDatabaseUrl(context, service, postgresPort) {
  const url = new URL('postgresql://127.0.0.1')
  url.username = required(context.rootValues.get('OES_POSTGRES_USER'), 'OES_POSTGRES_USER')
  url.password = required(context.rootValues.get('OES_POSTGRES_PASSWORD'), 'OES_POSTGRES_PASSWORD')
  url.port = String(postgresPort)
  url.pathname = `/${service.database}`
  url.searchParams.set('schema', 'public')
  return url.toString()
}

/** Selects explicitly named package surfaces without permitting typos or an empty execution set. */
export function selectL2Packages(inventory, requestedNames = []) {
  if (requestedNames.length === 0) return inventory
  const requested = new Set(requestedNames)
  const selected = inventory.filter((entry) => requested.delete(entry.name))
  if (requested.size > 0) {
    throw new Error(`L2_PACKAGE_UNKNOWN packages=${[...requested].sort().join(',')}`)
  }
  if (selected.length === 0) throw new Error('L2_SELECTION_EMPTY')
  return Object.freeze(selected)
}

/** Selects one deterministic, non-empty L2 package shard weighted by exact suite count. */
export function selectL2Shard(inventory, shardIndex, shardCount) {
  if (!Number.isInteger(shardIndex) || shardIndex < 0 || shardIndex >= shardCount)
    throw new Error(`CI_SHARD_INDEX_INVALID index=${shardIndex} count=${shardCount}`)
  return partitionL2Shards(inventory, shardCount)[shardIndex]
}

/** Partitions the complete L2 inventory for concurrent execution behind one shared lifecycle. */
export function partitionL2Shards(inventory, shardCount) {
  const remaining = new Map(inventory.map((entry) => [entry.name, entry]))
  const groups = []
  for (const conflictGroup of L2_SERIAL_CONFLICT_GROUPS) {
    const items = conflictGroup.flatMap((name) => {
      const item = remaining.get(name)
      if (!item) return []
      remaining.delete(name)
      return [item]
    })
    if (items.length > 0) groups.push(Object.freeze(items))
  }
  for (const item of remaining.values()) groups.push(Object.freeze([item]))
  const partitions = partitionWeighted(
    groups,
    shardCount,
    (group) => group.map((entry) => entry.name).join('+'),
    (group) => group.reduce((sum, entry) => sum + entry.specs.length, 0)
  )
  return Object.freeze(
    partitions.map((shard) =>
      Object.freeze({
        index: shard.index,
        weight: shard.weight,
        items: Object.freeze(
          shard.items
            .flatMap((group) => group)
            .sort((left, right) => left.name.localeCompare(right.name))
        )
      })
    )
  )
}

/** Runs all L2 specs against exact task-owned Postgres/NATS resources and always rolls them back. */
export async function runL2Matrix(
  repositoryRoot = defaultRepositoryRoot(),
  requestedNames = [],
  shardIndex = null,
  shardCount = null,
  prepared = false,
  parallelShardCount = null
) {
  const selected = selectL2Packages(discoverL2Packages(repositoryRoot), requestedNames)
  if (parallelShardCount !== null && shardIndex !== null)
    throw new Error('L2_PARALLEL_AND_EXTERNAL_SHARD_CONFLICT')
  const inventory =
    shardIndex === null ? selected : selectL2Shard(selected, shardIndex, shardCount).items
  const executionShards =
    parallelShardCount === null
      ? [Object.freeze({ index: 0, items: inventory })]
      : partitionL2Shards(inventory, parallelShardCount)
  assertNoTestResidue(repositoryRoot)
  run('pnpm', ['env:ensure'], { cwd: repositoryRoot })
  const context = loadDatabaseContext(repositoryRoot)
  const evidenceDirectory = path.join(repositoryRoot, '.tmp', 'oes-test-matrix', 'l2')
  fs.mkdirSync(evidenceDirectory, { recursive: true })
  const statePath = path.join(context.stateDirectory, 'state.json')
  let primaryFailure
  let lifecycleStarted = false
  let totalSuites = 0
  let totalTests = 0
  try {
    if (prepared) assertPreparedBuild(repositoryRoot, inventory)
    else {
      run('pnpm', ['generated:all'], { cwd: repositoryRoot })
      run('pnpm', ['common:build'], { cwd: repositoryRoot })
    }
    run('pnpm', ['db:up', '--', '--profile', 'l2'], { cwd: repositoryRoot })
    lifecycleStarted = true
    run('pnpm', ['db:health'], { cwd: repositoryRoot })
    run(
      'pnpm',
      ['db:migrate', '--', '--services', inventory.map((entry) => entry.name).join(',')],
      {
        cwd: repositoryRoot
      }
    )
    const trustEnvironment = bootstrapTaskTrust(context, repositoryRoot)

    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'))
    const postgresPort = Number(state.postgresPort)
    if (!Number.isInteger(postgresPort) || postgresPort < 1)
      throw new Error('L2_POSTGRES_PORT_INVALID')
    const nats = loadNatsEnvironment(context, repositoryRoot)
    const services = new Map(context.services.map((service) => [service.name, service]))
    process.stdout.write(
      `L2_EXECUTION sharedLifecycle=true parallelShards=${executionShards.length} packages=${inventory.length}\n`
    )
    const results = await Promise.allSettled(
      executionShards.map((shard) =>
        runL2ShardBatch({
          shard,
          repositoryRoot,
          context,
          services,
          postgresPort,
          nats,
          trustEnvironment,
          evidenceDirectory
        })
      )
    )
    const failures = results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason)
    if (failures.length > 0)
      throw new AggregateError(failures, `L2_SHARD_FAILURES count=${failures.length}`)
    for (const result of results) {
      totalSuites += result.value.suites
      totalTests += result.value.tests
    }
    process.stdout.write(
      `TEST_MATRIX_L2=PASS packages=${inventory.length} suites=${totalSuites} tests=${totalTests}\n`
    )
  } catch (error) {
    primaryFailure = error
  } finally {
    if (lifecycleStarted || fs.existsSync(statePath)) {
      try {
        run('pnpm', ['db:rollback'], { cwd: repositoryRoot })
      } catch (rollbackError) {
        if (primaryFailure) {
          primaryFailure = new AggregateError(
            [primaryFailure, rollbackError],
            'L2_AND_ROLLBACK_FAILED'
          )
        } else {
          primaryFailure = rollbackError
        }
      }
    }
    try {
      assertNoTestResidue(repositoryRoot)
    } catch (residueError) {
      primaryFailure = primaryFailure
        ? new AggregateError([primaryFailure, residueError], 'L2_AND_RESIDUE_CHECK_FAILED')
        : residueError
    }
  }
  if (primaryFailure) throw primaryFailure
}

/** Runs one weighted package batch serially while sibling batches share the same task-owned infra. */
async function runL2ShardBatch({
  shard,
  repositoryRoot,
  context,
  services,
  postgresPort,
  nats,
  trustEnvironment,
  evidenceDirectory
}) {
  let suites = 0
  let tests = 0
  const failures = []
  for (const entry of shard.items) {
    try {
      const service = services.get(entry.name)
      if (!service) throw new Error(`L2_DATABASE_BINDING_MISSING package=${entry.name}`)
      const databaseUrl = serviceDatabaseUrl(context, service, postgresPort)
      const outputFile = path.join(evidenceDirectory, `${safeName(entry.name)}.json`)
      fs.rmSync(outputFile, { force: true })
      const result = await runAllowFailureAsync(
        'pnpm',
        buildL2JestArguments(entry, outputFile),
        {
          cwd: repositoryRoot,
          env: {
            ...process.env,
            NODE_ENV: 'test',
            DATABASE_URL: databaseUrl,
            COLLABORATION_DATABASE_URL: databaseUrl,
            OES_L2_DATABASE_URL: databaseUrl,
            EVENT_BUS_LIVE: 'true',
            NOTIFICATION_EVENT_LIVE_TEST: 'true',
            NOTIFICATION_DELIVERY_PAYLOAD_KEY: taskLocalKey(context.taskKey, entry.name),
            ...(entry.name === 'collaboration-service' ? trustEnvironment : {}),
            ...nats.forPackage(entry.name)
          }
        },
        `l2-${shard.index}-${entry.name}`
      )
      if (!fs.existsSync(outputFile))
        throw new Error(`L2_JEST_REPORT_MISSING package=${entry.name} exit=${result.status}`)
      const report = JSON.parse(fs.readFileSync(outputFile, 'utf8'))
      assertJestResult(entry.name, report, entry.specs.length)
      if (result.status !== 0) throw new Error(`COMMAND_FAILED command=pnpm exit=${result.status}`)
      suites += report.numTotalTestSuites
      tests += report.numTotalTests
      process.stdout.write(
        `L2_SURFACE shard=${shard.index} package=${entry.name} suites=${report.numTotalTestSuites} tests=${report.numTotalTests} status=PASS\n`
      )
    } catch (error) {
      failures.push(error)
      process.stdout.write(
        `L2_SURFACE shard=${shard.index} package=${entry.name} status=FAIL reason=${error instanceof Error ? error.message : String(error)}\n`
      )
    }
  }
  if (failures.length > 0)
    throw new AggregateError(
      failures,
      `L2_BATCH_FAILURES shard=${shard.index} count=${failures.length}`
    )
  process.stdout.write(
    `L2_SHARD=PASS shard=${shard.index} packages=${shard.items.length} suites=${suites} tests=${tests}\n`
  )
  return Object.freeze({ suites, tests })
}

/** Builds the exact L2 Jest command with an integration-appropriate bounded hook timeout. */
export function buildL2JestArguments(entry, outputFile) {
  return [
    '--filter',
    entry.name,
    'exec',
    'jest',
    '--config',
    'jest.config.js',
    '--runInBand',
    '--testTimeout',
    String(L2_JEST_TIMEOUT_MS),
    '--runTestsByPath',
    ...entry.specs,
    '--json',
    '--outputFile',
    outputFile
  ]
}

/** Creates owner-local workload material and binds Collaboration's real mTLS client construction to it. */
function bootstrapTaskTrust(context, repositoryRoot) {
  const trustDirectory = path.join(context.stateDirectory, 'grpc-trust')
  run('bash', ['docker/grpc-trust/bootstrap-local-trust.sh', '--output', trustDirectory], {
    cwd: repositoryRoot,
    env: { ...process.env, OES_TRUST_ENV: 'local', OES_FORCE_RENEW: 'true' }
  })
  const current = path.join(trustDirectory, 'collaboration-service', 'current')
  const environment = Object.freeze({
    OES_GRPC_TLS_ENABLED: 'true',
    OES_GRPC_TLS_MIN_VERSION: 'TLSv1.2',
    OES_GRPC_TLS_CA_PATH: path.join(current, 'ca.pem'),
    OES_GRPC_TLS_CERT_PATH: path.join(current, 'cert.pem'),
    OES_GRPC_TLS_KEY_PATH: path.join(current, 'key.pem'),
    OES_WORKLOAD_SPIFFE_ID: 'spiffe://local.oes.internal/ns/oes/sa/collaboration-service'
  })
  for (const key of ['OES_GRPC_TLS_CA_PATH', 'OES_GRPC_TLS_CERT_PATH', 'OES_GRPC_TLS_KEY_PATH']) {
    if (!fs.existsSync(environment[key])) throw new Error(`L2_TRUST_MATERIAL_MISSING key=${key}`)
  }
  return environment
}

/** Derives one local-only 32-byte payload key without logging or persisting it. */
function taskLocalKey(taskKey, packageName) {
  return crypto
    .createHash('sha256')
    .update(`oes-l2:${taskKey}:${packageName}:notification-delivery-payload`)
    .digest('base64')
}

/** Reads task-generated credentials and exact loopback NATS port without logging secrets. */
function loadNatsEnvironment(context, repositoryRoot) {
  const composeEnvironmentPath = path.join(context.stateDirectory, 'compose.env')
  const values = parseEnvironmentFile(
    fs.readFileSync(composeEnvironmentPath, 'utf8'),
    path.relative(repositoryRoot, composeEnvironmentPath)
  )
  const portOutput = capture(
    'docker',
    [
      'compose',
      '--env-file',
      composeEnvironmentPath,
      '--project-name',
      context.projectName,
      '-f',
      'docker-compose.infra.yml',
      'port',
      'nats',
      '4222'
    ],
    { cwd: repositoryRoot }
  )
  const match = /127\.0\.0\.1:(\d+)/u.exec(portOutput)
  if (!match) throw new Error('L2_NATS_PORT_INVALID')
  const natsUrl = `nats://127.0.0.1:${match[1]}`
  const collaboration = Object.freeze({
    NATS_URL: natsUrl,
    NATS_USER: required(values.get('NATS_COLLABORATION_USER'), 'NATS_COLLABORATION_USER'),
    NATS_PASSWORD: required(
      values.get('NATS_COLLABORATION_PASSWORD'),
      'NATS_COLLABORATION_PASSWORD'
    ),
    NATS_CLIENT_NAME: 'collaboration-service-l2',
    COLLABORATION_OUTBOX_INTERVAL_MS: '300000'
  })
  const notification = Object.freeze({
    NATS_URL: natsUrl,
    NATS_USER: required(values.get('NATS_NOTIFICATION_USER'), 'NATS_NOTIFICATION_USER'),
    NATS_PASSWORD: required(values.get('NATS_NOTIFICATION_PASSWORD'), 'NATS_NOTIFICATION_PASSWORD'),
    NATS_COLLABORATION_USER: required(
      values.get('NATS_COLLABORATION_USER'),
      'NATS_COLLABORATION_USER'
    ),
    NATS_COLLABORATION_PASSWORD: required(
      values.get('NATS_COLLABORATION_PASSWORD'),
      'NATS_COLLABORATION_PASSWORD'
    ),
    NATS_NOTIFICATION_USER: required(
      values.get('NATS_NOTIFICATION_USER'),
      'NATS_NOTIFICATION_USER'
    ),
    NATS_NOTIFICATION_PASSWORD: required(
      values.get('NATS_NOTIFICATION_PASSWORD'),
      'NATS_NOTIFICATION_PASSWORD'
    ),
    NATS_CLIENT_NAME: 'notification-service-l2'
  })
  return Object.freeze({
    forPackage(packageName) {
      if (packageName === 'collaboration-service') return collaboration
      if (packageName === 'notification-service') return notification
      return Object.freeze({ NATS_URL: natsUrl })
    }
  })
}

/** Runs a command while retaining its status for Jest report validation. */
function runAllowFailure(command, args, options) {
  process.stdout.write(`COMMAND ${command} ${args.join(' ')}\n`)
  const result = spawnSync(command, args, { ...options, stdio: 'inherit' })
  process.stdout.write(`EXIT status=${result.status ?? 'spawn-error'}\n`)
  if (result.error) throw result.error
  return result
}

/** Runs one test process asynchronously so disjoint package shards can share setup safely. */
function runAllowFailureAsync(command, args, options, label) {
  process.stdout.write(`COMMAND label=${label} ${command} ${args.join(' ')}\n`)
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: 'inherit' })
    child.once('error', reject)
    child.once('close', (status, signal) => {
      process.stdout.write(
        `EXIT label=${label} status=${status ?? 'signal'} signal=${signal ?? 'none'}\n`
      )
      resolve(Object.freeze({ status, signal }))
    })
  })
}

/** Runs a command and fails on any non-zero status. */
function run(command, args, options) {
  const result = runAllowFailure(command, args, options)
  if (result.status !== 0)
    throw new Error(`COMMAND_FAILED command=${command} exit=${result.status}`)
}

/** Captures one non-secret command result for topology binding. */
function capture(command, args, options) {
  const result = spawnSync(command, args, { ...options, encoding: 'utf8' })
  if (result.error) throw result.error
  if (result.status !== 0)
    throw new Error(`COMMAND_FAILED command=${command} exit=${result.status}`)
  return result.stdout.trim()
}

/** Resolves a spec's closest package root without crossing the service tree. */
function findPackageRoot(file, boundary) {
  let current = path.dirname(file)
  while (current.startsWith(boundary)) {
    if (fs.existsSync(path.join(current, 'package.json'))) return current
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  return undefined
}

/** Recursively visits ordinary files below the service tree. */
function visit(root, callback) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name)
    if (entry.isDirectory()) visit(target, callback)
    else if (entry.isFile()) callback(target)
  }
}

/** Requires one generated fixture input without returning an empty scalar. */
function required(value, key) {
  if (!value) throw new Error(`L2_ENV_REQUIRED key=${key}`)
  return value
}

/** Produces a portable evidence filename for one package. */
function safeName(value) {
  return value.replaceAll(/[^a-z0-9-]+/giu, '_')
}

/** Rejects a prepared L2 shard when the verified build artifact was not restored. */
function assertPreparedBuild(repositoryRoot, inventory) {
  for (const target of ['src/common/dist', 'src/common/src/generated'])
    if (!fs.existsSync(path.join(repositoryRoot, target)))
      throw new Error(`L2_PREPARED_BUILD_MISSING path=${target}`)
  for (const entry of inventory) {
    const generated = path.join(entry.packageRoot, 'prisma', 'generated', 'prisma')
    if (!fs.existsSync(generated)) {
      throw new Error(`L2_PREPARED_BUILD_MISSING path=${path.relative(repositoryRoot, generated)}`)
    }
    const engines = fs.readdirSync(generated).filter((name) => /query_engine-.*\.node$/.test(name))
    if (engines.length !== 1) {
      throw new Error(
        `L2_PREPARED_ENGINE_COUNT_INVALID path=${path.relative(repositoryRoot, generated)} count=${engines.length}`
      )
    }
  }
  process.stdout.write(`L2_PREPARED_BUILD=VERIFIED services=${inventory.length}\n`)
}

/** Resolves the repository root from this script location. */
function defaultRepositoryRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const [command, ...rawArguments] = process.argv.slice(2)
    const prepared = rawArguments.includes('--prepared')
    const { parallelShardCount, remaining: parallelArguments } = parseParallelShardFlag(
      rawArguments.filter((argument) => argument !== '--prepared')
    )
    const {
      shardIndex,
      shardCount,
      remaining: parsedArguments
    } = parseShardFlags(parallelArguments)
    const packageNames = parsedArguments
    if (command === 'check') {
      const inventory = discoverL2Packages()
      for (const entry of inventory) {
        process.stdout.write(`L2_DISCOVERY package=${entry.name} suites=${entry.specs.length}\n`)
      }
      process.stdout.write(
        `L2_MATRIX_CHECK=PASS packages=${inventory.length} suites=${inventory.reduce((sum, entry) => sum + entry.specs.length, 0)}\n`
      )
    } else if (command === 'run') {
      await runL2Matrix(
        defaultRepositoryRoot(),
        packageNames,
        shardIndex,
        shardCount,
        prepared,
        parallelShardCount
      )
    } else {
      throw new Error('L2_TEST_COMMAND_REQUIRED expected=check|run')
    }
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`
    )
    process.exitCode = 1
  }
}
