import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
import {
  inheritsTrustedServiceDefaults,
  isSharedGrpcClientCredentialsCall
} from '../trusted-grpc-runtime-inventory.mjs'

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
