import { UnauthorizedException } from '@nestjs/common'
import { LoginMethodEnum } from '@oes/common/constants'
import { LoginStatus } from '@oes/common/generated/auth_service'
import { SwitchContextUseCase } from './switch-context.use-case'

describe('SwitchContextUseCase', () => {
  it('re-issues a session for the target account context with trimmed client context fields', async () => {
    const authAdapter = {
      selectAccount: jest.fn().mockResolvedValue({
        status: LoginStatus.LOGIN_STATUS_SUCCESS,
        accountId: 'account-system',
        scopeLevel: 'SYSTEM',
        accessToken: 'next-access',
        refreshToken: 'next-refresh',
        expiresIn: '3600'
      })
    }

    const useCase = new SwitchContextUseCase(authAdapter as any)
    const source = {
      user: {
        sub: 'user-1',
        aid: 'account-current',
        sid: 'session-current',
        tid: 'tenant-1',
        scopeLevel: 'TENANT'
      },
      requestId: 'req-1',
      traceId: 'trace-1'
    }

    await expect(
      useCase.execute(
        {
          accountId: '  account-system  ',
          device: {
            deviceId: ' device-1 ',
            deviceName: ' Firefox on macOS '
          }
        },
        source as any,
        { userAgent: '  browser  ', ipAddress: ' 1.1.1.1 ' }
      )
    ).resolves.toEqual({
      status: 'SUCCESS',
      context: {
        accountId: 'account-system',
        scopeLevel: 'SYSTEM',
        tenantId: null
      },
      session: {
        accessToken: 'next-access',
        refreshToken: 'next-refresh',
        expiresIn: 3600
      }
    })

    expect(authAdapter.selectAccount).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        accountId: 'account-system',
        loginMethod: LoginMethodEnum.ContextSwitch,
        currentSessionId: 'session-current',
        deviceId: 'device-1',
        deviceName: 'Firefox on macOS',
        userAgent: 'browser',
        ipAddress: '1.1.1.1'
      },
      expect.objectContaining({ requestId: 'req-1', traceId: 'trace-1' })
    )
  })

  it('rejects switch attempts without a target account id', async () => {
    const useCase = new SwitchContextUseCase({ selectAccount: jest.fn() } as any)

    await expect(
      useCase.execute(
        { accountId: '   ' },
        {
          user: {
            sub: 'user-1',
            aid: 'account-current',
            scopeLevel: 'TENANT'
          }
        } as any,
        {}
      )
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('does not report success or expose an empty session when downstream requires MFA continuation', async () => {
    const authAdapter = {
      selectAccount: jest.fn().mockResolvedValue({
        status: LoginStatus.LOGIN_STATUS_MFA_REQUIRED,
        accountId: 'account-2',
        tenantId: 'tenant-2',
        scopeLevel: 'TENANT',
        accessToken: '',
        refreshToken: '',
        expiresIn: '0'
      })
    }
    const useCase = new SwitchContextUseCase(authAdapter as any)

    await expect(
      useCase.execute(
        { accountId: 'account-2' },
        {
          user: {
            sub: 'user-1',
            aid: 'account-current',
            sid: 'session-current',
            scopeLevel: 'TENANT',
            tid: 'tenant-1'
          }
        } as any,
        {}
      )
    ).resolves.toEqual({
      status: 'DENIED',
      context: null,
      session: null,
      reasonCode: 'CONTEXT_SWITCH_CONTINUATION_REQUIRED',
      message: '账号切换需要额外验证，请重新登录后选择该账号。'
    })
  })
})
