import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { acquireExclusiveLease, acquireFifoSlot, releaseExclusiveLease, releaseFifoIdentity, withExclusiveLock } from './locks.mjs'
import { fingerprint, readJson, redact, sha256, writeAtomic } from './canonical.mjs'
import { loadRuntimeConfig } from './config.mjs'
import { planRuntime } from './planner.mjs'
import { publishManifest, reopenManifest, runDirectory } from './manifest.mjs'
import { cleanupDockerResource, provisionDockerProvider } from './docker-driver.mjs'
import { cleanupSimulatedResource, provisionSimulatedProvider } from './simulation-driver.mjs'

const ID = /^[a-z0-9][a-z0-9_-]{1,79}$/u

/** Validates an accountable runtime identity that is independent of repository paths. */
function exactId(value, name) {
  if (!ID.test(value || '')) throw new Error(`RUNTIME_ID_INVALID key=${name}`)
  return value
}

/** Reopens or creates the machine-stable devStackId outside the repository. */
async function resolveDevStackId(stateRoot, explicit) {
  const identityPath = path.join(stateRoot, 'machine', 'dev-stack.json')
  return withExclusiveLock(path.join(stateRoot, 'locks', 'machine-identity.lock'), async () => {
    if (fs.existsSync(identityPath)) {
      const existing = readJson(identityPath)
      if (explicit && explicit !== existing.devStackId) throw new Error(`DEV_STACK_ID_MISMATCH expected=${explicit} actual=${existing.devStackId}`)
      return exactId(existing.devStackId, 'devStackId')
    }
    const devStackId = exactId(explicit || `machine_${sha256(`${process.platform}:${process.arch}:${process.env.USER || 'user'}`).slice(0, 16)}`, 'devStackId')
    writeAtomic(identityPath, { schemaVersion: 2, devStackId, createdAt: new Date().toISOString() })
    return devStackId
  })
}

/** Records one secret-free exact runtime event for later evidence reopening. */
function appendEvent(directory, event) {
  const file = path.join(directory, 'events.ndjson')
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 })
  fs.appendFileSync(file, `${JSON.stringify(redact({ at: new Date().toISOString(), ...event }))}\n`, { mode: 0o600 })
  return file
}

/** Derives shared-provider reference count from exact lease files instead of a mutable scalar. */
function sharedLeaseCount(stateRoot, devStackId) {
  const root = path.join(stateRoot, 'leases', devStackId)
  if (!fs.existsSync(root)) return 0
  return fs.readdirSync(root).filter((entry) => entry.endsWith('.json')).length
}

/** Removes every run-private provider and credential file after exact resources no longer need them. */
export function cleanupRunPrivateFiles(context) {
  const expectedRunDirectory = path.resolve(runDirectory(context.stateRoot, context.taskKey, context.runId))
  if (path.resolve(context.runDirectory) !== expectedRunDirectory) throw new Error('RUN_PRIVATE_DIRECTORY_IDENTITY_MISMATCH')
  const markerPath = path.join(expectedRunDirectory, 'run-owner.json')
  const marker = readJson(markerPath)
  if (marker.markerFingerprint !== fingerprint(marker, 'markerFingerprint') || marker.path !== expectedRunDirectory || marker.taskKey !== context.taskKey || marker.runId !== context.runId) throw new Error('RUN_PRIVATE_OWNER_MARKER_MISMATCH')
  const deleted = []
  const walk = (root, current = root) => {
    const stat = fs.lstatSync(current)
    if (stat.isSymbolicLink()) throw new Error(`RUN_PRIVATE_SYMLINK_PRESERVED path=${current}`)
    if (stat.isFile()) {
      deleted.push({ path: path.relative(expectedRunDirectory, current), sha256: sha256(fs.readFileSync(current)), mode: stat.mode & 0o777 })
      return
    }
    for (const entry of fs.readdirSync(current)) walk(root, path.join(current, entry))
  }
  for (const name of ['provider', 'credentials']) {
    const target = path.join(expectedRunDirectory, name)
    if (!fs.existsSync(target)) continue
    walk(target)
    fs.rmSync(target, { recursive: true })
    if (fs.existsSync(target)) throw new Error(`RUN_PRIVATE_DIRECTORY_REMAINS path=${target}`)
  }
  return { resource: { kind: 'run-private-files', scope: 'RUN', runDirectory: expectedRunDirectory }, disposition: deleted.length ? 'DELETED_EXACT' : 'ALREADY_ABSENT', deleted, exitStatus: 0 }
}

/** Starts one exact runtime allocation and publishes its manifest only after provider readiness. */
export async function startRuntime(intent, adapters = {}) {
  const root = path.resolve(intent.root)
  const taskKey = exactId(intent.taskKey, 'taskKey')
  const runId = exactId(intent.runId || `run_${crypto.randomUUID().replaceAll('-', '')}`, 'runId')
  const config = loadRuntimeConfig({ root, profile: intent.profile, explicit: { concurrency: intent.concurrency, logLevel: intent.logLevel }, machineConfigPath: intent.machineConfigPath, stateRoot: intent.stateRoot })
  const plan = planRuntime({ root, profile: intent.profile, testClass: intent.testClass, owners: intent.owners, capabilities: intent.capabilities })
  const devStackId = await resolveDevStackId(config.stateRoot, intent.devStackId)
  const devLock = intent.profile === 'DEV'
    ? await acquireExclusiveLease(path.join(config.stateRoot, 'locks', `dev-stack-${devStackId}.lock`), { kind: 'DEV_STACK', devStackId, taskKey, runId }, { timeoutMs: intent.devLockTimeoutMs || 30000 })
    : { lease: null, release: () => {} }
  try {
    const directory = runDirectory(config.stateRoot, taskKey, runId)
    if (fs.existsSync(path.join(directory, 'manifest.json'))) throw new Error(`RUNTIME_RUN_ALREADY_REGISTERED taskKey=${taskKey} runId=${runId}`)
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 })
    const markerRaw = { schemaVersion: 2, kind: 'OES_RUNTIME_RUN_OWNER', path: directory, taskKey, runId }
    writeAtomic(path.join(directory, 'run-owner.json'), { ...markerRaw, markerFingerprint: fingerprint(markerRaw) })
    const context = { root, stateRoot: config.stateRoot, runDirectory: directory, profile: intent.profile, taskKey, runId, devStackId, owners: plan.owners, capabilities: plan.capabilities, providerOwners: plan.providerOwners }
    const releaseSlot = plan.realInfrastructure ? await acquireFifoSlot(config.stateRoot, config.concurrency, { taskKey, runId, runDirectory: directory }) : () => {}
    const leasePath = path.join(config.stateRoot, 'leases', devStackId, `${taskKey}--${runId}.json`)
    writeAtomic(leasePath, { schemaVersion: 2, devStackId, taskKey, runId, profile: intent.profile, planFingerprint: plan.planFingerprint, pid: process.pid, createdAt: new Date().toISOString() })
    const transaction = { schemaVersion: 2, lifecycle: 'ALLOCATING', ...context, plan, config: redact(config), devLockLease: devLock.lease, resources: [], endpoints: [] }
    const transactionPath = path.join(directory, 'transaction.json')
    writeAtomic(transactionPath, transaction)
    appendEvent(directory, { event: 'ALLOCATION_STARTED', taskKey, runId, profile: intent.profile, planFingerprint: plan.planFingerprint })
    const provision = adapters.provisionProvider || (intent.driver === 'simulation' ? provisionSimulatedProvider : provisionDockerProvider)
    const cleanup = adapters.cleanupResource || (intent.driver === 'simulation' ? cleanupSimulatedResource : cleanupDockerResource)
    try {
    for (const provider of plan.providers) {
      const result = await provision(provider, context)
      transaction.resources.push(...result.resources)
      transaction.endpoints.push(...result.endpoints)
      writeAtomic(transactionPath, transaction)
      appendEvent(directory, { event: 'PROVIDER_READY', provider, resources: result.resources.map((resource) => ({ kind: resource.kind, objectId: resource.objectId, scope: resource.scope })) })
    }
    transaction.lifecycle = 'REGISTERED'
    transaction.sharedLeaseCount = sharedLeaseCount(config.stateRoot, devStackId)
    transaction.evidenceReference = path.join(directory, 'events.ndjson')
    const published = publishManifest(directory, transaction)
    fs.rmSync(transactionPath)
    appendEvent(directory, { event: 'MANIFEST_PUBLISHED', manifestFingerprint: published.manifest.manifestFingerprint, manifestSha256: published.sha256 })
      return { ...published, releaseSlot, releaseDevLock: devLock.release, cleanup, context }
    } catch (primary) {
      transaction.lifecycle = 'RECONCILING_AFTER_FAILURE'
      writeAtomic(transactionPath, transaction)
      const cleanupResults = []
      for (const resource of [...transaction.resources].reverse()) cleanupResults.push(cleanup(resource, context))
      cleanupResults.push(cleanupResults.some((result) => result.exitStatus !== 0)
        ? { resource: { kind: 'run-private-files', scope: 'RUN', runDirectory: context.runDirectory }, disposition: 'PRESERVED_DEPENDENT_CLEANUP_FAILURE', exitStatus: 1 }
        : cleanupRunPrivateFiles(context))
      writeAtomic(path.join(directory, 'failed-cleanup.json'), { schemaVersion: 2, taskKey, runId, cleanupResults: redact(cleanupResults), primaryFailure: primary.message })
      fs.rmSync(leasePath, { force: true })
      releaseSlot()
      throw primary
    }
  } catch (error) {
    devLock.release()
    throw error
  }
}

/** Reconciles a registered or interrupted run using only its exact manifest/transaction truth. */
export function reconcileRuntime({ manifestPath, transactionPath, cleanupResource, releaseSlot = () => {}, releaseDevLock }) {
  const source = manifestPath || transactionPath
  if (!source || !fs.existsSync(source)) throw new Error(`RUNTIME_RECONCILE_SOURCE_MISSING path=${source}`)
  const value = manifestPath ? reopenManifest(manifestPath) : readJson(transactionPath)
  const directory = path.dirname(source)
  const context = { root: value.root, stateRoot: value.stateRoot, runDirectory: directory, profile: value.profile, taskKey: value.taskKey, runId: value.runId, devStackId: value.devStackId, owners: value.owners || value.plan.owners, capabilities: value.capabilities || value.plan.capabilities, providerOwners: value.providerOwners || value.plan.providerOwners }
  const cleanup = cleanupResource || cleanupDockerResource
  const cleanupResults = []
  for (const resource of [...value.resources].reverse()) cleanupResults.push(cleanup(resource, context))
  cleanupResults.push(cleanupResults.some((result) => result.exitStatus !== 0)
    ? { resource: { kind: 'run-private-files', scope: 'RUN', runDirectory: directory }, disposition: 'PRESERVED_DEPENDENT_CLEANUP_FAILURE', exitStatus: 1 }
    : cleanupRunPrivateFiles(context))
  const failures = cleanupResults.filter((result) => result.exitStatus !== 0)
  const leasePath = path.join(value.stateRoot, 'leases', value.devStackId, `${value.taskKey}--${value.runId}.json`)
  fs.rmSync(leasePath, { force: true })
  releaseSlot()
  releaseFifoIdentity(value.stateRoot, value.taskKey, value.runId)
  if (releaseDevLock) releaseDevLock()
  else if (value.devLockLease) releaseExclusiveLease(value.devLockLease)
  const record = { schemaVersion: 2, taskKey: value.taskKey, runId: value.runId, sourceFingerprint: value.manifestFingerprint || fingerprint(value), cleanupResults: redact(cleanupResults), sharedLeaseCount: sharedLeaseCount(value.stateRoot, value.devStackId), result: failures.length ? 'PRESERVED_WITH_FINDINGS' : 'RECONCILED' }
  record.recordFingerprint = fingerprint(record)
  writeAtomic(path.join(directory, 'cleanup.json'), record)
  appendEvent(directory, { event: 'RUN_RECONCILED', result: record.result, sharedLeaseCount: record.sharedLeaseCount })
  return record
}

/** Runs a callback against one manifest and always reconciles exact owned resources. */
export async function withRuntime(intent, callback, adapters = {}) {
  const started = await startRuntime(intent, adapters)
  let primary
  try { return await callback(started.manifest, started.file) } catch (error) { primary = error; throw error } finally {
    try { reconcileRuntime({ manifestPath: started.file, cleanupResource: started.cleanup, releaseSlot: started.releaseSlot, releaseDevLock: started.releaseDevLock }) } catch (cleanupError) {
      if (primary) throw new AggregateError([primary, cleanupError], 'RUNTIME_EXECUTION_AND_RECONCILIATION_FAILED')
      throw cleanupError
    }
  }
}
