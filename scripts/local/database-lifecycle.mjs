import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  checkEnvironment,
  normalizeTaskKey,
  parseEnvironmentFile
} from './worktree-env.mjs'
import {
  EXPECTED_PRISMA_SERVICE_COUNT,
  defaultRepositoryRoot,
  discoverBackendPackages,
  repositoryRelative
} from './reproducible-build-lib.mjs'

const STATE_VERSION = 1
const INFRA_COMPOSE = 'docker-compose.infra.yml'
const MAIN_COMPOSE = 'docker-compose.yml'
const COMPLETED_SERVICES = new Set(['nats-bootstrap', 'minio-init', 'grpc-trust-bootstrap'])
const HEALTHY_SERVICES = new Set(['postgres', 'redis', 'nats', 'minio', 'mysql'])
const LONG_RUNNING_INFRA_SERVICES = Object.freeze([
  'postgres',
  'redis',
  'nats',
  'minio',
  'tempo',
  'loki',
  'otel-collector',
  'grafana',
  'mysql',
  'nacos'
])

/** Runs a command with literal output and fails on a non-zero exit status. */
function run(command, args, options = {}) {
  process.stdout.write(`COMMAND ${command} ${args.join(' ')}\n`)
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    encoding: 'utf8',
    input: options.input
  })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  process.stdout.write(`EXIT status=${result.status ?? 'spawn-error'}\n`)
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`COMMAND_FAILED command=${command} exit=${result.status}`)
  return result.stdout.trim()
}

/** Captures machine-readable output without duplicating it into the evidence stream. */
function capture(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    encoding: 'utf8',
    input: options.input
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    if (result.stderr) process.stderr.write(result.stderr)
    throw new Error(`COMMAND_FAILED command=${command} exit=${result.status}`)
  }
  return result.stdout.trim()
}

/** Verifies one migrated database matches its service datamodel without printing credentials. */
function assertSchemaMatches(context, service, databaseUrl) {
  const schema = repositoryRelative(context.repositoryRoot, service.schema)
  process.stdout.write(
    `COMMAND pnpm exec prisma migrate diff --exit-code --from-url <TASK_DATABASE_URL> --to-schema-datamodel ${schema}\n`
  )
  const result = spawnSync(
    'pnpm',
    [
      'exec',
      'prisma',
      'migrate',
      'diff',
      '--exit-code',
      '--from-url',
      databaseUrl,
      '--to-schema-datamodel',
      service.schema
    ],
    { cwd: context.repositoryRoot, encoding: 'utf8' }
  )
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  process.stdout.write(`EXIT status=${result.status ?? 'spawn-error'}\n`)
  if (result.error) throw result.error
  if (result.status === 2) throw new Error(`SCHEMA_DRIFT service=${service.name}`)
  if (result.status !== 0) {
    throw new Error(`SCHEMA_DIFF_FAILED service=${service.name} exit=${result.status}`)
  }
  process.stdout.write(`SCHEMA_MATCH service=${service.name}\n`)
}

/** Creates a deterministic local-only fixture value without writing it to Git. */
function fixture(taskKey, purpose, length = 32) {
  return crypto.createHash('sha256').update(`oes-local:${taskKey}:${purpose}`).digest('hex').slice(0, length)
}

/** Quotes one dotenv value so Compose does not interpolate NATS `$JS` subjects. */
function quoteEnvironment(value) {
  if (value.startsWith("'$JS.") && value.endsWith("'")) {
    return `"${value.replaceAll('$', () => '$$')}"`
  }
  if (value.includes("'")) throw new Error('COMPOSE_ENV_UNQUOTABLE_VALUE')
  return `'${value}'`
}

/** Loads the exact task-owned database inventory produced by env:bootstrap. */
export function loadDatabaseContext(repositoryRoot = defaultRepositoryRoot()) {
  checkEnvironment({ repositoryRoot, output: { write() {} } })
  const rootValues = parseEnvironmentFile(fs.readFileSync(path.join(repositoryRoot, '.env'), 'utf8'))
  const taskKey = normalizeTaskKey(rootValues.get('OES_TASK_KEY'))
  const services = discoverBackendPackages(repositoryRoot)
    .filter((entry) => entry.prismaSchema)
    .map((entry) => {
      const serviceEnv = parseEnvironmentFile(
        fs.readFileSync(path.join(entry.directory, '.env'), 'utf8'),
        repositoryRelative(repositoryRoot, path.join(entry.directory, '.env'))
      )
      const localUrl = new URL(serviceEnv.get('DATABASE_URL'))
      return {
        database: decodeURIComponent(localUrl.pathname.slice(1)),
        directory: entry.directory,
        name: entry.name,
        schema: entry.prismaSchema
      }
    })
  if (services.length !== EXPECTED_PRISMA_SERVICE_COUNT) {
    throw new Error(
      `DATABASE_INVENTORY_COUNT expected=${EXPECTED_PRISMA_SERVICE_COUNT} actual=${services.length}`
    )
  }
  const databases = new Set(services.map((service) => service.database))
  if (databases.size !== services.length) throw new Error('DATABASE_INVENTORY_DUPLICATE')
  for (const service of services) validateLegacyFragments(service)
  const projectName = `oes_${taskKey}`
  const stateDirectory = path.join(repositoryRoot, '.tmp', 'oes-database-lifecycle', taskKey)
  return { projectName, repositoryRoot, rootValues, services, stateDirectory, taskKey }
}

/** Validates byte-preserving audit artifacts for histories replaced by complete baselines. */
export function validateLegacyFragments(service) {
  const migrationsDirectory = path.join(service.directory, 'prisma', 'migrations')
  const manifestPath = path.join(migrationsDirectory, 'legacy-fragments.json')
  if (!fs.existsSync(manifestPath)) return
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  if (manifest.reason !== 'INCOMPLETE_FROM_EMPTY_AUDIT' || !Array.isArray(manifest.preservedFragments)) {
    throw new Error(`LEGACY_FRAGMENT_MANIFEST_INVALID service=${service.name}`)
  }
  for (const fragment of manifest.preservedFragments) {
    if (!/^[0-9A-Za-z_-]+$/.test(fragment.name) || !/^[a-f0-9]{64}$/.test(fragment.sha256)) {
      throw new Error(`LEGACY_FRAGMENT_ENTRY_INVALID service=${service.name}`)
    }
    const fragmentPath = path.join(migrationsDirectory, `legacy__${fragment.name}.sql`)
    if (!fs.existsSync(fragmentPath)) {
      throw new Error(`LEGACY_FRAGMENT_MISSING service=${service.name} fragment=${fragment.name}`)
    }
    const actual = crypto.createHash('sha256').update(fs.readFileSync(fragmentPath)).digest('hex')
    if (actual !== fragment.sha256) {
      throw new Error(`LEGACY_FRAGMENT_DIGEST_MISMATCH service=${service.name} fragment=${fragment.name}`)
    }
  }
}

/** Produces the ignored Compose environment for one exact local worktree. */
export function composeEnvironment(context) {
  const { rootValues, services, taskKey } = context
  const values = new Map([
    ['OES_COMPOSE_PROJECT', context.projectName],
    ['OES_TASK_KEY', taskKey],
    ['OES_POSTGRES_USER', rootValues.get('OES_POSTGRES_USER')],
    ['OES_POSTGRES_PASSWORD', rootValues.get('OES_POSTGRES_PASSWORD')],
    ['NATS_COLLABORATION_USER', `collaboration_${taskKey}`],
    ['NATS_COLLABORATION_PASSWORD', fixture(taskKey, 'nats-collaboration')],
    ['NATS_NOTIFICATION_USER', `notification_${taskKey}`],
    ['NATS_NOTIFICATION_PASSWORD', fixture(taskKey, 'nats-notification')],
    ['NATS_NOTIFICATION_REPLAY_USER', `notification_replay_${taskKey}`],
    ['NATS_NOTIFICATION_REPLAY_PASSWORD', fixture(taskKey, 'nats-replay')],
    ['NATS_NOTIFICATION_RECOVERY_USER', `notification_recovery_${taskKey}`],
    ['NATS_NOTIFICATION_RECOVERY_PASSWORD', fixture(taskKey, 'nats-recovery')],
    ['NATS_OPERATOR_USER', `operator_${taskKey}`],
    ['NATS_OPERATOR_PASSWORD', fixture(taskKey, 'nats-operator')],
    ['MINIO_ROOT_USER', `minio_${taskKey}`],
    ['MINIO_ROOT_PASSWORD', fixture(taskKey, 'minio', 40)],
    ['MINIO_BUCKET', `oes-${taskKey.replaceAll('_', '-')}-assets`],
    ['GRAFANA_ADMIN_USER', `admin_${taskKey}`],
    ['GRAFANA_ADMIN_PASSWORD', fixture(taskKey, 'grafana', 40)],
    ['NACOS_MYSQL_ROOT_PASSWORD', fixture(taskKey, 'nacos-mysql-root', 40)],
    ['NACOS_MYSQL_PASSWORD', fixture(taskKey, 'nacos-mysql', 40)],
    ['NACOS_AUTH_TOKEN', Buffer.from(fixture(taskKey, 'nacos-token', 48)).toString('base64')],
    ['NACOS_AUTH_IDENTITY_KEY', 'serverIdentity'],
    ['NACOS_AUTH_IDENTITY_VALUE', fixture(taskKey, 'nacos-identity', 32)]
  ])
  const replayConsumer = (state) => `notification-service__replay__${taskKey}__${state}`
  const subject = (state) => `oes.events.collaboration.task.${state}`
  for (const state of ['assigned', 'completed', 'cancelled']) {
    const upper = state.toUpperCase()
    const consumer = replayConsumer(state)
    values.set(
      `NATS_NOTIFICATION_REPLAY_${upper}_CREATE_SUBJECT`,
      `'$JS.API.CONSUMER.CREATE.OES_BUSINESS_EVENTS.${consumer}.${subject(state)}'`
    )
    values.set(
      `NATS_NOTIFICATION_REPLAY_${upper}_INFO_SUBJECT`,
      `'$JS.API.CONSUMER.INFO.OES_BUSINESS_EVENTS.${consumer}'`
    )
    values.set(
      `NATS_NOTIFICATION_REPLAY_${upper}_DELETE_SUBJECT`,
      `'$JS.API.CONSUMER.DELETE.OES_BUSINESS_EVENTS.${consumer}'`
    )
    values.set(
      `NATS_NOTIFICATION_REPLAY_${upper}_NEXT_SUBJECT`,
      `'$JS.API.CONSUMER.MSG.NEXT.OES_BUSINESS_EVENTS.${consumer}'`
    )
    values.set(
      `NATS_NOTIFICATION_REPLAY_${upper}_ACK_SUBJECT`,
      `'$JS.ACK.OES_BUSINESS_EVENTS.${consumer}.>'`
    )
  }
  for (const service of services) {
    const key = `OES_DB_${service.name.toUpperCase().replaceAll('-', '_')}_URL`
    const url = new URL('postgresql://postgres:5432')
    url.username = rootValues.get('OES_POSTGRES_USER')
    url.password = rootValues.get('OES_POSTGRES_PASSWORD')
    url.hostname = 'postgres'
    url.port = '5432'
    url.pathname = `/${service.database}`
    url.searchParams.set('schema', 'public')
    values.set(key, url.toString())
  }
  return values
}

/** Writes the task-local Compose environment atomically with owner-only permissions. */
function writeComposeEnvironment(context) {
  fs.mkdirSync(context.stateDirectory, { recursive: true, mode: 0o700 })
  const environmentPath = path.join(context.stateDirectory, 'compose.env')
  const contents = [...composeEnvironment(context)]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${quoteEnvironment(value)}`)
    .join('\n')
  const temporary = `${environmentPath}.${process.pid}`
  fs.writeFileSync(temporary, `${contents}\n`, { encoding: 'utf8', mode: 0o600 })
  fs.renameSync(temporary, environmentPath)
  fs.chmodSync(environmentPath, 0o600)
  return environmentPath
}

/** Returns the stable ownership fingerprint for rollback validation. */
export function resourceFingerprint(context) {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        projectName: context.projectName,
        taskKey: context.taskKey,
        databases: context.services.map((service) => service.database).sort(),
        infraCompose: crypto
          .createHash('sha256')
          .update(fs.readFileSync(path.join(context.repositoryRoot, INFRA_COMPOSE)))
          .digest('hex')
      })
    )
    .digest('hex')
}

function statePath(context) {
  return path.join(context.stateDirectory, 'state.json')
}

function readState(context) {
  const target = statePath(context)
  if (!fs.existsSync(target)) return undefined
  return JSON.parse(fs.readFileSync(target, 'utf8'))
}

function writeState(context, patch) {
  const current = readState(context) ?? {}
  const state = {
    ...current,
    stateVersion: STATE_VERSION,
    taskKey: context.taskKey,
    projectName: context.projectName,
    resourceFingerprint: resourceFingerprint(context),
    databases: context.services.map((service) => service.database),
    ...patch
  }
  fs.mkdirSync(context.stateDirectory, { recursive: true, mode: 0o700 })
  const target = statePath(context)
  const temporary = `${target}.${process.pid}`
  fs.writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 })
  fs.renameSync(temporary, target)
  return state
}

/** Validates that rollback is still bound to the exact task-owned resource set. */
export function assertRollbackBinding(context, state) {
  if (!state) throw new Error('ROLLBACK_STATE_MISSING')
  if (state.stateVersion !== STATE_VERSION) throw new Error('ROLLBACK_STATE_VERSION_MISMATCH')
  if (state.taskKey !== context.taskKey) throw new Error('ROLLBACK_TASK_MISMATCH')
  if (state.projectName !== context.projectName) throw new Error('ROLLBACK_PROJECT_MISMATCH')
  if (state.resourceFingerprint !== resourceFingerprint(context)) {
    throw new Error('ROLLBACK_RESOURCE_FINGERPRINT_MISMATCH')
  }
}

function composeArgs(context, environmentPath, composeFile, args) {
  return [
    'compose',
    '--env-file',
    environmentPath,
    '--project-name',
    context.projectName,
    '-f',
    composeFile,
    ...args
  ]
}

function compose(context, environmentPath, composeFile, args) {
  return run('docker', composeArgs(context, environmentPath, composeFile, args), {
    cwd: context.repositoryRoot
  })
}

function projectContainerIds(context) {
  const result = spawnSync(
    'docker',
    ['ps', '-aq', '--filter', `label=com.docker.compose.project=${context.projectName}`],
    { encoding: 'utf8' }
  )
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`DOCKER_PS_FAILED exit=${result.status}`)
  return result.stdout.trim().split(/\s+/).filter(Boolean)
}

/** Ensures every discovered project container carries the exact owner label. */
function assertContainerOwnership(context) {
  const ids = projectContainerIds(context)
  for (const id of ids) {
    const owner = capture('docker', [
      'inspect',
      '-f',
      '{{ index .Config.Labels "oes.local.owner" }}',
      id
    ])
    if (owner !== context.taskKey) throw new Error(`RESOURCE_OWNER_MISMATCH container=${id}`)
  }
  return ids
}

function postgresPort(context, environmentPath) {
  const output = compose(context, environmentPath, INFRA_COMPOSE, ['port', 'postgres', '5432'])
  const match = /:(\d+)$/.exec(output.split(/\r?\n/).at(-1))
  if (!match) throw new Error(`POSTGRES_PORT_UNRESOLVED output=${output}`)
  return Number(match[1])
}

function postgresUrl(context, service, port) {
  const url = new URL('postgresql://127.0.0.1')
  url.username = context.rootValues.get('OES_POSTGRES_USER')
  url.password = context.rootValues.get('OES_POSTGRES_PASSWORD')
  url.hostname = '127.0.0.1'
  url.port = String(port)
  url.pathname = `/${service.database}`
  url.searchParams.set('schema', 'public')
  return url.toString()
}

function postgresExec(context, environmentPath, database, sql) {
  return compose(context, environmentPath, INFRA_COMPOSE, [
    'exec',
    '-T',
    'postgres',
    'psql',
    '-v',
    'ON_ERROR_STOP=1',
    '-At',
    '-U',
    context.rootValues.get('OES_POSTGRES_USER'),
    '-d',
    database,
    '-c',
    sql
  ])
}

function createDatabases(context, environmentPath) {
  for (const service of context.services) {
    const exists = postgresExec(
      context,
      environmentPath,
      'postgres',
      `SELECT 1 FROM pg_database WHERE datname = '${service.database}'`
    )
    if (exists !== '1') {
      compose(context, environmentPath, INFRA_COMPOSE, [
        'exec',
        '-T',
        'postgres',
        'createdb',
        '-U',
        context.rootValues.get('OES_POSTGRES_USER'),
        service.database
      ])
      process.stdout.write(`DATABASE_CREATED service=${service.name} database=${service.database}\n`)
    } else {
      process.stdout.write(`DATABASE_PRESENT service=${service.name} database=${service.database}\n`)
    }
  }
}

function migrationCount(service) {
  const migrationsDirectory = path.join(service.directory, 'prisma', 'migrations')
  if (!fs.existsSync(migrationsDirectory)) return 0
  return fs
    .readdirSync(migrationsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(migrationsDirectory, entry.name, 'migration.sql')))
    .length
}

function up(context, environmentPath) {
  writeState(context, { phase: 'STARTING' })
  compose(context, environmentPath, INFRA_COMPOSE, [
    'up',
    '-d',
    '--wait',
    '--wait-timeout',
    '240',
    ...LONG_RUNNING_INFRA_SERVICES
  ])
  compose(context, environmentPath, INFRA_COMPOSE, ['up', '--no-deps', 'nats-bootstrap'])
  compose(context, environmentPath, INFRA_COMPOSE, ['up', '--no-deps', 'minio-init'])
  compose(context, environmentPath, INFRA_COMPOSE, [
    'up',
    '-d',
    '--no-deps',
    'nats-advisory-monitor'
  ])
  assertContainerOwnership(context)
  const port = postgresPort(context, environmentPath)
  writeState(context, { phase: 'UP', postgresPort: port })
  process.stdout.write(`INFRA_UP=PASS project=${context.projectName} postgresPort=${port}\n`)
}

function health(context, environmentPath) {
  const ids = assertContainerOwnership(context)
  if (ids.length === 0) throw new Error('HEALTH_PROJECT_NOT_RUNNING')
  for (const id of ids) {
    const payload = JSON.parse(capture('docker', ['inspect', id]))[0]
    const service = payload.Config.Labels['com.docker.compose.service']
    const status = payload.State.Status
    if (COMPLETED_SERVICES.has(service)) {
      if (status !== 'exited' || payload.State.ExitCode !== 0) {
        throw new Error(`HEALTH_COMPLETION_FAILED service=${service} status=${status} exit=${payload.State.ExitCode}`)
      }
    } else if (status !== 'running') {
      throw new Error(`HEALTH_NOT_RUNNING service=${service} status=${status}`)
    }
    if (HEALTHY_SERVICES.has(service) && payload.State.Health?.Status !== 'healthy') {
      throw new Error(`HEALTH_NOT_HEALTHY service=${service} status=${payload.State.Health?.Status}`)
    }
    process.stdout.write(`HEALTH service=${service} status=${status} health=${payload.State.Health?.Status ?? 'n/a'}\n`)
  }
  writeState(context, { phase: 'HEALTHY' })
  process.stdout.write(`INFRA_HEALTH=PASS containers=${ids.length}\n`)
}

function migrate(context, environmentPath) {
  const state = readState(context)
  assertRollbackBinding(context, state)
  createDatabases(context, environmentPath)
  const port = state.postgresPort ?? postgresPort(context, environmentPath)
  const failureAfterRaw = process.env.OES_DB_FAIL_AFTER
  const failureAfter = failureAfterRaw === undefined ? undefined : Number(failureAfterRaw)
  if (failureAfter !== undefined && (!Number.isInteger(failureAfter) || failureAfter < 0)) {
    throw new Error('MIGRATION_FAILURE_INJECTION_INVALID')
  }
  let completed = 0
  for (const service of context.services) {
    if (failureAfter === completed) {
      throw new Error(`MIGRATION_FAILURE_INJECTED after=${completed}`)
    }
    run(
      'pnpm',
      ['exec', 'prisma', 'migrate', 'deploy', '--schema', repositoryRelative(context.repositoryRoot, service.schema)],
      {
        cwd: context.repositoryRoot,
        env: { ...process.env, DATABASE_URL: postgresUrl(context, service, port) }
      }
    )
    completed += 1
    process.stdout.write(
      `MIGRATION_DEPLOYED service=${service.name} database=${service.database} expected=${migrationCount(service)}\n`
    )
  }
  writeState(context, { phase: 'MIGRATED', postgresPort: port })
  process.stdout.write(`DATABASE_MIGRATE=PASS services=${completed}\n`)
}

function seedSnapshot(context, environmentPath) {
  const permission = context.services.find((service) => service.name === 'permission-service')
  const collaboration = context.services.find((service) => service.name === 'collaboration-service')
  return {
    collaborationTaskCount: Number(
      postgresExec(context, environmentPath, collaboration.database, 'SELECT count(*) FROM "CollaborationTask"')
    ),
    permissionCount: Number(
      postgresExec(context, environmentPath, permission.database, 'SELECT count(*) FROM "Permission"')
    ),
    roleCount: Number(postgresExec(context, environmentPath, permission.database, 'SELECT count(*) FROM "Role"'))
  }
}

function seed(context, environmentPath) {
  const state = readState(context)
  assertRollbackBinding(context, state)
  const port = state.postgresPort ?? postgresPort(context, environmentPath)
  const permission = context.services.find((service) => service.name === 'permission-service')
  const collaboration = context.services.find((service) => service.name === 'collaboration-service')
  run('pnpm', ['prisma:generate:all'], { cwd: context.repositoryRoot })
  run('pnpm', ['--filter', 'permission-service', 'seed:apply', '--', '--apply'], {
    cwd: context.repositoryRoot,
    env: { ...process.env, DATABASE_URL: postgresUrl(context, permission, port) }
  })
  run('pnpm', ['--filter', 'collaboration-service', 'seed:p1'], {
    cwd: context.repositoryRoot,
    env: {
      ...process.env,
      COLLABORATION_DATABASE_URL: postgresUrl(context, collaboration, port),
      DATABASE_URL: postgresUrl(context, collaboration, port)
    }
  })
  const snapshot = seedSnapshot(context, environmentPath)
  if (state.seedSnapshot && JSON.stringify(state.seedSnapshot) !== JSON.stringify(snapshot)) {
    throw new Error(
      `SEED_NOT_IDEMPOTENT before=${JSON.stringify(state.seedSnapshot)} after=${JSON.stringify(snapshot)}`
    )
  }
  for (const service of context.services) {
    const status = ['permission-service', 'collaboration-service'].includes(service.name)
      ? 'APPLIED'
      : 'NOT_DECLARED'
    process.stdout.write(`SEED service=${service.name} status=${status}\n`)
  }
  writeState(context, { phase: 'SEEDED', postgresPort: port, seedSnapshot: snapshot })
  process.stdout.write(`DATABASE_SEED=PASS snapshot=${JSON.stringify(snapshot)}\n`)
}

function verify(context, environmentPath) {
  const state = readState(context)
  assertRollbackBinding(context, state)
  const seen = new Set()
  for (const service of context.services) {
    if (seen.has(service.database)) throw new Error(`VERIFY_SHARED_DATABASE database=${service.database}`)
    seen.add(service.database)
    const expected = migrationCount(service)
    const applied = Number(
      postgresExec(
        context,
        environmentPath,
        service.database,
        'SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL'
      )
    )
    if (applied !== expected) {
      throw new Error(`VERIFY_MIGRATION_COUNT service=${service.name} expected=${expected} actual=${applied}`)
    }
    assertSchemaMatches(context, service, postgresUrl(context, service, state.postgresPort))
    process.stdout.write(
      `VERIFY service=${service.name} database=${service.database} migrations=${applied} status=PASS\n`
    )
  }
  if (state.seedSnapshot) {
    const current = seedSnapshot(context, environmentPath)
    if (JSON.stringify(current) !== JSON.stringify(state.seedSnapshot)) {
      throw new Error('VERIFY_SEED_SNAPSHOT_MISMATCH')
    }
  }
  writeState(context, { phase: 'VERIFIED' })
  process.stdout.write(`DATABASE_VERIFY=PASS databases=${seen.size}\n`)
}

function rollback(context, environmentPath) {
  const state = readState(context)
  assertRollbackBinding(context, state)
  assertContainerOwnership(context)
  compose(context, environmentPath, MAIN_COMPOSE, ['down', '--volumes', '--remove-orphans', '--timeout', '30'])
  const remaining = projectContainerIds(context)
  if (remaining.length !== 0) throw new Error(`ROLLBACK_CONTAINERS_REMAIN count=${remaining.length}`)
  const resourceQueries = [
    ['volume', 'ls', '-q', '--filter', `label=oes.local.owner=${context.taskKey}`],
    ['network', 'ls', '-q', '--filter', `label=oes.local.owner=${context.taskKey}`]
  ]
  for (const args of resourceQueries) {
    const output = run('docker', args)
    if (output) throw new Error(`ROLLBACK_RESOURCES_REMAIN kind=${args[0]}`)
  }
  fs.rmSync(context.stateDirectory, { recursive: true, force: true })
  process.stdout.write(`DATABASE_ROLLBACK=PASS project=${context.projectName}\n`)
}

function config(context, environmentPath) {
  compose(context, environmentPath, INFRA_COMPOSE, ['config', '--quiet'])
  const services = compose(context, environmentPath, MAIN_COMPOSE, ['config', '--services'])
    .split(/\r?\n/)
    .filter(Boolean)
  const backend = new Set(context.services.map((service) => service.name))
  const missing = [...backend].filter((service) => !services.includes(service))
  if (missing.length) throw new Error(`COMPOSE_SERVICE_MISSING services=${missing.join(',')}`)
  if (services.includes('entity-service') || services.includes('resource-service')) {
    throw new Error('COMPOSE_STALE_SERVICE_PRESENT')
  }
  if (!services.includes('api-gateway')) throw new Error('COMPOSE_GATEWAY_MISSING')
  const rendered = JSON.parse(
    capture('docker', composeArgs(context, environmentPath, MAIN_COMPOSE, ['config', '--format', 'json']), {
      cwd: context.repositoryRoot
    })
  )
  for (const service of context.services) {
    const definition = rendered.services[service.name]
    const expectedPath = repositoryRelative(context.repositoryRoot, service.directory)
    if (definition.build?.dockerfile !== 'docker/Dockerfile.service') {
      throw new Error(`COMPOSE_DOCKERFILE_INVALID service=${service.name}`)
    }
    if (
      definition.build?.args?.PACKAGE_NAME !== service.name ||
      definition.build?.args?.SERVICE_PATH !== expectedPath
    ) {
      throw new Error(`COMPOSE_BUILD_BINDING_INVALID service=${service.name}`)
    }
    const url = new URL(definition.environment?.DATABASE_URL)
    if (url.hostname !== 'postgres' || decodeURIComponent(url.pathname.slice(1)) !== service.database) {
      throw new Error(`COMPOSE_DATABASE_BINDING_INVALID service=${service.name}`)
    }
  }
  const infra = JSON.parse(
    capture('docker', composeArgs(context, environmentPath, INFRA_COMPOSE, ['config', '--format', 'json']), {
      cwd: context.repositoryRoot
    })
  )
  for (const [name, definition] of Object.entries(infra.services)) {
    if (definition.labels?.['oes.local.owner'] !== context.taskKey) {
      throw new Error(`COMPOSE_OWNER_LABEL_INVALID service=${name}`)
    }
    for (const port of definition.ports ?? []) {
      if (port.host_ip !== '127.0.0.1' || port.published !== undefined) {
        throw new Error(`COMPOSE_HOST_PORT_NOT_ISOLATED service=${name}`)
      }
    }
  }
  for (const [kind, resources] of [
    ['volume', infra.volumes],
    ['network', infra.networks]
  ]) {
    for (const [name, definition] of Object.entries(resources ?? {})) {
      if (definition.labels?.['oes.local.owner'] !== context.taskKey) {
        throw new Error(`COMPOSE_RESOURCE_LABEL_INVALID kind=${kind} resource=${name}`)
      }
    }
  }
  process.stdout.write(`COMPOSE_CONFIG=PASS backendServices=${backend.size} totalServices=${services.length}\n`)
}

/** Executes the bounded database lifecycle CLI. */
export function main(argv = process.argv.slice(2)) {
  const [command] = argv
  const context = loadDatabaseContext()
  const environmentPath = writeComposeEnvironment(context)
  if (command === 'config') config(context, environmentPath)
  else if (command === 'up') up(context, environmentPath)
  else if (command === 'health') health(context, environmentPath)
  else if (command === 'migrate') migrate(context, environmentPath)
  else if (command === 'seed') seed(context, environmentPath)
  else if (command === 'verify') verify(context, environmentPath)
  else if (command === 'rollback') rollback(context, environmentPath)
  else if (command === 'cycle') {
    up(context, environmentPath)
    health(context, environmentPath)
    migrate(context, environmentPath)
    seed(context, environmentPath)
    verify(context, environmentPath)
    rollback(context, environmentPath)
  } else {
    throw new Error('DATABASE_COMMAND_REQUIRED expected=config|up|health|migrate|seed|verify|rollback|cycle')
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
