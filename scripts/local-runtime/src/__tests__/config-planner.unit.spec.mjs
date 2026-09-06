import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { loadRuntimeConfig, parseMachineConfig } from '../config.mjs'
import { planRuntime } from '../planner.mjs'

const root = path.resolve(import.meta.dirname, '../../../..')

test('machine config accepts only tunables and never endpoint or identity bindings', () => {
  assert.deepEqual(parseMachineConfig('OES_RUNTIME_CONCURRENCY=2\nOES_RUNTIME_LOG_LEVEL=debug\n', 'fixture'), { OES_RUNTIME_CONCURRENCY: '2', OES_RUNTIME_LOG_LEVEL: 'debug' })
  assert.throws(() => parseMachineConfig('DATABASE_URL=postgres://foreign\n', 'fixture'), /MACHINE_CONFIG_KEY_FORBIDDEN/)
  assert.throws(() => parseMachineConfig('OES_TASK_KEY=foreign\n', 'fixture'), /MACHINE_CONFIG_KEY_FORBIDDEN/)
})

test('config precedence is explicit and defaults real infrastructure concurrency to two', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-runtime-config-'))
  const machine = path.join(directory, 'local.env')
  fs.writeFileSync(machine, 'OES_RUNTIME_CONCURRENCY=3\n')
  const config = loadRuntimeConfig({ root, profile: 'LOCAL_INTEGRATION', machineConfigPath: machine, stateRoot: path.join(directory, 'state') })
  assert.equal(config.concurrency, 3)
  assert.deepEqual(config.sourceOrder, ['repository-defaults', 'machine-config', 'LOCAL_INTEGRATION', 'explicit-arguments', 'dynamic-allocation'])
  assert.equal(loadRuntimeConfig({ root, profile: 'CI', machineConfigPath: path.join(directory, 'absent'), stateRoot: path.join(directory, 'ci') }).concurrency, 2)
})

test('planner fails closed for unknown owners and undeclared journeys', () => {
  assert.throws(() => planRuntime({ root, profile: 'LOCAL_INTEGRATION', testClass: 'integration', owners: ['unknown'], capabilities: [] }), /RUNTIME_OWNER_UNKNOWN/)
  assert.throws(() => planRuntime({ root, profile: 'LOCAL_INTEGRATION', testClass: 'journey', owners: ['permission-service'], capabilities: [] }), /RUNTIME_JOURNEY_UNDECLARED/)
})

test('profiles select minimal local providers and job-private CI providers', () => {
  const local = planRuntime({ root, profile: 'LOCAL_INTEGRATION', testClass: 'integration', owners: ['collaboration-service'], capabilities: ['events', 'network-trust'] })
  assert.deepEqual(local.providers, ['mtls', 'nats', 'postgres'])
  assert.equal(local.jobPrivate, false)
  const ci = planRuntime({ root, profile: 'CI', testClass: 'integration', owners: ['asset-service'], capabilities: ['object-store'] })
  assert.deepEqual(ci.providers, ['minio', 'postgres'])
  assert.equal(ci.jobPrivate, true)
  const unit = planRuntime({ root, profile: 'LOCAL_INTEGRATION', testClass: 'unit', owners: [], capabilities: [] })
  assert.deepEqual(unit.providers, [])
})

test('explicit provider selection never grants an undeclared service credential', () => {
  assert.throws(() => planRuntime({ root, profile: 'LOCAL_INTEGRATION', testClass: 'integration', owners: ['auth-service'], capabilities: ['events'] }), /RUNTIME_PROVIDER_OWNER_UNDECLARED/u)
  const plan = planRuntime({ root, profile: 'LOCAL_INTEGRATION', testClass: 'integration', owners: ['asset-service', 'auth-service'], capabilities: ['cache', 'events', 'object-store', 'network-trust'] })
  assert.deepEqual(plan.providerOwners.minio, ['asset-service'])
  assert.deepEqual(plan.providerOwners.nats, ['asset-service'])
  assert.deepEqual(plan.providerOwners.redis, ['auth-service'])
})

test('DEV profile selects one complete provider recipe without a second runtime mode', () => {
  const plan = planRuntime({ root, profile: 'DEV', testClass: 'integration', owners: ['permission-service'], capabilities: [] })
  assert.deepEqual(plan.providers, ['minio', 'mtls', 'nacos', 'nats', 'otel-full', 'postgres', 'redis'])
})
