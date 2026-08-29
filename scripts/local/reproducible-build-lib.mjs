import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const EXPECTED_PRISMA_SERVICE_COUNT = 21
export const EXPECTED_BACKEND_PACKAGE_COUNT = 22

export const SITE_RUNTIME_LEAF_PACKAGES = Object.freeze([
  '@oes/site-runtime-kit',
  '@oes/external-site-template-runtime',
  '@oes/meilong-ceramics-site-runtime',
  '@oes/external-site-template-storefront',
  '@oes/meilong-ceramics-site-storefront'
])

const EXCLUDED_DIRECTORIES = new Set(['.git', 'dist', 'generated', 'node_modules'])

/** Returns the repository root containing this versioned build helper. */
export function defaultRepositoryRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
}

/** Discovers package roots without walking generated output or dependency trees. */
export function discoverPackageRoots(scanRoot) {
  const packages = []

  function visit(directory) {
    const packagePath = path.join(directory, 'package.json')
    if (fs.existsSync(packagePath)) {
      const manifest = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
      packages.push({
        directory,
        manifest,
        name: manifest.name,
        packagePath
      })
      return
    }

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory() || EXCLUDED_DIRECTORIES.has(entry.name)) continue
      visit(path.join(directory, entry.name))
    }
  }

  visit(scanRoot)
  return packages.sort((left, right) => left.directory.localeCompare(right.directory))
}

/** Returns all backend packages and marks packages that own a direct Prisma schema. */
export function discoverBackendPackages(repositoryRoot = defaultRepositoryRoot()) {
  const servicesRoot = path.join(repositoryRoot, 'src/services')
  return discoverPackageRoots(servicesRoot).map((entry) => ({
    ...entry,
    prismaSchema: fs.existsSync(path.join(entry.directory, 'prisma/schema.prisma'))
      ? path.join(entry.directory, 'prisma/schema.prisma')
      : undefined
  }))
}

/** Produces a repository-relative path with stable separators for logs and comparisons. */
export function repositoryRelative(repositoryRoot, targetPath) {
  return path.relative(repositoryRoot, targetPath).split(path.sep).join('/')
}
