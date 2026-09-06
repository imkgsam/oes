#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { applyCommittedMigrations, applyFoundationSeeds, applyRunFixture, cleanProcessEnvironment, prepareDevelopmentArtifacts, reconcileMachineWorkloadSelectors } from './src/bootstrap.mjs'
import { loadRuntimeConfig } from './src/config.mjs'
import { resolveCredentialReference } from './src/credentials.mjs'
import { inventoryLegacyResources, planLegacyCleanup, applyLegacyCleanup, observeLegacyResidue, backupValidDevData, writeLegacyArtifact } from './src/legacy-reconcile.mjs'
import { environmentForOwner, reopenManifest } from './src/manifest.mjs'
import { reconcileRuntime, startRuntime, withRuntime } from './src/orchestrator.mjs'
import { planRuntime } from './src/planner.mjs'
import { runChecked } from './src/process.mjs'
import { startDevelopmentProcesses, stopDevelopmentProcesses } from './src/process-runtime.mjs'
import { backupDevelopmentState, restoreDevelopmentState } from './src/development-backup.mjs'

const root = path.resolve(import.meta.dirname, '../..')

/** Parses long options while preserving the command following `--`. */
export function parseArguments(argv) {
  const separator = argv.indexOf('--')
  const command = separator >= 0 ? argv.slice(separator + 1) : []
  const tokens = separator >= 0 ? argv.slice(0, separator) : argv
  const options = {}
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (!token.startsWith('--')) continue
    const [key, inline] = token.slice(2).split('=', 2)
    options[key] = inline ?? (tokens[index + 1]?.startsWith('--') || index + 1 === tokens.length ? 'true' : tokens[++index])
  }
  return { options, command }
}

/** Splits one comma-separated option into a stable unique list. */
function list(value) { return [...new Set(String(value || '').split(',').map((item) => item.trim()).filter(Boolean))] }

/** Converts CLI options into one explicit launcher intent. */
function intentFrom(options) {
  return {
    root,
    profile: options.profile || 'LOCAL_INTEGRATION',
    testClass: options['test-class'] || 'integration',
    owners: list(options.owners || options.owner),
    capabilities: list(options.capabilities),
    taskKey: options['task-key'],
    runId: options['run-id'],
    devStackId: options['dev-stack-id'],
    stateRoot: options['state-root'],
    machineConfigPath: options['machine-config'],
    concurrency: options.concurrency,
    driver: options.driver || 'docker'
  }
}

/** Writes deterministic JSON output without credential values. */
function emit(value) { process.stdout.write(`${JSON.stringify(value, null, 2)}\n`) }

/** Resolves the exact owner environment from a registered manifest. */
function ownerEnvironment(manifest, owner) {
  return { ...cleanProcessEnvironment(), ...environmentForOwner(manifest, owner, resolveCredentialReference), OES_RUNTIME_MANIFEST: path.join(manifest.runDirectory, 'manifest.json') }
}

/** Implements the unified launcher command surface. */
export async function main(argv = process.argv.slice(2)) {
  const subcommand = argv[0]
  const { options, command } = parseArguments(argv.slice(1))
  if (subcommand === 'dev') {
    const scopes = {
      system: ['permission-service','identity-service','hr-service','auth-service','collaboration-service','asset-service','item-master-service','notification-service','public-entry-service','party-service','site-service','tenant-org-service','terminal-device-service','browser-activity-service','api-gateway'],
      business: ['sales-service','crm-service','srm-service','finance-service','procurement-service','wms-service','mes-service'],
      full: Object.keys(JSON.parse(fs.readFileSync(path.join(root, 'scripts/local-runtime/relationships.json'), 'utf8')).owners)
    }
    const explicitOwners = list(options.owners || options.owner)
    const owners = explicitOwners.length ? explicitOwners : scopes[options.scope || 'full']
    if (!owners) throw new Error(`DEV_SCOPE_INVALID scope=${options.scope}`)
    const controller = new AbortController()
    const interrupt = () => controller.abort(new Error('DEVELOPMENT_INTERRUPTED'))
    process.once('SIGINT', interrupt)
    process.once('SIGTERM', interrupt)
    let started
    let processes
    try {
      started = await startRuntime({ ...intentFrom({ ...options, profile: 'DEV', 'test-class': 'integration', owners: owners.join(','), 'task-key': options['task-key'] || 'developer_dev' }), owners })
      if (controller.signal.aborted) throw controller.signal.reason
      backupDevelopmentState(started.file)
      if (controller.signal.aborted) throw controller.signal.reason
      prepareDevelopmentArtifacts(started.file, { root })
      if (controller.signal.aborted) throw controller.signal.reason
      applyCommittedMigrations(started.file, { root })
      if (controller.signal.aborted) throw controller.signal.reason
      applyFoundationSeeds(started.file, { root })
      if (controller.signal.aborted) throw controller.signal.reason
      const selectors = reconcileMachineWorkloadSelectors(started.file, { root })
      if (controller.signal.aborted) throw controller.signal.reason
      processes = await startDevelopmentProcesses(started.file, { root, selectorPath: selectors?.path, signal: controller.signal })
      emit({ status: 'DEV_READY', manifestPath: processes.manifestPath, manifestFingerprint: processes.manifest.manifestFingerprint, owners })
      if (!controller.signal.aborted) await new Promise((resolvePromise) => controller.signal.addEventListener('abort', resolvePromise, { once: true }))
    } finally {
      process.removeListener('SIGINT', interrupt)
      process.removeListener('SIGTERM', interrupt)
      if (processes) await stopDevelopmentProcesses(processes.children)
      if (started) reconcileRuntime({ manifestPath: started.file, cleanupResource: started.cleanup, releaseSlot: started.releaseSlot, releaseDevLock: started.releaseDevLock })
    }
    return
  }
  if (subcommand === 'plan') {
    const intent = intentFrom(options)
    const config = loadRuntimeConfig({ root, profile: intent.profile, explicit: { concurrency: intent.concurrency }, machineConfigPath: intent.machineConfigPath, stateRoot: intent.stateRoot })
    emit({ config, plan: planRuntime(intent) })
    return
  }
  if (subcommand === 'start') {
    const started = await startRuntime(intentFrom(options))
    emit({ status: 'REGISTERED', manifestPath: started.file, manifestFingerprint: started.manifest.manifestFingerprint, taskKey: started.manifest.taskKey, runId: started.manifest.runId, profile: started.manifest.profile })
    return
  }
  if (subcommand === 'run') {
    if (!command.length) throw new Error('RUNTIME_COMMAND_REQUIRED')
    const owner = options.owner
    if (!owner) throw new Error('RUNTIME_COMMAND_OWNER_REQUIRED')
    await withRuntime(intentFrom(options), async (manifest, manifestPath) => {
      if (options.migrate === 'true') applyCommittedMigrations(manifestPath, { root })
      if (options['foundation-seed'] === 'true') applyFoundationSeeds(manifestPath, { root })
      if (options.fixture) applyRunFixture(manifestPath, options.fixture, { root })
      const result = runChecked(command[0], command.slice(1), { cwd: root, env: ownerEnvironment(manifest, owner), timeout: Number(options.timeout || 600000) })
      process.stdout.write(result.stdout)
      process.stderr.write(result.stderr)
      emit({ status: 'COMMAND_COMPLETE', exitStatus: result.status, manifestFingerprint: manifest.manifestFingerprint })
    })
    return
  }
  if (['migrate', 'foundation-seed', 'fixture'].includes(subcommand)) {
    const manifestPath = path.resolve(options.manifest || '')
    const result = subcommand === 'migrate' ? applyCommittedMigrations(manifestPath, { root }) : subcommand === 'foundation-seed' ? applyFoundationSeeds(manifestPath, { root }) : applyRunFixture(manifestPath, options.fixture, { root })
    emit({ status: 'COMPLETE', stage: subcommand, results: result })
    return
  }
  if (subcommand === 'reconcile') {
    const manifestPath = options.manifest ? path.resolve(options.manifest) : null
    const transactionPath = options.transaction ? path.resolve(options.transaction) : null
    emit(reconcileRuntime({ manifestPath, transactionPath }))
    return
  }
  if (subcommand === 'status') {
    const manifest = reopenManifest(path.resolve(options.manifest || ''))
    emit({ status: manifest.lifecycle, profile: manifest.profile, taskKey: manifest.taskKey, runId: manifest.runId, devStackId: manifest.devStackId, manifestFingerprint: manifest.manifestFingerprint, providers: manifest.endpoints.map((endpoint) => ({ provider: endpoint.provider, authority: endpoint.authority, ready: endpoint.ready })) })
    return
  }
  if (subcommand === 'dev-backup') {
    const manifestPath = path.resolve(options.manifest || '')
    emit(backupDevelopmentState(manifestPath, { outputDirectory: options.output }))
    return
  }
  if (subcommand === 'dev-restore') {
    const manifestPath = path.resolve(options.manifest || '')
    const record = JSON.parse(fs.readFileSync(path.resolve(options.backup || ''), 'utf8'))
    const confirmation = JSON.parse(fs.readFileSync(path.resolve(options.confirmation || ''), 'utf8'))
    emit(restoreDevelopmentState(manifestPath, record, confirmation))
    return
  }
  if (subcommand === 'legacy-inventory') {
    const value = inventoryLegacyResources({ bindingsPath: options.bindings })
    if (options.output) writeLegacyArtifact(options.output, value)
    emit(value)
    return
  }
  if (subcommand === 'legacy-plan') {
    const inventory = JSON.parse(fs.readFileSync(path.resolve(options.inventory), 'utf8'))
    const value = planLegacyCleanup(inventory, { ownerTaskId: options['owner-task-id'] })
    if (options.output) writeLegacyArtifact(options.output, value)
    emit(value)
    return
  }
  if (subcommand === 'legacy-backup') {
    const inventory = JSON.parse(fs.readFileSync(path.resolve(options.inventory), 'utf8'))
    const value = backupValidDevData({ inventory, outputDirectory: path.resolve(options.output) })
    writeLegacyArtifact(path.join(path.resolve(options.output), 'backup-record.json'), value)
    emit(value)
    return
  }
  if (subcommand === 'legacy-apply') {
    const planPath = path.resolve(options.plan)
    const confirmationPath = path.resolve(options.confirmation)
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'))
    const confirmation = JSON.parse(fs.readFileSync(confirmationPath, 'utf8'))
    const value = applyLegacyCleanup({ plan, planPath, confirmation, confirmationPath })
    if (options.output) writeLegacyArtifact(options.output, value)
    emit(value)
    return
  }
  if (subcommand === 'legacy-residue') {
    const plan = JSON.parse(fs.readFileSync(path.resolve(options.plan), 'utf8'))
    const inventory = inventoryLegacyResources({ bindingsPath: options.bindings })
    const value = observeLegacyResidue(plan, inventory)
    if (options.output) writeLegacyArtifact(options.output, value)
    emit(value)
    return
  }
  emit({
    launcher: 'OES local runtime v2',
    commands: ['dev', 'plan', 'start', 'run', 'migrate', 'foundation-seed', 'fixture', 'status', 'reconcile', 'dev-backup', 'dev-restore', 'legacy-inventory', 'legacy-plan', 'legacy-backup', 'legacy-apply', 'legacy-residue'],
    identity: 'Pass --task-key and optionally --run-id; worktree paths never derive ownership.',
    examples: [
      'node scripts/local-runtime/launcher.mjs plan --profile LOCAL_INTEGRATION --test-class integration --owner asset-service --capabilities object-store',
      'node scripts/local-runtime/launcher.mjs run --profile CI --test-class integration --owner permission-service --task-key ci_job --migrate -- pnpm --filter permission-service test:integration'
    ]
  })
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => { process.stderr.write(`${error.stack || error.message || error}\n`); process.exitCode = 1 })
