import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import {
  CompleteMfaDto,
  EmployeeCodePinPreflightDto,
  LoginDto,
  RequestMfaFactorChallengeDto
} from './login.dto'

describe('login dto validation', () => {
  it('accepts JWT-sized challenge ids for MFA completion', () => {
    const dto = plainToInstance(CompleteMfaDto, {
      challengeId: 'x'.repeat(512),
      factor: 'TOTP',
      code: '123456',
      loginMethod: 'EMAIL_PASSWORD'
    })

    const errors = validateSync(dto)

    expect(errors).toEqual([])
  })

  it('accepts JWT-sized challenge ids when switching MFA factors', () => {
    const dto = plainToInstance(RequestMfaFactorChallengeDto, {
      challengeId: 'x'.repeat(512),
      factor: 'EMAIL_OTP'
    })

    const errors = validateSync(dto)

    expect(errors).toEqual([])
  })

  it('accepts PDA employee-code preflight without a redundant login method', () => {
    const dto = plainToInstance(EmployeeCodePinPreflightDto, {
      employeeCode: 'EMP-0AF-0001',
      device: {
        deviceId: 'terminal-device-1',
        deviceName: 'OES PDA',
        identity: {
          manufacturerSerial: 'xiaomi-serial-1',
          manufacturer: 'Xiaomi',
          model: '23127PN0CC'
        },
        software: {
          androidVersion: '15',
          appVersion: '0.1.0'
        }
      }
    })

    const errors = validateSync(dto)

    expect(errors).toEqual([])
  })

  it('accepts but does not validate authority from a client terminal hint', () => {
    const dto = plainToInstance(LoginDto, {
      method: 'EMAIL_PASSWORD',
      identifier: 'designer@example.com',
      credential: 'secret-1',
      terminal: 'WEB'
    })

    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true
    })

    expect(errors).toEqual([])
    expect(dto.terminal).toBe('WEB')
  })
})
