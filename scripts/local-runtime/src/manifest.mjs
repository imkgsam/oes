import fs from 'node:fs'
import path from 'node:path'
import { fingerprint, readJson, sha256, writeAtomic } from './canonical.mjs'

/** Returns the canonical run directory outside the repository. */
export function runDirectory(stateRoot, taskKey, runId) { return path.join(stateRoot, 'runs', taskKey, runId) }

/** Seals and atomically publishes a run manifest only after readiness. */
export function publishManifest(directory, draft) {
  if (draft.lifecycle !== 'REGISTERED') throw new Error(`MANIFEST_NOT_READY lifecycle=${draft.lifecycle}`)
  for (const endpoint of draft.endpoints) if (!endpoint.ready || !endpoint.authority) throw new Error(`MANIFEST_ENDPOINT_UNREADY provider=${endpoint.provider}`)
  const raw = { ...draft, schemaVersion: 2 }
  const manifest = { ...raw, manifestFingerprint: fingerprint(raw) }
  const file = path.join(directory, 'manifest.json')
  writeAtomic(file, manifest)
  return { file, manifest, sha256: sha256(fs.readFileSync(file)) }
}

/** Reopens a manifest and verifies exact task/run and byte-level identity. */
export function reopenManifest(file, expected = {}) {
  const value = readJson(file)
  if (value.schemaVersion !== 2 || value.manifestFingerprint !== fingerprint(value, 'manifestFingerprint')) throw new Error(`MANIFEST_FINGERPRINT_MISMATCH path=${file}`)
  for (const [key, expectedValue] of Object.entries(expected)) if (value[key] !== expectedValue) throw new Error(`MANIFEST_IDENTITY_MISMATCH key=${key}`)
  return value
}

/** Builds a secret-free minimal environment for exactly one owner process. */
export function environmentForOwner(manifest, owner, credentialResolver) {
  if (!manifest.owners.includes(owner)) throw new Error(`MANIFEST_OWNER_UNDECLARED owner=${owner}`)
  const output = { NODE_ENV: manifest.profile === 'DEV' ? 'development' : 'test', OES_TASK_KEY: manifest.taskKey, OES_RUN_ID: manifest.runId, OES_DEV_STACK_ID: manifest.devStackId }
  for (const endpoint of manifest.endpoints.filter((entry) => entry.owners.includes(owner))) {
    Object.assign(output, endpoint.environment)
    if (endpoint.credentialReference) Object.assign(output, credentialResolver(endpoint.credentialReference, owner))
  }
  return output
}
