import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import {
  EXPECTED_PRISMA_SERVICE_COUNT,
  defaultRepositoryRoot,
  discoverBackendPackages,
  repositoryRelative
} from './reproducible-build-lib.mjs'

/** Generates every service-owned Prisma Client after enforcing the exact schema inventory. */
export function generatePrismaClients({
  repositoryRoot = defaultRepositoryRoot(),
  output = process.stdout
} = {}) {
  const services = discoverBackendPackages(repositoryRoot).filter((entry) => entry.prismaSchema)
  if (services.length !== EXPECTED_PRISMA_SERVICE_COUNT) {
    throw new Error(
      `PRISMA_SCHEMA_COUNT_MISMATCH expected=${EXPECTED_PRISMA_SERVICE_COUNT} actual=${services.length}`
    )
  }

  output.write(`PRISMA_SCHEMA_COUNT=${services.length}\n`)
  for (const service of services) {
    const schema = repositoryRelative(service.directory, service.prismaSchema)
    output.write(
      `PRISMA_GENERATE service=${service.name} schema=${repositoryRelative(repositoryRoot, service.prismaSchema)}\n`
    )
    const result = spawnSync('pnpm', ['exec', 'prisma', 'generate', `--schema=${schema}`], {
      cwd: service.directory,
      env: { ...process.env, CHECKPOINT_DISABLE: '1' },
      stdio: 'inherit'
    })
    if (result.error) throw result.error
    if (result.status !== 0) {
      throw new Error(`PRISMA_GENERATE_FAILED service=${service.name} exit=${result.status}`)
    }

    const generatedEntry = path.join(service.directory, 'prisma/generated/prisma/index.js')
    if (!fs.existsSync(generatedEntry)) {
      throw new Error(
        `PRISMA_GENERATE_OUTPUT_MISSING service=${service.name} path=${repositoryRelative(repositoryRoot, generatedEntry)}`
      )
    }
  }
  output.write(`PRISMA_GENERATE_ALL=PASS count=${services.length}\n`)
  return services
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : undefined
if (invokedPath === import.meta.url) {
  try {
    generatePrismaClients()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
