import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { loadDatabaseContext } from './database-lifecycle.mjs'
import { parseEnvironmentFile } from './worktree-env.mjs'
import { assertJestResult, assertNoTestResidue } from './test-matrix.mjs'

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

/** Runs all L2 specs against exact task-owned Postgres/NATS resources and always rolls them back. */
export function runL2Matrix(repositoryRoot = defaultRepositoryRoot(), requestedNames = []) {
  const inventory = selectL2Packages(discoverL2Packages(repositoryRoot), requestedNames)
  assertNoTestResidue(repositoryRoot)
  run('pnpm', environmentPreparationArgs(repositoryRoot), { cwd: repositoryRoot })
  const context = loadDatabaseContext(repositoryRoot)
  const evidenceDirectory = path.join(repositoryRoot, '.tmp', 'oes-test-matrix', 'l2')
  fs.mkdirSync(evidenceDirectory, { recursive: true })
  const statePath = path.join(context.stateDirectory, 'state.json')
  let primaryFailure
  let lifecycleStarted = false
  let totalSuites = 0
  let totalTests = 0
  try {
    run('pnpm', ['generated:all'], { cwd: repositoryRoot })
    run('pnpm', ['common:build'], { cwd: repositoryRoot })
    run('pnpm', ['db:up'], { cwd: repositoryRoot })
    lifecycleStarted = true
    run('pnpm', ['db:health'], { cwd: repositoryRoot })
    run('pnpm', ['db:migrate'], { cwd: repositoryRoot })
    const trustEnvironment = bootstrapTaskTrust(context, repositoryRoot)

    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'))
    const postgresPort = Number(state.postgresPort)
    if (!Number.isInteger(postgresPort) || postgresPort < 1)
      throw new Error('L2_POSTGRES_PORT_INVALID')
    const nats = loadNatsEnvironment(context, repositoryRoot)
    const services = new Map(context.services.map((service) => [service.name, service]))
    const testFailures = []
    for (const entry of inventory) {
      const service = services.get(entry.name)
      if (!service) throw new Error(`L2_DATABASE_BINDING_MISSING package=${entry.name}`)
      const databaseUrl = serviceDatabaseUrl(context, service, postgresPort)
      const outputFile = path.join(evidenceDirectory, `${safeName(entry.name)}.json`)
      fs.rmSync(outputFile, { force: true })
      const args = [
        '--filter',
        entry.name,
        'exec',
        'jest',
        '--config',
        'jest.config.js',
        '--runInBand',
        '--runTestsByPath',
        ...entry.specs,
        '--json',
        '--outputFile',
        outputFile
      ]
      const result = runAllowFailure('pnpm', args, {
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
      })
      if (!fs.existsSync(outputFile)) {
        testFailures.push(
          new Error(`L2_JEST_REPORT_MISSING package=${entry.name} exit=${result.status}`)
        )
        process.stdout.write(`L2_SURFACE package=${entry.name} status=FAIL reason=report-missing\n`)
        continue
      }
      const report = JSON.parse(fs.readFileSync(outputFile, 'utf8'))
      try {
        assertJestResult(entry.name, report, entry.specs.length)
        if (result.status !== 0)
          throw new Error(`COMMAND_FAILED command=pnpm exit=${result.status}`)
      } catch (error) {
        testFailures.push(error)
        process.stdout.write(
          `L2_SURFACE package=${entry.name} suites=${report.numTotalTestSuites} tests=${report.numTotalTests} failed=${report.numFailedTests} pending=${report.numPendingTests} todo=${report.numTodoTests} status=FAIL\n`
        )
        continue
      }
      totalSuites += report.numTotalTestSuites
      totalTests += report.numTotalTests
      process.stdout.write(
        `L2_SURFACE package=${entry.name} suites=${report.numTotalTestSuites} tests=${report.numTotalTests} status=PASS\n`
      )
    }
    if (testFailures.length > 0) {
      throw new AggregateError(testFailures, `L2_TEST_FAILURES count=${testFailures.length}`)
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

/** Bootstraps a missing environment once and validates an existing owner binding without rewriting it. */
export function environmentPreparationArgs(repositoryRoot) {
  return Object.freeze(
    fs.existsSync(path.join(repositoryRoot, '.env')) ? ['env:check'] : ['env:bootstrap']
  )
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

/** Resolves the repository root from this script location. */
function defaultRepositoryRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const [command, ...rawPackageNames] = process.argv.slice(2)
    const packageNames = rawPackageNames.filter((name) => name !== '--')
    if (command === 'check') {
      const inventory = discoverL2Packages()
      for (const entry of inventory) {
        process.stdout.write(`L2_DISCOVERY package=${entry.name} suites=${entry.specs.length}\n`)
      }
      process.stdout.write(
        `L2_MATRIX_CHECK=PASS packages=${inventory.length} suites=${inventory.reduce((sum, entry) => sum + entry.specs.length, 0)}\n`
      )
    } else if (command === 'run') {
      runL2Matrix(defaultRepositoryRoot(), packageNames)
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
