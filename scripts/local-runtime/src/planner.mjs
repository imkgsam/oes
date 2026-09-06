import fs from 'node:fs'
import path from 'node:path'
import { fingerprint } from './canonical.mjs'

const CLASSES = new Set(['unit', 'component', 'contract', 'integration', 'journey'])

/** Normalizes and validates one explicit capability list. */
function capabilityList(values, allowed) {
  const normalized = [...new Set((values || []).map((value) => String(value).trim()).filter(Boolean))].sort()
  for (const capability of normalized) if (!allowed.has(capability)) throw new Error(`RUNTIME_CAPABILITY_UNKNOWN capability=${capability}`)
  return normalized
}

/** Produces a fail-closed dependency plan from test class, owner and versioned declarations. */
export function planRuntime({ root, profile, testClass, owners = [], capabilities = [] }) {
  if (!CLASSES.has(testClass)) throw new Error(`RUNTIME_TEST_CLASS_INVALID class=${testClass}`)
  const declarations = JSON.parse(fs.readFileSync(path.join(root, 'scripts/local-runtime/relationships.json'), 'utf8'))
  const defaults = JSON.parse(fs.readFileSync(path.join(root, 'scripts/local-runtime/defaults.json'), 'utf8'))
  const recipe = defaults.profiles[profile]
  if (!recipe) throw new Error(`RUNTIME_PROFILE_INVALID profile=${profile}`)
  const selectedOwners = [...new Set(owners)].sort()
  if (!selectedOwners.length && !['unit', 'component', 'contract'].includes(testClass)) throw new Error('RUNTIME_OWNER_REQUIRED')
  for (const owner of selectedOwners) if (!declarations.owners[owner]) throw new Error(`RUNTIME_OWNER_UNKNOWN owner=${owner}`)
  if (testClass === 'journey' && !selectedOwners.every((owner) => declarations.executableJourneys.includes(owner))) throw new Error(`RUNTIME_JOURNEY_UNDECLARED owners=${selectedOwners.join(',')}`)
  const allowed = new Set(['database', 'object-store', ...declarations.explicitCapabilities])
  const explicitCapabilities = capabilityList(capabilities, allowed)
  const classCapabilities = declarations.testCapabilities[testClass] || []
  const ownerCapabilities = selectedOwners.flatMap((owner) => declarations.owners[owner].capabilities)
  const requiredCapabilities = [...new Set(profile === 'DEV' ? [...classCapabilities, ...explicitCapabilities, ...ownerCapabilities, 'database', 'object-store', 'cache', 'events', 'network-trust', 'nacos-specific', 'trace-specific'] : [...classCapabilities, ...explicitCapabilities, ...ownerCapabilities.filter((capability) => explicitCapabilities.includes(capability))])].sort()
  if (profile !== 'DEV' && ['unit', 'component'].includes(testClass) && requiredCapabilities.length) throw new Error(`RUNTIME_NETWORK_FORBIDDEN class=${testClass}`)
  if (testClass === 'contract' && requiredCapabilities.some((capability) => !explicitCapabilities.includes(capability))) throw new Error('RUNTIME_CONTRACT_PROVIDER_MUST_BE_EXPLICIT')
  const providers = new Set()
  if (!['unit', 'component'].includes(testClass)) {
    for (const provider of recipe.sharedProviders) {
      if (profile === 'DEV' || requiredCapabilities.includes(provider === 'postgres' ? 'database' : provider === 'minio' ? 'object-store' : provider === 'mtls' ? 'network-trust' : provider === 'otel-full' ? 'trace-specific' : provider)) providers.add(provider)
    }
    for (const capability of requiredCapabilities) {
      const provider = recipe.ephemeralByCapability?.[capability]
      if (provider) providers.add(provider)
    }
  }
  const providerOwners = {}
  for (const provider of [...providers].sort()) {
    const capability = provider === 'postgres' ? 'database' : provider === 'minio' ? 'object-store' : provider === 'redis' ? 'cache' : provider === 'nats' ? 'events' : provider === 'mtls' ? 'network-trust' : provider.startsWith('otel') ? 'trace-specific' : provider === 'nacos' ? 'nacos-specific' : provider
    providerOwners[provider] = selectedOwners.filter((owner) => declarations.owners[owner].capabilities.includes(capability) || (profile === 'DEV' && ['nacos-specific', 'trace-specific'].includes(capability)) || (explicitCapabilities.includes(capability) && ['nacos-specific', 'trace-specific'].includes(capability)))
    if (profile !== 'DEV' && providers.has(provider) && providerOwners[provider].length === 0) throw new Error(`RUNTIME_PROVIDER_OWNER_UNDECLARED provider=${provider} capability=${capability}`)
    if (profile !== 'DEV' && provider === 'minio' && requiredCapabilities.includes('object-store') && !providerOwners[provider].includes('asset-service')) throw new Error('RUNTIME_OBJECT_STORE_OWNER_DENIED')
  }
  const plan = {
    schemaVersion: 2,
    profile,
    testClass,
    owners: selectedOwners,
    capabilities: requiredCapabilities,
    providers: [...providers].sort(),
    providerOwners,
    processes: selectedOwners.filter((owner) => declarations.owners[owner].process),
    realInfrastructure: providers.size > 0,
    providerScope: recipe.providerScope,
    jobPrivate: recipe.jobPrivate
  }
  plan.planFingerprint = fingerprint(plan)
  return plan
}
