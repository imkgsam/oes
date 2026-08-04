import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const authorization = require('@oes/common/authorization')
const transport = require('@oes/common/transport')

/** Verifies declaration and inventory APIs remain reachable through the established Common package barrels. */
function verifyPublicBarrels() {
  assert.equal(typeof authorization.AuthorizeBusinessRpc, 'function')
  assert.equal(typeof authorization.AuthorizeSelfServiceRpc, 'function')
  assert.equal(typeof authorization.AuthorizeInternalCall, 'function')
  assert.equal(typeof authorization.CertificateBoundExecutionTokenCache, 'function')
  assert.equal(typeof authorization.ExecutionTokenJwksCache, 'function')
  assert.equal(typeof authorization.ExecutionTokenVerifier, 'function')
  assert.equal(typeof authorization.AsyncLocalTrustedExecutionContextAccessor, 'function')
  assert.equal(typeof authorization.AsyncLocalTransportPrivateSourceCredentialAccessor, 'function')
  assert.equal(typeof authorization.createTrustedExecutionContext, 'function')
  assert.equal(typeof authorization.TransportPrivateSourceCredentialIssuer, 'function')
  assert.equal(typeof authorization.TrustedExecutionRegistry, 'function')
  assert.equal(typeof authorization.TrustedGrpcMetadataProvider, 'function')
  assert.equal(typeof transport.buildGrpcAuthorizationModeInventory, 'function')
  assert.equal(typeof transport.ExecutionTokenExchangeSourceCredentialCarrier, 'function')
  assert.equal(typeof transport.GrpcWorkloadIdentityProvider, 'function')
}

verifyPublicBarrels()
