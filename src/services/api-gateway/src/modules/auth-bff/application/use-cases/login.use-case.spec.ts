import { BadRequestException } from '@nestjs/common'
import { LoginStatus } from '@oes/common/generated/auth_service'
import { LoginUseCase } from './login.use-case'
import { LoginDto, LoginMethodDto } from '../../interfaces/http/dtos/login.dto'

describe('LoginUseCase', () => {
  it('maps downstream login results into the normalized auth response model', async () => {
    const authAdapter = {
      loginWithEmailPassword: jest.fn().mockResolvedValue({
        status: LoginStatus.LOGIN_STATUS_MFA_REQUIRED,
        userId: 'user-1',
        challengeId: 'challenge-1',
        loginMethod: 'EMAIL_PASSWORD'
      })
    }

    const useCase = new LoginUseCase(authAdapter as any)
    const dto: LoginDto = {
      method: LoginMethodDto.EMAIL_PASSWORD,
      identifier: 'alice@example.com',
      credential: 'secret',
      device: {
        deviceName: ' Alice MacBook Pro '
      }
    }

    const result = await useCase.execute(
      dto,
      { requestId: 'req-1', traceId: 'trace-1' },
      { userAgent: ' Mozilla/5.0 Firefox/149.0 ', ipAddress: ' 1.1.1.1 ' }
    )

    expect(authAdapter.loginWithEmailPassword).toHaveBeenCalledWith(
      {
        email: 'alice@example.com',
        password: 'secret',
        deviceName: 'Alice MacBook Pro',
        userAgent: 'Mozilla/5.0 Firefox/149.0',
        ipAddress: '1.1.1.1'
      },
      expect.objectContaining({ requestId: 'req-1', traceId: 'trace-1' })
    )
    expect(result).toEqual(
      expect.objectContaining({
        status: 'MFA_REQUIRED',
        nextStep: 'COMPLETE_MFA',
        loginMethod: 'EMAIL_PASSWORD',
        challenge: { challengeId: 'challenge-1' },
        operator: { userId: 'user-1' }
      })
    )
  })

  it('hydrates tenant names for account options through tenant-org-service instead of auth-service passthrough', async () => {
    const authAdapter = {
      loginWithEmailPassword: jest.fn().mockResolvedValue({
        status: LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED,
        userId: 'user-1',
        loginMethod: 'EMAIL_PASSWORD',
        accounts: [
          {
            accountId: 'account-1',
            tenantId: 'tenant-1',
            scopeLevel: 'TENANT',
            displayName: 'Tenant Account'
          },
          {
            accountId: 'account-2',
            scopeLevel: 'SYSTEM',
            displayName: 'Platform Account'
          }
        ]
      })
    }
    const tenantOrgAdapter = {
      getTenantById: jest.fn().mockResolvedValue({
        tenant: {
          id: 'tenant-1',
          name: 'Tenant One'
        }
      })
    }

    const useCase = new LoginUseCase(authAdapter as any, tenantOrgAdapter as any)

    const result = await useCase.execute(
      {
        method: LoginMethodDto.EMAIL_PASSWORD,
        identifier: 'alice@example.com',
        credential: 'secret'
      },
      { requestId: 'req-1', traceId: 'trace-1' },
      {}
    )

    expect(result).toEqual(
      expect.objectContaining({
        status: 'ACCOUNT_SELECTION_REQUIRED',
        nextStep: 'SELECT_ACCOUNT',
        accountOptions: [
          {
            accountId: 'account-1',
            tenantId: 'tenant-1',
            tenantName: 'Tenant One',
            scopeLevel: 'TENANT',
            displayName: 'Tenant Account'
          },
          {
            accountId: 'account-2',
            tenantId: undefined,
            tenantName: undefined,
            scopeLevel: 'SYSTEM',
            displayName: 'Platform Account'
          }
        ]
      })
    )
    expect(tenantOrgAdapter.getTenantById).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ requestId: 'req-1', traceId: 'trace-1' })
    )
  })

  it('rejects unsupported login methods', async () => {
    const useCase = new LoginUseCase({} as any)

    await expect(
      useCase.execute(
        {
          method: 'UNKNOWN' as LoginMethodDto,
          identifier: 'alice@example.com',
          credential: 'secret'
        },
        {},
        {}
      )
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
