import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  assertBaselineResolutionCheckpoint,
  assertDatabaseInvariantDigest,
  assertPinnedComposeImages,
  assertResourceOwnershipRecord,
  assertRollbackBinding,
  baselinePlanFingerprint,
  composeEnvironment,
  loadBaselineResolvePlan,
  loadDatabaseContext,
  probeHttpReadiness,
  renderedNamedResources,
  resourceFingerprint
} from './database-lifecycle.mjs'

const repositoryRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')

test('database context binds 21 unique service-owned databases to one task project', () => {
  const context = loadDatabaseContext(repositoryRoot)
  assert.equal(context.services.length, 21)
  assert.equal(new Set(context.services.map((service) => service.database)).size, 21)
  assert.equal(context.projectName, `oes_${context.taskKey}`)
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
  assert.throws(() => assertRollbackBinding(context, { ...state, taskKey: 'foreign_task' }), /TASK_MISMATCH/)
  assert.throws(
    () => assertRollbackBinding(context, { ...state, resourceFingerprint: '0'.repeat(64) }),
    /FINGERPRINT_MISMATCH/
  )
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

test('main resource enumeration guards the optional trust volume', () => {
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
  assert.throws(
    () =>
      assertResourceOwnershipRecord(context, trust.kind, trust.name, {
        Labels: {
          'oes.local.owner': 'foreign-task',
          'com.docker.compose.project': context.projectName
        }
      }),
    /RESOURCE_OWNER_MISMATCH/
  )
})

test('service and Gateway images generate tracked proto outputs before Common build', () => {
  const ignored = fs.readFileSync(path.join(repositoryRoot, '.dockerignore'), 'utf8').split(/\r?\n/)
  assert.ok(ignored.includes('docs'), 'Feature Packet updates must not change runtime image inputs')
  for (const relative of ['docker/Dockerfile.service', 'docker/Dockerfile.api-gateway']) {
    const contents = fs.readFileSync(path.join(repositoryRoot, relative), 'utf8')
    const proto = contents.indexOf('pnpm proto:gen')
    const common = contents.indexOf('pnpm common:build')
    assert.match(contents, /FROM bufbuild\/buf:1\.61\.0@sha256:[a-f0-9]{64} AS buf/)
    assert.match(contents, /COPY --from=buf \/usr\/local\/bin\/buf \/usr\/local\/bin\/buf/)
    assert.ok(proto >= 0, relative + ' must generate proto output')
    assert.ok(common > proto, relative + ' must generate proto before Common build')
  }
})

test('clean lifecycle prepares generated contracts and Common before TypeScript seed execution', () => {
  const contents = fs.readFileSync(path.join(repositoryRoot, 'scripts/local/database-lifecycle.mjs'), 'utf8')
  const generated = contents.indexOf("run('pnpm', ['generated:all']")
  const common = contents.indexOf("run('pnpm', ['common:build']")
  const permissionSeed = contents.indexOf("['--filter', 'permission-service', 'seed:apply'")
  assert.ok(generated >= 0)
  assert.ok(common > generated)
  assert.ok(permissionSeed > common)
})

test('Compose image policy covers main and infra rendered references', () => {
  assert.doesNotThrow(() =>
    assertPinnedComposeImages(
      { services: { pinned: { image: 'alpine:3.21@sha256:' + 'a'.repeat(64) }, built: {} } },
      'fixture.yml'
    )
  )
  assert.throws(
    () => assertPinnedComposeImages({ services: { mutable: { image: 'alpine:3.21' } } }, 'fixture.yml'),
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
    () => assertBaselineResolutionCheckpoint({ ...checkpoint, targets: checkpoint.targets.slice(1) }, expected),
    /CHECKPOINT_MISMATCH/
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
  assert.throws(() => assertDatabaseInvariantDigest(service, assertion, ''), /DATABASE_INVARIANT_MISSING/)
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
  const digest = (target) => crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')
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
