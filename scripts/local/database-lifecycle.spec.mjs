import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  assertRollbackBinding,
  composeEnvironment,
  loadDatabaseContext,
  resourceFingerprint,
  validateLegacyFragments
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

test('repository lifecycle state stays under ignored task-local storage', () => {
  const context = loadDatabaseContext(repositoryRoot)
  assert.equal(context.stateDirectory.startsWith(path.join(repositoryRoot, '.tmp')), true)
  const probe = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-db-lifecycle-test-'))
  fs.rmSync(probe, { recursive: true, force: true })
})

test('legacy migration fragment manifests detect byte drift', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-db-fragment-test-'))
  const migrations = path.join(directory, 'prisma', 'migrations')
  fs.mkdirSync(migrations, { recursive: true })
  fs.writeFileSync(path.join(migrations, 'legacy__old.sql'), 'SELECT 1;\n')
  fs.writeFileSync(
    path.join(migrations, 'legacy-fragments.json'),
    JSON.stringify({
      reason: 'INCOMPLETE_FROM_EMPTY_AUDIT',
      preservedFragments: [
        {
          name: 'old',
          sha256: 'b4e0497804e46e0a0b0b8c31975b062152d551bac49c3c2e80932567b4085dcd'
        }
      ]
    })
  )
  const service = { directory, name: 'fixture-service' }
  assert.doesNotThrow(() => validateLegacyFragments(service))
  fs.appendFileSync(path.join(migrations, 'legacy__old.sql'), '-- drift\n')
  assert.throws(() => validateLegacyFragments(service), /DIGEST_MISMATCH/)
  fs.rmSync(directory, { recursive: true, force: true })
})
