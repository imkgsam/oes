import assert from 'node:assert/strict'
import test from 'node:test'
import { changedLockfileImporters, createChangePlan } from './change-plan.mjs'

const packages = [
  { directory: 'packages/common', name: 'common', dependencies: {}, scripts: {} },
  { directory: 'packages/service', name: 'service', dependencies: { common: 'workspace:*' }, scripts: {} },
  { directory: 'packages/consumer', name: 'consumer', dependencies: { service: 'workspace:*' }, scripts: {} },
  { directory: '', name: 'root', dependencies: {}, scripts: {} }
]
const files = [
  'packages/common/src/common.unit.spec.ts',
  'packages/service/src/service.unit.spec.ts',
  'packages/service/test/api.contract.spec.ts',
  'packages/consumer/src/consumer.component.spec.ts',
  'tests/cross-service/event-flow.journey.spec.ts'
]
const relationships = {
  schemaVersion: 1,
  implicitContracts: [],
  sharedResources: [],
  journeyFamilies: [
    {
      id: 'event-flow',
      triggers: ['packages/service/contracts/**/*event*'],
      consumerOwners: ['consumer'],
      journeyGlobs: ['tests/cross-service/event-flow.journey.spec.*'],
      riskTags: ['event']
    }
  ]
}

function plan(changes, overrides = {}) {
  return createChangePlan({
    root: process.cwd(),
    base: 'a'.repeat(40),
    head: 'b'.repeat(40),
    changes,
    files,
    packages,
    relationships,
    ...overrides
  })
}

test('rename and delete use the complete two-sided diff and select the renamed test', () => {
  const result = plan([
    {
      status: 'R100',
      oldPath: 'packages/service/src/old.unit.spec.ts',
      path: 'packages/service/src/service.unit.spec.ts'
    },
    { status: 'D', path: 'packages/service/src/deleted.ts' }
  ])
  assert.equal(result.mode, 'SCOPED')
  assert.ok(result.selectedTests.unit.includes('packages/service/src/service.unit.spec.ts'))
  assert.ok(result.owners.some((owner) => owner.name === 'consumer'))
})

test('shared library changes expand through all transitive consumers', () => {
  const result = plan([{ status: 'M', path: 'packages/common/src/value.ts' }])
  assert.deepEqual(result.owners.map((owner) => owner.name), ['common', 'consumer', 'service'])
  assert.equal(result.selectedTestCount, 4)
})

test('lockfile importer parsing isolates package-scoped dependency changes', () => {
  const before = `lockfileVersion: '9.0'\nimporters:\n  .:\n    dependencies:\n      root: 1\n  packages/service:\n    dependencies:\n      a: 1\npackages:\n  a: 1\n`
  const after = `lockfileVersion: '9.0'\nimporters:\n  .:\n    dependencies:\n      root: 1\n  packages/service:\n    dependencies:\n      a: 2\npackages:\n  a: 2\n`
  assert.deepEqual(changedLockfileImporters(before, after), ['packages/service'])
})

test('event contract changes add declared consumers and critical journey', () => {
  const result = plan([{ status: 'M', path: 'packages/service/contracts/order-event.proto' }])
  assert.ok(result.owners.some((owner) => owner.name === 'consumer'))
  assert.deepEqual(result.selectedTests.journey, ['tests/cross-service/event-flow.journey.spec.ts'])
  assert.deepEqual(result.risks, ['event'])
})

test('unknown mappings and abnormal empty selections require FULL', () => {
  const unknown = plan([{ status: 'M', path: 'unmapped/binary.data' }])
  assert.equal(unknown.mode, 'FULL')
  assert.ok(unknown.reasons.some((reason) => reason.includes('workspace graph')))

  const empty = createChangePlan({
    root: process.cwd(),
    base: 'a',
    head: 'b',
    changes: [{ status: 'M', path: 'packages/service/src/value.ts' }],
    files: [],
    packages,
    relationships
  })
  assert.equal(empty.mode, 'FULL')
  assert.ok(empty.reasons.some((reason) => reason.includes('empty test selection')))
})

test('identical base, head, rules, and diff produce an identical plan', () => {
  const changes = [{ status: 'M', path: 'packages/service/src/value.ts' }]
  assert.deepEqual(plan(changes), plan(changes))
})

test('main push remains a bounded quick smoke even when a FULL rule changed', () => {
  const result = plan([{ status: 'M', path: 'scripts/test-infrastructure/src/run.mjs' }], {
    event: 'push'
  })
  assert.equal(result.phase, 'quick-smoke')
  assert.equal(result.mode, 'SCOPED')
  assert.equal(result.selectedTests.unit.length, 0)
  assert.ok(result.selectedTests.contract.length <= 1)
})

test('pull-request FULL confirmation binds to the exact candidate head', () => {
  const result = plan([{ status: 'M', path: 'scripts/test-infrastructure/src/run.mjs' }])
  assert.equal(result.mode, 'FULL')
  assert.equal(result.requiresHumanConfirmation, true)
  assert.equal(result.fullApprovalToken, `ci-full-approved-${'b'.repeat(12)}`)
})

test('an unavailable workspace graph produces an explicit blocked FULL_REQUIRED plan', () => {
  const result = createChangePlan({
    root: process.cwd(),
    base: 'a',
    head: 'b',
    changes: [{ status: 'M', path: 'unknown.ts' }],
    files: [],
    packages: [],
    relationships
  })
  assert.equal(result.mode, 'FULL')
  assert.equal(result.requiresHumanConfirmation, true)
  assert.equal(result.planningBlocked, true)
  assert.deepEqual(result.risks, ['workspace-graph'])

  const manual = createChangePlan({
    root: process.cwd(),
    base: 'a',
    head: 'b',
    event: 'workflow_dispatch',
    changes: [{ status: 'M', path: 'unknown.ts' }],
    files: [],
    packages: [],
    relationships
  })
  assert.equal(manual.fullApproved, true)
  assert.equal(manual.requiresHumanConfirmation, false)
  assert.equal(manual.planningBlocked, true)
})

test('duplicate package identities block an ambiguous workspace graph', () => {
  const duplicate = createChangePlan({
    root: process.cwd(),
    base: 'a',
    head: 'b',
    changes: [{ status: 'M', path: 'packages/service/src/value.ts' }],
    files,
    packages: [...packages, { ...packages[0], directory: 'packages/duplicate' }],
    relationships
  })
  assert.equal(duplicate.mode, 'FULL')
  assert.equal(duplicate.planningBlocked, true)
  assert.match(duplicate.reasons[0], /DUPLICATE_PACKAGE_NAME common/u)
})
