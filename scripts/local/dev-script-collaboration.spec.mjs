import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  findOccupiedBackendListeners,
  selectBackendListenerTargets
} from './backend-start-preflight.mjs'

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
const scripts = packageJson.scripts

function backendNames(script) {
  return script.match(/concurrently -k -n ([^ ]+)/)?.[1].split(',') ?? []
}

test('backend database synchronization uses the repository migration lifecycle', () => {
  assert.equal(scripts['backend:system:db:sync'], 'pnpm db:migrate')
  assert.equal(scripts['backend:business:db:sync'], 'pnpm db:migrate')
})

test('backend commands fail fast through the exact scope preflight before build or migration work', () => {
  assert.equal(scripts['backend:preflight'], 'node scripts/local/backend-start-preflight.mjs')
  assert.match(scripts['backend:system'], /^pnpm backend:preflight system && pnpm common:build/u)
  assert.match(
    scripts['backend:business'],
    /^pnpm backend:preflight business && pnpm common:build/u
  )
  assert.match(scripts.backend, /^pnpm backend:preflight full && pnpm common:build/u)
})

test('backend preflight selects scope listeners and reports occupied ports once', async () => {
  const inventory = [
    { workload: 'auth-service', source: 'src/services/system/auth-service/src/main.ts' },
    { workload: 'sales-service', source: 'src/services/business/sales-service/src/main.ts' }
  ]
  assert.deepEqual(selectBackendListenerTargets(inventory, 'system'), [
    { workload: 'auth-service', port: 52050 },
    { workload: 'api-gateway', port: 52101 }
  ])
  assert.deepEqual(selectBackendListenerTargets(inventory, 'business'), [
    { workload: 'sales-service', port: 52051 }
  ])
  const full = selectBackendListenerTargets(inventory, 'full')
  assert.deepEqual(
    await findOccupiedBackendListeners(full, async (port) => [52051, 52101].includes(port)),
    [
      { workload: 'sales-service', port: 52051 },
      { workload: 'api-gateway', port: 52101 }
    ]
  )
})

test('backend prepares and injects the trusted runtime before watched services start', () => {
  assert.equal(
    scripts['local:trusted-runtime:prepare'],
    'node scripts/local/trusted-runtime.mjs prepare'
  )
  assert.equal(scripts['backend:dev-service'], 'node scripts/local/trusted-runtime-dev-service.mjs')
  for (const script of ['backend:system', 'backend:business', 'backend']) {
    assert.match(
      scripts[script],
      /pnpm local:trusted-runtime:prepare && OES_TRUSTED_RUNTIME_DEV_SCOPE=(?:system|business|full) concurrently/u
    )
  }
  assert.equal(scripts.pms, 'pnpm backend:dev-service permission-service')
  assert.equal(scripts.ats, 'pnpm backend:dev-service auth-service')
  assert.equal(scripts.ass, 'pnpm backend:dev-service asset-service')
  assert.equal(scripts.bff, 'pnpm backend:dev-service api-gateway')
})

test('system backend logs use complete service-name prefixes', () => {
  assert.deepEqual(backendNames(scripts['backend:system']), [
    'permission-service',
    'identity-service',
    'hr-service',
    'auth-service',
    'collaboration-service',
    'asset-service',
    'item-master-service',
    'notification-service',
    'public-entry-service',
    'party-service',
    'site-service',
    'tenant-org-service',
    'terminal-device-service',
    'browser-activity-service',
    'api-gateway'
  ])
  assert.match(scripts['backend:system'], /--prefix "\[\{name\}\]"/)
})

test('full backend logs use complete service-name prefixes', () => {
  const names = backendNames(scripts.backend)
  assert.equal(names.length, 22)
  for (const service of [
    'permission-service',
    'collaboration-service',
    'site-service',
    'browser-activity-service',
    'sales-service',
    'mes-service',
    'api-gateway'
  ]) {
    assert.ok(names.includes(service), `missing prefix for ${service}`)
  }
  assert.match(scripts.backend, /--prefix "\[\{name\}\]"/)
})
