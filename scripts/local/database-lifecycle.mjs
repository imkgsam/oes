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
import { buildTenantWebAuthSeedEnvironment } from './tenant-web-auth-seed-environment.mjs'
import {
  AUTH_ACCEPTANCE_FIXTURES,
  PAGE_ACCEPTANCE_FIXTURES
} from './tenant-web-auth-test-fixtures.mjs'
import {
  EXPECTED_PRISMA_SERVICE_COUNT,
  defaultRepositoryRoot,
  discoverBackendPackages,
  repositoryRelative
} from './reproducible-build-lib.mjs'

const STATE_VERSION = 1
const INFRA_COMPOSE = 'docker-compose.infra.yml'
const MAIN_COMPOSE = 'docker-compose.yml'
export const DATABASE_LIFECYCLE_INIT_SERVICES = Object.freeze([
  'nats-bootstrap',
  'minio-init',
  'nacos-auth-bootstrap'
])
const COMPLETED_SERVICES = new Set([
  ...DATABASE_LIFECYCLE_INIT_SERVICES,
  'grpc-trust-bootstrap'
])
const HEALTHY_SERVICES = new Set(['postgres', 'redis', 'nats', 'minio', 'mysql'])
const HTTP_READINESS = Object.freeze({
  tempo: { path: '/ready', port: 3200 },
  loki: { path: '/ready', port: 3100 },
  'otel-collector': { path: '/', port: 13133 },
  grafana: { path: '/api/health', port: 3000 },
  nacos: { path: '/nacos/v1/console/health/readiness', port: 8848 }
})
const EXPECTED_INFRA_RESOURCES = Object.freeze({
  network: ['oes_network'],
  volume: [
    'grafana_data',
    'minio_data',
    'nacos_logs',
    'nacos_mysql_data',
    'nats_jetstream_data',
    'otel_logs',
    'postgres_data',
    'redis_data'
  ]
})
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
const LIFECYCLE_INFRA_SERVICES = Object.freeze([
  ...LONG_RUNNING_INFRA_SERVICES,
  ...DATABASE_LIFECYCLE_INIT_SERVICES,
  'nats-advisory-monitor'
])
const INFRA_PROFILES = Object.freeze({
  full: Object.freeze({
    initServices: DATABASE_LIFECYCLE_INIT_SERVICES,
    longRunningServices: LONG_RUNNING_INFRA_SERVICES,
    monitor: true,
    resources: EXPECTED_INFRA_RESOURCES
  }),
  l2: Object.freeze({
    initServices: Object.freeze(['nats-bootstrap']),
    longRunningServices: Object.freeze(['postgres', 'nats']),
    monitor: false,
    resources: Object.freeze({
      network: Object.freeze(['oes_network']),
      volume: Object.freeze(['nats_jetstream_data', 'postgres_data'])
    })
  })
})

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

/** Creates a deterministic NATS password that is also a valid bare config string scalar. */
function natsPassword(taskKey, purpose) {
  return `n${fixture(taskKey, purpose, 31)}`
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
  for (const service of services) service.baselinePlan = loadBaselineResolvePlan(service)
  const projectName = `oes_${taskKey}`
  const stateDirectory = path.join(repositoryRoot, '.tmp', 'oes-database-lifecycle', taskKey)
  return { projectName, repositoryRoot, rootValues, services, stateDirectory, taskKey }
}

/** Loads and validates an auditable Prisma baseline/resolve plan without changing active history. */
export function loadBaselineResolvePlan(service) {
  const migrationsDirectory = path.join(service.directory, 'prisma', 'migrations')
  const manifestPath = path.join(migrationsDirectory, 'baseline-resolve.json')
  if (!fs.existsSync(manifestPath)) return undefined
  const plan = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  if (
    plan.strategy !== 'PRISMA_BASELINE_RESOLVE' ||
    !/^[0-9A-Za-z_-]+$/.test(plan.baselineMigration) ||
    !/^[a-f0-9]{64}$/.test(plan.baselineSha256) ||
    !Array.isArray(plan.supersededMigrations) ||
    plan.supersededMigrations.length === 0
  ) {
    throw new Error(`BASELINE_RESOLVE_PLAN_INVALID service=${service.name}`)
  }
  const entries = [
    ...plan.supersededMigrations,
    { name: plan.baselineMigration, sha256: plan.baselineSha256 }
  ]
  if (new Set(entries.map((entry) => entry.name)).size !== entries.length) {
    throw new Error(`BASELINE_RESOLVE_PLAN_DUPLICATE service=${service.name}`)
  }
  for (const entry of entries) {
    if (!/^[0-9A-Za-z_-]+$/.test(entry.name) || !/^[a-f0-9]{64}$/.test(entry.sha256)) {
      throw new Error(`BASELINE_RESOLVE_ENTRY_INVALID service=${service.name}`)
    }
    const migrationPath = path.join(migrationsDirectory, entry.name, 'migration.sql')
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`BASELINE_RESOLVE_MIGRATION_MISSING service=${service.name} migration=${entry.name}`)
    }
    const actual = crypto.createHash('sha256').update(fs.readFileSync(migrationPath)).digest('hex')
    if (actual !== entry.sha256) {
      throw new Error(`BASELINE_RESOLVE_DIGEST_MISMATCH service=${service.name} migration=${entry.name}`)
    }
  }
  return plan
}

/** Loads versioned pg_catalog assertions for database objects Prisma cannot model. */
export function loadDatabaseInvariantPlan(service) {
  const target = path.join(service.directory, 'prisma', 'migrations', 'database-invariants.json')
  if (!fs.existsSync(target)) return undefined
  const plan = JSON.parse(fs.readFileSync(target, 'utf8'))
  if (plan.version !== 1 || !Array.isArray(plan.assertions) || plan.assertions.length === 0) {
    throw new Error(`DATABASE_INVARIANT_PLAN_INVALID service=${service.name}`)
  }
  for (const assertion of plan.assertions) {
    if (
      !['constraint', 'function', 'index', 'trigger'].includes(assertion.kind) ||
      !/^[0-9A-Za-z_]+$/.test(assertion.name) ||
      !/^[a-f0-9]{64}$/.test(assertion.sha256)
    ) {
      throw new Error(`DATABASE_INVARIANT_ASSERTION_INVALID service=${service.name}`)
    }
  }
  return plan
}

/** Produces the ignored Compose environment for one exact local worktree. */
export function composeEnvironment(context) {
  const { rootValues, services, taskKey } = context
  const authWorkloadPolicies = JSON.stringify(
    JSON.parse(
      fs.readFileSync(
        path.join(context.repositoryRoot, 'scripts/local/runtime-config/auth-execution-workload-policies.json'),
        'utf8'
      )
    )
  )
  const permissionWorkloadPolicies = JSON.stringify(
    JSON.parse(
      fs.readFileSync(
        path.join(context.repositoryRoot, 'scripts/local/runtime-config/permission-workload-issuance-policies.json'),
        'utf8'
      )
    )
  )
  const nacosUsername = `oes_${taskKey}`
  const nacosPassword = fixture(taskKey, 'nacos-user', 32)
  const nacosPasswordHash = spawnSync('htpasswd', ['-niBC', '10', nacosUsername], {
    encoding: 'utf8',
    input: `${nacosPassword}\n`
  })
  if (nacosPasswordHash.error || nacosPasswordHash.status !== 0) {
    throw new Error('NACOS_PASSWORD_HASH_GENERATION_FAILED')
  }
  const values = new Map([
    ['OES_COMPOSE_PROJECT', context.projectName],
    ['OES_TASK_KEY', taskKey],
    ['OES_POSTGRES_USER', rootValues.get('OES_POSTGRES_USER')],
    ['OES_POSTGRES_PASSWORD', rootValues.get('OES_POSTGRES_PASSWORD')],
    ['AUTH_EXECUTION_WORKLOAD_POLICIES', authWorkloadPolicies],
    ['PERMISSION_WORKLOAD_ISSUANCE_POLICIES', permissionWorkloadPolicies],
    ['AUTH_PERMISSION_WORKLOAD_ISSUANCE_POLICY_VERSION', 'auth-login-owner-facts-v1'],
    ['NATS_COLLABORATION_USER', `collaboration_${taskKey}`],
    ['NATS_COLLABORATION_PASSWORD', natsPassword(taskKey, 'nats-collaboration')],
    ['NATS_NOTIFICATION_USER', `notification_${taskKey}`],
    ['NATS_NOTIFICATION_PASSWORD', natsPassword(taskKey, 'nats-notification')],
    ['NATS_ASSET_USER', `asset_${taskKey}`],
    ['NATS_ASSET_PASSWORD', natsPassword(taskKey, 'nats-asset')],
    ['NATS_SITE_USER', `site_${taskKey}`],
    ['NATS_SITE_PASSWORD', natsPassword(taskKey, 'nats-site')],
    ['NATS_NOTIFICATION_REPLAY_USER', `notification_replay_${taskKey}`],
    ['NATS_NOTIFICATION_REPLAY_PASSWORD', natsPassword(taskKey, 'nats-replay')],
    ['NATS_NOTIFICATION_RECOVERY_USER', `notification_recovery_${taskKey}`],
    ['NATS_NOTIFICATION_RECOVERY_PASSWORD', natsPassword(taskKey, 'nats-recovery')],
    ['NATS_OPERATOR_USER', `operator_${taskKey}`],
    ['NATS_OPERATOR_PASSWORD', natsPassword(taskKey, 'nats-operator')],
    ['SITE_PREVIEW_TOKEN_SECRET', fixture(taskKey, 'site-preview-token', 48)],
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
    ,['NACOS_USERNAME', nacosUsername]
    ,['NACOS_PASSWORD', nacosPassword]
    ,[
      'NACOS_PASSWORD_BCRYPT',
      nacosPasswordHash.stdout.trim().split(':').slice(1).join(':').replace(/^\$2y\$/, '$2a$')
    ]
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
          .digest('hex'),
        resources: EXPECTED_INFRA_RESOURCES,
        services: LIFECYCLE_INFRA_SERVICES
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

/** Builds one command bound only to the Compose model owned by the database lifecycle. */
export function databaseLifecycleComposeArgs(context, environmentPath, args) {
  return composeArgs(context, environmentPath, INFRA_COMPOSE, args)
}

/** Builds the exact non-orphan-deleting rollback command for lifecycle-owned infrastructure. */
export function databaseRollbackComposeArgs(context, environmentPath) {
  return databaseLifecycleComposeArgs(context, environmentPath, [
    'down',
    '--volumes',
    '--timeout',
    '30'
  ])
}

function compose(context, environmentPath, composeFile, args) {
  return run('docker', composeArgs(context, environmentPath, composeFile, args), {
    cwd: context.repositoryRoot
  })
}

/** Renders exact Compose resource names after task/project interpolation. */
function renderedCompose(context, environmentPath, composeFile = INFRA_COMPOSE) {
  return JSON.parse(
    capture(
      'docker',
      composeArgs(context, environmentPath, composeFile, ['config', '--format', 'json']),
      { cwd: context.repositoryRoot }
    )
  )
}

/** Lists every exact named network/volume emitted by a rendered Compose model. */
export function renderedNamedResources(rendered) {
  const resources = []
  for (const [kind, definitions] of [
    ['network', rendered.networks ?? {}],
    ['volume', rendered.volumes ?? {}]
  ]) {
    for (const [logicalName, definition] of Object.entries(definitions)) {
      if (!definition?.name) {
        throw new Error('RESOURCE_NAME_UNRESOLVED kind=' + kind + ' logical=' + logicalName)
      }
      resources.push({ kind, logicalName, name: definition.name })
    }
  }
  return resources
}

/** Rejects mutable image references in any rendered Compose service. */
export function assertPinnedComposeImages(rendered, composeFile) {
  for (const [service, definition] of Object.entries(rendered.services ?? {})) {
    if (!definition.image) continue
    if (!/@sha256:[a-f0-9]{64}$/.test(definition.image)) {
      throw new Error('COMPOSE_IMAGE_MUTABLE compose=' + composeFile + ' service=' + service)
    }
  }
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

/** Lists containers carrying the exact lifecycle owner label across every Compose project. */
function ownerContainerIds(context) {
  const result = spawnSync(
    'docker',
    ['ps', '-aq', '--filter', `label=oes.local.owner=${context.taskKey}`],
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
  const lifecycleServices = new Set(LIFECYCLE_INFRA_SERVICES)
  for (const id of ownerContainerIds(context)) {
    const payload = JSON.parse(capture('docker', ['inspect', id]))[0]
    const labels = payload?.Config?.Labels ?? {}
    const project = labels['com.docker.compose.project']
    const service = labels['com.docker.compose.service']
    if (project !== context.projectName || !lifecycleServices.has(service)) {
      throw new Error(
        `ROLLBACK_UNEXPECTED_OWNER_CONTAINER container=${id} project=${project ?? 'NONE'} service=${service ?? 'NONE'}`
      )
    }
  }
  return ids
}

/** Validates an existing Docker resource against both task owner and Compose project labels. */
export function assertResourceOwnershipRecord(context, kind, name, record) {
  const labels = record?.Labels ?? {}
  if (labels['oes.local.owner'] !== context.taskKey) {
    throw new Error(`RESOURCE_OWNER_MISMATCH kind=${kind} resource=${name}`)
  }
  if (labels['com.docker.compose.project'] !== context.projectName) {
    throw new Error(`RESOURCE_PROJECT_MISMATCH kind=${kind} resource=${name}`)
  }
}

/** Rejects same-owner named resources outside the exact lifecycle-owned resource set. */
export function assertExactLifecycleOwnerResources(kind, expectedNames, actualNames) {
  const expected = new Set(expectedNames)
  const unexpected = [...new Set(actualNames)].filter((name) => !expected.has(name)).sort()
  if (unexpected.length > 0) {
    throw new Error(
      `ROLLBACK_UNEXPECTED_OWNER_RESOURCE kind=${kind} resources=${unexpected.join(',')}`
    )
  }
}

/** Builds a name-preserving owner-label query for Docker volumes and networks. */
export function ownerNamedResourceListArgs(context, kind) {
  return [
    kind,
    'ls',
    '--format',
    '{{.Name}}',
    '--filter',
    `label=oes.local.owner=${context.taskKey}`
  ]
}

/** Lists named Docker resources carrying the exact lifecycle owner label. */
function ownerNamedResourceNames(context, kind) {
  return capture('docker', ownerNamedResourceListArgs(context, kind)).split(/\s+/).filter(Boolean)
}

/** Checks exact named volumes/networks before creation or destructive rollback. */
function assertNamedResourceOwnership(
  context,
  environmentPath,
  { requireExisting, resources = EXPECTED_INFRA_RESOURCES }
) {
  const rendered = renderedCompose(context, environmentPath)
  for (const [kind, logicalNames] of Object.entries(resources)) {
    const definitions = kind === 'volume' ? rendered.volumes : rendered.networks
    const expectedNames = []
    for (const logicalName of logicalNames) {
      const name = definitions?.[logicalName]?.name
      if (!name) throw new Error(`RESOURCE_NAME_UNRESOLVED kind=${kind} logical=${logicalName}`)
      expectedNames.push(name)
      const result = spawnSync('docker', [kind, 'inspect', name], { encoding: 'utf8' })
      if (result.error) throw result.error
      if (result.status !== 0) {
        if (!requireExisting && /not found|No such/i.test(result.stderr ?? '')) continue
        throw new Error(`RESOURCE_INSPECT_FAILED kind=${kind} resource=${name} exit=${result.status}`)
      }
      const [record] = JSON.parse(result.stdout)
      assertResourceOwnershipRecord(context, kind, name, record)
      process.stdout.write(`RESOURCE_OWNER kind=${kind} resource=${name} status=PASS\n`)
    }
    assertExactLifecycleOwnerResources(kind, expectedNames, ownerNamedResourceNames(context, kind))
  }
}

function postgresPort(context, environmentPath) {
  return servicePort(context, environmentPath, 'postgres', 5432)
}

/** Treats the current Docker published port as authoritative after daemon restarts or remaps. */
export function resolveRuntimePostgresPort(persistedPort, publishedPort) {
  if (!Number.isInteger(publishedPort) || publishedPort < 1 || publishedPort > 65_535) {
    throw new Error('POSTGRES_HOST_PORT_INVALID')
  }
  if (
    persistedPort !== undefined &&
    (!Number.isInteger(persistedPort) || persistedPort < 1 || persistedPort > 65_535)
  ) {
    throw new Error('POSTGRES_PERSISTED_PORT_INVALID')
  }
  return {
    port: publishedPort,
    changed: persistedPort !== undefined && persistedPort !== publishedPort
  }
}

/** Keeps Postgres on the host-development contract while every other infra port stays isolated. */
export function assertInfraHostPort(service, port) {
  if (port.host_ip !== '127.0.0.1') {
    throw new Error(`COMPOSE_HOST_PORT_NOT_ISOLATED service=${service}`)
  }
  const isPostgres = service === 'postgres' && Number(port.target) === 5432
  if (isPostgres) {
    if (Number(port.published) !== 5432) {
      throw new Error(`COMPOSE_POSTGRES_HOST_PORT_INVALID published=${port.published}`)
    }
    return
  }
  if (port.published !== undefined) {
    throw new Error(`COMPOSE_HOST_PORT_NOT_ISOLATED service=${service}`)
  }
}

/** Reads and reports the exact live task-owned PostgreSQL mapping used by host-side clients. */
function runtimePostgresPort(context, environmentPath, state) {
  const selection = resolveRuntimePostgresPort(
    state?.postgresPort,
    postgresPort(context, environmentPath)
  )
  if (selection.port !== 5432) {
    throw new Error(`POSTGRES_HOST_PORT_NOT_FIXED expected=5432 actual=${selection.port}`)
  }
  if (selection.changed) {
    process.stdout.write(
      `POSTGRES_PORT_REFRESH before=${state.postgresPort} after=${selection.port}\n`
    )
    writeState(context, { postgresPort: selection.port })
  }
  return selection.port
}

function servicePort(context, environmentPath, service, targetPort) {
  const output = compose(context, environmentPath, INFRA_COMPOSE, ['port', service, String(targetPort)])
  const match = /:(\d+)$/.exec(output.split(/\r?\n/).at(-1))
  if (!match) throw new Error(`SERVICE_PORT_UNRESOLVED service=${service} output=${output}`)
  return Number(match[1])
}

/** Polls a concrete HTTP readiness endpoint and fails when a running process never becomes ready. */
export function probeHttpReadiness(url, options = {}) {
  const attempts = options.attempts ?? 60
  const delayMs = options.delayMs ?? 1000
  const runner = options.runner ?? spawnSync
  let lastError = ''
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = runner(
      'curl',
      ['--fail', '--silent', '--show-error', '--max-time', '3', url],
      { encoding: 'utf8' }
    )
    if (!result.error && result.status === 0) return { attempt, body: result.stdout?.trim() ?? '' }
    lastError = result.error?.message ?? result.stderr?.trim() ?? `exit=${result.status}`
    if (attempt < attempts && delayMs > 0) {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs)
    }
  }
  throw new Error(`HTTP_READINESS_FAILED url=${url} detail=${lastError}`)
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

/** Compares one normalized pg_catalog definition against its versioned digest. */
export function assertDatabaseInvariantDigest(service, assertion, definition) {
  if (!definition) {
    throw new Error(
      `DATABASE_INVARIANT_MISSING service=${service.name} kind=${assertion.kind} name=${assertion.name}`
    )
  }
  const normalized = definition.replace(/\s+/g, ' ').trim()
  const actual = crypto.createHash('sha256').update(normalized).digest('hex')
  if (actual !== assertion.sha256) {
    throw new Error(
      `DATABASE_INVARIANT_DRIFT service=${service.name} kind=${assertion.kind} name=${assertion.name} expected=${assertion.sha256} actual=${actual}`
    )
  }
  process.stdout.write(
    `DATABASE_INVARIANT service=${service.name} kind=${assertion.kind} name=${assertion.name} sha256=${actual} status=PASS\n`
  )
}

/** Verifies custom indexes, constraints, functions, and triggers through pg_catalog. */
function verifyDatabaseInvariants(context, environmentPath, service) {
  const plan = loadDatabaseInvariantPlan(service)
  if (!plan) return
  const sqlByKind = {
    constraint: (name) =>
      `SELECT pg_get_constraintdef(oid, true) FROM pg_constraint WHERE conname = '${name}' AND connamespace = 'public'::regnamespace ORDER BY oid LIMIT 1`,
    function: (name) =>
      `SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = '${name}' AND pronamespace = 'public'::regnamespace ORDER BY oid LIMIT 1`,
    index: (name) =>
      `SELECT pg_get_indexdef(i.indexrelid) FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid WHERE c.relname = '${name}' AND c.relnamespace = 'public'::regnamespace ORDER BY i.indexrelid LIMIT 1`,
    trigger: (name) =>
      `SELECT pg_get_triggerdef(t.oid, true) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid WHERE t.tgname = '${name}' AND c.relnamespace = 'public'::regnamespace AND NOT t.tgisinternal ORDER BY t.oid LIMIT 1`
  }
  for (const assertion of plan.assertions) {
    const definition = postgresExec(
      context,
      environmentPath,
      service.database,
      sqlByKind[assertion.kind](assertion.name)
    )
    assertDatabaseInvariantDigest(service, assertion, definition)
  }
}

function createDatabases(context, environmentPath, services = context.services) {
  for (const service of services) {
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

function appliedMigrations(context, environmentPath, service) {
  const exists = postgresExec(
    context,
    environmentPath,
    service.database,
    `SELECT to_regclass('public."_prisma_migrations"') IS NOT NULL`
  )
  if (exists !== 't') return []
  return postgresExec(
    context,
    environmentPath,
    service.database,
    'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name'
  )
    .split(/\r?\n/)
    .filter(Boolean)
}

function userTableCount(context, environmentPath, service) {
  return Number(
    postgresExec(
      context,
      environmentPath,
      service.database,
      `SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`
    )
  )
}

function resolveMigration(context, service, databaseUrl, migrationName) {
  run(
    'pnpm',
    [
      'exec',
      'prisma',
      'migrate',
      'resolve',
      '--applied',
      migrationName,
      '--schema',
      repositoryRelative(context.repositoryRoot, service.schema)
    ],
    { cwd: context.repositoryRoot, env: { ...process.env, DATABASE_URL: databaseUrl } }
  )
}

/** Fingerprints one exact baseline plan so a partial resolve can resume only its own intent. */
export function baselinePlanFingerprint(service) {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        service: service.name,
        database: service.database,
        plan: service.baselinePlan
      })
    )
    .digest('hex')
}

/** Rejects a stale or foreign baseline-resolution checkpoint. */
export function assertBaselineResolutionCheckpoint(checkpoint, expected) {
  const valid =
    checkpoint?.version === 1 &&
    ['EMPTY_BASELINE', 'LEGACY_ADOPTION'].includes(checkpoint.mode) &&
    checkpoint.taskKey === expected.taskKey &&
    checkpoint.projectName === expected.projectName &&
    checkpoint.service === expected.service &&
    checkpoint.database === expected.database &&
    checkpoint.databaseOid === expected.databaseOid &&
    checkpoint.planFingerprint === expected.planFingerprint &&
    JSON.stringify(checkpoint.targets) === JSON.stringify(expected.targets)
  if (!valid) {
    throw new Error('BASELINE_RESOLUTION_CHECKPOINT_MISMATCH service=' + expected.service)
  }
  return checkpoint
}

function databaseOid(context, environmentPath, service) {
  return postgresExec(
    context,
    environmentPath,
    service.database,
    'SELECT oid::text FROM pg_database WHERE datname = current_database()'
  )
}

function expectedBaselineResolution(context, service, databaseIdentity) {
  const plan = service.baselinePlan
  return {
    taskKey: context.taskKey,
    projectName: context.projectName,
    service: service.name,
    database: service.database,
    databaseOid: databaseIdentity,
    planFingerprint: baselinePlanFingerprint(service),
    targets: [...plan.supersededMigrations.map((entry) => entry.name), plan.baselineMigration]
  }
}

function baselineResolutionCheckpoint(context, service) {
  return readState(context)?.baselineResolutions?.[service.name]
}

function writeBaselineResolutionCheckpoint(context, service, expected, mode) {
  const current = readState(context)?.baselineResolutions ?? {}
  const checkpoint = { version: 1, mode, ...expected }
  writeState(context, {
    baselineResolutions: {
      ...current,
      [service.name]: checkpoint
    }
  })
  process.stdout.write(
    'BASELINE_RESOLUTION_CHECKPOINT service=' + service.name + ' mode=' + mode + ' status=RECORDED\n'
  )
  return checkpoint
}

function clearBaselineResolutionCheckpoint(context, service) {
  const current = { ...(readState(context)?.baselineResolutions ?? {}) }
  if (!(service.name in current)) return
  delete current[service.name]
  writeState(context, { baselineResolutions: current })
  process.stdout.write('BASELINE_RESOLUTION_CHECKPOINT service=' + service.name + ' status=CLEARED\n')
}

function resolveFailureAfter() {
  const raw = process.env.OES_DB_FAIL_RESOLVE_AFTER
  if (raw === undefined) return undefined
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 1) {
    throw new Error('BASELINE_RESOLVE_FAILURE_INJECTION_INVALID')
  }
  return value
}

/** Chooses the fail-closed recovery action for a persisted baseline-resolution checkpoint. */
export function baselineCheckpointResumeAction(checkpoint, tables) {
  if (!Number.isInteger(tables) || tables < 0) {
    throw new Error('BASELINE_RESOLUTION_TABLE_COUNT_INVALID')
  }
  if (checkpoint.mode === 'LEGACY_ADOPTION') return 'VERIFY_CURRENT_SCHEMA'
  if (checkpoint.mode !== 'EMPTY_BASELINE') {
    throw new Error('BASELINE_RESOLUTION_CHECKPOINT_MODE_INVALID')
  }
  return tables === 0 ? 'REAPPLY_EMPTY_BASELINE' : 'VERIFY_BASELINE_INVARIANTS'
}

/** Applies the exact migration file bound by one empty-database baseline plan. */
function applyEmptyBaseline(context, service, databaseUrl) {
  const baselineFile = path.join(
    service.directory,
    'prisma',
    'migrations',
    service.baselinePlan.baselineMigration,
    'migration.sql'
  )
  run(
    'pnpm',
    [
      'exec',
      'prisma',
      'db',
      'execute',
      '--file',
      repositoryRelative(context.repositoryRoot, baselineFile),
      '--schema',
      repositoryRelative(context.repositoryRoot, service.schema)
    ],
    { cwd: context.repositoryRoot, env: { ...process.env, DATABASE_URL: databaseUrl } }
  )
}

/** Applies or adopts one complete baseline while preserving every legacy migration ID and byte. */
function prepareBaseline(context, environmentPath, service, databaseUrl) {
  const plan = service.baselinePlan
  if (!plan) return
  const superseded = plan.supersededMigrations.map((entry) => entry.name)
  const applied = appliedMigrations(context, environmentPath, service)
  const missing = superseded.filter((name) => !applied.includes(name))
  if (applied.includes(plan.baselineMigration)) {
    if (missing.length > 0) {
      throw new Error('BASELINE_HISTORY_INCOMPLETE service=' + service.name + ' missing=' + missing.join(','))
    }
    clearBaselineResolutionCheckpoint(context, service)
    process.stdout.write('BASELINE_PRESENT service=' + service.name + '\n')
    return
  }

  const databaseIdentity = databaseOid(context, environmentPath, service)
  const expected = expectedBaselineResolution(context, service, databaseIdentity)
  const existingCheckpoint = baselineResolutionCheckpoint(context, service)
  let checkpoint
  if (existingCheckpoint) {
    checkpoint = assertBaselineResolutionCheckpoint(existingCheckpoint, expected)
  }

  if (applied.length > 0 && missing.length > 0 && !checkpoint) {
    throw new Error('LEGACY_HISTORY_PARTIAL service=' + service.name + ' missing=' + missing.join(','))
  }

  const tables = userTableCount(context, environmentPath, service)
  if (checkpoint) {
    const resumeAction = baselineCheckpointResumeAction(checkpoint, tables)
    if (resumeAction === 'VERIFY_CURRENT_SCHEMA') {
      assertSchemaMatches(context, service, databaseUrl)
    } else if (resumeAction === 'REAPPLY_EMPTY_BASELINE') {
      applyEmptyBaseline(context, service, databaseUrl)
      process.stdout.write('BASELINE_REAPPLIED_EMPTY service=' + service.name + '\n')
    }
    verifyDatabaseInvariants(context, environmentPath, service)
    process.stdout.write(
      'BASELINE_RESOLUTION_RESUMED service=' + service.name + ' applied=' + applied.length +
        ' remaining=' + (missing.length + 1) + ' action=' + resumeAction + '\n'
    )
  } else if (tables === 0) {
    checkpoint = writeBaselineResolutionCheckpoint(context, service, expected, 'EMPTY_BASELINE')
    applyEmptyBaseline(context, service, databaseUrl)
    process.stdout.write('BASELINE_APPLIED_EMPTY service=' + service.name + '\n')
  } else {
    assertSchemaMatches(context, service, databaseUrl)
    verifyDatabaseInvariants(context, environmentPath, service)
    checkpoint = writeBaselineResolutionCheckpoint(context, service, expected, 'LEGACY_ADOPTION')
    process.stdout.write(
      'BASELINE_ADOPTED_LEGACY service=' + service.name + ' recordedMigrations=' + applied.length +
        ' tables=' + tables + '\n'
    )
  }

  const failureAfter = resolveFailureAfter()
  let resolved = 0
  for (const migrationName of superseded) {
    if (applied.includes(migrationName)) continue
    resolveMigration(context, service, databaseUrl, migrationName)
    resolved += 1
    if (failureAfter === resolved) {
      throw new Error(
        'BASELINE_RESOLVE_FAILURE_INJECTED service=' + service.name + ' after=' + resolved
      )
    }
  }
  resolveMigration(context, service, databaseUrl, plan.baselineMigration)
  clearBaselineResolutionCheckpoint(context, service)
}

/** Resolves the exact infrastructure surface for a full lifecycle or isolated L2 shard. */
export function selectInfraProfile(name = 'full') {
  const profile = INFRA_PROFILES[name]
  if (!profile) throw new Error(`DATABASE_INFRA_PROFILE_INVALID profile=${name}`)
  return profile
}

function up(context, environmentPath, profileName = 'full') {
  const profile = selectInfraProfile(profileName)
  assertContainerOwnership(context)
  assertNamedResourceOwnership(context, environmentPath, {
    requireExisting: false,
    resources: profile.resources
  })
  writeState(context, { phase: 'STARTING', infraProfile: profileName })
  compose(context, environmentPath, INFRA_COMPOSE, [
    'up',
    '-d',
    '--wait',
    '--wait-timeout',
    '240',
    ...profile.longRunningServices
  ])
  for (const service of profile.initServices) {
    compose(context, environmentPath, INFRA_COMPOSE, ['up', '--no-deps', service])
  }
  if (profile.monitor) {
    compose(context, environmentPath, INFRA_COMPOSE, [
      'up',
      '-d',
      '--no-deps',
      'nats-advisory-monitor'
    ])
  }
  assertContainerOwnership(context)
  assertNamedResourceOwnership(context, environmentPath, {
    requireExisting: true,
    resources: profile.resources
  })
  const port = runtimePostgresPort(context, environmentPath, readState(context))
  writeState(context, { phase: 'UP', infraProfile: profileName, postgresPort: port })
  process.stdout.write(`INFRA_UP=PASS project=${context.projectName} profile=${profileName} postgresPort=${port}\n`)
}

function health(context, environmentPath) {
  const state = readState(context)
  assertRollbackBinding(context, state)
  const profileName = state.infraProfile ?? 'full'
  selectInfraProfile(profileName)
  const ids = assertContainerOwnership(context)
  if (ids.length === 0) throw new Error('HEALTH_PROJECT_NOT_RUNNING')
  const runningServices = new Set()
  for (const id of ids) {
    const payload = JSON.parse(capture('docker', ['inspect', id]))[0]
    const service = payload.Config.Labels['com.docker.compose.service']
    const status = payload.State.Status
    runningServices.add(service)
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
  for (const [service, endpoint] of Object.entries(HTTP_READINESS)) {
    if (!runningServices.has(service)) continue
    const port = servicePort(context, environmentPath, service, endpoint.port)
    const url = `http://127.0.0.1:${port}${endpoint.path}`
    const result = probeHttpReadiness(url)
    process.stdout.write(`READINESS service=${service} status=PASS attempt=${result.attempt}\n`)
  }
  const port = runtimePostgresPort(context, environmentPath, state)
  writeState(context, { phase: 'HEALTHY', postgresPort: port })
  process.stdout.write(`INFRA_HEALTH=PASS profile=${profileName} containers=${ids.length}\n`)
}

/** Selects an exact non-empty database subset while rejecting duplicate and unknown service names. */
export function selectDatabaseServices(services, requestedNames = []) {
  if (requestedNames.length === 0) return services
  const duplicates = requestedNames.filter((name, index) => requestedNames.indexOf(name) !== index)
  if (duplicates.length > 0) {
    throw new Error(`DATABASE_SERVICE_DUPLICATE services=${[...new Set(duplicates)].sort().join(',')}`)
  }
  const requested = new Set(requestedNames)
  const selected = services.filter((service) => requested.delete(service.name))
  if (requested.size > 0) {
    throw new Error(`DATABASE_SERVICE_UNKNOWN services=${[...requested].sort().join(',')}`)
  }
  if (selected.length === 0) throw new Error('DATABASE_SERVICE_SELECTION_EMPTY')
  return Object.freeze(selected)
}

/** Migrates either the complete inventory or one exact CI shard-owned database subset. */
function migrate(context, environmentPath, requestedNames = []) {
  const state = readState(context)
  assertRollbackBinding(context, state)
  const services = selectDatabaseServices(context.services, requestedNames)
  createDatabases(context, environmentPath, services)
  const port = runtimePostgresPort(context, environmentPath, state)
  const failureAfterRaw = process.env.OES_DB_FAIL_AFTER
  const failureAfter = failureAfterRaw === undefined ? undefined : Number(failureAfterRaw)
  if (failureAfter !== undefined && (!Number.isInteger(failureAfter) || failureAfter < 0)) {
    throw new Error('MIGRATION_FAILURE_INJECTION_INVALID')
  }
  let completed = 0
  for (const service of services) {
    if (failureAfter === completed) {
      throw new Error(`MIGRATION_FAILURE_INJECTED after=${completed}`)
    }
    const databaseUrl = postgresUrl(context, service, port)
    prepareBaseline(context, environmentPath, service, databaseUrl)
    run(
      'pnpm',
      ['exec', 'prisma', 'migrate', 'deploy', '--schema', repositoryRelative(context.repositoryRoot, service.schema)],
      {
        cwd: context.repositoryRoot,
        env: { ...process.env, DATABASE_URL: databaseUrl }
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
  const auth = context.services.find((service) => service.name === 'auth-service')
  const identity = context.services.find((service) => service.name === 'identity-service')
  const permission = context.services.find((service) => service.name === 'permission-service')
  const itemMaster = context.services.find((service) => service.name === 'item-master-service')
  const collaboration = context.services.find((service) => service.name === 'collaboration-service')
  const mfaSecretDigest = crypto
    .createHash('md5')
    .update(AUTH_ACCEPTANCE_FIXTURES.mfa.binding.secret)
    .digest('hex')
  const digest = (database, sql) =>
    crypto
      .createHash('sha256')
      .update(postgresExec(context, environmentPath, database, sql))
      .digest('hex')
  return {
    authAcceptanceRecoveryGrantCount: Number(
      postgresExec(
        context,
        environmentPath,
        auth.database,
        `SELECT count(*) FROM "PasswordRecoveryGrant" g JOIN "LoginMethod" m ON m."id" = g."loginMethodId" WHERE g."id" = '${AUTH_ACCEPTANCE_FIXTURES.passwordRecovery.grant.id}' AND g."userId" = '${AUTH_ACCEPTANCE_FIXTURES.passwordRecovery.userId}' AND g."challengeId" = '${AUTH_ACCEPTANCE_FIXTURES.passwordRecovery.grant.challengeId}' AND g."consumedAt" IS NULL AND g."expiresAt" = '${AUTH_ACCEPTANCE_FIXTURES.passwordRecovery.grant.expiresAt.toISOString()}'::timestamptz AND m."userId" = g."userId" AND m."verified" = true AND m."enabled" = true`
      )
    ),
    authAcceptanceRecoveryLoginMethodCount: Number(
      postgresExec(
        context,
        environmentPath,
        auth.database,
        `SELECT count(*) FROM "LoginMethod" WHERE "userId" = '${AUTH_ACCEPTANCE_FIXTURES.passwordRecovery.userId}' AND "verified" = true AND "enabled" = true`
      )
    ),
    authAcceptanceRecoveryEmailMethodCount: Number(
      postgresExec(
        context,
        environmentPath,
        auth.database,
        `SELECT count(*) FROM "LoginMethod" WHERE "userId" = '${AUTH_ACCEPTANCE_FIXTURES.passwordRecovery.userId}' AND "type" = 'EMAIL' AND "verified" = true AND "enabled" = true`
      )
    ),
    authAcceptanceRecoveryPhoneMethodCount: Number(
      postgresExec(
        context,
        environmentPath,
        auth.database,
        `SELECT count(*) FROM "LoginMethod" WHERE "userId" = '${AUTH_ACCEPTANCE_FIXTURES.passwordRecovery.userId}' AND "type" = 'PHONE' AND "verified" = true AND "enabled" = true`
      )
    ),
    authAcceptanceMfaBindingCount: Number(
      postgresExec(
        context,
        environmentPath,
        auth.database,
        `SELECT count(*) FROM "MfaBinding" WHERE "id" = '${AUTH_ACCEPTANCE_FIXTURES.mfa.binding.id}' AND "userId" = '${AUTH_ACCEPTANCE_FIXTURES.mfa.userId}' AND "type" = 'TOTP' AND "enabled" = true AND md5("secret") = '${mfaSecretDigest}'`
      )
    ),
    authAcceptanceMfaWebPolicyCount: Number(
      postgresExec(
        context,
        environmentPath,
        auth.database,
        `SELECT count(*) FROM "TenantTerminalMfaPolicy" WHERE "tenantId" = '${AUTH_ACCEPTANCE_FIXTURES.mfa.tenantId}' AND "terminal" = 'WEB' AND "loginMfaRequired" = true AND "newDeviceMfaRequired" = false AND "allowedFactors" = '["TOTP"]'::jsonb AND "factorPriority" = '["TOTP"]'::jsonb`
      )
    ),
    authAcceptanceMfaScenarioPolicyCount: Number(
      postgresExec(
        context,
        environmentPath,
        auth.database,
        `SELECT count(*) FROM "TenantMfaScenarioPolicy" WHERE "tenantId" = '${AUTH_ACCEPTANCE_FIXTURES.mfa.tenantId}' AND "scenario" = 'LOGIN' AND "required" = true AND "updatedBy" = '${AUTH_ACCEPTANCE_FIXTURES.mfa.tenantScenarioPolicy.updatedBy}'`
      )
    ),
    authAcceptanceMfaFactorPolicyCount: Number(
      postgresExec(
        context,
        environmentPath,
        auth.database,
        `SELECT count(*) FROM "TenantMfaFactorPolicy" WHERE "tenantId" = '${AUTH_ACCEPTANCE_FIXTURES.mfa.tenantId}' AND (("factor" = 'TOTP' AND "enabled" = true AND "priority" = 1) OR ("factor" = 'EMAIL_OTP' AND "enabled" = false AND "priority" = 2) OR ("factor" = 'SMS_OTP' AND "enabled" = false AND "priority" = 3) OR ("factor" = 'BACKUP_CODE' AND "enabled" = false AND "priority" = 4)) AND "updatedBy" = '${AUTH_ACCEPTANCE_FIXTURES.mfa.tenantFactorPolicies[0].updatedBy}'`
      )
    ),
    authAcceptancePasswordSetupCount: Number(
      postgresExec(
        context,
        environmentPath,
        auth.database,
        `SELECT count(*) FROM "PasswordSetupRequirement" WHERE "id" = '${AUTH_ACCEPTANCE_FIXTURES.passwordSetup.requirement.id}' AND "userId" = '${AUTH_ACCEPTANCE_FIXTURES.passwordSetup.userId}' AND "reason" = 'FIRST_LOGIN' AND "required" = true AND "completedAt" IS NULL`
      )
    ),
    identityAuthAcceptanceUserCount: Number(
      postgresExec(
        context,
        environmentPath,
        identity.database,
        `SELECT count(*) FROM "User" WHERE "id" IN ('${AUTH_ACCEPTANCE_FIXTURES.passwordRecovery.userId}', '${AUTH_ACCEPTANCE_FIXTURES.passwordSetup.userId}', '${AUTH_ACCEPTANCE_FIXTURES.mfa.userId}') AND "isActive" = true`
      )
    ),
    permissionAuthAcceptanceWebAccessCount: Number(
      postgresExec(
        context,
        environmentPath,
        permission.database,
        `SELECT count(*) FROM "AccountTerminalAccessOverride" WHERE ("id", "accountId", "tenantId") IN (('${AUTH_ACCEPTANCE_FIXTURES.passwordRecovery.accountTerminalAccessOverride.id}', '${AUTH_ACCEPTANCE_FIXTURES.passwordRecovery.accountId}', '${AUTH_ACCEPTANCE_FIXTURES.passwordRecovery.accountTerminalAccessOverride.tenantId}'), ('${AUTH_ACCEPTANCE_FIXTURES.passwordSetup.accountTerminalAccessOverride.id}', '${AUTH_ACCEPTANCE_FIXTURES.passwordSetup.accountId}', '${AUTH_ACCEPTANCE_FIXTURES.passwordSetup.accountTerminalAccessOverride.tenantId}'), ('${AUTH_ACCEPTANCE_FIXTURES.mfa.accountTerminalAccessOverride.id}', '${AUTH_ACCEPTANCE_FIXTURES.mfa.accountId}', '${AUTH_ACCEPTANCE_FIXTURES.mfa.accountTerminalAccessOverride.tenantId}')) AND "scopeLevel" = 'TENANT' AND "allowedTerminals" = ARRAY['WEB']::text[]`
      )
    ),
    policyPreviewFixtureCount: Number(
      postgresExec(
        context,
        environmentPath,
        permission.database,
        `SELECT count(*) FROM "PolicyInstance" WHERE "id" = '${PAGE_ACCEPTANCE_FIXTURES.policyPreview.policyInstance.id}' AND "tenantId" = '${PAGE_ACCEPTANCE_FIXTURES.policyPreview.tenantId}' AND "subjectSelectorType" = 'ACCOUNT' AND "subjectSelectorValue" = '${PAGE_ACCEPTANCE_FIXTURES.policyPreview.accountId}' AND "permissionCode" = '${PAGE_ACCEPTANCE_FIXTURES.policyPreview.permissionCode}' AND "resourceType" = '${PAGE_ACCEPTANCE_FIXTURES.policyPreview.resourceType}' AND "templateCode" = 'resource-field-in-set' AND "effect" = 'ALLOW' AND "params" = '${JSON.stringify(PAGE_ACCEPTANCE_FIXTURES.policyPreview.policyInstance.params)}'::jsonb AND "priority" = 100 AND "isEnabled" = true`
      )
    ),
    mesAcceptanceNavigationCount: Number(
      postgresExec(
        context,
        environmentPath,
        permission.database,
        `SELECT count(*) FROM "Role" r JOIN "PrincipalRoleBinding" b ON b."roleId" = r."id" JOIN "RoleNavigationVisibility" v ON v."roleId" = r."id" WHERE r."id" = '00000000-0000-4000-8000-000000001050' AND r."tenantId" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.tenantId}' AND r."code" = 'mes.forming_workshop.supervisor' AND b."principalType" = 'HUMAN' AND b."principalId" = '${PAGE_ACCEPTANCE_FIXTURES.policyPreview.accountId}' AND b."tenantId" = r."tenantId" AND v."entryKey" = 'mes.mold-management' AND v."terminal" = 'DEFAULT' AND v."enabled" = true`
      )
    ),
    itemMasterAttributeDefinitionFixtureCount: Number(
      postgresExec(
        context,
        environmentPath,
        itemMaster.database,
        `SELECT count(*) FROM "AttributeDefinition" WHERE "id" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.attributeDefinition.id}' AND "tenantId" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.tenantId}' AND "attributeCode" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.attributeDefinition.attributeCode}' AND "active" = true`
      )
    ),
    itemMasterItemModelFixtureCount: Number(
      postgresExec(
        context,
        environmentPath,
        itemMaster.database,
        `SELECT count(*) FROM "ItemModel" WHERE "id" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.itemModel.id}' AND "tenantId" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.tenantId}' AND "modelCode" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.itemModel.modelCode}' AND "primaryCategoryId" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.category.id}' AND "active" = true`
      )
    ),
    itemMasterItemFixtureCount: Number(
      postgresExec(
        context,
        environmentPath,
        itemMaster.database,
        `SELECT count(*) FROM "Item" WHERE "id" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.item.id}' AND "tenantId" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.tenantId}' AND "itemModelId" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.itemModel.id}' AND "itemCode" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.item.itemCode}' AND "lockedAttributeOptionIds" = ARRAY['${PAGE_ACCEPTANCE_FIXTURES.itemMaster.attributeOption.id}']::text[] AND "variantKey" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.item.variantKey}' AND "active" = true`
      )
    ),
    pageAcceptancePermissionDigest: digest(
      permission.database,
      `SELECT COALESCE((SELECT (to_jsonb(t) - 'createdAt' - 'updatedAt')::text FROM "PolicyInstance" t WHERE t."id" = '${PAGE_ACCEPTANCE_FIXTURES.policyPreview.policyInstance.id}'), '{}')`
    ),
    authAcceptanceTerminalAccessDigest: digest(
      permission.database,
      `SELECT COALESCE(jsonb_agg(to_jsonb(t) - 'createdAt' - 'updatedAt' ORDER BY t."id")::text, '[]') FROM "AccountTerminalAccessOverride" t WHERE t."id" IN ('${AUTH_ACCEPTANCE_FIXTURES.passwordRecovery.accountTerminalAccessOverride.id}', '${AUTH_ACCEPTANCE_FIXTURES.passwordSetup.accountTerminalAccessOverride.id}', '${AUTH_ACCEPTANCE_FIXTURES.mfa.accountTerminalAccessOverride.id}')`
    ),
    pageAcceptanceItemMasterDigest: digest(
      itemMaster.database,
      `SELECT jsonb_build_object('category', COALESCE((SELECT to_jsonb(t) - 'createdAt' - 'updatedAt' FROM "ItemCategory" t WHERE t."id" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.category.id}'), '{}'::jsonb), 'definition', COALESCE((SELECT to_jsonb(t) - 'createdAt' - 'updatedAt' FROM "AttributeDefinition" t WHERE t."id" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.attributeDefinition.id}'), '{}'::jsonb), 'option', COALESCE((SELECT to_jsonb(t) - 'createdAt' - 'updatedAt' FROM "AttributeOption" t WHERE t."id" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.attributeOption.id}'), '{}'::jsonb), 'model', COALESCE((SELECT to_jsonb(t) - 'createdAt' - 'updatedAt' FROM "ItemModel" t WHERE t."id" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.itemModel.id}'), '{}'::jsonb), 'rule', COALESCE((SELECT to_jsonb(t) - 'createdAt' - 'updatedAt' FROM "ItemModelAttributeRule" t WHERE t."id" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.itemModelAttributeRule.id}'), '{}'::jsonb), 'item', COALESCE((SELECT to_jsonb(t) - 'createdAt' - 'updatedAt' FROM "Item" t WHERE t."id" = '${PAGE_ACCEPTANCE_FIXTURES.itemMaster.item.id}'), '{}'::jsonb))::text`
    ),
    collaborationTaskCount: Number(
      postgresExec(
        context,
        environmentPath,
        collaboration.database,
        'SELECT count(*) FROM "CollaborationTask"'
      )
    ),
    collaborationTaskDigest: digest(
      collaboration.database,
      `SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t."id")::text, '[]') FROM "CollaborationTask" t WHERE t."id"::text LIKE '10000000-0000-4000-8000-%'`
    ),
    permissionCount: Number(
      postgresExec(
        context,
        environmentPath,
        permission.database,
        'SELECT count(*) FROM "Permission"'
      )
    ),
    permissionDigest: digest(
      permission.database,
      `SELECT COALESCE(jsonb_agg(to_jsonb(t) - 'createdAt' - 'updatedAt' ORDER BY t."id")::text, '[]') FROM "Permission" t`
    ),
    roleCount: Number(
      postgresExec(context, environmentPath, permission.database, 'SELECT count(*) FROM "Role"')
    ),
    roleDigest: digest(
      permission.database,
      `SELECT COALESCE(jsonb_agg(to_jsonb(t) - 'createdAt' - 'updatedAt' ORDER BY t."id")::text, '[]') FROM "Role" t`
    )
  }
}

/** Verifies the ordinary seed produced every dedicated tenant-web auth acceptance state. */
export function assertTenantWebAuthSeedSnapshot(snapshot) {
  const expected = {
    authAcceptanceRecoveryGrantCount: 1,
    authAcceptanceRecoveryLoginMethodCount: 2,
    authAcceptanceRecoveryEmailMethodCount: 1,
    authAcceptanceRecoveryPhoneMethodCount: 1,
    authAcceptanceMfaBindingCount: 1,
    authAcceptanceMfaWebPolicyCount: 1,
    authAcceptanceMfaScenarioPolicyCount: 1,
    authAcceptanceMfaFactorPolicyCount: 4,
    authAcceptancePasswordSetupCount: 1,
    identityAuthAcceptanceUserCount: 3,
    permissionAuthAcceptanceWebAccessCount: 3,
    policyPreviewFixtureCount: 1,
    mesAcceptanceNavigationCount: 1,
    itemMasterAttributeDefinitionFixtureCount: 1,
    itemMasterItemModelFixtureCount: 1,
    itemMasterItemFixtureCount: 1
  }
  for (const [field, value] of Object.entries(expected)) {
    if (snapshot[field] !== value) {
      throw new Error(
        `TENANT_WEB_AUTH_SEED_INCOMPLETE field=${field} expected=${value} actual=${snapshot[field]}`
      )
    }
  }
}

/** Builds the ordered, explicit command plan for all repository-owned database seeds. */
export function buildDatabaseSeedCommands(context, port, environment = process.env) {
  const permission = context.services.find((service) => service.name === 'permission-service')
  const collaboration = context.services.find((service) => service.name === 'collaboration-service')
  if (!permission || !collaboration) throw new Error('SEED_SERVICE_INVENTORY_INCOMPLETE')

  return [
    {
      command: 'pnpm',
      args: ['generated:all'],
      environment,
      cwd: context.repositoryRoot
    },
    {
      command: 'pnpm',
      args: ['common:build'],
      environment,
      cwd: context.repositoryRoot
    },
    {
      command: 'pnpm',
      args: ['--filter', 'permission-service', 'seed:apply', '--', '--apply'],
      environment: { ...environment, DATABASE_URL: postgresUrl(context, permission, port) },
      cwd: context.repositoryRoot
    },
    {
      command: 'pnpm',
      args: ['--filter', 'collaboration-service', 'seed:p1'],
      environment: {
        ...environment,
        COLLABORATION_DATABASE_URL: postgresUrl(context, collaboration, port),
        DATABASE_URL: postgresUrl(context, collaboration, port)
      },
      cwd: context.repositoryRoot
    },
    {
      command: 'node',
      args: ['scripts/local/seed-tenant-web-auth-test-data.mjs'],
      environment: buildTenantWebAuthSeedEnvironment(context, port, environment),
      cwd: context.repositoryRoot
    }
  ]
}

/** Executes seed commands serially so the first failure prevents later commands and state writes. */
export function executeDatabaseSeedCommands(commands, runner = run) {
  for (const command of commands) {
    runner(command.command, command.args, {
      cwd: command.cwd,
      env: command.environment
    })
  }
}

/** Invalidates any older successful seed record before the first seed command can write. */
export function beginDatabaseSeedState() {
  return { phase: 'SEEDING', seedSnapshot: null }
}

/** Records a failed seed without retaining a stale successful snapshot. */
export function failDatabaseSeedState() {
  return { phase: 'SEED_FAILED', seedSnapshot: null }
}

/** Invalidates any earlier successful verification before semantic checks begin. */
export function beginDatabaseVerifyState() {
  return { phase: 'VERIFYING' }
}

/** Records a failed verification without presenting the previous success phase as current. */
export function failDatabaseVerifyState() {
  return { phase: 'VERIFY_FAILED' }
}

function seed(context, environmentPath) {
  const state = readState(context)
  assertRollbackBinding(context, state)
  const port = runtimePostgresPort(context, environmentPath, state)
  const previousSnapshot = state.seedSnapshot
  writeState(context, beginDatabaseSeedState())
  let snapshot
  try {
    executeDatabaseSeedCommands(buildDatabaseSeedCommands(context, port))
    snapshot = seedSnapshot(context, environmentPath)
    assertTenantWebAuthSeedSnapshot(snapshot)
    if (previousSnapshot && JSON.stringify(previousSnapshot) !== JSON.stringify(snapshot)) {
      throw new Error(
        `SEED_NOT_IDEMPOTENT before=${JSON.stringify(previousSnapshot)} after=${JSON.stringify(snapshot)}`
      )
    }
  } catch (error) {
    writeState(context, failDatabaseSeedState())
    throw error
  }
  for (const service of context.services) {
    const status = [
      'auth-service',
      'collaboration-service',
      'hr-service',
      'identity-service',
      'item-master-service',
      'party-service',
      'permission-service',
      'tenant-org-service'
    ].includes(service.name)
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
  writeState(context, beginDatabaseVerifyState())
  const seen = new Set()
  let port
  try {
    port = runtimePostgresPort(context, environmentPath, state)
    for (const service of context.services) {
      if (seen.has(service.database)) {
        throw new Error(`VERIFY_SHARED_DATABASE database=${service.database}`)
      }
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
        throw new Error(
          `VERIFY_MIGRATION_COUNT service=${service.name} expected=${expected} actual=${applied}`
        )
      }
      assertSchemaMatches(context, service, postgresUrl(context, service, port))
      verifyDatabaseInvariants(context, environmentPath, service)
      process.stdout.write(
        `VERIFY service=${service.name} database=${service.database} migrations=${applied} status=PASS\n`
      )
    }
    if (!state.seedSnapshot) throw new Error('VERIFY_SEED_SNAPSHOT_MISSING')
    const current = seedSnapshot(context, environmentPath)
    assertTenantWebAuthSeedSnapshot(current)
    if (JSON.stringify(current) !== JSON.stringify(state.seedSnapshot)) {
      throw new Error('VERIFY_SEED_SNAPSHOT_MISMATCH')
    }
  } catch (error) {
    writeState(context, failDatabaseVerifyState())
    throw error
  }
  writeState(context, { phase: 'VERIFIED', postgresPort: port })
  process.stdout.write(`DATABASE_VERIFY=PASS databases=${seen.size}\n`)
}

function rollback(context, environmentPath) {
  const state = readState(context)
  assertRollbackBinding(context, state)
  const profile = selectInfraProfile(state.infraProfile ?? 'full')
  assertContainerOwnership(context)
  assertNamedResourceOwnership(context, environmentPath, {
    requireExisting: true,
    resources: profile.resources
  })
  run('docker', databaseRollbackComposeArgs(context, environmentPath), {
    cwd: context.repositoryRoot
  })
  const remaining = projectContainerIds(context)
  if (remaining.length !== 0) throw new Error(`ROLLBACK_CONTAINERS_REMAIN count=${remaining.length}`)
  const remainingOwnerContainers = ownerContainerIds(context)
  if (remainingOwnerContainers.length !== 0) {
    throw new Error(`ROLLBACK_OWNER_CONTAINERS_REMAIN count=${remainingOwnerContainers.length}`)
  }
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
  const rendered = renderedCompose(context, environmentPath, MAIN_COMPOSE)
  assertPinnedComposeImages(rendered, MAIN_COMPOSE)
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
  const infra = renderedCompose(context, environmentPath)
  assertPinnedComposeImages(infra, INFRA_COMPOSE)
  for (const [name, definition] of Object.entries(infra.services)) {
    if (definition.labels?.['oes.local.owner'] !== context.taskKey) {
      throw new Error(`COMPOSE_OWNER_LABEL_INVALID service=${name}`)
    }
    for (const port of definition.ports ?? []) {
      assertInfraHostPort(name, port)
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
  const [command, ...rawArguments] = argv
  const arguments_ = rawArguments.filter((argument) => argument !== '--')
  const context = loadDatabaseContext()
  const environmentPath = writeComposeEnvironment(context)
  if (command === 'config') config(context, environmentPath)
  else if (command === 'up') up(context, environmentPath, parseProfileArguments(arguments_))
  else if (command === 'health') health(context, environmentPath)
  else if (command === 'migrate') migrate(context, environmentPath, parseServiceArguments(arguments_))
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

/** Parses the bounded infrastructure profile used only by task-local L2 execution. */
function parseProfileArguments(arguments_) {
  if (arguments_.length === 0) return 'full'
  if (arguments_.length !== 2 || arguments_[0] !== '--profile') {
    throw new Error('DATABASE_INFRA_PROFILE_ARGUMENT_INVALID expected=--profile full|l2')
  }
  selectInfraProfile(arguments_[1])
  return arguments_[1]
}

/** Parses the single explicit --services CSV selector used by isolated L2 shards. */
function parseServiceArguments(arguments_) {
  if (arguments_.length === 0) return []
  if (arguments_.length !== 2 || arguments_[0] !== '--services') {
    throw new Error('DATABASE_SERVICE_ARGUMENT_INVALID expected=--services <service[,service]>')
  }
  const names = arguments_[1].split(',')
  if (names.some((name) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name))) {
    throw new Error('DATABASE_SERVICE_ARGUMENT_INVALID expected=--services <service[,service]>')
  }
  return names
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
