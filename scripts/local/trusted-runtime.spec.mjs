import assert from 'node:assert/strict'
import test from 'node:test'
import { generateProfile, readInventory } from './trusted-runtime.mjs'
import { readFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'

test('inventory has exactly 21 unique listeners and canonical Collaboration port', async () => {
  const entries = await readInventory()
  assert.equal(entries.length, 21)
  assert.equal(entries.find((entry) => entry.workload === 'collaboration-service')?.canonicalPort, 50068)
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
  const auth = profile.services.find((service) => service.workload === 'auth-service')
  const authEnvironment = await readFile(auth.envPath, 'utf8')
  assert.match(authEnvironment, /AUTH_EXECUTION_WORKLOAD_POLICIES=.*urn:oes:service:auth-service/u)
})

test('inventory rejects duplicate workload, listener port, or source', async () => {
  await assert.rejects(() => readInventory('a|50050|a.ts\na|50051|b.ts\n'), /DUPLICATE_WORKLOAD/)
  await assert.rejects(() => readInventory('a|50050|a.ts\nb|50050|b.ts\n'), /DUPLICATE_CANONICALPORT/)
  await assert.rejects(() => readInventory('a|50050|a.ts\nb|50051|a.ts\n'), /DUPLICATE_SOURCE/)
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
  assert.equal(secondEnvironment.match(/^NOTIFICATION_DELIVERY_PAYLOAD_KEY='([^']+)'$/mu)?.[1], firstKey)
  const secret = await stat(join(dirname(dirname(notification.envPath)), 'secrets/notification-delivery-payload.key'))
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
