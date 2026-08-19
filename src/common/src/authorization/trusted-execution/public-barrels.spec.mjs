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
  assert.equal(typeof authorization.parseTenantTargetSelector, 'function')
  assert.equal(typeof authorization.admitTenantTargetSelector, 'function')
  assert.equal(typeof authorization.DeclareTenantTargetRpc, 'function')
  assert.equal(typeof authorization.DeclareSystemTenantTargetRpc, 'function')
  assert.equal(typeof authorization.TenantTargetAdmissionGuard, 'function')
  assert.equal(typeof authorization.requireAdmittedTenantTarget, 'function')
  assert.equal(authorization.bindTrustedExecutionAdmissionEvidence, undefined)
  assert.equal(authorization.getTrustedExecutionAdmissionEvidence, undefined)
  assert.equal(authorization.getVerifiedExecutionEvidence, undefined)
  assert.equal(typeof authorization.PARTY_CALLER_ERRORS, 'object')
  assert.equal(authorization.PARTY_CALLER_ERRORS.FOUNDATION_UNAVAILABLE, 'PARTY_CALLER_FOUNDATION_UNAVAILABLE')
  await assert.rejects(
    new authorization.InternalTrustedGrpcCaller({}, {}, {}).forInternalCall('party.internal.get_tenant_party_by_id', async () => undefined),
    /PARTY_CALLER_EXECUTION_CONTEXT_REQUIRED/
  )
  const root = authorization.createTrustedExecutionContext({
    subject: 'machine', principalType: 'MACHINE', requestId: 'request',
    traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01'
  })
  for (const [message, expected] of [
    ['configuration unavailable', authorization.PARTY_CALLER_ERRORS.FOUNDATION_UNAVAILABLE],
    ['source credential rejected: source-secret', authorization.PARTY_CALLER_ERRORS.SOURCE_CREDENTIAL_INVALID],
    ['ExecutionToken exchange returned an invalid bearer credential: raw-token', authorization.PARTY_CALLER_ERRORS.SOURCE_CREDENTIAL_INVALID],
    ['ExecutionToken exchange granted an unexpected audience', authorization.PARTY_CALLER_ERRORS.SOURCE_CREDENTIAL_INVALID],
    ['ExecutionToken exchange granted an unexpected Permission Code set', authorization.PARTY_CALLER_ERRORS.SOURCE_CREDENTIAL_INVALID],
    ['certificate cnf binding failed', authorization.PARTY_CALLER_ERRORS.SOURCE_CREDENTIAL_INVALID]
  ]) {
    const context = new authorization.AsyncLocalTrustedExecutionContextAccessor()
    const downstream = { calls: 0 }
    const caller = new authorization.InternalTrustedGrpcCaller(
      context,
      { forInternalCall: async () => { throw new Error(message) } },
      { run: async (callback) => callback() }
    )
    await assert.rejects(context.run(root, () => caller.forInternalCall('party.internal.get_tenant_party_by_id', async () => { downstream.calls += 1 })), new RegExp(expected))
    assert.equal(downstream.calls, 0)
  }
  const successContext = new authorization.AsyncLocalTrustedExecutionContextAccessor()
  let calls = 0
  const success = new authorization.InternalTrustedGrpcCaller(successContext, { forInternalCall: async () => new (require('@grpc/grpc-js').Metadata)() }, { run: async (callback) => callback() })
  await successContext.run(root, () => success.forInternalCall('party.internal.get_tenant_party_by_id', async () => { calls += 1 }))
  assert.equal(calls, 1)
  assert.equal(typeof transport.buildGrpcAuthorizationModeInventory, 'function')
  assert.equal(transport.ExecutionTokenExchangeSourceCredentialCarrier, undefined)
  assert.equal(typeof transport.GrpcWorkloadIdentityProvider, 'function')
}

await verifyPublicBarrels()
