import { LoginStatus, MfaBindingType, MfaScenario } from '@oes/common/generated/auth_service'
import { SelectAccountUseCase } from './select-account.use-case'
import { LoginMethodDto } from '../../interfaces/http/dtos/login.dto'

describe('SelectAccountUseCase', () => {
  it('maps ordered MFA factors from selectAccount into the normalized auth response model', async () => {
    const authAdapter = {
      selectAccount: jest.fn().mockResolvedValue({
        status: LoginStatus.LOGIN_STATUS_MFA_REQUIRED,
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        challengeId: 'challenge-1',
        mfaScenario: MfaScenario.MFA_SCENARIO_LOGIN,
        defaultMfaFactor: MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP,
        availableFactors: [
          {
            type: MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP,
            label: '邮箱验证码',
            priority: 1,
          },
          {
            type: MfaBindingType.MFA_BINDING_TYPE_TOTP,
            label: '认证器 App',
            priority: 2,
          },
        ],
      }),
    }

    const useCase = new SelectAccountUseCase(authAdapter as any)

    const result = await useCase.execute(
      {
        userId: ' user-1 ',
        accountId: ' account-1 ',
        loginMethod: LoginMethodDto.EMAIL_PASSWORD,
        device: {
          deviceId: ' device-1 ',
          deviceName: ' Alice MacBook Pro ',
        },
      },
      { requestId: 'req-1', traceId: 'trace-1' } as any,
      { userAgent: ' Mozilla/5.0 ', ipAddress: ' 1.1.1.1 ' },
    )

    expect(authAdapter.selectAccount).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        accountId: 'account-1',
        loginMethod: 'email-password',
        deviceId: 'device-1',
        deviceName: 'Alice MacBook Pro',
        userAgent: 'Mozilla/5.0',
        ipAddress: '1.1.1.1',
        terminal: 'WEB',
      },
      expect.objectContaining({ requestId: 'req-1', traceId: 'trace-1' }),
    )
    expect(result).toEqual(
      expect.objectContaining({
        status: 'MFA_REQUIRED',
        nextStep: 'COMPLETE_MFA',
        challenge: {
          challengeId: 'challenge-1',
          scenario: 'LOGIN',
          defaultFactor: 'EMAIL_OTP',
          availableFactors: [
            { type: 'EMAIL_OTP', label: '邮箱验证码', priority: 1 },
            { type: 'TOTP', label: '认证器 App', priority: 2 },
          ],
        },
        operator: {
          userId: 'user-1',
          accountId: 'account-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
        },
      }),
    )
  })
})
