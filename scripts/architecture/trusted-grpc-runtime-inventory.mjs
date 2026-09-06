import { readFile, readdir } from 'node:fs/promises'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const servicesRoot = join(repositoryRoot, 'src/services')
const workloadPath = join(repositoryRoot, 'docker/grpc-trust/workloads.txt')

/** Lists files recursively without following symlinks. */
async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map(async (entry) => entry.isDirectory() ? listFiles(join(directory, entry.name)) : entry.isFile() ? [join(directory, entry.name)] : []))).flat()
}

/** Accepts only a direct call to the shared fail-closed gRPC client credential factory. */
export function isSharedGrpcClientCredentialsCall(source) {
  return /^\s*createGrpcClientCredentials\s*\([\s\S]*\)\s*$/u.test(source)
}

/** Reports one-based lines for gRPC client declarations that lack the shared credential factory. */
export function plaintextGrpcClientLines(source) {
  const findings = []
  const pattern = /transport\s*:\s*Transport\.GRPC/gu
  const matches = [...source.matchAll(pattern)]
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index]
    const boundary = matches[index + 1]?.index ?? source.length
    const declarationTail = source.slice(match.index, boundary)
    if (!/credentials\s*:\s*createGrpcClientCredentials\s*\(/u.test(declarationTail)) {
      findings.push(source.slice(0, match.index).split(/\r?\n/u).length)
    }
  }
  return findings
}

/** Enumerates package-backed gRPC service listeners and their mTLS server factory. */
async function readServiceListeners() {
  const packagePaths = (await listFiles(servicesRoot)).filter((file) => basename(file) === 'package.json' && /src\/services\/(?:business|system)\/[^/]+\/package\.json$/u.test(file))
  return Promise.all(packagePaths.map(async (packageFile) => {
    const directory = dirname(packageFile)
    const serviceName = JSON.parse(await readFile(packageFile, 'utf8')).name
    const mainPath = join(directory, 'src/main.ts')
    const source = await readFile(mainPath, 'utf8')
    let port = source.match(/GRPC_LISTEN_PORT\s*\|\|\s*['"](\d{5})['"]/u)?.[1]
    if (!port && serviceName === 'auth-service') {
      const auth = await readFile(join(directory, 'src/infrastructure/execution-token-signer/auth-grpc-bootstrap.ts'), 'utf8')
      port = auth.match(/GRPC_LISTEN_PORT\s*\|\|\s*['"](\d{5})['"]/u)?.[1]
    }
    return { serviceName, port, mtls: /(?:createGrpcServerCredentials|createAuthGrpcMicroserviceOptions)\(/u.test(source), mainPath: relative(repositoryRoot, mainPath) }
  }))
}

/** Finds production gRPC client registrations that omit the shared credential factory. */
async function readPlaintextClientSources() {
  const files = (await listFiles(servicesRoot)).filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.includes('/test/'))
  const findings = []
  for (const file of files) {
    const source = await readFile(file, 'utf8')
    if (file.endsWith('/src/main.ts') || /createAuthGrpcMicroserviceOptions/u.test(source)) continue
    const wrapsAll = /function\s+createMtlsClientProvider[\s\S]+createGrpcClientCredentials\(\)/u.test(source) && /ClientsModule\.registerAsync\([\s\S]+createMtlsClientProvider\(client\)/u.test(source) && !/ClientsModule\.register\(/u.test(source)
    if (!wrapsAll) findings.push(...plaintextGrpcClientLines(source).map((line) => `${relative(repositoryRoot, file)}:${line}`))
  }
  return findings.sort()
}

/** Produces runtime trust inventory against launcher declarations instead of local service containers. */
async function main() {
  const listeners = (await readServiceListeners()).sort((a, b) => a.serviceName.localeCompare(b.serviceName))
  const registry = (await readFile(workloadPath, 'utf8')).split(/\r?\n/u).map((line) => line.trim()).filter((line) => line && !line.startsWith('#')).map((line) => line.split('|')[0])
  const declarations = JSON.parse(await readFile(join(repositoryRoot, 'scripts/local-runtime/relationships.json'), 'utf8'))
  const launcher = await readFile(join(repositoryRoot, 'scripts/local-runtime/src/process-runtime.mjs'), 'utf8')
  const missingRuntimeOwners = listeners.map((entry) => entry.serviceName).filter((name) => !declarations.owners[name])
  const missingTrustCapability = listeners.map((entry) => entry.serviceName).filter((name) => !declarations.owners[name]?.capabilities.includes('network-trust'))
  const report = {
    gatewayCount: declarations.owners['api-gateway'] ? 1 : 0,
    serviceCount: listeners.length,
    listeners: listeners.map((entry) => ({ ...entry, workloadRegistered: registry.includes(entry.serviceName), runtimeDeclared: Boolean(declarations.owners[entry.serviceName]) })),
    missingWorkloads: listeners.map((entry) => entry.serviceName).filter((name) => !registry.includes(name)),
    missingRuntimeOwners,
    missingTrustCapability,
    plaintextListeners: listeners.filter((entry) => !entry.mtls).map((entry) => entry.serviceName),
    plaintextClientSources: await readPlaintextClientSources(),
    dynamicProcessPorts: /listen\(0, '127\.0\.0\.1'/u.test(launcher),
    explicitMinimalEnvironment: /environmentForOwner\(manifest, owner/u.test(launcher)
  }
  console.log(JSON.stringify(report, null, 2))
  const failures = [report.serviceCount === 21 ? null : 'service-count', report.gatewayCount === 1 ? null : 'gateway', report.missingWorkloads.length ? 'workload-registry' : null, report.missingRuntimeOwners.length ? 'runtime-owner' : null, report.missingTrustCapability.length ? 'trust-capability' : null, report.plaintextListeners.length ? 'plaintext-listener' : null, report.plaintextClientSources.length ? 'plaintext-client' : null, report.dynamicProcessPorts ? null : 'dynamic-ports', report.explicitMinimalEnvironment ? null : 'minimal-environment'].filter(Boolean)
  if (failures.length) throw new Error(`TRUSTED_RUNTIME_INVENTORY_FAILED ${failures.join(',')}`)
}

if (resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
