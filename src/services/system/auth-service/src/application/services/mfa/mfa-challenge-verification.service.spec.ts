import { MfaType } from '@oes/common/constants'
import { MfaBindingEntity } from '../../../domain/aggregates/mfabinding.aggregate'
import { MfaChallengeVerificationService } from './mfa-challenge-verification.service'

describe('MfaChallengeVerificationService', () => {
  it('rejects seeded legacy totp bindings as a valid selected MFA factor', async () => {
    const seededTotp = MfaBindingEntity.createSeededTestTotpBinding('user-1')
    const service = new MfaChallengeVerificationService(
      {} as any,
      {} as any,
      {
        findByUserIdAndType: jest.fn().mockResolvedValue(seededTotp)
      } as any
    )

    await expect(
      service.verifySelectedFactor({
        userId: 'user-1',
        factor: MfaType.TOTP,
        code: '123456'
      })
    ).resolves.toBe(false)
  })
})
