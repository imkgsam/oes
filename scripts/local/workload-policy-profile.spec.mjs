import assert from 'node:assert/strict'
import test from 'node:test'
import {
  renderWorkloadPolicyEnvironment,
  validate,
  WORKLOAD_POLICY_VERSION
} from './workload-policy-profile.mjs'

test('composes the preserved Gateway tuple and exact Auth owner-fact additions', () => {
  const output = renderWorkloadPolicyEnvironment()
  assert.match(output, /api-gateway/)
  assert.match(output, /urn:oes:service:auth-service/)
  assert.match(output, /urn:oes:service:item-master-service/)
  assert.match(output, /public-entry-service/)
  assert.match(output, /urn:oes:service:public-entry-service/)
  assert.match(output, /auth-service[^\n]+urn:oes:service:auth-service/)
  assert.match(output, /identity\.internal\.auth_login_account\.resolve/)
  assert.match(output, /hr\.internal\.auth_login_employee\.resolve/)
  assert.match(output, /tenant_org\.internal\.auth_session_tenant_lifecycle\.resolve/)
  assert.match(output, /terminal-device\.internal\.gateway\.enrollment\.activate/)
  assert.match(output, /terminal-device\.internal\.gateway\.access\.resolve/)
  assert.match(output, /terminal-device\.internal\.gateway\.heartbeat\.record/)
  assert.match(output, /terminal-device\.internal\.gateway\.diagnostic_log\.record/)
  assert.match(output, /permission\.internal\.account_access_summary\.resolve/)
  assert.match(output, /permission\.internal\.account_navigation\.resolve/)
  assert.doesNotMatch(output, /password|secret|token=/i)
})

test('rejects wildcard, duplicate, tenant and unregistered authority', () => {
  const auth = [
    { spiffeId: 'spiffe://local/sa/auth', audiences: ['urn:oes:service:identity-service'] }
  ]
  const permission = [
    {
      originalWorkloadSpiffeId: 'spiffe://local/sa/auth',
      targetAudience: 'urn:oes:service:identity-service',
      permissionCodes: ['identity.internal.read'],
      scopeLevel: 'SYSTEM',
      policyVersion: WORKLOAD_POLICY_VERSION
    }
  ]
  assert.doesNotThrow(() => validate(auth, permission))
  assert.throws(
    () => validate([{ ...auth[0], spiffeId: 'spiffe://*/auth' }], permission),
    /AUTH_SHAPE_INVALID/
  )
  assert.throws(() => validate(auth, [...permission, permission[0]]), /PERMISSION_DUPLICATE/)
  assert.throws(
    () => validate(auth, [{ ...permission[0], tenantIds: ['tenant-1'] }]),
    /AUTHORITY_INVALID/
  )
  assert.throws(
    () => validate(auth, [{ ...permission[0], targetAudience: 'urn:oes:service:hr-service' }]),
    /NOT_REGISTERED/
  )
})

test('admits registered tuple growth while rejecting policy authority weakening', () => {
  const identityAudience = 'urn:oes:service:identity-service'
  const permissionAudience = 'urn:oes:service:permission-service'
  const auth = [
    {
      spiffeId: 'spiffe://local/sa/auth',
      audiences: [identityAudience, permissionAudience]
    }
  ]
  const permission = [
    {
      originalWorkloadSpiffeId: auth[0].spiffeId,
      targetAudience: identityAudience,
      permissionCodes: ['identity.internal.read'],
      scopeLevel: 'SYSTEM',
      policyVersion: WORKLOAD_POLICY_VERSION
    }
  ]
  const registeredGrowth = {
    ...permission[0],
    targetAudience: permissionAudience,
    permissionCodes: ['permission.internal.account_access_summary.resolve']
  }
  assert.doesNotThrow(() => validate(auth, [...permission, registeredGrowth]))
  for (const weakened of [
    { ...registeredGrowth, targetAudience: 'urn:oes:service:*' },
    { ...registeredGrowth, scopeLevel: 'TENANT' },
    { ...registeredGrowth, permissionCodes: ['permission.read'] },
    {
      ...registeredGrowth,
      permissionCodes: ['permission.internal.read', 'permission.internal.read']
    },
    { ...registeredGrowth, policyVersion: 'stale-v0' }
  ])
    assert.throws(() => validate(auth, [...permission, weakened]), /WORKLOAD_POLICY_/)
})
