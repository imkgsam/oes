import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  ASSIGNED_TEST_SURFACES,
  assertJestResult,
  assertNoTestResidue,
  discoverSpecs,
  partitionUnitShards,
  selectUnitShard
} from './test-matrix.mjs'

test('matrix binds all eight assigned non-empty test surfaces', () => {
  assert.deepEqual(
    ASSIGNED_TEST_SURFACES.map((surface) => surface.name),
    [
      '@oes/common',
      'api-gateway',
      'auth-service',
      'public-entry-service',
      'crm-service',
      'item-master-service',
      'permission-service',
      'browser-activity-service'
    ]
  )
})

test('discovery returns only exact spec files below declared roots', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-test-matrix-'))
  try {
    fs.mkdirSync(path.join(root, 'package', 'test', 'l1'), { recursive: true })
    fs.mkdirSync(path.join(root, 'package', 'test', 'l2'), { recursive: true })
    fs.writeFileSync(path.join(root, 'package', 'test', 'l1', 'included.spec.ts'), '')
    fs.writeFileSync(path.join(root, 'package', 'test', 'l2', 'excluded.spec.ts'), '')
    assert.deepEqual(discoverSpecs(root, { directory: 'package', roots: ['test/l1'] }), [
      'test/l1/included.spec.ts'
    ])
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('Jest result gate rejects empty, skipped, todo, failed, and missing suites', () => {
  const passing = {
    success: true,
    numFailedTests: 0,
    numFailedTestSuites: 0,
    numPendingTests: 0,
    numTodoTests: 0,
    numTotalTests: 2,
    numTotalTestSuites: 1
  }
  assert.doesNotThrow(() => assertJestResult('package', passing, 1))
  for (const patch of [
    { numTotalTests: 0 },
    { numPendingTests: 1 },
    { numTodoTests: 1 },
    { numFailedTests: 1 },
    { numTotalTestSuites: 0 }
  ]) {
    assert.throws(() => assertJestResult('package', { ...passing, ...patch }, 1))
  }
})

test('unit driver rejects a certificate serial leaked into the repository root', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-test-residue-'))
  try {
    assert.doesNotThrow(() => assertNoTestResidue(root))
    fs.writeFileSync(path.join(root, '.srl'), '01\n')
    assert.throws(
      () => assertNoTestResidue(root),
      /TEST_MATRIX_RESIDUE path=\.srl expected=task-local-certificate-serial/
    )
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('unit sharding assigns every surface exactly once with deterministic weights', () => {
  const inventory = [
    { name: 'alpha', specs: ['1', '2', '3'], typecheck: true },
    { name: 'beta', specs: ['1', '2'] },
    { name: 'gamma', specs: ['1'] }
  ]
  const shards = [selectUnitShard(inventory, 0, 2), selectUnitShard(inventory, 1, 2)]
  assert.deepEqual(
    shards
      .flatMap((shard) => shard.items)
      .map((item) => item.name)
      .sort(),
    ['alpha', 'beta', 'gamma']
  )
  assert.deepEqual(selectUnitShard(inventory, 0, 2), shards[0])
  assert.deepEqual(partitionUnitShards(inventory, 2), shards)
})
