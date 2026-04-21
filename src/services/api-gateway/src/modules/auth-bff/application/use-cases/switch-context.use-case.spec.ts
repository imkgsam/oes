import { UnauthorizedException } from '@nestjs/common'
import { LoginMethodEnum } from '@oes/common/constants'
import { SwitchContextUseCase } from './switch-context.use-case'

describe('SwitchContextUseCase', () => {
  it('re-issues a session for the target account context with trimmed client context fields', async () => {
    const authAdapter = {
      selectAccount: jest.fn().mockResolvedValue({
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
        { accountId: '  account-system  ' },
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
})
