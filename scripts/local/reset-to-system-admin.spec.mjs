import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildResetToSystemAdminPlan,
  buildSystemAdminSeedEnv,
  parseResetToSystemAdminArgs
} from './reset-to-system-admin.mjs'

test('reset to system admin defaults to dry-run and masks database passwords', () => {
  const options = parseResetToSystemAdminArgs([])
  const plan = buildResetToSystemAdminPlan({}, options)

  assert.equal(plan.mode, 'dry-run')
  assert.equal(plan.writesDatabase, false)
  assert.deepEqual(plan.databases, [
    'permissiondb',
    'identitydb',
    'hrdb',
    'authdb',
    'assetdb',
    'partydb',
    'tenantorgdb',
    'itemmasterdb',
    'notificationdb',
    'salesdb',
    'crmdb',
    'mydb'
  ])
  assert.doesNotMatch(JSON.stringify(plan), /imkgsam:imkgsam/)
})

test('reset to system admin keeps the one-click reset command sequence explicit', () => {
  const options = parseResetToSystemAdminArgs(['--apply'])
  const plan = buildResetToSystemAdminPlan({}, options)

  assert.equal(plan.mode, 'apply')
  assert.equal(plan.writesDatabase, true)
  assert.deepEqual(
    plan.steps.map((step) => step.name),
    [
      'reset-postgres-databases',
      'sync-backend-schemas',
      'sync-notification-schema',
      'sync-permission-foundation',
      'validate-permission-foundation',
      'seed-system-admin',
      'validate-system-admin'
    ]
  )
})

test('system admin seed env uses loopback-safe database URLs for Node Prisma clients', () => {
  const env = buildSystemAdminSeedEnv({})

  assert.equal(env.OES_PARTY_DATABASE_URL, 'postgres://imkgsam:imkgsam@127.0.0.1:5432/partydb')
  assert.equal(env.OES_IDENTITY_DATABASE_URL, 'postgres://imkgsam:imkgsam@127.0.0.1:5432/identitydb')
  assert.equal(env.OES_AUTH_DATABASE_URL, 'postgres://imkgsam:imkgsam@127.0.0.1:5432/authdb')
  assert.equal(env.OES_PERMISSION_DATABASE_URL, 'postgres://imkgsam:imkgsam@127.0.0.1:5432/permissiondb')
})
