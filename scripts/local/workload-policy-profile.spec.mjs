import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  renderWorkloadPolicyEnvironment,
  validate,
  WORKLOAD_POLICY_VERSION
} from './workload-policy-profile.mjs'

const provenance = JSON.parse(
  readFileSync(new URL('./runtime-config/workload-policy-provenance.json', import.meta.url), 'utf8')
)

const GATEWAY_RUNTIME_ADDITIONS = Object.freeze([
  Object.freeze({
    audience: 'urn:oes:service:browser-activity-service',
    code: 'browser_activity.overview.read',
    source: 'docs/architecture/services/browser-activity-service.md#51-trusted-grpc-entry'
  }),
  Object.freeze({
    audience: 'urn:oes:service:crm-service',
    code: 'crm.account.read',
    source: 'docs/architecture/services/crm-service.md#18-trusted-grpc-inbound-boundary'
  }),
  Object.freeze({
    audience: 'urn:oes:service:hr-service',
    code: 'hr.employee.list',
    source: 'docs/architecture/services/hr-service.md#11-trusted-grpc-17-rpc-contractfrozen'
  }),
  Object.freeze({
    audience: 'urn:oes:service:site-service',
    code: 'site.management.read',
    source: 'docs/architecture/services/site-service.md#222-frozen-admin-rpc-authorization-map'
  })
])

test('composes the preserved Gateway tuple and exact Auth owner-fact additions', () => {
  const output = renderWorkloadPolicyEnvironment()
  assert.match(output, /api-gateway/)
  assert.match(output, /urn:oes:service:auth-service/)
  assert.match(output, /urn:oes:service:browser-activity-service/)
  assert.match(output, /urn:oes:service:crm-service/)
  assert.match(output, /urn:oes:service:hr-service/)
  assert.match(output, /urn:oes:service:item-master-service/)
  assert.match(output, /public-entry-service/)
  assert.match(output, /urn:oes:service:public-entry-service/)
  assert.match(output, /urn:oes:service:site-service/)
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

test('binds each added Gateway audience to exact selector-v2 provenance', () => {
  const exactGatewayAdditions = provenance.additions.filter(
    ({ workload }) => workload === 'api-gateway'
  )
  for (const addition of exactGatewayAdditions) assertExactStableSource(addition)
  const gatewayAdditions = exactGatewayAdditions.map(
    ({ audience, code, source, selectorEntry, selectorVersion }) => ({
      audience,
      code,
      source,
      selectorEntry,
      selectorVersion
    })
  )

  assert.deepEqual(
    gatewayAdditions,
    GATEWAY_RUNTIME_ADDITIONS.map((addition) => ({
      ...addition,
      selectorEntry: 'api-gateway',
      selectorVersion: '2'
    }))
  )
  assert.equal(JSON.stringify(gatewayAdditions).includes('*'), false)
})

/** Resolves one provenance fragment to an existing stable heading whose section contains its Code. */
function assertExactStableSource({ source, code }) {
  const [relativePath, fragment, extra] = source.split('#')
  assert.equal(extra, undefined)
  assert.ok(relativePath?.startsWith('docs/architecture/'))
  assert.ok(fragment)
  const document = readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8')
  const headings = [...document.matchAll(/^(#{1,6})\s+(.+)$/gmu)].map((match) => ({
    level: match[1].length,
    fragment: headingFragment(match[2]),
    offset: match.index,
    start: match.index + match[0].length
  }))
  const index = headings.findIndex((heading) => heading.fragment === fragment)
  assert.notEqual(index, -1, `stable source fragment is missing: ${source}`)
  const heading = headings[index]
  const next = headings.slice(index + 1).find((candidate) => candidate.level <= heading.level)
  const section = document.slice(heading.start, next?.offset ?? document.length)
  assert.match(section, new RegExp(escapeRegExp(code), 'u'))
}

/** Mirrors the repository's GitHub-compatible heading fragments for stable Markdown references. */
function headingFragment(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s_-]/gu, '')
    .replace(/\s+/gu, '-')
}

/** Escapes one exact Permission Code before matching it inside its referenced stable section. */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}

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
