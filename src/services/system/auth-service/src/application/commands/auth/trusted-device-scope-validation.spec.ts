import { validate } from 'class-validator'
import { RevokeOtherTrustedDevicesCommand } from './revoke-other-trusted-devices.command'
import { RevokeTrustedDeviceCommand } from './revoke-trusted-device.command'
import { ListTrustedDevicesQuery } from '../../queries/self-security/list-trusted-devices.query'

describe('Trusted-device tenant scope validation', () => {
  it('allows empty tenantId when listing trusted devices for non-tenant self-service scopes', async () => {
    const errors = await validate(new ListTrustedDevicesQuery('user-1', '', 'SYSTEM'), {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: false
    })

    expect(errors).toEqual([])
  })

  it('allows omitted tenantId when listing trusted devices for non-tenant self-service scopes', async () => {
    const errors = await validate(new ListTrustedDevicesQuery('user-1', undefined, 'SYSTEM'), {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: false
    })

    expect(errors).toEqual([])
  })

  it('allows empty tenantId when revoking other trusted devices for non-tenant self-service scopes', async () => {
    const errors = await validate(
      new RevokeOtherTrustedDevicesCommand('user-1', '', 'SYSTEM', 'device-1'),
      {
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: false
      }
    )

    expect(errors).toEqual([])
  })

  it('allows omitted tenantId when revoking other trusted devices for non-tenant self-service scopes', async () => {
    const errors = await validate(
      new RevokeOtherTrustedDevicesCommand('user-1', undefined, 'SYSTEM', 'device-1'),
      {
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: false
      }
    )

    expect(errors).toEqual([])
  })

  it('allows empty tenantId when revoking one trusted device for non-tenant self-service scopes', async () => {
    const errors = await validate(
      new RevokeTrustedDeviceCommand('user-1', '', 'SYSTEM', 'trusted-device-1'),
      {
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: false
      }
    )

    expect(errors).toEqual([])
  })

  it('allows omitted tenantId when revoking one trusted device for non-tenant self-service scopes', async () => {
    const errors = await validate(
      new RevokeTrustedDeviceCommand('user-1', undefined, 'SYSTEM', 'trusted-device-1'),
      {
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: false
      }
    )

    expect(errors).toEqual([])
  })
})
