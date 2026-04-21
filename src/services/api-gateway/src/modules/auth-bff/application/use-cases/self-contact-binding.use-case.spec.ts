import { SelfContactBindingUseCase } from './self-contact-binding.use-case'

describe('SelfContactBindingUseCase', () => {
  it('verifies an email binding then updates identity and bootstraps the authenticated user login methods', async () => {
    const authAdapter = {
      verifyEmailBinding: jest.fn().mockResolvedValue({
        success: true,
        type: 'EMAIL',
        identifier: 'alice@example.com'
      }),
      bootstrapUserLoginMethods: jest.fn().mockResolvedValue({
        success: true
      })
    }
    const identityAdapter = {
      updateUserBasicInfo: jest.fn().mockResolvedValue({
        user: {
          id: 'user-1',
          personalEmail: 'alice@example.com'
        }
      })
    }

    const useCase = new SelfContactBindingUseCase(authAdapter as any, identityAdapter as any)

    await expect(
      useCase.verifyEmailBinding(
        {
          email: ' Alice@Example.com ',
          otp: '123456'
        },
        {
          user: {
            aid: 'account-1',
            sid: 'session-1',
            sub: 'user-1'
          }
        } as any
      )
    ).resolves.toEqual({
      identifier: 'alice@example.com',
      success: true,
      type: 'EMAIL'
    })

    expect(identityAdapter.updateUserBasicInfo).toHaveBeenCalledWith(
      {
        accountId: 'account-1',
        userId: 'user-1',
        email: 'alice@example.com'
      },
      expect.objectContaining({
        user: expect.objectContaining({
          aid: 'account-1',
          sub: 'user-1'
        })
      })
    )
    expect(authAdapter.bootstrapUserLoginMethods).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        accountId: 'account-1',
        email: 'alice@example.com'
      },
      expect.objectContaining({
        user: expect.objectContaining({
          aid: 'account-1',
          sub: 'user-1'
        })
      })
    )
  })
})
