export const TENANT_WEB_AUTH_DATABASE_BINDINGS = Object.freeze([
  { envKey: 'AUTH_DATABASE_URL', service: 'auth-service' },
  { envKey: 'IDENTITY_DATABASE_URL', service: 'identity-service' },
  { envKey: 'PERMISSION_DATABASE_URL', service: 'permission-service' },
  { envKey: 'TENANT_ORG_DATABASE_URL', service: 'tenant-org-service' },
  { envKey: 'PARTY_DATABASE_URL', service: 'party-service' },
  { envKey: 'HR_DATABASE_URL', service: 'hr-service' }
])
const SEED_BINDING_ENV = 'OES_TENANT_WEB_AUTH_SEED_BINDING'

/** Decodes every valid percent-encoded run while preserving malformed or literal percent signs. */
function decodeCredentialVariant(value) {
  return value.replace(/(?:%[0-9a-f]{2})+/gi, (encoded) => {
    try {
      return decodeURIComponent(encoded)
    } catch {
      return encoded
    }
  })
}

/** Builds the explicit loopback database environment used by the host-side tenant-web seeder. */
export function buildTenantWebAuthSeedEnvironment(context, port, baseEnvironment = process.env) {
  const environment = {
    ...baseEnvironment,
    OES_TASK_KEY: context.taskKey
  }
  const seen = new Set()

  for (const { envKey, service: serviceName } of TENANT_WEB_AUTH_DATABASE_BINDINGS) {
    const service = context.services.find((candidate) => candidate.name === serviceName)
    if (!service) throw new Error(`SEED_DATABASE_SERVICE_MISSING service=${serviceName}`)
    if (seen.has(service.database)) {
      throw new Error(`SEED_DATABASE_DUPLICATE database=${service.database}`)
    }
    seen.add(service.database)

    const url = new URL('postgresql://127.0.0.1')
    url.username = context.rootValues.get('OES_POSTGRES_USER')
    url.password = context.rootValues.get('OES_POSTGRES_PASSWORD')
    url.hostname = '127.0.0.1'
    url.port = String(port)
    url.pathname = `/${service.database}`
    url.searchParams.set('schema', 'public')
    environment[envKey] = url.toString()
  }

  environment[SEED_BINDING_ENV] = JSON.stringify({
    taskKey: context.taskKey,
    port: String(port),
    databases: Object.fromEntries(
      TENANT_WEB_AUTH_DATABASE_BINDINGS.map(({ envKey, service: serviceName }) => [
        envKey,
        context.services.find((candidate) => candidate.name === serviceName).database
      ])
    )
  })

  resolveTenantWebAuthSeedDatabaseUrls(environment)
  return environment
}

/** Validates that every seeder database URL belongs to one local task and one runtime port. */
export function resolveTenantWebAuthSeedDatabaseUrls(environment = process.env) {
  const taskKey = environment.OES_TASK_KEY?.trim()
  if (!taskKey) throw new Error('SEED_TASK_KEY_MISSING')

  let binding
  try {
    binding = JSON.parse(environment[SEED_BINDING_ENV] ?? '')
  } catch {
    throw new Error('SEED_BINDING_INVALID')
  }
  if (binding.taskKey !== taskKey) throw new Error('SEED_BINDING_TASK_MISMATCH')
  if (!/^\d{1,5}$/.test(binding.port ?? '')) throw new Error('SEED_BINDING_PORT_INVALID')
  const expectedKeys = TENANT_WEB_AUTH_DATABASE_BINDINGS.map(({ envKey }) => envKey).sort()
  if (
    !binding.databases ||
    JSON.stringify(Object.keys(binding.databases).sort()) !== JSON.stringify(expectedKeys)
  ) {
    throw new Error('SEED_BINDING_DATABASE_INVENTORY_INVALID')
  }

  const resolved = new Map()
  const databases = new Set()
  const ports = new Set()
  for (const { envKey } of TENANT_WEB_AUTH_DATABASE_BINDINGS) {
    const raw = environment[envKey]?.trim()
    if (!raw) throw new Error(`SEED_DATABASE_ENV_MISSING key=${envKey}`)

    let url
    try {
      url = new URL(raw)
    } catch {
      throw new Error(`SEED_DATABASE_URL_INVALID key=${envKey}`)
    }
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
      throw new Error(`SEED_DATABASE_PROTOCOL_INVALID key=${envKey}`)
    }
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
      throw new Error(`SEED_DATABASE_HOST_NOT_LOCAL key=${envKey}`)
    }
    const database = decodeURIComponent(url.pathname.slice(1))
    if (database !== binding.databases[envKey]) {
      throw new Error(`SEED_DATABASE_NAME_MISMATCH key=${envKey}`)
    }
    if (databases.has(database)) throw new Error(`SEED_DATABASE_DUPLICATE database=${database}`)
    databases.add(database)
    ports.add(url.port || '5432')
    if ((url.port || '5432') !== binding.port) {
      throw new Error(`SEED_DATABASE_RUNTIME_PORT_MISMATCH key=${envKey}`)
    }
    resolved.set(envKey, url.toString())
  }

  if (ports.size !== 1) throw new Error('SEED_DATABASE_PORT_MISMATCH')
  return resolved
}

/** Redacts database URLs and known credential values from one seeder diagnostic. */
export function sanitizeTenantWebAuthSeedMessage(message, credentialValues = []) {
  let sanitized = String(message).replace(/postgres(?:ql)?:\/\/[^\s'"`]+/gi, '<TASK_DATABASE_URL>')
  const variants = new Set()
  for (const candidate of credentialValues) {
    if (!candidate) continue
    const value = String(candidate)
    variants.add(value)
    variants.add(decodeCredentialVariant(value))
  }
  for (const value of [...variants]
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)) {
    sanitized = sanitized.replaceAll(value, '<REDACTED>')
  }
  return sanitized.replace(/\b(password|otp|secret)=\S+/gi, '$1=<REDACTED>')
}
