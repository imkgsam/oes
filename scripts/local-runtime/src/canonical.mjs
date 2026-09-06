import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

/** Produces deterministic JSON by recursively sorting object keys. */
export function canonicalJson(value) {
  const normalize = (input) => {
    if (Array.isArray(input)) return input.map(normalize)
    if (input && typeof input === 'object') {
      return Object.fromEntries(Object.entries(input).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
    }
    return input
  }
  return JSON.stringify(normalize(value))
}

/** Returns a lowercase SHA-256 digest for bytes or text. */
export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/** Returns a canonical object fingerprint while omitting one self field. */
export function fingerprint(value, omitted = '__none__') {
  const copy = { ...value }
  delete copy[omitted]
  return sha256(canonicalJson(copy))
}

/** Atomically writes a mode-restricted file and verifies the persisted bytes. */
export function writeAtomic(file, value, mode = 0o600) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 })
  const bytes = typeof value === 'string' ? value : `${canonicalJson(value)}\n`
  const temporary = `${file}.tmp-${crypto.randomUUID()}`
  const fd = fs.openSync(temporary, 'wx', mode)
  try {
    fs.writeFileSync(fd, bytes)
    fs.fsyncSync(fd)
  } finally {
    fs.closeSync(fd)
  }
  fs.renameSync(temporary, file)
  fs.chmodSync(file, mode)
  if (fs.readFileSync(file, 'utf8') !== bytes) throw new Error(`ATOMIC_READBACK_MISMATCH path=${file}`)
}

/** Reads one exact JSON object from disk. */
export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

/** Expands a leading home marker without consulting the current directory. */
export function expandHome(value, home = process.env.HOME) {
  if (!value.startsWith('~/')) return path.resolve(value)
  if (!home) throw new Error('HOME_REQUIRED')
  return path.join(home, value.slice(2))
}

/** Creates a secret suitable for a provider credential without logging it. */
export function randomSecret(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url')
}

/** Redacts known secret-bearing values before evidence publication. */
export function redact(value) {
  if (Array.isArray(value)) return value.map(redact)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, /(password|secret|token|private|credentialValue|databaseUrl)/iu.test(key) ? '<redacted>' : redact(child)]))
}
