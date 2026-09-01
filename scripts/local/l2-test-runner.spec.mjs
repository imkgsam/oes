import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  buildL2JestArguments,
  discoverL2Packages,
  L2_JEST_TIMEOUT_MS,
  selectL2Packages,
  selectL2Shard,
  serviceDatabaseUrl
} from './l2-test-runner.mjs'

test('L2 Jest command uses a bounded integration timeout without changing assertions', () => {
  const args = buildL2JestArguments(
    { name: 'one-service', specs: ['test/l2/one.spec.ts'] },
    '/tmp/one.json'
  )
  assert.equal(args[args.indexOf('--testTimeout') + 1], String(L2_JEST_TIMEOUT_MS))
  assert.equal(args.includes('--runInBand'), true)
  assert.equal(args.includes('--runTestsByPath'), true)
})

test('L2 discovery binds exact specs to the closest package and rejects no tests', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-l2-matrix-'))
  try {
    const packageRoot = path.join(root, 'src', 'services', 'system', 'one-service')
    fs.mkdirSync(path.join(packageRoot, 'test', 'l2'), { recursive: true })
    fs.writeFileSync(path.join(packageRoot, 'package.json'), '{"name":"one-service"}\n')
    fs.writeFileSync(path.join(packageRoot, 'jest.config.js'), 'module.exports = {}\n')
    fs.writeFileSync(path.join(packageRoot, 'test', 'l2', 'one.spec.ts'), '')
    assert.deepEqual(
      discoverL2Packages(root).map(({ name, specs }) => ({ name, specs: [...specs] })),
      [{ name: 'one-service', specs: ['test/l2/one.spec.ts'] }]
    )
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('service database URL binds loopback, mapped port, and service-owned database', () => {
  const url = new URL(
    serviceDatabaseUrl(
      {
        rootValues: new Map([
          ['OES_POSTGRES_USER', 'owner_user'],
          ['OES_POSTGRES_PASSWORD', 'owner_password']
        ])
      },
      { database: 'owner_database' },
      49152
    )
  )
  assert.equal(url.hostname, '127.0.0.1')
  assert.equal(url.port, '49152')
  assert.equal(url.pathname, '/owner_database')
  assert.equal(url.searchParams.get('schema'), 'public')
})

test('focused L2 selection preserves inventory order and rejects unknown package names', () => {
  const inventory = Object.freeze([
    Object.freeze({ name: 'alpha-service' }),
    Object.freeze({ name: 'beta-service' })
  ])
  assert.deepEqual(selectL2Packages(inventory, ['beta-service']), [
    Object.freeze({ name: 'beta-service' })
  ])
  assert.throws(
    () => selectL2Packages(inventory, ['missing-service']),
    /L2_PACKAGE_UNKNOWN packages=missing-service/
  )
})

test('L2 sharding is deterministic, balanced, non-empty, and complete', () => {
  const inventory = Object.freeze([
    Object.freeze({ name: 'alpha-service', specs: ['a', 'b', 'c'] }),
    Object.freeze({ name: 'beta-service', specs: ['a', 'b'] }),
    Object.freeze({ name: 'gamma-service', specs: ['a'] })
  ])
  const left = selectL2Shard(inventory, 0, 2)
  const right = selectL2Shard(inventory, 1, 2)
  assert.deepEqual([...left.items, ...right.items].map((item) => item.name).sort(), [
    'alpha-service',
    'beta-service',
    'gamma-service'
  ])
  assert.ok(Math.abs(left.weight - right.weight) <= 1)
  assert.deepEqual(selectL2Shard(inventory, 0, 2), left)
  assert.throws(() => selectL2Shard(inventory, 0, 4), /CI_SHARD_EMPTY_FORBIDDEN/)
})

test('local trust bootstrap keeps the OpenSSL CA serial below the task-owned output root', () => {
  const script = fs.readFileSync(
    new URL('../../docker/grpc-trust/bootstrap-local-trust.sh', import.meta.url),
    'utf8'
  )
  assert.match(script, /-CAserial "\$\{output_directory\}\/ca\.srl"/)
})
