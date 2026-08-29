import { readFile, readdir } from 'node:fs/promises'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const servicesRoot = join(repositoryRoot, 'src/services')
const workloadPath = join(repositoryRoot, 'docker/grpc-trust/workloads.txt')
const composePath = join(repositoryRoot, 'docker-compose.yml')
const auxiliaryWorkloads = new Set([
  'grpc-transport-smoke-client',
  'grpc-transport-smoke-server',
  'grpc-transport-smoke-rogue'
])

/** Lists files recursively without following symlinks. */
async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) return listFiles(path)
      return entry.isFile() ? [path] : []
    })
  )
  return nested.flat()
}

/** Reads the versioned workload registry and its exact name, port, and listener-source columns. */
function parseWorkloadRegistry(source) {
  return source
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [name, port, listenerPath, ...extra] = line.split('|').map((value) => value.trim())
      return {
        name,
        port,
        listenerPath,
        malformed: !name || !port || !listenerPath || extra.length > 0
      }
    })
}

/** Checks each service registry row against its executable listener port and source. */
async function readRegistryMismatches(listeners, registry) {
  const byName = new Map(registry.map((entry) => [entry.name, entry]))
  const mismatches = []
  for (const listener of listeners) {
    const entry = byName.get(listener.serviceName)
    if (!entry) continue
    let sourceHasPort = false
    try {
      sourceHasPort = (await readFile(join(repositoryRoot, entry.listenerPath), 'utf8')).includes(
        listener.port
      )
    } catch {
      sourceHasPort = false
    }
    if (
      entry.malformed ||
      entry.port !== listener.port ||
      !entry.listenerPath.startsWith('src/services/') ||
      !sourceHasPort
    ) {
      mismatches.push({
        serviceName: listener.serviceName,
        listenerPort: listener.port,
        registryPort: entry.port,
        listenerPath: entry.listenerPath,
        sourceHasPort
      })
    }
  }
  return mismatches
}

/** Extracts the service listener's default port from its exact bootstrap source. */
async function readListenerPort(serviceDirectory, mainSource, serviceName) {
  const direct = mainSource.match(/GRPC_LISTEN_PORT\s*\|\|\s*['"](\d{5})['"]/u)?.[1]
  if (direct) return direct
  if (serviceName !== 'auth-service') return undefined
  const authBootstrap = await readFile(
    join(serviceDirectory, 'src/infrastructure/execution-token-signer/auth-grpc-bootstrap.ts'),
    'utf8'
  )
  return authBootstrap.match(/GRPC_LISTEN_PORT\s*\|\|\s*['"](\d{5})['"]/u)?.[1]
}

/** Enumerates the exact package-backed gRPC service listener set. */
async function readServiceListeners() {
  const files = await listFiles(servicesRoot)
  const packagePaths = files.filter(
    (path) =>
      basename(path) === 'package.json' &&
      /src\/services\/(?:business|system)\/[^/]+\/package\.json$/u.test(path)
  )
  return Promise.all(
    packagePaths.map(async (packagePath) => {
      const serviceDirectory = dirname(packagePath)
      const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
      const serviceName = packageJson.name
      const mainPath = join(serviceDirectory, 'src/main.ts')
      const mainSource = await readFile(mainPath, 'utf8')
      const port = await readListenerPort(serviceDirectory, mainSource, serviceName)
      const mtls = /(?:createGrpcServerCredentials|createAuthGrpcServerCredentials)\(\)/u.test(
        mainSource
      )
      return {
        serviceName,
        port,
        mtls,
        mainPath: relative(repositoryRoot, mainPath)
      }
    })
  )
}

/** Reads an object-literal property by its exact identifier or string-literal name. */
function objectProperty(object, name) {
  return object.properties.find((property) => {
    if (!ts.isPropertyAssignment(property)) return false
    return (
      (ts.isIdentifier(property.name) && property.name.text === name) ||
      (ts.isStringLiteral(property.name) && property.name.text === name)
    )
  })
}

/** Finds each production gRPC client registration that omits the shared fail-closed mTLS factory. */
async function readPlaintextClientSources() {
  const files = (await listFiles(servicesRoot)).filter(
    (path) => path.endsWith('.ts') && !path.endsWith('.spec.ts') && !path.includes('/test/')
  )
  const findings = []
  for (const path of files) {
    const source = await readFile(path, 'utf8')
    if (path.endsWith('/src/main.ts') || /createAuthGrpcMicroserviceOptions/u.test(source)) continue
    const wrapsAllRegistrations =
      /function\s+createMtlsClientProvider[\s\S]+createGrpcClientCredentials\(\)/u.test(source) &&
      /ClientsModule\.registerAsync\([\s\S]+\.map\(\(client\)[\s\S]+createMtlsClientProvider\(client\)/u.test(
        source
      ) &&
      !/ClientsModule\.register\(/u.test(source)
    const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true)
    const visit = (node) => {
      if (ts.isObjectLiteralExpression(node)) {
        const transport = objectProperty(node, 'transport')
        if (transport?.initializer.getText(sourceFile) === 'Transport.GRPC') {
          if (wrapsAllRegistrations) {
            ts.forEachChild(node, visit)
            return
          }
          const options = objectProperty(node, 'options')
          const credentials =
            options && ts.isObjectLiteralExpression(options.initializer)
              ? objectProperty(options.initializer, 'credentials')
              : undefined
          if (
            !credentials ||
            !/^createGrpcClientCredentials\(\)$/u.test(credentials.initializer.getText(sourceFile))
          ) {
            const line = sourceFile.getLineAndCharacterOfPosition(transport.getStart()).line + 1
            findings.push(`${relative(repositoryRoot, path)}:${line}`)
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
  }
  return findings.sort()
}

/** Checks dedicated Gateway client defaults against the matching listener port. */
async function readGatewayTargetMismatches(portByService) {
  const gatewayFiles = (await listFiles(join(servicesRoot, 'api-gateway/src'))).filter(
    (path) => /gateway-.+-grpc\.client\.ts$/u.test(path) && !path.endsWith('.spec.ts')
  )
  const mismatches = []
  for (const path of gatewayFiles) {
    const targetStem = basename(path).match(/^gateway-(.+)-grpc\.client\.ts$/u)?.[1]
    if (!targetStem) continue
    const serviceName = `${targetStem}-service`
    const expectedPort = portByService.get(serviceName)
    if (!expectedPort) continue
    const source = await readFile(path, 'utf8')
    const configuredPorts = [...source.matchAll(/127\.0\.0\.1:(\d{5})/gu)].map((match) => match[1])
    if (configuredPorts.length > 0 && configuredPorts.some((port) => port !== expectedPort)) {
      mismatches.push({
        path: relative(repositoryRoot, path),
        serviceName,
        expectedPort,
        configuredPorts: [...new Set(configuredPorts)]
      })
    }
  }
  return mismatches
}

/** Extracts one top-level or service-level Compose block without interpreting unrelated YAML. */
function composeBlock(source, header, nextIndent = 0) {
  const indentation = ' '.repeat(nextIndent)
  const escaped = header.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
  return source.match(
    new RegExp(
      `^${indentation}${escaped}:[^\\n]*\\n([\\s\\S]*?)(?=^${indentation}[^ \\n][^\\n]*:|(?![\\s\\S]))`,
      'mu'
    )
  )?.[1]
}

/** Verifies that Compose realizes every registered runtime workload with exact trust and port bindings. */
async function readComposeMismatches(listeners) {
  const source = await readFile(composePath, 'utf8')
  const defaults = composeBlock(source, 'x-service-defaults') ?? ''
  const environment = composeBlock(source, 'x-service-environment') ?? ''
  const services = composeBlock(source, 'services') ?? ''
  const trustRoot = '/var/run/oes-grpc-trust'
  const defaultRequirements = [
    'grpc-trust-bootstrap: { condition: service_completed_successfully }',
    `grpc_trust_runtime:${trustRoot}:ro`
  ]
  const environmentRequirements = [
    "OES_GRPC_TLS_ENABLED: 'true'",
    'OES_GRPC_TLS_MIN_VERSION: TLSv1.2',
    `OES_GRPC_TLS_CA_PATH: ${trustRoot}/ca.pem`
  ]
  const defaultTrustMismatches = [
    ...defaultRequirements.filter((expected) => !defaults.includes(expected)),
    ...environmentRequirements.filter((expected) => !environment.includes(expected))
  ]
  const runtimeNames = ['api-gateway', ...listeners.map(({ serviceName }) => serviceName)]
  const composeTrustMismatches = []
  const composePortMismatches = []
  const composeGatewayTargetMismatches = []
  const gateway = composeBlock(services, 'api-gateway', 2) ?? ''
  for (const name of runtimeNames) {
    const block = composeBlock(services, name, 2)
    if (!block) {
      composeTrustMismatches.push(`${name}:missing-service`)
      continue
    }
    const workloadRequirements = [
      '<<: *service-defaults',
      '<<: *service-environment',
      `MODULE_NAME: ${name}`,
      `OES_GRPC_TLS_CERT_PATH: ${trustRoot}/${name}/current/cert.pem`,
      `OES_GRPC_TLS_KEY_PATH: ${trustRoot}/${name}/current/key.pem`,
      `OES_WORKLOAD_SPIFFE_ID: spiffe://local.oes.internal/ns/oes/sa/${name}`
    ]
    for (const expected of workloadRequirements) {
      if (!block.includes(expected)) composeTrustMismatches.push(`${name}:${expected}`)
    }
    const listener = listeners.find(({ serviceName }) => serviceName === name)
    if (!listener) continue
    if (
      !block.includes(`GRPC_LISTEN_PORT: ${listener.port}`) ||
      !block.includes(`expose: ['${listener.port}']`)
    ) {
      composePortMismatches.push(`${name}:${listener.port}`)
    }
    const targetVariable = `${name.replace(/-service$/u, '').replaceAll('-', '_').toUpperCase()}_SERVICE_PORT`
    const targetMatch = gateway.match(new RegExp(`^      ${targetVariable}: (\\d{5})$`, 'mu'))
    if (targetMatch && targetMatch[1] !== listener.port) {
      composeGatewayTargetMismatches.push(`${name}:${targetMatch[1]}!=${listener.port}`)
    }
  }
  return {
    composeRuntimeCount: runtimeNames.filter((name) => composeBlock(services, name, 2)).length,
    defaultTrustMismatches,
    composeTrustMismatches,
    composePortMismatches,
    composeGatewayTargetMismatches
  }
}

/** Produces the executable state truth table and fails closed on drift. */
async function main() {
  const listeners = (await readServiceListeners()).sort((left, right) =>
    left.serviceName.localeCompare(right.serviceName)
  )
  const registry = parseWorkloadRegistry(await readFile(workloadPath, 'utf8'))
  const workloads = registry.map((entry) => entry.name)
  const workloadSet = new Set(workloads)
  const expectedRuntimeWorkloads = new Set([
    'api-gateway',
    ...listeners.map((listener) => listener.serviceName),
    ...auxiliaryWorkloads
  ])
  const missingWorkloads = [...expectedRuntimeWorkloads]
    .filter((name) => !workloadSet.has(name))
    .sort()
  const staleWorkloads = [...workloadSet]
    .filter((name) => !expectedRuntimeWorkloads.has(name))
    .sort()
  const duplicateWorkloads = workloads.filter((name, index) => workloads.indexOf(name) !== index)
  const portGroups = new Map()
  for (const listener of listeners.filter((entry) => entry.port)) {
    portGroups.set(listener.port, [...(portGroups.get(listener.port) ?? []), listener])
  }
  const duplicatePorts = [...portGroups]
    .filter(([, entries]) => entries.length > 1)
    .map(([port, entries]) => ({
      port,
      services: entries.map((entry) => entry.serviceName).sort()
    }))
  const missingPorts = listeners
    .filter((listener) => !listener.port)
    .map((listener) => listener.serviceName)
  const plaintextListeners = listeners
    .filter((listener) => !listener.mtls)
    .map((listener) => listener.serviceName)
  const plaintextClientSources = await readPlaintextClientSources()
  const registryMismatches = await readRegistryMismatches(listeners, registry)
  const gatewayTargetMismatches = await readGatewayTargetMismatches(
    new Map(listeners.map((listener) => [listener.serviceName, listener.port]))
  )
  const compose = await readComposeMismatches(listeners)
  const report = {
    gatewayCount: workloadSet.has('api-gateway') ? 1 : 0,
    serviceCount: listeners.length,
    listeners: listeners.map((listener) => ({
      ...listener,
      workloadRegistered: workloadSet.has(listener.serviceName)
    })),
    missingWorkloads,
    staleWorkloads,
    duplicateWorkloads: [...new Set(duplicateWorkloads)].sort(),
    missingPorts,
    duplicatePorts,
    registryMismatches,
    plaintextListeners,
    plaintextClientSources,
    gatewayTargetMismatches,
    ...compose
  }

  console.log(JSON.stringify(report, null, 2))
  const failures = [
    listeners.length === 21 ? undefined : `expected 21 services, found ${listeners.length}`,
    workloadSet.has('api-gateway') ? undefined : 'api-gateway workload is missing',
    missingWorkloads.length ? `missing workloads: ${missingWorkloads.join(', ')}` : undefined,
    staleWorkloads.length ? `stale workloads: ${staleWorkloads.join(', ')}` : undefined,
    duplicateWorkloads.length ? `duplicate workloads: ${duplicateWorkloads.join(', ')}` : undefined,
    missingPorts.length ? `missing ports: ${missingPorts.join(', ')}` : undefined,
    duplicatePorts.length
      ? `duplicate ports: ${duplicatePorts.map(({ port, services }) => `${port}=${services.join('+')}`).join(', ')}`
      : undefined,
    registry.some((entry) => entry.malformed) ? 'malformed workload registry row' : undefined,
    registryMismatches.length
      ? 'workload registry ports or listener sources do not match code'
      : undefined,
    plaintextListeners.length ? `plaintext listeners: ${plaintextListeners.join(', ')}` : undefined,
    plaintextClientSources.length
      ? `plaintext client registrations: ${plaintextClientSources.join(', ')}`
      : undefined,
    gatewayTargetMismatches.length
      ? 'Gateway target defaults do not match listener ports'
      : undefined,
    compose.composeRuntimeCount === 22
      ? undefined
      : `expected 22 Compose runtimes, found ${compose.composeRuntimeCount}`,
    compose.defaultTrustMismatches.length
      ? `Compose trust defaults missing: ${compose.defaultTrustMismatches.join(', ')}`
      : undefined,
    compose.composeTrustMismatches.length
      ? `Compose workload trust bindings missing: ${compose.composeTrustMismatches.join(', ')}`
      : undefined,
    compose.composePortMismatches.length
      ? `Compose listener ports mismatch: ${compose.composePortMismatches.join(', ')}`
      : undefined,
    compose.composeGatewayTargetMismatches.length
      ? `Compose Gateway target ports mismatch: ${compose.composeGatewayTargetMismatches.join(', ')}`
      : undefined
  ].filter(Boolean)
  if (failures.length > 0) throw new Error(failures.join('\n'))
}

await main()
