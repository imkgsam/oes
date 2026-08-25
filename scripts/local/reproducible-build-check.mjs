import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import {
  EXPECTED_BACKEND_PACKAGE_COUNT,
  EXPECTED_PRISMA_SERVICE_COUNT,
  SITE_RUNTIME_LEAF_PACKAGES,
  defaultRepositoryRoot,
  discoverBackendPackages,
  repositoryRelative
} from './reproducible-build-lib.mjs'

const REQUIRED_ALLOW_BUILDS = Object.freeze(
  new Map([
    ['@nestjs/core', false],
    ['@parcel/watcher', true],
    ['@prisma/client', true],
    ['@prisma/engines', true],
    ['@scarf/scarf', false],
    ['@swc/core', true],
    ['bcrypt', true],
    ['esbuild', true],
    ['grpc-tools', true],
    ['prisma', true],
    ['protobufjs', false],
    ['sharp', true]
  ])
)

const SITE_RUNTIME_LEAF_PATHS = Object.freeze([
  'src/site-runtime/site-runtime-kit',
  'src/site-runtime/external-site-template/runtime',
  'src/site-runtime/meilong-ceramics-site/runtime',
  'src/site-runtime/external-site-template/storefront',
  'src/site-runtime/meilong-ceramics-site/storefront'
])

/** Parses repository JSONC files that use line comments and trailing commas. */
function parseJsonc(contents) {
  return JSON.parse(contents.replace(/^\s*\/\/.*$/gm, '').replace(/,\s*([}\]])/g, '$1'))
}

/** Returns normalized root project references after rejecting malformed or duplicate entries. */
export function validateRootTsconfigReferences(references) {
  if (!Array.isArray(references)) throw new Error('ROOT_TSC_REFERENCES_INVALID')
  const normalized = references.map((entry, index) => {
    if (!entry || typeof entry.path !== 'string') {
      throw new Error(`ROOT_TSC_REFERENCE_INVALID index=${index}`)
    }
    return entry.path.replace(/^\.\//, '')
  })
  const unique = new Set(normalized)
  if (unique.size !== normalized.length) {
    const duplicate = normalized.find((entry, index) => normalized.indexOf(entry) !== index)
    throw new Error(`ROOT_TSC_REFERENCE_DUPLICATE path=${duplicate}`)
  }
  return unique
}

/** Parses the root allowBuilds mapping and rejects any non-boolean or placeholder value. */
export function parseAllowBuilds(workspaceContents) {
  if (/set this to true or false/i.test(workspaceContents)) {
    throw new Error('ALLOW_BUILDS_PLACEHOLDER_PRESENT')
  }
  const lines = workspaceContents.split(/\r?\n/)
  const start = lines.findIndex((line) => line.trim() === 'allowBuilds:')
  if (start < 0) throw new Error('ALLOW_BUILDS_MISSING')
  const entries = new Map()
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (!line.trim()) continue
    if (!/^\s+/.test(line)) break
    const match = /^\s{2}(?:'([^']+)'|([^:]+)):\s*(true|false)\s*$/.exec(line)
    if (!match) throw new Error(`ALLOW_BUILDS_VALUE_INVALID line=${index + 1}`)
    entries.set(match[1] || match[2].trim(), match[3] === 'true')
  }
  for (const [dependency, expected] of REQUIRED_ALLOW_BUILDS) {
    if (entries.get(dependency) !== expected) {
      throw new Error(`ALLOW_BUILDS_POLICY_MISMATCH dependency=${dependency} expected=${expected}`)
    }
  }
  return entries
}

/** Validates that pnpm reports unique package identities and every expected name/path pair once. */
export function validateWorkspacePackageEntries(entries, expectedPackages, repositoryRoot) {
  if (!Array.isArray(entries)) throw new Error('WORKSPACE_DISCOVERY_OUTPUT_INVALID')
  const normalized = entries.map((entry, index) => {
    if (!entry || typeof entry.name !== 'string' || typeof entry.path !== 'string') {
      throw new Error(`WORKSPACE_DISCOVERY_ENTRY_INVALID index=${index}`)
    }
    return { name: entry.name, path: path.resolve(entry.path) }
  })
  const names = new Set()
  const paths = new Set()
  for (const entry of normalized) {
    if (names.has(entry.name))
      throw new Error(`WORKSPACE_PACKAGE_NAME_DUPLICATE name=${entry.name}`)
    if (paths.has(entry.path)) {
      throw new Error(
        `WORKSPACE_PACKAGE_PATH_DUPLICATE path=${repositoryRelative(repositoryRoot, entry.path)}`
      )
    }
    names.add(entry.name)
    paths.add(entry.path)
  }

  const expectedPaths = new Set()
  for (const expected of expectedPackages) {
    const expectedPath = path.resolve(expected.directory)
    if (expectedPaths.has(expectedPath)) {
      throw new Error(
        `WORKSPACE_EXPECTED_PATH_DUPLICATE path=${repositoryRelative(repositoryRoot, expectedPath)}`
      )
    }
    expectedPaths.add(expectedPath)
    const actual = normalized.find((entry) => entry.path === expectedPath)
    if (!actual) {
      throw new Error(
        `WORKSPACE_PACKAGE_MISSING name=${expected.name} path=${repositoryRelative(repositoryRoot, expectedPath)}`
      )
    }
    if (actual.name !== expected.name) {
      throw new Error(
        `WORKSPACE_PACKAGE_IDENTITY_MISMATCH path=${repositoryRelative(repositoryRoot, expectedPath)} expected=${expected.name} actual=${actual.name}`
      )
    }
  }
  return { entries: normalized, names }
}

/** Reads pnpm's actual recursive package discovery rather than trusting glob text alone. */
export function readWorkspacePackageEntries(repositoryRoot) {
  const result = spawnSync('pnpm', ['-r', 'list', '--depth', '-1', '--json'], {
    cwd: repositoryRoot,
    encoding: 'utf8'
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(
      `WORKSPACE_DISCOVERY_FAILED exit=${result.status} stderr=${result.stderr.trim()}`
    )
  }
  try {
    return JSON.parse(result.stdout)
  } catch {
    throw new Error('WORKSPACE_DISCOVERY_OUTPUT_INVALID')
  }
}

/** Validates the complete build inventory, root references, workspace links, and root scripts. */
export function checkReproducibleBuild({
  repositoryRoot = defaultRepositoryRoot(),
  output = process.stdout
} = {}) {
  const backendPackages = discoverBackendPackages(repositoryRoot)
  if (backendPackages.length !== EXPECTED_BACKEND_PACKAGE_COUNT) {
    throw new Error(
      `BACKEND_PACKAGE_COUNT_MISMATCH expected=${EXPECTED_BACKEND_PACKAGE_COUNT} actual=${backendPackages.length}`
    )
  }
  const prismaPackages = backendPackages.filter((entry) => entry.prismaSchema)
  if (prismaPackages.length !== EXPECTED_PRISMA_SERVICE_COUNT) {
    throw new Error(
      `PRISMA_SCHEMA_COUNT_MISMATCH expected=${EXPECTED_PRISMA_SERVICE_COUNT} actual=${prismaPackages.length}`
    )
  }

  const rootTsconfig = parseJsonc(
    fs.readFileSync(path.join(repositoryRoot, 'tsconfig.json'), 'utf8')
  )
  const actualReferences = validateRootTsconfigReferences(rootTsconfig.references)
  const expectedReferences = new Set([
    'src/common',
    ...backendPackages.map((entry) => repositoryRelative(repositoryRoot, entry.directory))
  ])
  const missingReferences = [...expectedReferences].filter((entry) => !actualReferences.has(entry))
  const extraReferences = [...actualReferences].filter((entry) => !expectedReferences.has(entry))
  if (
    missingReferences.length ||
    extraReferences.length ||
    actualReferences.size !== expectedReferences.size
  ) {
    throw new Error(
      `ROOT_TSC_REFERENCES_MISMATCH missing=${missingReferences.join(',') || 'none'} extra=${extraReferences.join(',') || 'none'}`
    )
  }

  const workspaceContents = fs.readFileSync(
    path.join(repositoryRoot, 'pnpm-workspace.yaml'),
    'utf8'
  )
  if (!/^strictDepBuilds:\s*true\s*$/m.test(workspaceContents)) {
    throw new Error('STRICT_DEP_BUILDS_NOT_ENABLED')
  }
  const allowBuilds = parseAllowBuilds(workspaceContents)
  const commonDirectory = path.join(repositoryRoot, 'src/common')
  const commonManifest = JSON.parse(
    fs.readFileSync(path.join(commonDirectory, 'package.json'), 'utf8')
  )
  const sitePackages = SITE_RUNTIME_LEAF_PATHS.map((relativePath, index) => ({
    directory: path.join(repositoryRoot, relativePath),
    name: SITE_RUNTIME_LEAF_PACKAGES[index]
  }))
  const expectedWorkspacePackages = [
    { directory: commonDirectory, name: commonManifest.name },
    ...backendPackages.map((entry) => ({ directory: entry.directory, name: entry.name })),
    ...sitePackages
  ]
  const workspace = validateWorkspacePackageEntries(
    readWorkspacePackageEntries(repositoryRoot),
    expectedWorkspacePackages,
    repositoryRoot
  )
  const workspacePackages = workspace.names

  const rootPackage = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'))
  const requiredScripts = [
    'env:bootstrap',
    'env:check',
    'prisma:generate:all',
    'generated:all',
    'workspace:check',
    'build:backend',
    'build:site-runtime',
    'build'
  ]
  const missingScripts = requiredScripts.filter((name) => !rootPackage.scripts?.[name])
  if (missingScripts.length)
    throw new Error(`ROOT_BUILD_SCRIPT_MISSING scripts=${missingScripts.join(',')}`)
  if (
    rootPackage.scripts.build !==
    'pnpm workspace:check && pnpm build:backend && pnpm build:site-runtime'
  ) {
    throw new Error('ROOT_BUILD_ENTRYPOINT_NOT_CANONICAL')
  }
  const siteBuild = rootPackage.scripts['build:site-runtime']
  let previousSiteBuildIndex = -1
  for (const packageName of SITE_RUNTIME_LEAF_PACKAGES) {
    const index = siteBuild.indexOf(`--filter ${packageName} build`)
    if (index <= previousSiteBuildIndex) {
      throw new Error(`SITE_RUNTIME_BUILD_ORDER_INVALID package=${packageName}`)
    }
    previousSiteBuildIndex = index
  }
  if (/pnpm-lock\.yaml/.test(rootPackage.scripts?.['clear:build'] ?? '')) {
    throw new Error('ROOT_CLEAN_REMOVES_LOCKFILE')
  }
  for (const packagePath of [
    'src/site-runtime/external-site-template/runtime/package.json',
    'src/site-runtime/meilong-ceramics-site/runtime/package.json'
  ]) {
    const manifest = JSON.parse(fs.readFileSync(path.join(repositoryRoot, packagePath), 'utf8'))
    if (manifest.dependencies?.['@oes/site-runtime-kit'] !== 'workspace:*') {
      throw new Error(`SITE_RUNTIME_LINK_NOT_WORKSPACE package=${manifest.name}`)
    }
  }

  output.write(`BACKEND_PACKAGE_COUNT=${backendPackages.length}\n`)
  output.write(`PRISMA_SCHEMA_COUNT=${prismaPackages.length}\n`)
  output.write(`ROOT_TSC_REFERENCE_COUNT=${actualReferences.size}\n`)
  output.write(`SITE_RUNTIME_LEAF_COUNT=${SITE_RUNTIME_LEAF_PACKAGES.length}\n`)
  output.write(`WORKSPACE_PACKAGE_COUNT=${workspace.entries.length}\n`)
  output.write(`WORKSPACE_REQUIRED_PACKAGE_COUNT=${expectedWorkspacePackages.length}\n`)
  output.write(`ALLOW_BUILDS_POLICY=explicit entries=${allowBuilds.size}\n`)
  output.write('REPRODUCIBLE_BUILD_CHECK=PASS\n')
  return { allowBuilds, backendPackages, prismaPackages, workspacePackages }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : undefined
if (invokedPath === import.meta.url) {
  try {
    checkReproducibleBuild()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
