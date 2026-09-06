import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { writeCredentialBundle, resolveCredentialReference } from '../credentials.mjs'
import { environmentForOwner, publishManifest, reopenManifest } from '../manifest.mjs'

test('manifest publication is readiness-gated, atomic and value-free', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-runtime-manifest-'))
  assert.throws(() => publishManifest(directory, { lifecycle: 'ALLOCATING', endpoints: [] }), /MANIFEST_NOT_READY/)
  const reference = writeCredentialBundle(directory, 'postgres', { 'owner-a': { DATABASE_URL: 'postgresql://secret' } })
  const published = publishManifest(directory, { lifecycle: 'REGISTERED', profile: 'LOCAL_INTEGRATION', devStackId: 'machine_a', taskKey: 'task_a', runId: 'run_a', owners: ['owner-a'], endpoints: [{ provider: 'postgres', ready: true, authority: 'docker:abc:5432/tcp', owners: ['owner-a'], environment: { OES_POSTGRES_PORT: '31000' }, credentialReference: reference }] })
  assert.equal(fs.existsSync(`${published.file}.tmp`), false)
  assert.doesNotMatch(fs.readFileSync(published.file, 'utf8'), /postgresql:\/\/secret/u)
  const reopened = reopenManifest(published.file, { taskKey: 'task_a', runId: 'run_a' })
  assert.deepEqual(environmentForOwner(reopened, 'owner-a', resolveCredentialReference), { NODE_ENV: 'test', OES_TASK_KEY: 'task_a', OES_RUN_ID: 'run_a', OES_DEV_STACK_ID: 'machine_a', OES_POSTGRES_PORT: '31000', DATABASE_URL: 'postgresql://secret' })
  assert.throws(() => environmentForOwner(reopened, 'owner-b', resolveCredentialReference), /MANIFEST_OWNER_UNDECLARED/)
})
