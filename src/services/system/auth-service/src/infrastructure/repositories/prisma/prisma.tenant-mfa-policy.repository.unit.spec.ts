import { TenantMfaScenario } from '../../../../prisma/generated/prisma'

describe('TenantMfaScenario prisma enum', () => {
  it('includes every managed tenant MFA scenario used by the auth-service domain model', () => {
    expect(TenantMfaScenario).toMatchObject({
      LOGIN: 'LOGIN',
      NEW_DEVICE_LOGIN: 'NEW_DEVICE_LOGIN',
      CHANGE_PASSWORD: 'CHANGE_PASSWORD',
      CHANGE_CONTACT: 'CHANGE_CONTACT'
    })
  })
})
