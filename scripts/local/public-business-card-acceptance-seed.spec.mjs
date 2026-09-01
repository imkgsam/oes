import assert from 'node:assert/strict'
import test from 'node:test'
import { buildBusinessCardLiveFixtureSeed } from './business-card-live-fixtures.mjs'
import {
  assertTaskOwnedPublicEntryDatabase,
  buildPublicBusinessCardAcceptanceSeed
} from './public-business-card-acceptance-seed.mjs'
import {
  assertTaskOwnedPermissionDatabase,
  buildPublicBusinessCardPermissionAcceptanceSeed
} from './public-business-card-permission-acceptance-fixture.mjs'

test('public business card acceptance seed owns exactly three persisted states and one absent id', () => {
  const taskKey = '2af8_a2e462d5'
  const fixture = buildPublicBusinessCardAcceptanceSeed(taskKey, buildBusinessCardLiveFixtureSeed())

  assert.equal(fixture.cards.length, 3)
  assert.deepEqual(
    fixture.cards.map((card) => [card.fixtureState, card.status, card.templateKey]),
    [
      ['AVAILABLE', 'ACTIVE', 'TENANT_STANDARD'],
      ['DISABLED', 'DISABLED', 'TENANT_STANDARD'],
      ['UNAVAILABLE', 'ACTIVE', 'TASK_FIXTURE_UNAVAILABLE']
    ]
  )
  assert.equal(fixture.notFoundBusinessCardId, '00000000-0000-4000-8000-000000000799')
  assert.ok(
    fixture.cards.every((card) => card.createdBy === `fixture:public-business-card:${taskKey}`)
  )
  assert.ok(fixture.cards.every((card) => !JSON.stringify(card).includes('displayName')))
  assert.ok(fixture.cards.every((card) => !JSON.stringify(card).includes('sales@example')))
  assert.match(fixture.digest, /^[a-f0-9]{64}$/)
})

test('public business card acceptance seed keeps contact values as upstream references only', () => {
  const fixture = buildPublicBusinessCardAcceptanceSeed('2af8_a2e462d5')
  assert.deepEqual(fixture.cards[0].contactActionsJson, [
    {
      contactActionType: 'SEND_EMAIL',
      targetRefType: 'CONTACT_ASSET',
      targetRefId: 'contact-00000000-0000-4000-8000-000000000903',
      visibility: 'PUBLIC',
      displayOrder: 10,
      enabled: true,
      includeInVCard: true
    },
    {
      contactActionType: 'SAVE_VCARD',
      targetRefType: 'NONE',
      targetRefId: null,
      visibility: 'PUBLIC',
      displayOrder: 20,
      enabled: true,
      includeInVCard: false
    }
  ])
})

test('public business card acceptance seed accepts only the exact loopback task database', () => {
  assert.deepEqual(
    assertTaskOwnedPublicEntryDatabase(
      'postgresql://user:password@127.0.0.1:5432/oes_2af8_a2e462d5_public_entry?schema=public',
      '2af8_a2e462d5'
    ),
    { database: 'oes_2af8_a2e462d5_public_entry', host: '127.0.0.1', port: '5432' }
  )
  assert.throws(
    () =>
      assertTaskOwnedPublicEntryDatabase(
        'postgresql://user:password@db.example.com:5432/oes_2af8_a2e462d5_public_entry',
        '2af8_a2e462d5'
      ),
    /DATABASE_NOT_LOOPBACK/
  )
  assert.throws(
    () =>
      assertTaskOwnedPublicEntryDatabase(
        'postgresql://user:password@127.0.0.1:5432/oes_other_public_entry',
        '2af8_a2e462d5'
      ),
    /DATABASE_NOT_TASK_OWNED/
  )
  assert.deepEqual(
    assertTaskOwnedPermissionDatabase(
      'postgresql://user:password@localhost:5544/oes_2af8_a2e462d5_permission?schema=public',
      '2af8_a2e462d5'
    ),
    { database: 'oes_2af8_a2e462d5_permission', host: 'localhost', port: '5544' }
  )
})

test('public business card Permission fixture grants one exact SYSTEM read to Gateway MACHINE', () => {
  const fixture = buildPublicBusinessCardPermissionAcceptanceSeed(
    '2af8_a2e462d5',
    'machine-api-gateway'
  )

  assert.equal(fixture.permissionCode, 'public-entry.business-card.read')
  assert.deepEqual(fixture.rolePermission, {
    id: '00000000-0000-4000-8000-000000000712',
    roleId: '00000000-0000-4000-8000-000000000711'
  })
  assert.deepEqual(fixture.binding, {
    id: '00000000-0000-4000-8000-000000000713',
    principalType: 'MACHINE',
    principalId: 'machine-api-gateway',
    roleId: '00000000-0000-4000-8000-000000000711',
    tenantId: null,
    scopeLevel: 'SYSTEM',
    effectiveAt: null,
    expiresAt: null,
    revokedAt: null,
    revokedByOperatorId: null,
    revokeReason: null,
    revokeAuditEventId: null,
    createdByOperatorId: 'fixture:public-business-card:2af8_a2e462d5',
    createdRequestId: 'public-business-card-2af8_a2e462d5',
    createdTraceId: 'public-business-card-2af8_a2e462d5',
    grantAuditEventId: '00000000-0000-4000-8000-000000000714'
  })
  assert.equal(fixture.role.kind, 'SYSTEM_INSTANCE')
  assert.equal(fixture.role.allowTenantPermissionOverride, false)
  assert.ok(!JSON.stringify(fixture).includes('*'))
  assert.match(fixture.digest, /^[a-f0-9]{64}$/)
})
