import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { discoverL2Packages, selectL2Packages, serviceDatabaseUrl } from './l2-test-runner.mjs'

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

test('local trust bootstrap keeps the OpenSSL CA serial below the task-owned output root', () => {
  const script = fs.readFileSync(
    new URL('../../docker/grpc-trust/bootstrap-local-trust.sh', import.meta.url),
    'utf8'
  )
  assert.match(script, /-CAserial "\$\{output_directory\}\/ca\.srl"/)
})
