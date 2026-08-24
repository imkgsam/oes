import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  writeFileSync
} from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { fail } from './errors.ts'

/** Produces deterministic JSON by recursively sorting object keys. */
export function canonicalJson(value: unknown): string {
  const normalize = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(normalize)
    if (input && typeof input === 'object') {
      return Object.fromEntries(
        Object.entries(input as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, child]) => [key, normalize(child)])
      )
    }
    return input
  }
  return JSON.stringify(normalize(value))
}

/** Computes a lowercase SHA-256 digest for text or bytes. */
export function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

/** Computes a canonical object fingerprint while omitting one self-referential field. */
export function objectFingerprint(value: Record<string, unknown>, omittedField: string): string {
  const copy = { ...value }
  delete copy[omittedField]
  return sha256(canonicalJson(copy))
}

/** Reads and parses one UTF-8 JSON artifact. */
export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

/** Atomically replaces a JSON artifact and verifies its read-after-write bytes. */
export function writeJsonAtomic(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  const bytes = `${canonicalJson(value)}\n`
  const temporary = `${path}.tmp-${randomUUID()}`
  const descriptor = openSync(temporary, 'wx', 0o600)
  try {
    writeFileSync(descriptor, bytes, 'utf8')
    fsyncSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
  renameSync(temporary, path)
  if (readFileSync(path, 'utf8') !== bytes) fail('ATOMIC_READBACK_MISMATCH', path)
}

/** Requires an artifact path to remain inside its bound root. */
export function assertPathWithin(root: string, candidate: string): void {
  const exactRoot = resolve(root)
  const exactCandidate = resolve(candidate)
  const child = relative(exactRoot, exactCandidate)
  if (child === '' || (!child.startsWith(`..${sep}`) && child !== '..' && !child.startsWith(sep)))
    return
  fail('ARTIFACT_PATH_OUTSIDE_BOUND_ROOT', candidate)
}

/** Returns whether an optional invalidation marker already exists. */
export function isInvalidated(path: string): boolean {
  return existsSync(path)
}
