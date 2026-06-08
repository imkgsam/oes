import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildBusinessCardLiveFixtureSeed,
  renderBusinessCardLiveFixtureEnv
} from './business-card-live-fixtures.mjs'

test('business card live fixture derives operator, employee, self account, and contact asset from tenant-web seed', () => {
  const seed = buildBusinessCardLiveFixtureSeed()

  assert.deepEqual(seed, {
    tenantId: '00000000-0000-4000-8000-000000000001',
    employeeId: '00000000-0000-4000-8000-000000000302',
    operatorAccountId: '00000000-0000-4000-8000-000000000901',
    selfAccountId: '00000000-0000-4000-8000-000000000903',
    workEmailContactAssetId: 'contact-00000000-0000-4000-8000-000000000903'
  })
})

test('business card live fixture renders explicit env lines for live-stack smoke commands', () => {
  const envText = renderBusinessCardLiveFixtureEnv(buildBusinessCardLiveFixtureSeed())

  assert.equal(envText, [
    'BUSINESS_CARD_LIVE_TENANT_ID=00000000-0000-4000-8000-000000000001',
    'BUSINESS_CARD_LIVE_EMPLOYEE_ID=00000000-0000-4000-8000-000000000302',
    'BUSINESS_CARD_LIVE_OPERATOR_ACCOUNT_ID=00000000-0000-4000-8000-000000000901',
    'BUSINESS_CARD_LIVE_SELF_ACCOUNT_ID=00000000-0000-4000-8000-000000000903',
    'BUSINESS_CARD_LIVE_WORK_EMAIL_CONTACT_ASSET_ID=contact-00000000-0000-4000-8000-000000000903'
  ].join('\n'))
})
