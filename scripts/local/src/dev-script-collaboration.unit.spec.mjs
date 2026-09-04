import assert from 'node:assert/strict'
import test from 'node:test'
import {
  findOccupiedBackendListeners,
  selectBackendListenerTargets
} from '../backend-start-preflight.mjs'

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
