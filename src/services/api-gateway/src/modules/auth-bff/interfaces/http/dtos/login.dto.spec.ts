import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { CompleteMfaDto, RequestMfaFactorChallengeDto } from './login.dto'

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
})
