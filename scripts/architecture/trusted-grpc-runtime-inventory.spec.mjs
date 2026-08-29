import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import ts from 'typescript'
import {
  inheritsTrustedServiceDefaults,
  isSharedGrpcClientCredentialsCall
} from './trusted-grpc-runtime-inventory.mjs'

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

/** Parses one initializer for the semantic credential-factory classifier. */
function initializer(source) {
  const file = ts.createSourceFile('fixture.ts', `const value = ${source}`, ts.ScriptTarget.Latest)
  const declaration = file.statements[0].declarationList.declarations[0]
  return declaration.initializer
}

test('mTLS client classifier accepts exact factory calls with security inputs only', () => {
  assert.equal(
    isSharedGrpcClientCredentialsCall(initializer('createGrpcClientCredentials()')),
    true
  )
  assert.equal(
    isSharedGrpcClientCredentialsCall(
      initializer('createGrpcClientCredentials(process.env, resolvePeerSpiffeId())')
    ),
    true
  )
  assert.equal(isSharedGrpcClientCredentialsCall(initializer('createInsecureCredentials()')), false)
  assert.equal(isSharedGrpcClientCredentialsCall(initializer('credentials')), false)
})

test('Compose default classifier admits only direct or exact event-default inheritance', () => {
  assert.equal(inheritsTrustedServiceDefaults('<<: *service-defaults', ''), true)
  assert.equal(
    inheritsTrustedServiceDefaults('<<: *event-service-defaults', '<<: *service-defaults'),
    true
  )
  assert.equal(inheritsTrustedServiceDefaults('<<: *event-service-defaults', ''), false)
  assert.equal(
    inheritsTrustedServiceDefaults('<<: *untrusted-defaults', '<<: *service-defaults'),
    false
  )
})

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

test('Compose realizes fail-closed trust for Gateway plus 21 runtime workloads', async () => {
  const result = await inventory()
  assert.equal(result.composeRuntimeCount, 22)
  assert.deepEqual(result.defaultTrustMismatches, [])
  assert.deepEqual(result.composeTrustMismatches, [])
  assert.deepEqual(result.composePortMismatches, [])
  assert.deepEqual(result.composeGatewayTargetMismatches, [])
})

test('CRM and SRM retain their exact distinct listener and Gateway target ports', async () => {
  const result = await inventory()
  const ports = Object.fromEntries(
    result.listeners.map((listener) => [listener.serviceName, listener.port])
  )
  assert.equal(ports['crm-service'], '50060')
  assert.equal(ports['srm-service'], '50061')
})
