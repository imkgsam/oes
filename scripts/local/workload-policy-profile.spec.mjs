import assert from 'node:assert/strict'
import test from 'node:test'
import { renderWorkloadPolicyEnvironment, validate } from './workload-policy-profile.mjs'

test('composes the preserved Gateway tuple and exact Auth owner-fact additions', () => {
  const output = renderWorkloadPolicyEnvironment()
  assert.match(output, /api-gateway/)
  assert.match(output, /identity\.internal\.auth_login_account\.resolve/)
  assert.match(output, /hr\.internal\.auth_login_employee\.resolve/)
  assert.match(output, /tenant_org\.internal\.auth_session_tenant_lifecycle\.resolve/)
  assert.doesNotMatch(output, /password|secret|token=/i)
})

test('rejects wildcard, duplicate, tenant and unregistered authority', () => {
  const auth = [{ spiffeId: 'spiffe://local/sa/auth', audiences: ['urn:oes:service:identity-service'] }]
  const permission = [{ originalWorkloadSpiffeId: 'spiffe://local/sa/auth', targetAudience: 'urn:oes:service:identity-service', permissionCodes: ['identity.internal.read'], scopeLevel: 'SYSTEM', policyVersion: 'v1' }]
  assert.doesNotThrow(() => validate(auth, permission))
  assert.throws(() => validate([{ ...auth[0], spiffeId: 'spiffe://*/auth' }], permission), /AUTH_SHAPE_INVALID/)
  assert.throws(() => validate(auth, [...permission, permission[0]]), /PERMISSION_DUPLICATE/)
  assert.throws(() => validate(auth, [{ ...permission[0], tenantIds: ['tenant-1'] }]), /AUTHORITY_INVALID/)
  assert.throws(() => validate(auth, [{ ...permission[0], targetAudience: 'urn:oes:service:hr-service' }]), /NOT_REGISTERED/)
})
