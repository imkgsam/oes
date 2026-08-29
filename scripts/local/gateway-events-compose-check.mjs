import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseEnvironmentFile } from './worktree-env.mjs'

const WORKLOADS = [
  'api-gateway',
  'auth-service',
  'permission-service',
  'identity-service',
  'party-service',
  'tenant-org-service',
  'hr-service',
  'asset-service',
  'terminal-device-service',
  'item-master-service',
  'sales-service',
  'crm-service',
  'srm-service',
  'procurement-service',
  'finance-service',
  'wms-service',
  'mes-service',
  'notification-service',
  'public-entry-service',
  'collaboration-service',
  'site-service',
  'browser-activity-service'
]

/** Validates the secret-expanded Compose graph in memory and emits only non-sensitive invariant counts. */
function main() {
  const root = resolve(import.meta.dirname, '../..')
  const rootEnvironment = parseEnvironmentFile(readFileSync(`${root}/.env`, 'utf8'))
  const taskKey = rootEnvironment.get('OES_TASK_KEY')
  const environmentPath = `${root}/.tmp/oes-database-lifecycle/${taskKey}/compose.env`
  const projectName = `oes_${taskKey}`
  const result = spawnSync(
    'docker',
    [
      'compose',
      '--env-file',
      environmentPath,
      '--project-name',
      projectName,
      '-f',
      'docker-compose.yml',
      'config',
      '--format',
      'json'
    ],
    { cwd: root, encoding: 'utf8' }
  )
  if (result.status !== 0) throw new Error('GATEWAY_EVENTS_COMPOSE_CONFIG_FAILED')
  const compose = JSON.parse(result.stdout)
  for (const workload of WORKLOADS) assertWorkload(compose.services[workload], workload)

  const gateway = compose.services['api-gateway']
  const targets = gateway.environment.GATEWAY_READINESS_TARGETS.split(',').map((value) =>
    value.trim()
  )
  assert.equal(targets.length, 20)
  assert.ok(targets.includes('srm-service=grpcs://srm-service:50061'))
  assert.deepEqual(gateway.healthcheck.test.slice(0, 2), ['CMD', 'node'])

  const apisix = compose.services.apisix
  assert.equal(
    apisix.image,
    'apache/apisix:3.13.0-debian@sha256:c5c7a55ebb5c07abc210dbb963a37f41030e12c91d23bacedbaa168fec633bd7'
  )
  assert.equal(apisix.depends_on['api-gateway'].condition, 'service_healthy')
  assert.equal(apisix.ports[0].host_ip, '127.0.0.1')
  assert.deepEqual(apisix.volumes.map((volume) => volume.target).sort(), [
    '/usr/local/apisix/conf/apisix.yaml',
    '/usr/local/apisix/conf/config.yaml'
  ])

  for (const eventService of ['collaboration-service', 'notification-service']) {
    const service = compose.services[eventService]
    assert.equal(service.environment.NATS_URL, 'nats://nats:4222')
    assert.equal(service.depends_on['nats-bootstrap'].condition, 'service_completed_successfully')
  }
  assert.equal(compose.services['srm-service'].environment.GRPC_LISTEN_PORT, '50061')

  const apisixRoutes = readFileSync(`${root}/docker/apisix/apisix.yaml`, 'utf8')
  assert.match(apisixRoutes, /uri: \/api\/\*/)
  assert.match(apisixRoutes, /uris: \[\/health, \/health\/ready\]/)
  assert.match(apisixRoutes, /http_path: \/health\/ready/)
  assert.match(apisixRoutes, /request-id:/)

  console.log(
    JSON.stringify({
      composeConfig: 'PASS',
      workloadTrustBindings: WORKLOADS.length,
      gatewayReadinessTargets: targets.length,
      apisixRoutes: 2,
      eventServicesWaitingForTopology: 2,
      srmPort: 50061
    })
  )
}

/** Requires one workload to resolve its exact leaf inside the main-verified read-only trust root. */
function assertWorkload(service, workload) {
  assert.ok(service, `COMPOSE_WORKLOAD_MISSING:${workload}`)
  assert.equal(service.environment.OES_GRPC_TLS_ENABLED, 'true')
  assert.equal(service.environment.OES_GRPC_TLS_MIN_VERSION, 'TLSv1.2')
  const trustRoot = '/var/run/oes-grpc-trust'
  assert.equal(service.environment.OES_GRPC_TLS_CA_PATH, `${trustRoot}/ca.pem`)
  assert.equal(
    service.environment.OES_GRPC_TLS_CERT_PATH,
    `${trustRoot}/${workload}/current/cert.pem`
  )
  assert.equal(
    service.environment.OES_GRPC_TLS_KEY_PATH,
    `${trustRoot}/${workload}/current/key.pem`
  )
  assert.equal(
    service.environment.OES_WORKLOAD_SPIFFE_ID,
    `spiffe://local.oes.internal/ns/oes/sa/${workload}`
  )
  const trustVolume = service.volumes.find((volume) => volume.target === trustRoot)
  assert.equal(trustVolume.type, 'volume')
  assert.equal(trustVolume.read_only, true)
  assert.equal(trustVolume.source, 'grpc_trust_runtime')
  assert.equal(
    service.depends_on['grpc-trust-bootstrap'].condition,
    'service_completed_successfully'
  )
}

main()
