import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { resolveCredentialReference } from '../credentials.mjs'
import { environmentForOwner } from '../manifest.mjs'
import { fingerprint, writeAtomic } from '../canonical.mjs'
import { cleanupRunPrivateFiles, startRuntime, withRuntime } from '../orchestrator.mjs'
import { cleanupSimulatedResource } from '../simulation-driver.mjs'

const root = path.resolve(import.meta.dirname, '../../../..')
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
function intent(stateRoot, taskKey, runId) { return { root, stateRoot, profile: 'LOCAL_INTEGRATION', testClass: 'integration', owners: ['permission-service'], capabilities: [], taskKey, runId, devStackId: 'fixture_machine', driver: 'simulation', concurrency: 2 } }
function devIntent(stateRoot, taskKey, runId) { return { root, stateRoot, profile: 'DEV', testClass: 'integration', owners: ['permission-service'], capabilities: [], taskKey, runId, devStackId: 'fixture_machine', driver: 'simulation', concurrency: 2, devLockTimeoutMs: 2000 } }

test('two runs share physical TEST provider but receive isolated logical allocations and credentials', async () => {
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-runtime-two-run-'))
  let releaseA
  const gateA = new Promise((resolve) => { releaseA = resolve })
  const observed = {}
  const runA = withRuntime(intent(stateRoot, 'task_a', 'run_a'), async (manifest) => {
    observed.a = manifest
    await gateA
  })
  const runB = withRuntime(intent(stateRoot, 'task_b', 'run_b'), async (manifest) => {
    observed.b = manifest
    const envA = environmentForOwner(observed.a, 'permission-service', resolveCredentialReference)
    const envB = environmentForOwner(manifest, 'permission-service', resolveCredentialReference)
    assert.notEqual(envA.OES_POSTGRES_CREDENTIAL, envB.OES_POSTGRES_CREDENTIAL)
    assert.equal(observed.a.resources[0].objectId, manifest.resources[0].objectId)
    releaseA()
    await delay(25)
    assert.equal(fs.existsSync(observed.a.resources[0].path), true)
  })
  await Promise.all([runA, runB])
  assert.equal(fs.existsSync(observed.a.resources[0].path), true)
  assert.equal(fs.existsSync(observed.a.resources[1].path), false)
  assert.equal(fs.existsSync(observed.b.resources[1].path), false)
})

test('real-resource FIFO semaphore limits concurrent runs to two', async () => {
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-runtime-fifo-'))
  let active = 0
  let maximum = 0
  await Promise.all(['a', 'b', 'c'].map((suffix) => withRuntime(intent(stateRoot, `task_${suffix}`, `run_${suffix}`), async () => { active += 1; maximum = Math.max(maximum, active); await delay(80); active -= 1 })))
  assert.equal(maximum, 2)
})

test('DEV devStack lease admits only one complete stack for the full process lifetime', async () => {
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-runtime-dev-exclusive-'))
  let active = 0
  let maximum = 0
  const adapters = {
    provisionProvider: async () => ({ resources: [], endpoints: [] }),
    cleanupResource: () => ({ disposition: 'NOT_APPLICABLE', exitStatus: 0 })
  }

  await Promise.all(['a', 'b'].map((suffix) => withRuntime(devIntent(stateRoot, `task_${suffix}`, `run_${suffix}`), async () => {
    active += 1
    maximum = Math.max(maximum, active)
    await delay(80)
    active -= 1
  }, adapters)))

  assert.equal(maximum, 1)
  assert.equal(fs.existsSync(path.join(stateRoot, 'locks', 'dev-stack-fixture_machine.lock')), false)
})

test('abnormal callback failure still reconciles exact run resources', async () => {
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-runtime-abnormal-'))
  const sentinel = new Error('abnormal sentinel')
  await assert.rejects(withRuntime(intent(stateRoot, 'task_abnormal', 'run_abnormal'), async () => { throw sentinel }), sentinel)
  const cleanup = JSON.parse(fs.readFileSync(path.join(stateRoot, 'runs', 'task_abnormal', 'run_abnormal', 'cleanup.json'), 'utf8'))
  assert.equal(cleanup.result, 'RECONCILED')
  assert.equal(cleanup.sharedLeaseCount, 0)
  assert.equal(fs.existsSync(path.join(stateRoot, 'runs', 'task_abnormal', 'run_abnormal', 'credentials')), false)
  assert.equal(cleanup.cleanupResults.at(-1).resource.kind, 'run-private-files')
})

test('run-private cleanup removes CA, bootstrap, policy and credential files behind the exact owner marker', () => {
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-runtime-private-files-'))
  const directory = path.join(stateRoot, 'runs', 'task_private', 'run_private')
  const markerRaw = { schemaVersion: 2, kind: 'OES_RUNTIME_RUN_OWNER', path: directory, taskKey: 'task_private', runId: 'run_private' }
  writeAtomic(path.join(directory, 'run-owner.json'), { ...markerRaw, markerFingerprint: fingerprint(markerRaw) })
  for (const file of ['provider/mtls/ca.key', 'provider/postgres-bootstrap.json', 'provider/minio-policy.json', 'credentials/mtls.json']) {
    const target = path.join(directory, file)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, 'fixture-secret')
  }

  const result = cleanupRunPrivateFiles({ stateRoot, runDirectory: directory, taskKey: 'task_private', runId: 'run_private' })

  assert.equal(result.disposition, 'DELETED_EXACT')
  assert.equal(result.deleted.length, 4)
  assert.equal(fs.existsSync(path.join(directory, 'provider')), false)
  assert.equal(fs.existsSync(path.join(directory, 'credentials')), false)
})

test('unready provider fails before manifest publication and reconciles partial state', async () => {
  const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-runtime-unready-'))
  const runDirectory = path.join(stateRoot, 'runs', 'task_unready', 'run_unready')
  await assert.rejects(startRuntime(intent(stateRoot, 'task_unready', 'run_unready'), { provisionProvider: async () => ({ resources: [{ kind: 'simulated-logical', scope: 'RUN', provider: 'postgres', objectId: 'x', path: path.join(runDirectory, 'owned'), cleanup: 'DELETE_EXACT' }], endpoints: [{ provider: 'postgres', ready: false, authority: '', owners: ['permission-service'], environment: {}, credentialReference: null }] }), cleanupResource: cleanupSimulatedResource }), /MANIFEST_ENDPOINT_UNREADY/)
  assert.equal(fs.existsSync(path.join(runDirectory, 'manifest.json')), false)
  assert.equal(fs.existsSync(path.join(runDirectory, 'failed-cleanup.json')), true)
})
