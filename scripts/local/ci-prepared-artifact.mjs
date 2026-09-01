import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defaultRepositoryRoot, discoverBackendPackages } from './reproducible-build-lib.mjs'

const ENGINE_PATTERN = /^(?:lib)?query_engine-[A-Za-z0-9_.-]+\.(?:so|dylib|dll)\.node$/

/** Discovers the exact generated Prisma-client roots required by repository tests. */
export function discoverPrismaGeneratedRoots(repositoryRoot = defaultRepositoryRoot()) {
  const roots = discoverBackendPackages(repositoryRoot)
    .filter((entry) => entry.prismaSchema)
    .map((entry) => path.join(entry.directory, 'prisma', 'generated', 'prisma'))
  if (roots.length === 0) throw new Error('CI_PREPARED_PRISMA_INVENTORY_EMPTY')
  return Object.freeze(roots)
}

/** Seals one shared Prisma engine plus the exact target inventory for a deduplicated artifact. */
export function stageSharedPrismaEngine(
  repositoryRoot,
  artifactRoot,
  generatedRoots = discoverPrismaGeneratedRoots(repositoryRoot)
) {
  const entries = generatedRoots.map((root) => {
    const names = fs.readdirSync(root).filter((name) => ENGINE_PATTERN.test(name))
    if (names.length !== 1) {
      throw new Error(
        `CI_PREPARED_ENGINE_COUNT_INVALID root=${relative(repositoryRoot, root)} count=${names.length}`
      )
    }
    const file = path.join(root, names[0])
    if (fs.lstatSync(file).isSymbolicLink()) {
      throw new Error(`CI_PREPARED_ENGINE_SYMLINK root=${relative(repositoryRoot, root)}`)
    }
    return { file, name: names[0], root, digest: fileDigest(file) }
  })
  const names = new Set(entries.map((entry) => entry.name))
  const digests = new Set(entries.map((entry) => entry.digest))
  if (names.size !== 1) throw new Error('CI_PREPARED_ENGINE_NAME_MISMATCH')
  if (digests.size !== 1) throw new Error('CI_PREPARED_ENGINE_DIGEST_MISMATCH')
  fs.rmSync(artifactRoot, { recursive: true, force: true })
  fs.mkdirSync(artifactRoot, { recursive: true })
  const engineDigest = entries[0].digest
  const engineFileName = entries[0].name
  fs.copyFileSync(entries[0].file, path.join(artifactRoot, 'query-engine.node'))
  const targets = entries.map((entry) => relative(repositoryRoot, entry.root)).sort()
  const manifest = {
    schemaVersion: 1,
    kind: 'OES_SHARED_PRISMA_ENGINE',
    engineFileName,
    engineDigest,
    targets,
    inventoryDigest: digest(targets)
  }
  fs.writeFileSync(path.join(artifactRoot, 'manifest.json'), `${canonical(manifest)}\n`)
  process.stdout.write(
    `CI_PREPARED_ENGINE_STAGE=PASS targets=${targets.length} digest=${engineDigest}\n`
  )
  return Object.freeze(manifest)
}

/** Restores one verified engine as hard links at every exact generated-client target. */
export function restoreSharedPrismaEngine(
  repositoryRoot,
  artifactRoot,
  generatedRoots = discoverPrismaGeneratedRoots(repositoryRoot)
) {
  const manifest = JSON.parse(fs.readFileSync(path.join(artifactRoot, 'manifest.json'), 'utf8'))
  const expectedTargets = generatedRoots.map((root) => relative(repositoryRoot, root)).sort()
  if (
    manifest.schemaVersion !== 1 ||
    manifest.kind !== 'OES_SHARED_PRISMA_ENGINE' ||
    !ENGINE_PATTERN.test(manifest.engineFileName ?? '') ||
    !/^[0-9a-f]{64}$/.test(manifest.engineDigest ?? '') ||
    !Array.isArray(manifest.targets) ||
    manifest.targets.length !== new Set(manifest.targets).size ||
    canonical(manifest.targets) !== canonical(expectedTargets) ||
    manifest.inventoryDigest !== digest(expectedTargets)
  ) {
    throw new Error('CI_PREPARED_ENGINE_MANIFEST_INVALID')
  }
  const shared = path.join(artifactRoot, 'query-engine.node')
  if (fs.lstatSync(shared).isSymbolicLink() || fileDigest(shared) !== manifest.engineDigest) {
    throw new Error('CI_PREPARED_SHARED_ENGINE_INVALID')
  }
  for (const targetRoot of generatedRoots) {
    const target = path.join(targetRoot, manifest.engineFileName)
    if (!fs.statSync(targetRoot).isDirectory()) {
      throw new Error(`CI_PREPARED_TARGET_MISSING root=${relative(repositoryRoot, targetRoot)}`)
    }
    if (fs.existsSync(target)) {
      if (fs.lstatSync(target).isSymbolicLink() || fileDigest(target) !== manifest.engineDigest) {
        throw new Error(
          `CI_PREPARED_TARGET_ENGINE_INVALID target=${relative(repositoryRoot, target)}`
        )
      }
      continue
    }
    try {
      fs.linkSync(shared, target)
    } catch (error) {
      if (error?.code !== 'EXDEV') throw error
      fs.copyFileSync(shared, target)
    }
    if (fileDigest(target) !== manifest.engineDigest) {
      throw new Error(
        `CI_PREPARED_TARGET_ENGINE_INVALID target=${relative(repositoryRoot, target)}`
      )
    }
  }
  process.stdout.write(
    `CI_PREPARED_ENGINE_RESTORE=PASS targets=${expectedTargets.length} digest=${manifest.engineDigest}\n`
  )
  return Object.freeze(manifest)
}

function relative(repositoryRoot, target) {
  const value = path.relative(repositoryRoot, target).replaceAll(path.sep, '/')
  if (!value || value.startsWith('../') || path.isAbsolute(value)) {
    throw new Error('CI_PREPARED_TARGET_OUTSIDE_REPOSITORY')
  }
  return value
}

function fileDigest(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function digest(value) {
  return crypto.createHash('sha256').update(canonical(value)).digest('hex')
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`)
      .join(',')}}`
  return JSON.stringify(value)
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const [command, ...args] = process.argv.slice(2)
    const rootIndex = args.indexOf('--root')
    if (rootIndex < 0 || !args[rootIndex + 1]) throw new Error('CI_PREPARED_ROOT_REQUIRED')
    const repositoryRoot = defaultRepositoryRoot()
    const artifactRoot = path.resolve(args[rootIndex + 1])
    if (command === 'stage') stageSharedPrismaEngine(repositoryRoot, artifactRoot)
    else if (command === 'restore') restoreSharedPrismaEngine(repositoryRoot, artifactRoot)
    else throw new Error('CI_PREPARED_COMMAND_REQUIRED expected=stage|restore')
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
