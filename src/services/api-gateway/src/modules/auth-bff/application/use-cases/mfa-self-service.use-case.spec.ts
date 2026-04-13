import { MfaBindingType } from '@oes/common/generated/auth_service'
import { MfaSelfServiceUseCase } from './mfa-self-service.use-case'
import { MfaBindingTypeDto } from '../../interfaces/http/dtos/self-security.dto'

describe('MfaSelfServiceUseCase', () => {
  it('uses the authenticated user context for MFA listing and mutation requests', async () => {
    const authAdapter = {
      listMfaBindings: jest.fn().mockResolvedValue({
        bindings: [
          {
            bindingId: 'binding-1',
            type: MfaBindingType.MFA_BINDING_TYPE_TOTP,
            enabled: true,
            available: true,
            destination: '',
            updatedAt: '2026-04-09T10:00:00.000Z'
          }
        ]
      }),
      enableMfaBinding: jest.fn().mockResolvedValue({
        success: true,
        binding: {
          bindingId: 'binding-2',
          type: MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP,
          enabled: true,
          available: true,
          destination: 'a***@example.com',
          updatedAt: '2026-04-09T10:00:00.000Z'
        }
      })
    }

    const useCase = new MfaSelfServiceUseCase(authAdapter as any)

    const listResult = await useCase.listBindings({ user: { userId: 'user-1' } })
    const mutateResult = await useCase.enableBinding(MfaBindingTypeDto.EMAIL_OTP, {
      user: { userId: 'user-1' }
    })

    expect(authAdapter.listMfaBindings).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ user: { userId: 'user-1' } })
    )
    expect(authAdapter.enableMfaBinding).toHaveBeenCalledWith(
      'user-1',
      MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP,
      expect.objectContaining({ user: { userId: 'user-1' } })
    )
    expect(listResult.bindings[0]).toEqual(
      expect.objectContaining({
        bindingId: 'binding-1',
        type: 'TOTP'
      })
    )
    expect(mutateResult.binding).toEqual(
      expect.objectContaining({
        bindingId: 'binding-2',
        type: 'EMAIL_OTP'
      })
    )
  })
})
