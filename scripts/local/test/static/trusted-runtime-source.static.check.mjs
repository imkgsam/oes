import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('local trust leaves use workload-scoped DNS names rather than IP identity', async () => {
  const source = await readFile('docker/grpc-trust/bootstrap-local-trust.sh', 'utf8')
  assert.match(source, /DNS:\$\{workload\},DNS:\$\{workload\}\.localhost/)
  assert.doesNotMatch(source, /IP:/)
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
