import assert from 'node:assert/strict'
import test, { after } from 'node:test'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const testStateRoot = await mkdtemp(join(tmpdir(), 'oes-trusted-runtime-spec-'))
const taskEnvironmentPath = join(testStateRoot, 'compose.env')
const selectorProfilePath = join(testStateRoot, 'machine-selectors-v2.json')
await writeFile(taskEnvironmentPath, 'NACOS_HOST_PORT=8848\n', { mode: 0o600 })
await writeFile(
  selectorProfilePath,
  JSON.stringify({
    selectors: [
      'api-gateway',
      'auth-service',
      'collaboration-service',
      'crm-service',
      'hr-service',
      'identity-service',
      'public-entry-service',
      'srm-service',
      'tenant-org-service'
    ].map((inventoryEntryKey) => ({
      inventoryEntryKey,
      machinePrincipalId: `principal-${inventoryEntryKey}`,
      machineWorkloadBindingId: `binding-${inventoryEntryKey}`,
      machineWorkloadBindingVersion: '1'
    }))
  }),
  { mode: 0o600 }
)
process.env.OES_TASK_ENV = taskEnvironmentPath
process.env.OES_TRUSTED_RUNTIME_STATE = join(testStateRoot, 'runtime')
const {
  DOCKER_PORT_INSPECTION_TIMEOUT_MS,
  generateProfile: generateProfileFromFixture,
  parseTrustedRuntimeEnvironment,
  readInventory,
  resolveTrustedRuntimeTaskKey,
  selectDevelopmentDependencies,
  selectDevelopmentService,
  selectRestartService,
  signerWorkDirectory
} = await import('./trusted-runtime.mjs')

/** Generates a profile from test-owned task inputs rather than shared lifecycle residue. */
const generateProfile = (options) => generateProfileFromFixture({ ...options, selectorProfilePath })

after(async () => {
  await rm(testStateRoot, { recursive: true, force: true })
})

test('inventory has exactly 21 unique listeners and canonical Collaboration port', async () => {
  const entries = await readInventory()
  assert.equal(entries.length, 21)
  assert.equal(
    entries.find((entry) => entry.workload === 'collaboration-service')?.canonicalPort,
    50068
  )
})

test('task Docker port inspection tolerates bounded local daemon latency', () => {
  assert.equal(DOCKER_PORT_INSPECTION_TIMEOUT_MS, 30_000)
})

test('trusted runtime resolves the generated repository task key before its legacy fallback', async () => {
  const repositoryRoot = join(testStateRoot, 'task-root')
  await mkdir(repositoryRoot, { recursive: true })
  await writeFile(join(repositoryRoot, '.env'), 'OES_TASK_KEY=fixture_task\n')
  assert.equal(resolveTrustedRuntimeTaskKey({ environment: {}, repositoryRoot }), 'fixture_task')
  assert.equal(
    resolveTrustedRuntimeTaskKey({
      environment: { OES_TASK_KEY: 'explicit_task' },
      repositoryRoot
    }),
    'explicit_task'
  )
})

test('trusted runtime CLI resolves the root task key during first module initialization', () => {
  const result = spawnSync(process.execPath, ['scripts/local/trusted-runtime.mjs', 'check'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      OES_TASK_KEY: 'fixture_task',
      OES_TASK_ENV: taskEnvironmentPath,
      OES_MACHINE_SELECTOR_FILE: selectorProfilePath,
      OES_TRUSTED_RUNTIME_STATE: join(testStateRoot, 'cli-runtime')
    }
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /TRUSTED_RUNTIME_PROFILE_VALID services=21/u)
})

test('foreground dev selection includes one exact Gateway and parses generated shell values', () => {
  const gateway = { workload: 'api-gateway', envPath: 'gateway.env' }
  const permission = { workload: 'permission-service', envPath: 'permission.env' }
  const manifest = { services: [permission], gateway }
  assert.equal(selectDevelopmentService(manifest, 'api-gateway'), gateway)
  assert.equal(selectDevelopmentService(manifest, 'permission-service'), permission)
  assert.throws(
    () => selectDevelopmentService(manifest, 'permission-service '),
    /DEV_WORKLOAD_INVALID/
  )
  assert.throws(
    () => selectDevelopmentService(manifest, 'missing-service'),
    /DEV_WORKLOAD_NOT_EXACT/
  )
  assert.deepEqual(parseTrustedRuntimeEnvironment("A='one'\nB='two'\\''s'\n"), {
    A: 'one',
    B: "two's"
  })
})

test('foreground dev dependencies preserve trusted readiness groups for full and system scopes', () => {
  const service = (workload, group, port) => ({ workload, group, port })
  const manifest = {
    services: [
      service('permission-service', 1, 1),
      service('auth-service', 2, 2),
      service('asset-service', 3, 3),
      service('sales-service', 4, 4),
      service('notification-service', 5, 5)
    ],
    gateway: service('api-gateway', undefined, 6)
  }
  assert.deepEqual(
    selectDevelopmentDependencies(manifest, 'auth-service', 'full').map((item) => item.workload),
    ['permission-service']
  )
  assert.deepEqual(
    selectDevelopmentDependencies(manifest, 'notification-service', 'system').map(
      (item) => item.workload
    ),
    ['permission-service', 'auth-service', 'asset-service']
  )
  assert.deepEqual(
    selectDevelopmentDependencies(manifest, 'api-gateway', 'full').map((item) => item.workload),
    ['permission-service', 'auth-service', 'asset-service', 'sales-service', 'notification-service']
  )
  assert.deepEqual(selectDevelopmentDependencies(manifest, 'sales-service', 'business'), [])
  assert.throws(
    () => selectDevelopmentDependencies(manifest, 'sales-service', 'unknown'),
    /DEV_SCOPE_INVALID/
  )
})

test('signer work directories are short and isolated by exact runtime state root', () => {
  const first = signerWorkDirectory('/a/runtime/root')
  const second = signerWorkDirectory('/b/runtime/root')
  assert.notEqual(first, second)
  assert.ok(first.startsWith('/private/tmp/oes-signer-'))
  assert.ok(Buffer.byteLength(join(first, 'signer.sock')) < 104)
})

test('local trust leaves use workload-scoped DNS names rather than IP identity', async () => {
  const source = await readFile('docker/grpc-trust/bootstrap-local-trust.sh', 'utf8')
  assert.match(source, /DNS:\$\{workload\},DNS:\$\{workload\}\.localhost/)
  assert.doesNotMatch(source, /IP:/)
})

test('offline profile validation does not require live Docker infrastructure', async () => {
  const profile = await generateProfile({ basePort: 54050, requireInfrastructure: false })
  assert.equal(profile.services.length, 21)
  assert.equal(profile.nacos, '127.0.0.1:8848')
  assert.equal(new Set(profile.services.map((service) => service.port)).size, 21)
  assert.equal(new Set(profile.services.map((service) => service.certPath)).size, 21)
  assert.equal(profile.gateway.workload, 'api-gateway')
  assert.equal(profile.gateway.port, 52101)
  const gatewayEnvironment = await readFile(profile.gateway.envPath, 'utf8')
  assert.equal(
    readProjectedEnvironmentValue(gatewayEnvironment, 'GATEWAY_TERMINAL_DEVICE_PEER_SPIFFE_ID'),
    'spiffe://local.oes.internal/ns/oes/sa/terminal-device-service'
  )
  assert.match(gatewayEnvironment, /GATEWAY_MACHINE_PRINCIPAL_ID=/u)
  assert.match(gatewayEnvironment, /GATEWAY_MACHINE_WORKLOAD_BINDING_ID=/u)
  assert.match(gatewayEnvironment, /GATEWAY_MACHINE_WORKLOAD_BINDING_VERSION=/u)
  const auth = profile.services.find((service) => service.workload === 'auth-service')
  const authEnvironment = await readFile(auth.envPath, 'utf8')
  assert.equal(profile.authHttpPort, 52103)
  assert.equal(readProjectedEnvironmentValue(authEnvironment, 'AUTH_HTTP_PORT'), '52103')
  assert.match(authEnvironment, /AUTH_EXECUTION_WORKLOAD_POLICIES=.*urn:oes:service:auth-service/u)
  assert.match(authEnvironment, /AUTH_FOUNDATION_MACHINE_PRINCIPAL_ID=/u)
  assert.match(authEnvironment, /AUTH_FOUNDATION_MACHINE_WORKLOAD_BINDING_ID=/u)
  assert.match(gatewayEnvironment, /urn:oes:service:terminal-device-service/u)
  assert.match(gatewayEnvironment, /urn:oes:service:item-master-service/u)
  assert.match(gatewayEnvironment, /terminal-device\.internal\.gateway\.enrollment\.activate/u)
  assert.match(gatewayEnvironment, /terminal-device\.internal\.gateway\.access\.resolve/u)
  assert.match(gatewayEnvironment, /permission\.internal\.account_access_summary\.resolve/u)
  assert.match(gatewayEnvironment, /permission\.internal\.account_navigation\.resolve/u)
  const terminalDevice = profile.services.find(
    (service) => service.workload === 'terminal-device-service'
  )
  assert.ok(terminalDevice)
  const terminalDeviceEnvironment = await readFile(terminalDevice.envPath, 'utf8')
  assert.match(
    terminalDeviceEnvironment,
    /GATEWAY_TERMINAL_DEVICE_SPIFFE_ID='spiffe:\/\/local\.oes\.internal\/ns\/oes\/sa\/api-gateway'/u
  )
})

test('inventory rejects duplicate workload, listener port, or source', async () => {
  await assert.rejects(() => readInventory('a|50050|a.ts\na|50051|b.ts\n'), /DUPLICATE_WORKLOAD/)
  await assert.rejects(
    () => readInventory('a|50050|a.ts\nb|50050|b.ts\n'),
    /DUPLICATE_CANONICALPORT/
  )
  await assert.rejects(() => readInventory('a|50050|a.ts\nb|50051|a.ts\n'), /DUPLICATE_SOURCE/)
})

test('service restart selection is exact and rejects missing, malformed, or duplicate targets', () => {
  const permission = { workload: 'permission-service', port: 52051 }
  const manifest = { services: [permission, { workload: 'auth-service', port: 52050 }] }
  assert.equal(selectRestartService(manifest, 'permission-service'), permission)
  assert.throws(
    () => selectRestartService(manifest, 'permission-service '),
    /RESTART_WORKLOAD_INVALID/
  )
  assert.throws(
    () => selectRestartService(manifest, 'unknown-service'),
    /RESTART_WORKLOAD_NOT_EXACT/
  )
  assert.throws(
    () => selectRestartService({ services: [permission, permission] }, 'permission-service'),
    /RESTART_WORKLOAD_NOT_EXACT/
  )
})

test('notification payload protection key is stable and owner-private', async () => {
  const first = await generateProfile({ basePort: 54050, requireInfrastructure: false })
  const notification = first.services.find((service) => service.workload === 'notification-service')
  assert.ok(notification)
  const firstEnvironment = await readFile(notification.envPath, 'utf8')
  const firstKey = firstEnvironment.match(/^NOTIFICATION_DELIVERY_PAYLOAD_KEY='([^']+)'$/mu)?.[1]
  assert.equal(Buffer.from(firstKey ?? '', 'base64').length, 32)
  await generateProfile({ basePort: 54050, requireInfrastructure: false })
  const secondEnvironment = await readFile(notification.envPath, 'utf8')
  assert.equal(
    secondEnvironment.match(/^NOTIFICATION_DELIVERY_PAYLOAD_KEY='([^']+)'$/mu)?.[1],
    firstKey
  )
  const secret = await stat(
    join(dirname(dirname(notification.envPath)), 'secrets/notification-delivery-payload.key')
  )
  assert.equal(secret.mode & 0o777, 0o600)
})

test('APISIX standalone profile routes only to the host-rewritable Gateway binding', async () => {
  const [config, routes] = await Promise.all([
    readFile('docker/apisix/config.yaml', 'utf8'),
    readFile('docker/apisix/apisix.yaml', 'utf8')
  ])
  assert.match(config, /config_provider: yaml/u)
  assert.match(config, /enable_admin: false/u)
  assert.match(routes, /api-gateway:9101/u)
  assert.match(routes, /#END/u)
})

test('projects exact Collaboration HUMAN_OBO owner selectors and Permission upper bound', async () => {
  const auth = JSON.parse(
    await readFile('scripts/local/runtime-config/auth-execution-workload-policies.json', 'utf8')
  )
  const permission = JSON.parse(
    await readFile(
      'scripts/local/runtime-config/permission-workload-issuance-policies.json',
      'utf8'
    )
  )
  assert.deepEqual(
    auth.find((entry) => entry.spiffeId.endsWith('/collaboration-service')),
    {
      spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/collaboration-service',
      audiences: [
        'urn:oes:service:collaboration-service',
        'urn:oes:service:identity-service',
        'urn:oes:service:permission-service'
      ]
    }
  )
  assert.deepEqual(
    permission.find((entry) => entry.originalWorkloadSpiffeId.endsWith('/collaboration-service')),
    {
      originalWorkloadSpiffeId: 'spiffe://local.oes.internal/ns/oes/sa/collaboration-service',
      targetAudience: 'urn:oes:service:permission-service',
      permissionCodes: ['permission.internal.account_access_summary.resolve'],
      scopeLevel: 'SYSTEM',
      policyVersion: 'auth-login-owner-facts-v1'
    }
  )
  const runtimeAuth = await readProjectedRuntimeAuthPolicies(54150)
  const runtimeCollaboration = runtimeAuth.find((entry) =>
    entry.spiffeId.endsWith('/collaboration-service')
  )
  assert.equal(
    runtimeCollaboration?.humanObo?.selfAudience,
    'urn:oes:service:collaboration-service'
  )
  assert.deepEqual(runtimeCollaboration?.humanObo?.targetAudiences, [
    'urn:oes:service:identity-service',
    'urn:oes:service:permission-service'
  ])
  assert.ok(runtimeCollaboration?.humanObo?.actorMachinePrincipalId)
  assert.ok(runtimeCollaboration?.humanObo?.actorBindingId)
  assert.ok(runtimeCollaboration?.humanObo?.actorBindingVersion)
})

test('projects exact Gateway Web journey HUMAN_OBO targets without wildcard', async () => {
  const runtimeAuth = await readProjectedRuntimeAuthPolicies(54250)
  const gateway = runtimeAuth.find((entry) => entry.spiffeId.endsWith('/api-gateway'))
  assert.ok(gateway)
  assert.ok(gateway.audiences.includes('urn:oes:service:browser-activity-service'))
  assert.ok(gateway.audiences.includes('urn:oes:service:identity-service'))
  assert.ok(gateway.audiences.includes('urn:oes:service:hr-service'))
  assert.ok(gateway.audiences.includes('urn:oes:service:crm-service'))
  assert.ok(gateway.audiences.includes('urn:oes:service:collaboration-service'))
  assert.ok(gateway.audiences.includes('urn:oes:service:public-entry-service'))
  assert.ok(gateway.audiences.includes('urn:oes:service:site-service'))
  assert.ok(gateway.audiences.includes('urn:oes:service:tenant-org-service'))
  assert.deepEqual(gateway.humanObo?.targetAudiences, [
    'urn:oes:service:identity-service',
    'urn:oes:service:permission-service',
    'urn:oes:service:public-entry-service',
    'urn:oes:service:collaboration-service',
    'urn:oes:service:tenant-org-service'
  ])
  assert.equal(gateway.humanObo?.selfAudience, 'urn:oes:service:api-gateway')
  assert.ok(gateway.humanObo?.targetAudiences.every((audience) => !audience.includes('*')))
  assert.equal(
    gateway.humanObo?.targetAudiences.includes('urn:oes:service:browser-activity-service'),
    false
  )
  assert.equal(gateway.humanObo?.targetAudiences.includes('urn:oes:service:hr-service'), false)
  assert.equal(gateway.humanObo?.targetAudiences.includes('urn:oes:service:crm-service'), false)
  assert.equal(gateway.humanObo?.targetAudiences.includes('urn:oes:service:site-service'), false)
})

test('projects only the frozen Public Entry ingress and foundation target audiences', async () => {
  const runtimeAuth = await readProjectedRuntimeAuthPolicies(54350)
  const gateway = runtimeAuth.find((entry) => entry.spiffeId.endsWith('/api-gateway'))
  const publicEntry = runtimeAuth.find((entry) => entry.spiffeId.endsWith('/public-entry-service'))
  const expectedWorkloadAudiences = [
    'urn:oes:service:auth-service',
    'urn:oes:service:hr-service',
    'urn:oes:service:identity-service',
    'urn:oes:service:permission-service',
    'urn:oes:service:tenant-org-service'
  ]
  const expectedFoundationAudiences = [
    'urn:oes:service:hr-service',
    'urn:oes:service:identity-service',
    'urn:oes:service:permission-service',
    'urn:oes:service:tenant-org-service'
  ]

  assert.ok(gateway?.audiences.includes('urn:oes:service:public-entry-service'))
  assert.equal(gateway?.audiences.includes('urn:oes:service:*'), false)
  assert.equal(gateway?.audiences.includes('urn:oes:service:notification-service'), false)
  assert.deepEqual(publicEntry?.audiences, expectedWorkloadAudiences)
  assert.ok(publicEntry?.audiences.includes('urn:oes:service:auth-service'))
  assert.equal(publicEntry?.humanObo?.selfAudience, 'urn:oes:service:public-entry-service')
  assert.deepEqual(publicEntry?.humanObo?.targetAudiences, expectedFoundationAudiences)
  assert.equal(
    publicEntry?.humanObo?.targetAudiences.includes('urn:oes:service:auth-service'),
    false
  )
  assert.ok(publicEntry?.humanObo?.actorMachinePrincipalId)
  assert.ok(publicEntry?.humanObo?.actorBindingId)
  assert.ok(publicEntry?.humanObo?.actorBindingVersion)
  assert.ok(publicEntry?.audiences.every((audience) => !audience.includes('*')))
})

/** Reads the semantic projected Auth policy instead of coupling tests to source formatting. */
async function readProjectedRuntimeAuthPolicies(basePort) {
  const profile = await generateProfile({ basePort, requireInfrastructure: false })
  const environment = await readFile(profile.gateway.envPath, 'utf8')
  return JSON.parse(readProjectedEnvironmentValue(environment, 'AUTH_EXECUTION_WORKLOAD_POLICIES'))
}

/** Parses one shell-quoted generated environment value without depending on line formatting. */
function readProjectedEnvironmentValue(environment, name) {
  const prefix = `${name}=`
  const line = environment.split(/\r?\n/u).find((candidate) => candidate.startsWith(prefix))
  assert.ok(line, `${name} must be projected`)
  const value = line.slice(prefix.length)
  return value.startsWith("'") && value.endsWith("'")
    ? value.slice(1, -1).replaceAll("'\\''", "'")
    : value
}
