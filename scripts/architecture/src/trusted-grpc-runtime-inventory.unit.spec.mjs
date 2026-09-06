import assert from 'node:assert/strict'
import test from 'node:test'
import { isSharedGrpcClientCredentialsCall, plaintextGrpcClientLines } from '../trusted-grpc-runtime-inventory.mjs'

test('mTLS client classifier accepts exact factory calls with security inputs only', () => {
  assert.equal(isSharedGrpcClientCredentialsCall('createGrpcClientCredentials()'), true)
  assert.equal(isSharedGrpcClientCredentialsCall('createGrpcClientCredentials(process.env, resolvePeerSpiffeId())'), true)
  assert.equal(isSharedGrpcClientCredentialsCall('createInsecureCredentials()'), false)
  assert.equal(isSharedGrpcClientCredentialsCall('credentials'), false)
})

test('source classifier identifies the exact plaintext declaration line', () => {
  const source = `const secure = {\n  transport: Transport.GRPC,\n  options: { credentials: createGrpcClientCredentials() }\n}\nconst insecure = {\n  transport: Transport.GRPC,\n  options: { credentials: credentials }\n}`
  assert.deepEqual(plaintextGrpcClientLines(source), [6])
})
