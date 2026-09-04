import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { loadDatabaseContext } from '../../local/database-lifecycle.mjs'
import { parseEnvironmentFile } from '../../local/worktree-env.mjs'

/** Runs a lifecycle command with literal output and a checked exit status. */
function run(command, args, options = {}) {
  process.stdout.write(`RUNTIME_COMMAND ${JSON.stringify([command, ...args])}\n`)
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env || process.env,
    encoding: 'utf8'
  })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  process.stdout.write(`RUNTIME_EXIT status=${result.status ?? 'spawn-error'}\n`)
  if (result.error) throw result.error
  if (result.status !== 0)
    throw new Error(`Runtime command failed: ${command} exit=${result.status}`)
  return result.stdout.trim()
}

/** Requires a generated runtime value without exposing its secret. */
function required(value, key) {
  if (!value) throw new Error(`INTEGRATION_ENV_REQUIRED key=${key}`)
  return value
}

/** Reuses an existing worktree owner locally while preserving an explicit isolated CI owner. */
export function resolveIntegrationTaskKey(root, explicit, fallback) {
  if (explicit) return explicit
  const environmentPath = path.join(root, '.env')
  if (!fs.existsSync(environmentPath)) return fallback
  const values = parseEnvironmentFile(fs.readFileSync(environmentPath, 'utf8'), '.env')
  return required(values.get('OES_TASK_KEY'), 'OES_TASK_KEY')
}

/** Builds a task-owned loopback URL for one dynamically discovered service database. */
function serviceDatabaseUrl(context, service, postgresPort) {
  const url = new URL('postgresql://127.0.0.1')
  url.username = required(context.rootValues.get('OES_POSTGRES_USER'), 'OES_POSTGRES_USER')
  url.password = required(context.rootValues.get('OES_POSTGRES_PASSWORD'), 'OES_POSTGRES_PASSWORD')
  url.port = String(postgresPort)
  url.pathname = `/${service.database}`
  url.searchParams.set('schema', 'public')
  return url.toString()
}

/** Synchronizes one disposable Integration database with its current Prisma datamodel. */
export function synchronizeIntegrationSchemas({ context, execute, postgresPort, services, root }) {
  for (const service of services) {
    execute(
      'pnpm',
      [
        'exec',
        'prisma',
        'db',
        'push',
        '--schema',
        service.schema,
        '--skip-generate',
        '--accept-data-loss'
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          DATABASE_URL: serviceDatabaseUrl(context, service, postgresPort),
          NODE_ENV: 'test'
        }
      }
    )
    process.stdout.write(`INTEGRATION_SCHEMA_SYNC service=${service.name} status=PASS\n`)
  }
}

/** Builds one owner-scoped environment from the ready task runtime inventory. */
export function integrationEnvironmentForOwner({
  context,
  serviceMap,
  postgresPort,
  nats,
  trust,
  ownerName
}) {
  const service = serviceMap.get(ownerName)
  const databaseUrl = service ? serviceDatabaseUrl(context, service, postgresPort) : undefined
  const natsEnvironment =
    ownerName === 'collaboration-service'
      ? nats.collaboration
      : ownerName === 'notification-service'
        ? nats.notification
        : nats.default
  const namedDatabaseKey = databaseUrl
    ? `${ownerName
        .replace(/-service$/u, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toUpperCase()}_DATABASE_URL`
    : undefined
  return {
    NODE_ENV: 'test',
    ...(databaseUrl
      ? {
          DATABASE_URL: databaseUrl,
          OES_INTEGRATION_DATABASE_URL: databaseUrl,
          [namedDatabaseKey]: databaseUrl
        }
      : {}),
    ...natsEnvironment,
    ...(ownerName === 'collaboration-service' ? { ...trust, EVENT_BUS_LIVE: 'true' } : {}),
    ...(ownerName === 'notification-service' ? { NOTIFICATION_EVENT_LIVE_TEST: 'true' } : {}),
    NOTIFICATION_DELIVERY_PAYLOAD_KEY: crypto
      .createHash('sha256')
      .update(`oes-integration:${context.taskKey}:${ownerName}`)
      .digest('base64')
  }
}

/** Reads the task-owned NATS endpoint and credentials after readiness succeeds. */
function loadNatsEnvironment(context, root) {
  const environmentPath = path.join(context.stateDirectory, 'compose.env')
  const values = parseEnvironmentFile(
    fs.readFileSync(environmentPath, 'utf8'),
    path.relative(root, environmentPath)
  )
  const port = run(
    'docker',
    [
      'compose',
      '--env-file',
      environmentPath,
      '--project-name',
      context.projectName,
      '-f',
      'docker-compose.infra.yml',
      'port',
      'nats',
      '4222'
    ],
    { cwd: root }
  ).match(/127\.0\.0\.1:(\d+)/)?.[1]
  if (!port) throw new Error('INTEGRATION_NATS_PORT_INVALID')
  const url = `nats://127.0.0.1:${port}`
  return {
    default: { NATS_URL: url },
    collaboration: {
      NATS_URL: url,
      NATS_USER: required(values.get('NATS_COLLABORATION_USER'), 'NATS_COLLABORATION_USER'),
      NATS_PASSWORD: required(
        values.get('NATS_COLLABORATION_PASSWORD'),
        'NATS_COLLABORATION_PASSWORD'
      ),
      NATS_CLIENT_NAME: `collaboration-${context.taskKey}`,
      COLLABORATION_OUTBOX_INTERVAL_MS: '300000'
    },
    notification: {
      NATS_URL: url,
      NATS_USER: required(values.get('NATS_NOTIFICATION_USER'), 'NATS_NOTIFICATION_USER'),
      NATS_PASSWORD: required(
        values.get('NATS_NOTIFICATION_PASSWORD'),
        'NATS_NOTIFICATION_PASSWORD'
      ),
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
      NATS_CLIENT_NAME: `notification-${context.taskKey}`
    }
  }
}

/** Creates owner-local mTLS material for integration clients that use the trusted runtime. */
function bootstrapTaskTrust(context, root) {
  const trustDirectory = path.join(context.stateDirectory, 'grpc-trust')
  run('bash', ['docker/grpc-trust/bootstrap-local-trust.sh', '--output', trustDirectory], {
    cwd: root,
    env: { ...process.env, OES_TRUST_ENV: 'local', OES_FORCE_RENEW: 'true' }
  })
  const current = path.join(trustDirectory, 'collaboration-service', 'current')
  const environment = {
    OES_GRPC_TLS_ENABLED: 'true',
    OES_GRPC_TLS_MIN_VERSION: 'TLSv1.2',
    OES_GRPC_TLS_CA_PATH: path.join(current, 'ca.pem'),
    OES_GRPC_TLS_CERT_PATH: path.join(current, 'cert.pem'),
    OES_GRPC_TLS_KEY_PATH: path.join(current, 'key.pem'),
    OES_WORKLOAD_SPIFFE_ID: 'spiffe://local.oes.internal/ns/oes/sa/collaboration-service'
  }
  for (const key of ['OES_GRPC_TLS_CA_PATH', 'OES_GRPC_TLS_CERT_PATH', 'OES_GRPC_TLS_KEY_PATH']) {
    if (!fs.existsSync(environment[key]))
      throw new Error(`INTEGRATION_TRUST_MATERIAL_MISSING key=${key}`)
  }
  return environment
}

/** Rejects every task-owned Docker or lifecycle residue after teardown. */
function assertNoResidue(root, taskKey, stateDirectory) {
  if (fs.existsSync(path.join(stateDirectory, 'state.json'))) {
    throw new Error(`INTEGRATION_STATE_REMAINS path=${stateDirectory}`)
  }
  for (const args of [
    ['ps', '-aq', '--filter', `label=oes.local.owner=${taskKey}`],
    ['volume', 'ls', '-q', '--filter', `label=oes.local.owner=${taskKey}`],
    ['network', 'ls', '-q', '--filter', `label=oes.local.owner=${taskKey}`]
  ]) {
    const output = run('docker', args, { cwd: root })
    if (output) throw new Error(`INTEGRATION_RESOURCE_REMAINS kind=${args[0]}`)
  }
  process.stdout.write(`INTEGRATION_RESIDUE=PASS owner=${taskKey}\n`)
}

/** Runs selected integration groups against one isolated, ready, migrated runtime and always tears it down. */
export async function withIntegrationRuntime({
  root,
  ownerNames,
  runTests,
  taskKey,
  adapters = {}
}) {
  const execute = adapters.run || run
  const loadContext = adapters.loadDatabaseContext || loadDatabaseContext
  const readState =
    adapters.readState ||
    ((context) =>
      JSON.parse(fs.readFileSync(path.join(context.stateDirectory, 'state.json'), 'utf8')))
  const loadNats = adapters.loadNatsEnvironment || loadNatsEnvironment
  const bootstrapTrust = adapters.bootstrapTaskTrust || bootstrapTaskTrust
  const checkResidue = adapters.assertNoResidue || assertNoResidue
  let context
  let started = false
  let primaryFailure
  let value
  const normalizedKey = taskKey.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80)
  try {
    execute('pnpm', ['env:ensure', '--', `--task-key=${normalizedKey}`], { cwd: root })
    context = loadContext(root)
    const serviceMap = new Map(context.services.map((service) => [service.name, service]))
    const selectedServices = [...new Set(ownerNames)]
      .map((name) => serviceMap.get(name))
      .filter(Boolean)
      .sort((left, right) => left.name.localeCompare(right.name))
    execute('pnpm', ['generated:all'], { cwd: root })
    execute('pnpm', ['common:build'], { cwd: root })
    execute('pnpm', ['db:up', '--', '--profile', 'integration'], { cwd: root })
    started = true
    execute('pnpm', ['db:health'], { cwd: root })
    const state = readState(context)
    if (!Number.isInteger(state.postgresPort) || state.postgresPort < 1) {
      throw new Error('INTEGRATION_POSTGRES_PORT_INVALID')
    }
    if (selectedServices.length) {
      execute(
        'pnpm',
        [
          'db:migrate',
          '--',
          '--services',
          selectedServices.map((service) => service.name).join(',')
        ],
        { cwd: root }
      )
      synchronizeIntegrationSchemas({
        context,
        execute,
        postgresPort: state.postgresPort,
        root,
        services: selectedServices
      })
    }
    const nats = loadNats(context, root)
    const trust = ownerNames.includes('collaboration-service') ? bootstrapTrust(context, root) : {}
    const environmentForOwner = (ownerName) =>
      integrationEnvironmentForOwner({
        context,
        serviceMap,
        postgresPort: state.postgresPort,
        nats,
        trust,
        ownerName
      })
    value = await runTests(environmentForOwner)
  } catch (error) {
    primaryFailure = error
  } finally {
    if (context && (started || fs.existsSync(path.join(context.stateDirectory, 'state.json')))) {
      try {
        execute('pnpm', ['db:rollback'], { cwd: root })
      } catch (error) {
        primaryFailure = primaryFailure
          ? new AggregateError([primaryFailure, error], 'INTEGRATION_AND_ROLLBACK_FAILED')
          : error
      }
    }
    if (context) {
      try {
        checkResidue(root, context.taskKey, context.stateDirectory)
      } catch (error) {
        primaryFailure = primaryFailure
          ? new AggregateError([primaryFailure, error], 'INTEGRATION_AND_RESIDUE_CHECK_FAILED')
          : error
      }
    }
  }
  if (primaryFailure) throw primaryFailure
  return value
}
