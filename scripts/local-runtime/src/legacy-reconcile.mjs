import fs from 'node:fs'
import path from 'node:path'
import { fingerprint, readJson, sha256, writeAtomic } from './canonical.mjs'
import { runChecked } from './process.mjs'

const CLASSIFICATIONS = new Set(['VALID_DEV_DATA', 'ACTIVE_OWNER_HELD', 'CONFIRMED_IDLE_LEGACY_RESIDUE', 'UNKNOWN_OR_INSUFFICIENT_EVIDENCE'])

/** Returns all Docker objects of one kind without inspecting secret-bearing configuration. */
function inspectAll(kind) {
  const listArgs = kind === 'container' ? ['ps', '-aq'] : [kind, 'ls', '-q']
  const identifiers = runChecked('docker', listArgs, { timeout: 30000 }).stdout.trim().split(/\s+/u).filter(Boolean)
  if (!identifiers.length) return []
  const inspectKind = kind === 'container' ? ['inspect', '--type', 'container'] : [kind, 'inspect']
  const output = runChecked('docker', [...inspectKind, ...identifiers], { timeout: 120000 }).stdout
  const values = JSON.parse(output)
  return kind === 'container' ? values : values.flat()
}

/** Returns whether labels provide an OES discovery lead without treating a name as ownership proof. */
function isOesLead(labels = {}, name = '') {
  return Boolean(labels['oes.local.owner'] || labels['oes.runtime.version'] || /^oes(?:_|-|$)/iu.test(labels['com.docker.compose.project'] || '') || /^oes(?:_|-|$)/iu.test(name))
}

/** Retains only OES and Compose discovery labels in the operator-facing inventory. */
function sanitizeLabels(labels) {
  return Object.fromEntries(Object.entries(labels).filter(([key]) => key.startsWith('oes.') || key.startsWith('com.docker.compose.')).sort(([left], [right]) => left.localeCompare(right)))
}

/** Extracts a stable, secret-free exact identity record from Docker inspection. */
function sanitizeDockerObject(kind, value) {
  const observedLabels = kind === 'container' ? value.Config?.Labels || {} : value.Labels || {}
  const name = kind === 'container' ? String(value.Name || '').replace(/^\//u, '') : value.Name
  if (!isOesLead(observedLabels, name)) return null
  if (observedLabels['oes.runtime.version'] === '2') return null
  const labels = sanitizeLabels(observedLabels)
  if (kind === 'container') return {
    type: kind, objectId: value.Id, name, labels, state: value.State?.Status || 'unknown', active: Boolean(value.State?.Running),
    attachments: Object.entries(value.NetworkSettings?.Networks || {}).map(([network, entry]) => ({ network, networkId: entry.NetworkID || null })).sort((a, b) => a.network.localeCompare(b.network)),
    mounts: (value.Mounts || []).map((mount) => ({ type: mount.Type, name: mount.Name || null, destination: mount.Destination, rw: Boolean(mount.RW) })).sort((a, b) => `${a.type}:${a.name}:${a.destination}`.localeCompare(`${b.type}:${b.name}:${b.destination}`))
  }
  if (kind === 'network') return {
    type: kind, objectId: value.Id, name, labels, state: 'observed', active: Object.keys(value.Containers || {}).length > 0,
    attachments: Object.entries(value.Containers || {}).map(([id, entry]) => ({ objectId: id, name: entry.Name })).sort((a, b) => a.objectId.localeCompare(b.objectId)), mounts: []
  }
  return { type: kind, objectId: value.Name, name, labels, state: 'observed', active: false, attachments: [], mounts: [] }
}

/** Loads operator-supplied exact evidence bindings without granting trust to mere names. */
function loadBindings(file) {
  if (!file) return { validDevData: {}, activeOwners: {}, idleLegacy: {} }
  const value = readJson(path.resolve(file))
  for (const key of ['validDevData', 'activeOwners', 'idleLegacy']) if (!value[key] || typeof value[key] !== 'object') throw new Error(`LEGACY_BINDING_INVALID key=${key}`)
  return value
}

/** Classifies one exact observed object using only reopened positive evidence. */
function classify(resource, bindings) {
  const key = `${resource.type}:${resource.objectId}`
  const dev = bindings.validDevData[key]
  if (dev && dev.objectId === resource.objectId && dev.sourceEvidenceSha256 && resource.type === 'volume') return { classification: 'VALID_DEV_DATA', plannedAction: 'BACKUP_MIGRATE_PRESERVE', reason: 'exact operator binding marks persistent DEV data', evidence: dev }
  const active = bindings.activeOwners[key]
  if (active && active.objectId === resource.objectId && active.ownerTaskId && active.leaseSha256) return { classification: 'ACTIVE_OWNER_HELD', plannedAction: 'PRESERVE', reason: 'exact active owner and lease binding reopened', evidence: active }
  const idle = bindings.idleLegacy[key]
  const unattached = !resource.active && resource.attachments.length === 0 && (resource.type !== 'container' || resource.mounts.every((mount) => mount.type !== 'volume'))
  if (idle && idle.objectId === resource.objectId && idle.lifecycleEvidenceReference?.path && idle.lifecycleEvidenceReference?.sha256 && idle.lifecycleEvidenceReference?.fingerprint && unattached) return { classification: 'CONFIRMED_IDLE_LEGACY_RESIDUE', plannedAction: 'DELETE_AFTER_CLEANUP_CONFIRMATION', reason: 'exact legacy lifecycle evidence and idle/unattached state', evidence: idle }
  return { classification: 'UNKNOWN_OR_INSUFFICIENT_EVIDENCE', plannedAction: 'PRESERVE_AND_RESOLVE_OWNER', reason: resource.active ? 'active state lacks exact owner/lease evidence' : 'name/Compose label/stopped state is insufficient deletion proof', evidence: null }
}

/** Performs a read-only host inventory and classifies every legacy OES discovery lead exactly once. */
export function inventoryLegacyResources({ bindingsPath, now = new Date().toISOString() } = {}) {
  const bindings = loadBindings(bindingsPath)
  const resources = []
  const rawContainers = inspectAll('container')
  const v2MountedVolumes = new Set(rawContainers.filter((value) => value.Config?.Labels?.['oes.runtime.version'] === '2').flatMap((value) => (value.Mounts || []).filter((mount) => mount.Type === 'volume').map((mount) => mount.Name)))
  for (const kind of ['container', 'network', 'volume']) {
    const values = kind === 'container' ? rawContainers : inspectAll(kind)
    for (const raw of values) {
      if (kind === 'volume' && v2MountedVolumes.has(raw.Name)) continue
      const resource = sanitizeDockerObject(kind, raw)
      if (!resource) continue
      const decision = classify(resource, bindings)
      resources.push({ ...resource, ...decision, evidenceDigest: fingerprint({ resource, decision }) })
    }
  }
  resources.sort((a, b) => `${a.type}:${a.objectId}`.localeCompare(`${b.type}:${b.objectId}`))
  if (resources.some((resource) => !CLASSIFICATIONS.has(resource.classification))) throw new Error('LEGACY_CLASSIFICATION_GAP')
  const raw = { schemaVersion: 2, kind: 'OES_LEGACY_RUNTIME_INVENTORY', observedAt: now, readOnly: true, resources }
  return { ...raw, inventoryFingerprint: fingerprint(raw) }
}

/** Creates a deterministic, sealed, child-first cleanup plan from one immutable inventory. */
export function planLegacyCleanup(inventory, { ownerTaskId } = {}) {
  if (inventory.inventoryFingerprint !== fingerprint(inventory, 'inventoryFingerprint')) throw new Error('LEGACY_INVENTORY_FINGERPRINT_MISMATCH')
  if (!ownerTaskId || typeof ownerTaskId !== 'string') throw new Error('LEGACY_CLEANUP_OWNER_TASK_REQUIRED')
  const order = { container: 0, network: 1, volume: 2 }
  const actions = inventory.resources.map((resource) => {
    const evidenceEnvelope = {
      resource: { type: resource.type, objectId: resource.objectId, name: resource.name, labels: resource.labels, state: resource.state, active: resource.active, attachments: resource.attachments, mounts: resource.mounts },
      decision: { classification: resource.classification, action: resource.plannedAction, reason: resource.reason, evidence: resource.evidence || null }
    }
    return { ...evidenceEnvelope.resource, classification: evidenceEnvelope.decision.classification, action: evidenceEnvelope.decision.action, reason: evidenceEnvelope.decision.reason, evidence: evidenceEnvelope.decision.evidence, evidenceDigest: fingerprint(evidenceEnvelope) }
  }).sort((a, b) => order[a.type] - order[b.type] || a.objectId.localeCompare(b.objectId))
  const raw = { schemaVersion: 2, kind: 'OES_LEGACY_RUNTIME_CLEANUP_PLAN', ownerTaskId, inventoryFingerprint: inventory.inventoryFingerprint, observedAt: inventory.observedAt, readOnlyDryRun: true, applyRequiresSeparateCleanupConfirmation: true, actions, residueExpectation: { deleteSet: actions.filter((action) => action.action === 'DELETE_AFTER_CLEANUP_CONFIRMATION').map((action) => `${action.type}:${action.objectId}`), preservedSet: actions.filter((action) => action.action !== 'DELETE_AFTER_CLEANUP_CONFIRMATION').map((action) => `${action.type}:${action.objectId}`) } }
  return { ...raw, planFingerprint: fingerprint(raw) }
}

/** Reopens one absolute sealed JSON reference and verifies both bytes and content fingerprint. */
function reopenReference(reference, fingerprintField) {
  if (!reference || !path.isAbsolute(reference.path) || !/^[0-9a-f]{64}$/u.test(reference.sha256 || '') || !/^[0-9a-f]{64}$/u.test(reference.fingerprint || '')) throw new Error('LEGACY_REFERENCE_INVALID')
  const bytes = fs.readFileSync(reference.path)
  if (sha256(bytes) !== reference.sha256) throw new Error(`LEGACY_REFERENCE_SHA_MISMATCH path=${reference.path}`)
  const value = JSON.parse(bytes.toString('utf8'))
  if (value[fingerprintField] !== reference.fingerprint || value[fingerprintField] !== fingerprint(value, fingerprintField)) throw new Error(`LEGACY_REFERENCE_FINGERPRINT_MISMATCH path=${reference.path}`)
  return value
}

/** Reopens the protected collaboration binding supplied independently by the Collaboration boundary. */
function validateCleanupConfirmation({ plan, planPath, confirmation, confirmationPath, collaborationBindingPath }) {
  const expectedKeys = ['confirmationFingerprint', 'expectedState', 'humanConfirmationFingerprint', 'kind', 'ownerTaskId', 'planReference', 'schemaVersion', 'stateVersion', 'status', 'transitionId']
  if (!confirmationPath || !path.isAbsolute(confirmationPath) || fingerprint(confirmation, 'confirmationFingerprint') !== confirmation.confirmationFingerprint || Object.keys(confirmation).sort().join('\0') !== expectedKeys.sort().join('\0')) throw new Error('LEGACY_CLEANUP_CONFIRMATION_INVALID')
  if (!collaborationBindingPath || !path.isAbsolute(collaborationBindingPath) || [planPath, confirmationPath].map((item) => path.resolve(item)).includes(path.resolve(collaborationBindingPath))) throw new Error('LEGACY_CLEANUP_CURRENT_BINDING_REQUIRED')
  const reopenedConfirmation = readJson(confirmationPath)
  if (fingerprint(reopenedConfirmation) !== fingerprint(confirmation)) throw new Error('LEGACY_CLEANUP_CONFIRMATION_REOPEN_MISMATCH')
  if (confirmation.schemaVersion !== 2 || confirmation.kind !== 'OES_LEGACY_CLEANUP_CONFIRMATION' || confirmation.status !== 'CONFIRMED' || confirmation.expectedState !== 'LEGACY_CLEANUP_AUTHORIZED' || confirmation.ownerTaskId !== plan.ownerTaskId || !/^(?:\/[A-Za-z0-9][A-Za-z0-9_-]*){2,}$/u.test(confirmation.ownerTaskId || '') || !Number.isSafeInteger(confirmation.stateVersion) || confirmation.stateVersion < 1 || !confirmation.transitionId || !/^[0-9a-f]{64}$/u.test(confirmation.humanConfirmationFingerprint || '')) throw new Error('LEGACY_CLEANUP_CONFIRMATION_INVALID')
  const reopenedPlan = reopenReference(confirmation.planReference, 'planFingerprint')
  if (path.resolve(confirmation.planReference.path) !== path.resolve(planPath) || fingerprint(reopenedPlan) !== fingerprint(plan)) throw new Error('LEGACY_CLEANUP_PLAN_REFERENCE_MISMATCH')
  const bindingBytes = fs.readFileSync(collaborationBindingPath)
  const binding = JSON.parse(bindingBytes.toString('utf8'))
  if (binding.recordFingerprint !== fingerprint(binding, 'recordFingerprint')) throw new Error(`LEGACY_REFERENCE_FINGERPRINT_MISMATCH path=${collaborationBindingPath}`)
  const bindingKeys = ['expectedState', 'humanConfirmationFingerprint', 'kind', 'ownerTaskId', 'planReference', 'recordFingerprint', 'schemaVersion', 'stateVersion', 'status', 'transitionId']
  if (Object.keys(binding).sort().join('\0') !== bindingKeys.sort().join('\0') || binding.schemaVersion !== 2 || binding.kind !== 'OES_LEGACY_CLEANUP_CURRENT_BINDING' || binding.status !== 'ACTIVE' || binding.expectedState !== confirmation.expectedState || binding.ownerTaskId !== confirmation.ownerTaskId || binding.stateVersion !== confirmation.stateVersion || binding.transitionId !== confirmation.transitionId || binding.humanConfirmationFingerprint !== confirmation.humanConfirmationFingerprint || fingerprint(binding.planReference) !== fingerprint(confirmation.planReference)) throw new Error('LEGACY_CLEANUP_COLLABORATION_BINDING_MISMATCH')
}

/** Reopens the exact lifecycle evidence that admitted one object to the delete set. */
function reopenDeleteEvidence(action) {
  const envelope = {
    resource: { type: action.type, objectId: action.objectId, name: action.name, labels: action.labels, state: action.state, active: action.active, attachments: action.attachments, mounts: action.mounts },
    decision: { classification: action.classification, action: action.action, reason: action.reason, evidence: action.evidence || null }
  }
  if (fingerprint(envelope) !== action.evidenceDigest) throw new Error(`LEGACY_ACTION_EVIDENCE_DIGEST_MISMATCH objectId=${action.objectId}`)
  const lifecycle = reopenReference(action.evidence?.lifecycleEvidenceReference, 'evidenceFingerprint')
  if (lifecycle.objectId !== action.objectId || lifecycle.ownerTaskId !== action.evidence.ownerTaskId || lifecycle.lifecycle !== 'IDLE') throw new Error(`LEGACY_LIFECYCLE_EVIDENCE_MISMATCH objectId=${action.objectId}`)
}

/** Reopens an object by exact type/id and verifies labels, state, attachments and mounts. */
function reopenPlannedObject(action) {
  const command = action.type === 'container' ? ['inspect', '--type', 'container', action.objectId] : [action.type, 'inspect', action.objectId]
  const raw = JSON.parse(runChecked('docker', command, { timeout: 30000 }).stdout)
  const value = action.type === 'container' ? raw[0] : raw[0]
  const current = sanitizeDockerObject(action.type, value)
  if (!current || current.objectId !== action.objectId || fingerprint(current.labels) !== fingerprint(action.labels) || current.active !== action.active || fingerprint(current.attachments) !== fingerprint(action.attachments) || fingerprint(current.mounts) !== fingerprint(action.mounts)) throw new Error(`LEGACY_RESOURCE_DRIFT type=${action.type} objectId=${action.objectId}`)
  return current
}

/** Applies only the sealed delete set after reopening a separate exact Cleanup confirmation. */
export function applyLegacyCleanup({ plan, planPath, confirmation, confirmationPath, collaborationBindingPath }) {
  if (plan.planFingerprint !== fingerprint(plan, 'planFingerprint')) throw new Error('LEGACY_PLAN_FINGERPRINT_MISMATCH')
  if (!path.isAbsolute(planPath || '') || !path.isAbsolute(confirmationPath || '') || path.resolve(planPath) !== path.resolve(confirmation?.planReference?.path || '')) throw new Error('LEGACY_CLEANUP_PLAN_PATH_REQUIRED')
  validateCleanupConfirmation({ plan, planPath: path.resolve(planPath), confirmation, confirmationPath: path.resolve(confirmationPath), collaborationBindingPath })
  const results = []
  for (const action of plan.actions) {
    if (action.action !== 'DELETE_AFTER_CLEANUP_CONFIRMATION') { results.push({ key: `${action.type}:${action.objectId}`, disposition: 'PRESERVED_NOT_AUTHORIZED_DELETE_SET', exitStatus: 0 }); continue }
    try {
      reopenDeleteEvidence(action)
      reopenPlannedObject(action)
      const args = action.type === 'container' ? ['rm', '--force', action.objectId] : action.type === 'network' ? ['network', 'rm', action.objectId] : ['volume', 'rm', action.objectId]
      runChecked('docker', args, { timeout: 120000 })
      results.push({ key: `${action.type}:${action.objectId}`, disposition: 'DELETED_EXACT', exitStatus: 0 })
    } catch (error) { results.push({ key: `${action.type}:${action.objectId}`, disposition: 'PRESERVED_DRIFT_OR_FAILURE', reason: error.message, exitStatus: 1 }) }
  }
  const raw = { schemaVersion: 2, kind: 'OES_LEGACY_CLEANUP_RESULT', planFingerprint: plan.planFingerprint, results }
  return { ...raw, resultFingerprint: fingerprint(raw) }
}

/** Compares a sealed plan with a fresh read-only inventory and reports exact remaining dispositions. */
export function observeLegacyResidue(plan, currentInventory) {
  if (plan.planFingerprint !== fingerprint(plan, 'planFingerprint')) throw new Error('LEGACY_PLAN_FINGERPRINT_MISMATCH')
  const current = new Map(currentInventory.resources.map((resource) => [`${resource.type}:${resource.objectId}`, resource]))
  const observations = plan.actions.map((action) => ({ key: `${action.type}:${action.objectId}`, plannedAction: action.action, present: current.has(`${action.type}:${action.objectId}`), disposition: action.action === 'DELETE_AFTER_CLEANUP_CONFIRMATION' ? (current.has(`${action.type}:${action.objectId}`) ? 'CONFIRMED_IDLE_RESIDUE_REMAINS' : 'PLANNED_OBJECT_ABSENT') : 'PRESERVED_OUTSIDE_DELETE_SET' }))
  const raw = { schemaVersion: 2, kind: 'OES_LEGACY_RESIDUE_OBSERVATION', planFingerprint: plan.planFingerprint, currentInventoryFingerprint: currentInventory.inventoryFingerprint, observations }
  return { ...raw, observationFingerprint: fingerprint(raw) }
}

/** Creates verified archives for exact VALID_DEV_DATA volumes without deleting sources. */
export function backupValidDevData({ inventory, outputDirectory }) {
  fs.mkdirSync(outputDirectory, { recursive: true, mode: 0o700 })
  const backups = []
  for (const resource of inventory.resources.filter((item) => item.classification === 'VALID_DEV_DATA')) {
    const archive = `${resource.objectId}.tar.gz`
    runChecked('docker', ['run', '--rm', '--volume', `${resource.name}:/source:ro`, '--volume', `${path.resolve(outputDirectory)}:/backup`, 'alpine:3.21', 'tar', '-C', '/source', '-czf', `/backup/${archive}`, '.'], { timeout: 600000 })
    const file = path.join(path.resolve(outputDirectory), archive)
    backups.push({ source: `${resource.type}:${resource.objectId}`, file, sha256: sha256(fs.readFileSync(file)) })
  }
  const raw = { schemaVersion: 2, kind: 'OES_DEV_DATA_BACKUP', inventoryFingerprint: inventory.inventoryFingerprint, sourcesPreserved: true, backups }
  return { ...raw, backupFingerprint: fingerprint(raw) }
}

/** Writes one sealed reconciliation artifact atomically. */
export function writeLegacyArtifact(file, value) { writeAtomic(path.resolve(file), value) }
