import fs from 'node:fs'
import path from 'node:path'
import { fingerprint, readJson, sha256, writeAtomic } from './canonical.mjs'

/** Writes one run credential bundle with mode 0600 and returns a value-free reference. */
export function writeCredentialBundle(runDirectory, provider, ownerEnvironments) {
  const raw = { schemaVersion: 2, provider, ownerEnvironments }
  const value = { ...raw, credentialFingerprint: fingerprint(raw) }
  const file = path.join(runDirectory, 'credentials', `${provider}.json`)
  writeAtomic(file, value, 0o600)
  return { path: file, sha256: sha256(fs.readFileSync(file)), fingerprint: value.credentialFingerprint }
}

/** Reopens one credential reference and exposes only the exact requesting owner's values. */
export function resolveCredentialReference(reference, owner) {
  const bytes = fs.readFileSync(reference.path)
  if (sha256(bytes) !== reference.sha256) throw new Error(`CREDENTIAL_REFERENCE_SHA_MISMATCH path=${reference.path}`)
  const value = readJson(reference.path)
  if (value.credentialFingerprint !== reference.fingerprint || value.credentialFingerprint !== fingerprint(value, 'credentialFingerprint')) throw new Error(`CREDENTIAL_REFERENCE_FINGERPRINT_MISMATCH path=${reference.path}`)
  const environment = value.ownerEnvironments[owner]
  if (!environment) throw new Error(`CREDENTIAL_OWNER_DENIED owner=${owner} provider=${value.provider}`)
  return environment
}
