import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** Executes the live repository inventory and returns its structured fail-closed result. */
async function inventory() {
  const { stdout } = await execFileAsync(
    process.execPath,
    ['scripts/architecture/trusted-grpc-runtime-inventory.mjs'],
    { cwd: repositoryRoot, encoding: 'utf8', maxBuffer: 1024 * 1024 }
  )
  return JSON.parse(stdout)
}

test('Gateway plus 21 service workloads have complete unique mTLS listener and client wiring', async () => {
  const result = await inventory()
  assert.equal(result.gatewayCount, 1)
  assert.equal(result.serviceCount, 21)
  assert.equal(result.listeners.filter((listener) => listener.workloadRegistered).length, 21)
  assert.equal(result.listeners.filter((listener) => listener.mtls).length, 21)
  assert.deepEqual(result.missingWorkloads, [])
  assert.deepEqual(result.staleWorkloads, [])
  assert.deepEqual(result.duplicateWorkloads, [])
  assert.deepEqual(result.missingPorts, [])
  assert.deepEqual(result.duplicatePorts, [])
  assert.deepEqual(result.registryMismatches, [])
  assert.deepEqual(result.plaintextListeners, [])
  assert.deepEqual(result.plaintextClientSources, [])
  assert.deepEqual(result.gatewayTargetMismatches, [])
})

test('CRM and SRM retain their exact distinct listener and Gateway target ports', async () => {
  const result = await inventory()
  const ports = Object.fromEntries(
    result.listeners.map((listener) => [listener.serviceName, listener.port])
  )
  assert.equal(ports['crm-service'], '50060')
  assert.equal(ports['srm-service'], '50061')
})
