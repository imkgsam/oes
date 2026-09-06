import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { baselineResolutionAction, cleanProcessEnvironment, discoverMigrationOwners, loadBaselineResolvePlan } from '../bootstrap.mjs'

const root = path.resolve(import.meta.dirname, '../../../..')

test('managed process environment strips inherited endpoint and credential bindings', () => {
  const clean = cleanProcessEnvironment({ PATH: '/bin', HOME: '/tmp/home', DATABASE_URL: 'foreign', NATS_PASSWORD: 'foreign', OES_TASK_KEY: 'foreign' })
  assert.deepEqual(clean, { PATH: '/bin', HOME: '/tmp/home' })
})

test('migration discovery requires committed migrations and never returns db push', () => {
  const owners = discoverMigrationOwners(root, ['permission-service', 'api-gateway'])
  assert.deepEqual(owners.map((entry) => entry.owner), ['permission-service'])
  assert.equal(owners.every((entry) => fs.existsSync(entry.migrations)), true)
})

test('baseline resolution validates committed migration bytes and selects empty database application', () => {
  const [service] = discoverMigrationOwners(root, ['terminal-device-service'])
  const plan = loadBaselineResolvePlan(service)
  assert.equal(plan.baselineMigration, '20260825000000_baseline')
  assert.equal(baselineResolutionAction(plan, [], 0), 'APPLY_EMPTY_BASELINE')
  assert.equal(baselineResolutionAction(plan, [], 1), 'ADOPT_MATCHING_SCHEMA')
  assert.equal(baselineResolutionAction(plan, [plan.supersededMigrations[0].name, plan.baselineMigration], 1), 'PRESENT')
  assert.throws(() => baselineResolutionAction(plan, [plan.baselineMigration], 1), /BASELINE_HISTORY_INCOMPLETE/u)
})

test('baseline resolution rejects a migration whose bytes do not match its declaration', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-baseline-plan-'))
  const migrations = path.join(directory, 'migrations')
  fs.mkdirSync(path.join(migrations, '001_old'), { recursive: true })
  fs.mkdirSync(path.join(migrations, '002_baseline'), { recursive: true })
  fs.writeFileSync(path.join(migrations, '001_old', 'migration.sql'), 'SELECT 1;\n')
  fs.writeFileSync(path.join(migrations, '002_baseline', 'migration.sql'), 'SELECT 2;\n')
  fs.writeFileSync(path.join(migrations, 'baseline-resolve.json'), JSON.stringify({
    strategy: 'PRISMA_BASELINE_RESOLVE',
    baselineMigration: '002_baseline',
    baselineSha256: '0'.repeat(64),
    supersededMigrations: [{ name: '001_old', sha256: '1'.repeat(64) }]
  }))
  assert.throws(() => loadBaselineResolvePlan({ owner: 'fixture-service', migrations }), /BASELINE_RESOLVE_DIGEST_MISMATCH/u)
  fs.rmSync(directory, { recursive: true, force: true })
})
