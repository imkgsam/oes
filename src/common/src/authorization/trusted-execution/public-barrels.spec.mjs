import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const authorization = require('@oes/common/authorization')
const transport = require('@oes/common/transport')

/** Verifies declaration and inventory APIs remain reachable through the established Common package barrels. */
async function verifyPublicBarrels() {
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
  assert.equal(typeof authorization.InternalTrustedGrpcCaller, 'function')
  assert.equal(typeof authorization.PARTY_CALLER_ERRORS, 'object')
  assert.equal(authorization.PARTY_CALLER_ERRORS.FOUNDATION_UNAVAILABLE, 'PARTY_CALLER_FOUNDATION_UNAVAILABLE')
  await assert.rejects(
    new authorization.InternalTrustedGrpcCaller({}, {}, {}).forInternalCall('party.internal.get_tenant_party_by_id', async () => undefined),
    /PARTY_CALLER_EXECUTION_CONTEXT_REQUIRED/
  )
  assert.equal(typeof transport.buildGrpcAuthorizationModeInventory, 'function')
  assert.equal(transport.ExecutionTokenExchangeSourceCredentialCarrier, undefined)
  assert.equal(typeof transport.GrpcWorkloadIdentityProvider, 'function')
}

await verifyPublicBarrels()
