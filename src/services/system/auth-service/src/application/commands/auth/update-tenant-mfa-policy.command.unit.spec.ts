import { MfaType } from '../../../common/constants'
import { validate } from 'class-validator'
import { UpdateTenantMfaPolicyCommand } from './update-tenant-mfa-policy.command'

describe('UpdateTenantMfaPolicyCommand', () => {
  it('accepts plain factor snapshots and scenario requirements through nested validation', async () => {
    const errors = await validate(
      new UpdateTenantMfaPolicyCommand({
        tenantId: 'tenant-1',
        scenarioRequirements: {
          LOGIN: true,
          NEW_DEVICE_LOGIN: false,
          CHANGE_PASSWORD: true,
          CHANGE_CONTACT: true
        },
        updatedBy: 'operator-1',
        factors: [
          { factor: MfaType.EMAIL_OTP, enabled: true, priority: 1 },
          { factor: MfaType.TOTP, enabled: true, priority: 2 },
          { factor: MfaType.SMS_OTP, enabled: true, priority: 3 },
          { factor: MfaType.BACKUP_CODE, enabled: false, priority: 4 }
        ]
      }),
      {
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: false
      }
    )

    expect(errors).toEqual([])
  })
})
