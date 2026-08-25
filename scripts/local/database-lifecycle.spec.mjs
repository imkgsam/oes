import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  assertDatabaseInvariantDigest,
  assertResourceOwnershipRecord,
  assertRollbackBinding,
  composeEnvironment,
  loadBaselineResolvePlan,
  loadDatabaseContext,
  probeHttpReadiness,
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
  assert.match(values.get('NATS_NOTIFICATION_PASSWORD'), /^[a-f0-9]{32}$/)
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
