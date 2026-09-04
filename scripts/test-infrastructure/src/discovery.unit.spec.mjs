import assert from 'node:assert/strict'
import test from 'node:test'
import {
  discoverTests,
  globToRegExp,
  integrationOwnersForTests,
  packageScriptsForKind,
  parseNameStatus
} from './test-infrastructure.mjs'

const packages = [
  { directory: 'packages/example', name: 'example', dependencies: {}, scripts: {} },
  { directory: '', name: 'root', dependencies: {}, scripts: {} }
]

test('discovers every canonical taxonomy suffix exactly once', () => {
  const result = discoverTests({
    root: process.cwd(),
    packages,
    files: [
      'packages/example/src/rule.unit.spec.ts',
      'packages/example/src/module.component.spec.ts',
      'packages/example/test/api.contract.spec.ts',
      'packages/example/test/database.integration.spec.ts',
      'tests/cross-service/login.journey.spec.ts',
      'tests/cross-service/pda-login.journey.spec.kt',
      'packages/example/src/test/java/com/example/RuleTest.kt'
    ]
  })
  assert.deepEqual(result.violations, [])
  assert.equal(result.total, 7)
  assert.deepEqual(result.counts, {
    unit: 2,
    component: 1,
    contract: 1,
    integration: 1,
    journey: 2
  })
})

test('each Journey resolves exactly one declared runtime family and all consumer owners', () => {
  const relationships = {
    journeyFamilies: [
      {
        id: 'web-login',
        journeyGlobs: ['tests/cross-service/**/web-login*.journey.spec.*'],
        consumerOwners: ['gateway', 'auth', 'identity', 'permission']
      },
      {
        id: 'pda-login',
        journeyGlobs: ['tests/cross-service/**/pda-login*.journey.spec.*'],
        consumerOwners: ['gateway', 'auth', 'terminal-device']
      }
    ]
  }
  assert.deepEqual(
    integrationOwnersForTests(
      [
        {
          path: 'tests/cross-service/web-login.journey.spec.ts',
          type: 'journey',
          owner: 'cross-service'
        },
        {
          path: 'tests/cross-service/pda-login.journey.spec.kt',
          type: 'journey',
          owner: 'cross-service'
        }
      ],
      relationships
    ),
    ['auth', 'gateway', 'identity', 'permission', 'terminal-device']
  )
  assert.throws(
    () =>
      integrationOwnersForTests(
        [
          {
            path: 'tests/cross-service/unmapped.journey.spec.ts',
            type: 'journey',
            owner: 'cross-service'
          }
        ],
        relationships
      ),
    /matches=0/u
  )
})

test('fails closed for ordinary names, every old layer, overlaps, invalid locations, and orphans', () => {
  const result = discoverTests({
    root: process.cwd(),
    packages,
    files: [
      'packages/example/src/ordinary.spec.ts',
      'packages/example/src/ordinary.test.ts',
      'packages/example/test/l1/legacy.contract.spec.ts',
      'packages/example/test/l2/legacy.integration.spec.ts',
      'packages/example/test/l3/legacy.contract.spec.ts',
      'packages/example/test/wrong.unit.spec.ts',
      'orphan/src/rule.unit.spec.ts',
      'packages/example/src/duplicate.unit.spec.ts',
      'packages/example/src/duplicate.unit.spec.ts'
    ]
  })
  assert.deepEqual(result.violations.map((item) => item.code).sort(), [
    'INVALID_TEST_LOCATION',
    'LEGACY_TEST_LAYER',
    'LEGACY_TEST_LAYER',
    'LEGACY_TEST_LAYER',
    'ORPHAN_TEST',
    'OVERLAPPING_TEST_CLASS',
    'UNKNOWN_TEST_CLASS',
    'UNKNOWN_TEST_CLASS'
  ])
})

test('relationship globs support zero or many intermediate directories', () => {
  const expression = globToRegExp('src/common/src/contracts/**/*event*')
  assert.equal(expression.test('src/common/src/contracts/event.proto'), true)
  assert.equal(expression.test('src/common/src/contracts/domain/order-event.proto'), true)
})

test('name-status parser retains delete and both rename paths', () => {
  const result = parseNameStatus(Buffer.from('D\0old.ts\0R100\0from.ts\0to.ts\0'))
  assert.deepEqual(result, [
    { status: 'D', path: 'old.ts' },
    { status: 'R100', oldPath: 'from.ts', path: 'to.ts' }
  ])
})

test('static package orchestration includes every mature static entry point deterministically', () => {
  const record = {
    scripts: {
      test: 'runner',
      typecheck: 'tsc',
      'check:static:z': 'z',
      lint: 'eslint',
      'check:static': 'check',
      'check:static:a': 'a',
      build: 'build'
    }
  }
  assert.deepEqual(packageScriptsForKind(record, 'static'), [
    'check:static',
    'check:static:a',
    'check:static:z',
    'lint',
    'typecheck'
  ])
  assert.deepEqual(packageScriptsForKind(record, 'build'), ['build'])
})
