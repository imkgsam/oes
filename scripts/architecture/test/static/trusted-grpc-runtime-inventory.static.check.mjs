import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
const execFileAsync = promisify(execFile)
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')

test('Gateway plus 21 host services use declared dynamic launcher mTLS wiring', async () => {
  const { stdout } = await execFileAsync(process.execPath, ['scripts/architecture/trusted-grpc-runtime-inventory.mjs'], { cwd: repositoryRoot, encoding: 'utf8', maxBuffer: 1024 * 1024 })
  const result = JSON.parse(stdout)
  assert.equal(result.gatewayCount, 1)
  assert.equal(result.serviceCount, 21)
  assert.equal(result.listeners.filter((listener) => listener.workloadRegistered).length, 21)
  assert.equal(result.listeners.filter((listener) => listener.mtls).length, 21)
  assert.deepEqual(result.missingRuntimeOwners, [])
  assert.deepEqual(result.missingTrustCapability, [])
  assert.deepEqual(result.plaintextClientSources, [])
  assert.equal(result.dynamicProcessPorts, true)
  assert.equal(result.explicitMinimalEnvironment, true)
})
