import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import {
  assertBaselineResolutionCheckpoint,
  assertDatabaseInvariantDigest,
  assertInfraHostPort,
  assertTenantWebAuthSeedSnapshot,
  assertExactLifecycleOwnerResources,
  assertPinnedComposeImages,
  assertResourceOwnershipRecord,
  assertRollbackBinding,
  baselineCheckpointResumeAction,
  baselinePlanFingerprint,
  composeEnvironment,
  DATABASE_LIFECYCLE_INIT_SERVICES,
  databaseLifecycleComposeArgs,
  databaseRollbackComposeArgs,
  buildDatabaseSeedCommands,
  beginDatabaseSeedState,
  beginDatabaseVerifyState,
  executeDatabaseSeedCommands,
  failDatabaseSeedState,
  failDatabaseVerifyState,
  loadBaselineResolvePlan,
  loadDatabaseContext,
  ownerNamedResourceListArgs,
  probeHttpReadiness,
  renderedNamedResources,
  resolveRuntimePostgresPort,
  resourceFingerprint,
  selectDatabaseServices,
  selectInfraProfile
} from '../database-lifecycle.mjs'
import {
  validate as validateWorkloadPolicyProfile,
  WORKLOAD_POLICY_VERSION
} from '../workload-policy-profile.mjs'

const repositoryRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..')

test('database context binds 21 unique service-owned databases to one task project', () => {
  const context = loadDatabaseContext(repositoryRoot)
  assert.equal(context.services.length, 21)
  assert.equal(new Set(context.services.map((service) => service.database)).size, 21)
  assert.equal(context.projectName, `oes_${context.taskKey}`)
})
test('database shard selector preserves inventory order and rejects ambiguous input', () => {
  const context = loadDatabaseContext(repositoryRoot)
  const selected = selectDatabaseServices(context.services, ['mes-service', 'identity-service'])
  assert.deepEqual(selected.map((service) => service.name), ['mes-service', 'identity-service'])
  assert.throws(
    () => selectDatabaseServices(context.services, ['identity-service', 'identity-service']),
    /DATABASE_SERVICE_DUPLICATE/
  )
  assert.throws(
    () => selectDatabaseServices(context.services, ['missing-service']),
    /DATABASE_SERVICE_UNKNOWN/
  )
})
test('Integration infrastructure profile starts only Postgres and NATS dependencies', () => {
  const profile = selectInfraProfile('integration')
  assert.deepEqual(profile.longRunningServices, ['postgres', 'nats'])
  assert.deepEqual(profile.initServices, ['nats-bootstrap'])
  assert.equal(profile.monitor, false)
  assert.deepEqual(profile.resources.volume, ['nats_jetstream_data', 'postgres_data'])
  assert.throws(() => selectInfraProfile('unknown'), /DATABASE_INFRA_PROFILE_INVALID/)
})
test('live Docker PostgreSQL mapping reports persisted-port drift before fixed-port validation', () => {
  assert.deepEqual(resolveRuntimePostgresPort(56816, 51229), {
    port: 51229,
    changed: true
  })
  assert.deepEqual(resolveRuntimePostgresPort(51229, 51229), {
    port: 51229,
    changed: false
  })
  assert.throws(() => resolveRuntimePostgresPort(51229, 0), /POSTGRES_HOST_PORT_INVALID/)
  assert.throws(
    () => resolveRuntimePostgresPort(Number.NaN, 51229),
    /POSTGRES_PERSISTED_PORT_INVALID/
  )
})
test('host Postgres is fixed on 5432 while other infrastructure ports remain dynamically isolated', () => {
  assert.doesNotThrow(() =>
    assertInfraHostPort('postgres', { host_ip: '127.0.0.1', target: 5432, published: '5432' })
  )
  assert.doesNotThrow(() =>
    assertInfraHostPort('redis', { host_ip: '127.0.0.1', target: 6379 })
  )
  assert.throws(
    () =>
      assertInfraHostPort('postgres', {
        host_ip: '127.0.0.1',
        target: 5432,
        published: '50125'
      }),
    /COMPOSE_POSTGRES_HOST_PORT_INVALID/
  )
  assert.throws(
    () =>
      assertInfraHostPort('redis', {
        host_ip: '127.0.0.1',
        target: 6379,
        published: '6379'
      }),
    /COMPOSE_HOST_PORT_NOT_ISOLATED/
  )
})
test('generated Compose inputs keep secrets local and map every service to postgres', () => {
  const context = loadDatabaseContext(repositoryRoot)
  const values = composeEnvironment(context)
  for (const service of context.services) {
    const key = `OES_DB_${service.name.toUpperCase().replaceAll('-', '_')}_URL`
    const url = new URL(values.get(key))
    assert.equal(url.hostname, 'postgres')
    assert.equal(url.port, '5432')
    assert.equal(decodeURIComponent(url.pathname.slice(1)), service.database)
  }
  for (const key of [
    'NATS_COLLABORATION_PASSWORD',
    'NATS_NOTIFICATION_PASSWORD',
    'NATS_NOTIFICATION_REPLAY_PASSWORD',
    'NATS_NOTIFICATION_RECOVERY_PASSWORD',
    'NATS_OPERATOR_PASSWORD'
  ]) {
    assert.match(values.get(key), /^n[a-f0-9]{31}$/)
  }
  const authPolicies = JSON.parse(values.get('AUTH_EXECUTION_WORKLOAD_POLICIES'))
  const permissionPolicies = JSON.parse(values.get('PERMISSION_WORKLOAD_ISSUANCE_POLICIES'))
  const versionedPermissionPolicies = JSON.parse(
    fs.readFileSync(
      path.join(
        repositoryRoot,
        'scripts/local/runtime-config/permission-workload-issuance-policies.json'
      ),
      'utf8'
    )
  )
  assert.equal(authPolicies[0].spiffeId, 'spiffe://local.oes.internal/ns/oes/sa/api-gateway')
  assert.deepEqual(permissionPolicies, versionedPermissionPolicies)
  assert.doesNotThrow(() => validateWorkloadPolicyProfile(authPolicies, permissionPolicies))
  assert.deepEqual(
    [...new Set(permissionPolicies.map((policy) => policy.policyVersion))],
    [WORKLOAD_POLICY_VERSION]
  )
  assert.equal(
    values.get('AUTH_PERMISSION_WORKLOAD_ISSUANCE_POLICY_VERSION'),
    WORKLOAD_POLICY_VERSION
  )
  assert.match(values.get('NATS_NOTIFICATION_REPLAY_ASSIGNED_CREATE_SUBJECT'), /^'\$JS\.API\..*'$/)
})
test('rollback rejects owner and fingerprint drift', () => {
  const context = loadDatabaseContext(repositoryRoot)
  const state = {
    stateVersion: 1,
    taskKey: context.taskKey,
    projectName: context.projectName,
    resourceFingerprint: resourceFingerprint(context)
  }
  assert.doesNotThrow(() => assertRollbackBinding(context, state))
  assert.throws(
    () => assertRollbackBinding(context, { ...state, taskKey: 'foreign_task' }),
    /TASK_MISMATCH/
  )
  assert.throws(
    () => assertRollbackBinding(context, { ...state, resourceFingerprint: '0'.repeat(64) }),
    /FINGERPRINT_MISMATCH/
  )
})
test('rollback command is bound to infra Compose without application interpolation or orphan deletion', () => {
  const context = loadDatabaseContext(repositoryRoot)
  const args = databaseRollbackComposeArgs(context, '/tmp/fixture-compose.env')
  assert.equal(args[args.indexOf('-f') + 1], 'docker-compose.infra.yml')
  assert.equal(args.includes('docker-compose.yml'), false)
  assert.equal(args.includes('--remove-orphans'), false)
  assert.deepEqual(args.slice(-4), ['down', '--volumes', '--timeout', '30'])
  assert.deepEqual(ownerNamedResourceListArgs(context, 'network'), [
    'network',
    'ls',
    '--format',
    '{{.Name}}',
    '--filter',
    `label=oes.local.owner=${context.taskKey}`
  ])
})
test('infra Compose remains renderable when application runtime selectors are missing', () => {
  const context = loadDatabaseContext(repositoryRoot)
  const environment = { ...process.env, ...Object.fromEntries(composeEnvironment(context)) }
  for (const key of [
    'SRM_PARTY_MACHINE_WORKLOAD_BINDING_ID',
    'PUBLIC_ENTRY_FOUNDATION_MACHINE_PRINCIPAL_ID'
  ]) {
    delete environment[key]
  }
  const result = spawnSync(
    'docker',
    databaseLifecycleComposeArgs(context, '/dev/null', ['config', '--quiet']),
    { cwd: repositoryRoot, env: environment, encoding: 'utf8' }
  )
  assert.equal(result.status, 0, result.stderr)
})
test('named Docker resource ownership rejects foreign task and project labels', () => {
  const context = loadDatabaseContext(repositoryRoot)
  const valid = {
    Labels: {
      'oes.local.owner': context.taskKey,
      'com.docker.compose.project': context.projectName
    }
  }
  assert.doesNotThrow(() => assertResourceOwnershipRecord(context, 'volume', 'fixture', valid))
  assert.throws(
    () =>
      assertResourceOwnershipRecord(context, 'volume', 'fixture', {
        Labels: { ...valid.Labels, 'oes.local.owner': 'foreign-task' }
      }),
    /RESOURCE_OWNER_MISMATCH/
  )
  assert.throws(
    () =>
      assertResourceOwnershipRecord(context, 'network', 'fixture', {
        Labels: { ...valid.Labels, 'com.docker.compose.project': 'foreign-project' }
      }),
    /RESOURCE_PROJECT_MISMATCH/
  )
})
test('unexpected same-owner main-only residue fails closed before lifecycle deletion', () => {
  const context = loadDatabaseContext(repositoryRoot)
  const resources = renderedNamedResources({
    networks: { oes_network: { name: context.projectName + '_oes_network' } },
    volumes: {
      postgres_data: { name: context.projectName + '_postgres_data' },
      grpc_trust_runtime: { name: context.projectName + '_grpc_trust_runtime' }
    }
  })
  const trust = resources.find((entry) => entry.logicalName === 'grpc_trust_runtime')
  assert.deepEqual(trust, {
    kind: 'volume',
    logicalName: 'grpc_trust_runtime',
    name: context.projectName + '_grpc_trust_runtime'
  })
  const infraVolume = context.projectName + '_postgres_data'
  assert.doesNotThrow(() =>
    assertExactLifecycleOwnerResources('volume', [infraVolume], [infraVolume])
  )
  assert.throws(
    () => assertExactLifecycleOwnerResources('volume', [infraVolume], [infraVolume, trust.name]),
    /ROLLBACK_UNEXPECTED_OWNER_RESOURCE.*grpc_trust_runtime/
  )
})
test('clean lifecycle prepares generated contracts and Common before TypeScript seed execution', () => {
  const context = loadDatabaseContext(repositoryRoot)
  const commands = buildDatabaseSeedCommands(context, 49123)
  assert.deepEqual(
    commands.slice(0, 3).map(({ command, args }) => [command, ...args]),
    [
      ['pnpm', 'generated:all'],
      ['pnpm', 'common:build'],
      ['pnpm', '--filter', 'permission-service', 'seed:apply', '--', '--apply']
    ]
  )
})
test('ordinary database seed invokes the official tenant-web auth fixture with explicit task URLs', () => {
  const context = loadDatabaseContext(repositoryRoot)
  const commands = buildDatabaseSeedCommands(context, 49123, { SENTINEL: 'preserved' })
  const tenantWeb = commands.find(
    (command) => command.args.at(-1) === 'scripts/local/seed-tenant-web-auth-test-data.mjs'
  )

  assert.ok(tenantWeb)
  assert.equal(tenantWeb.command, 'node')
  assert.equal(tenantWeb.environment.SENTINEL, 'preserved')
  assert.equal(tenantWeb.environment.OES_TASK_KEY, context.taskKey)
  for (const key of [
    'AUTH_DATABASE_URL',
    'IDENTITY_DATABASE_URL',
    'PERMISSION_DATABASE_URL',
    'ITEM_MASTER_DATABASE_URL',
    'TENANT_ORG_DATABASE_URL',
    'PARTY_DATABASE_URL',
    'HR_DATABASE_URL'
  ]) {
    const url = new URL(tenantWeb.environment[key])
    assert.equal(url.hostname, '127.0.0.1')
    assert.equal(url.port, '49123')
  }
})
test('database seed stops at the first failed command and never records later work', () => {
  const visited = []
  const commands = [
    { command: 'first', args: [], options: {} },
    { command: 'tenant-web', args: [], options: {} },
    { command: 'after-failure', args: [], options: {} }
  ]

  assert.throws(
    () =>
      executeDatabaseSeedCommands(commands, (command) => {
        visited.push(command)
        if (command === 'tenant-web') throw new Error('fixture failure')
      }),
    /fixture failure/
  )
  assert.deepEqual(visited, ['first', 'tenant-web'])
})
test('database seed snapshot requires every dedicated auth acceptance fixture', () => {
  const valid = {
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
  assert.doesNotThrow(() => assertTenantWebAuthSeedSnapshot(valid))
  assert.throws(
    () => assertTenantWebAuthSeedSnapshot({ ...valid, authAcceptanceMfaBindingCount: 0 }),
    /TENANT_WEB_AUTH_SEED_INCOMPLETE.*authAcceptanceMfaBindingCount/
  )
  assert.throws(
    () => assertTenantWebAuthSeedSnapshot({ ...valid, authAcceptanceMfaWebPolicyCount: 0 }),
    /TENANT_WEB_AUTH_SEED_INCOMPLETE.*authAcceptanceMfaWebPolicyCount/
  )
  assert.throws(
    () => assertTenantWebAuthSeedSnapshot({ ...valid, authAcceptanceRecoveryPhoneMethodCount: 0 }),
    /TENANT_WEB_AUTH_SEED_INCOMPLETE.*authAcceptanceRecoveryPhoneMethodCount/
  )
  assert.throws(
    () => assertTenantWebAuthSeedSnapshot({ ...valid, permissionAuthAcceptanceWebAccessCount: 2 }),
    /TENANT_WEB_AUTH_SEED_INCOMPLETE.*permissionAuthAcceptanceWebAccessCount/
  )
  assert.throws(
    () => assertTenantWebAuthSeedSnapshot({ ...valid, mesAcceptanceNavigationCount: 0 }),
    /TENANT_WEB_AUTH_SEED_INCOMPLETE.*mesAcceptanceNavigationCount/
  )
  assert.throws(
    () => assertTenantWebAuthSeedSnapshot({ ...valid, itemMasterItemFixtureCount: 0 }),
    /TENANT_WEB_AUTH_SEED_INCOMPLETE.*itemMasterItemFixtureCount/
  )
})
test('database seed invalidates earlier SEEDED or VERIFIED success before work and on failure', () => {
  for (const phase of ['SEEDED', 'VERIFIED']) {
    const earlier = { phase, seedSnapshot: { digest: 'old-success' } }
    assert.deepEqual(
      { ...earlier, ...beginDatabaseSeedState() },
      {
        phase: 'SEEDING',
        seedSnapshot: null
      }
    )
    assert.deepEqual(
      { ...earlier, ...failDatabaseSeedState() },
      {
        phase: 'SEED_FAILED',
        seedSnapshot: null
      }
    )
  }
})
test('database verification invalidates earlier VERIFIED success before work and on failure', () => {
  const earlier = {
    phase: 'VERIFIED',
    postgresPort: 56816,
    seedSnapshot: { authAcceptanceMfaFactorPolicyCount: 4 }
  }
  assert.deepEqual({ ...earlier, ...beginDatabaseVerifyState() }, {
    ...earlier,
    phase: 'VERIFYING'
  })
  assert.deepEqual({ ...earlier, ...failDatabaseVerifyState() }, {
    ...earlier,
    phase: 'VERIFY_FAILED'
  })
})
test('Compose image policy covers main and infra rendered references', () => {
  assert.doesNotThrow(() =>
    assertPinnedComposeImages(
      { services: { pinned: { image: 'alpine:3.21@sha256:' + 'a'.repeat(64) }, built: {} } },
      'fixture.yml'
    )
  )
  assert.throws(
    () =>
      assertPinnedComposeImages({ services: { mutable: { image: 'alpine:3.21' } } }, 'fixture.yml'),
    /COMPOSE_IMAGE_MUTABLE/
  )
})
test('baseline resolution checkpoint binds task, database identity, plan, and exact targets', () => {
  const context = loadDatabaseContext(repositoryRoot)
  const service = context.services.find((entry) => entry.name === 'crm-service')
  const expected = {
    taskKey: context.taskKey,
    projectName: context.projectName,
    service: service.name,
    database: service.database,
    databaseOid: '4242',
    planFingerprint: baselinePlanFingerprint(service),
    targets: [
      ...service.baselinePlan.supersededMigrations.map((entry) => entry.name),
      service.baselinePlan.baselineMigration
    ]
  }
  const checkpoint = { version: 1, mode: 'EMPTY_BASELINE', ...expected }
  assert.equal(assertBaselineResolutionCheckpoint(checkpoint, expected), checkpoint)
  assert.throws(
    () => assertBaselineResolutionCheckpoint({ ...checkpoint, databaseOid: '9999' }, expected),
    /CHECKPOINT_MISMATCH/
  )
  assert.throws(
    () =>
      assertBaselineResolutionCheckpoint(
        { ...checkpoint, targets: checkpoint.targets.slice(1) },
        expected
      ),
    /CHECKPOINT_MISMATCH/
  )
})
test('baseline checkpoint recovery distinguishes empty baseline replay from post-baseline deploy', () => {
  assert.equal(
    baselineCheckpointResumeAction({ mode: 'EMPTY_BASELINE' }, 0),
    'REAPPLY_EMPTY_BASELINE'
  )
  assert.equal(
    baselineCheckpointResumeAction({ mode: 'EMPTY_BASELINE' }, 8),
    'VERIFY_BASELINE_INVARIANTS'
  )
  assert.equal(
    baselineCheckpointResumeAction({ mode: 'LEGACY_ADOPTION' }, 8),
    'VERIFY_CURRENT_SCHEMA'
  )
  assert.throws(
    () => baselineCheckpointResumeAction({ mode: 'UNKNOWN' }, 8),
    /CHECKPOINT_MODE_INVALID/
  )
  assert.throws(
    () => baselineCheckpointResumeAction({ mode: 'EMPTY_BASELINE' }, -1),
    /TABLE_COUNT_INVALID/
  )
})
test('HTTP readiness retries concrete failures and fails closed', () => {
  let attempts = 0
  const ready = probeHttpReadiness('http://127.0.0.1:1/ready', {
    attempts: 3,
    delayMs: 0,
    runner: () => {
      attempts += 1
      return attempts === 3
        ? { status: 0, stdout: 'ready\n', stderr: '' }
        : { status: 22, stdout: '', stderr: 'not ready' }
    }
  })
  assert.deepEqual(ready, { attempt: 3, body: 'ready' })
  assert.throws(
    () =>
      probeHttpReadiness('http://127.0.0.1:1/ready', {
        attempts: 2,
        delayMs: 0,
        runner: () => ({ status: 22, stdout: '', stderr: 'still starting' })
      }),
    /HTTP_READINESS_FAILED.*still starting/
  )
})
test('custom database invariant digests detect definition drift', () => {
  const definition = 'CREATE UNIQUE INDEX fixture ON public.fixture_table USING btree (id)'
  const assertion = {
    kind: 'index',
    name: 'fixture',
    sha256: crypto.createHash('sha256').update(definition).digest('hex')
  }
  const service = { name: 'fixture-service' }
  assert.doesNotThrow(() => assertDatabaseInvariantDigest(service, assertion, definition))
  assert.throws(
    () => assertDatabaseInvariantDigest(service, assertion, `${definition} WHERE active`),
    /DATABASE_INVARIANT_DRIFT/
  )
  assert.throws(
    () => assertDatabaseInvariantDigest(service, assertion, ''),
    /DATABASE_INVARIANT_MISSING/
  )
})
test('repository lifecycle state stays under ignored task-local storage', () => {
  const context = loadDatabaseContext(repositoryRoot)
  assert.equal(context.stateDirectory.startsWith(path.join(repositoryRoot, '.tmp')), true)
  const probe = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-db-lifecycle-test-'))
  fs.rmSync(probe, { recursive: true, force: true })
})
test('baseline resolve plans preserve active migration bytes and detect drift', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-db-fragment-test-'))
  const migrations = path.join(directory, 'prisma', 'migrations')
  const old = path.join(migrations, '20260101000000_old', 'migration.sql')
  const baseline = path.join(migrations, '20260825000000_baseline', 'migration.sql')
  fs.mkdirSync(path.dirname(old), { recursive: true })
  fs.mkdirSync(path.dirname(baseline), { recursive: true })
  fs.writeFileSync(old, 'SELECT 1;\n')
  fs.writeFileSync(baseline, 'SELECT 2;\n')
  const digest = (target) =>
    crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')
  fs.writeFileSync(
    path.join(migrations, 'baseline-resolve.json'),
    JSON.stringify({
      strategy: 'PRISMA_BASELINE_RESOLVE',
      baselineMigration: '20260825000000_baseline',
      baselineSha256: digest(baseline),
      supersededMigrations: [
        {
          name: '20260101000000_old',
          sha256: digest(old)
        }
      ]
    })
  )
  const service = { directory, name: 'fixture-service' }
  assert.equal(loadBaselineResolvePlan(service).baselineMigration, '20260825000000_baseline')
  fs.appendFileSync(old, '-- drift\n')
  assert.throws(() => loadBaselineResolvePlan(service), /DIGEST_MISMATCH/)
  fs.rmSync(directory, { recursive: true, force: true })
})
