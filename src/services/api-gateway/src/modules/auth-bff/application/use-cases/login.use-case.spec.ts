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
        ipAddress: '1.1.1.1',
        terminal: 'WEB',
        loginFlow: 'EMAIL_PASSWORD'
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

  it('forwards PDA terminal to downstream password login instead of trusting the client payload', async () => {
    const authAdapter = {
      loginWithEmailPassword: jest.fn().mockResolvedValue({
        status: LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED,
        userId: 'user-1',
        loginMethod: 'EMAIL_PASSWORD',
        accounts: []
      })
    }
    const terminalDeviceAdapter = {
      resolveLoginDeviceContext: jest.fn().mockResolvedValue({
        allowed: true,
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound'
      })
    }

    const useCase = new LoginUseCase(authAdapter as any, undefined, terminalDeviceAdapter as any)

    await useCase.execute(
      {
        method: LoginMethodDto.EMAIL_PASSWORD,
        identifier: 'worker@example.com',
        credential: 'secret',
        device: {
          deviceId: 'terminal-device-1'
        }
      },
      { requestId: 'req-1' },
      {},
      'PDA'
    )

    expect(authAdapter.loginWithEmailPassword).toHaveBeenCalledWith(
      expect.objectContaining({
        terminal: 'PDA',
        loginFlow: 'PASSWORD'
      }),
      expect.objectContaining({ requestId: 'req-1' })
    )
  })

  it('filters extension account options to browser-extension eligible tenant accounts', async () => {
    const authAdapter = {
      loginWithEmailPassword: jest.fn().mockResolvedValue({
        status: LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED,
        userId: 'user-1',
        loginMethod: 'EMAIL_PASSWORD',
        accounts: [
          {
            accountId: 'designer-account',
            tenantId: 'tenant-1',
            tenantName: 'Tenant 1',
            displayName: 'Designer',
            scopeLevel: 'TENANT'
          },
          {
            accountId: 'web-only-account',
            tenantId: 'tenant-2',
            tenantName: 'Tenant 2',
            displayName: 'Web Only',
            scopeLevel: 'TENANT'
          },
          {
            accountId: 'system-account',
            displayName: 'System Admin',
            scopeLevel: 'SYSTEM'
          }
        ]
      })
    }
    const terminalAccessAdapter = {
      resolveAccountTerminalAccess: jest
        .fn()
        .mockResolvedValueOnce({ allowed: true })
        .mockResolvedValueOnce({ allowed: false })
    }
    const useCase = new LoginUseCase(
      authAdapter as any,
      undefined,
      undefined,
      terminalAccessAdapter as any
    )

    const result = await useCase.execute(
      {
        method: LoginMethodDto.EMAIL_PASSWORD,
        identifier: 'designer@example.com',
        credential: 'secret'
      },
      { requestId: 'req-1', traceId: 'trace-1' },
      {},
      'BROWSER_EXTENSION'
    )

    expect(terminalAccessAdapter.resolveAccountTerminalAccess).toHaveBeenCalledTimes(2)
    expect(authAdapter.loginWithEmailPassword).toHaveBeenCalledWith(
      expect.objectContaining({
        terminal: 'BROWSER_EXTENSION',
        loginFlow: 'PASSWORD'
      }),
      expect.objectContaining({ requestId: 'req-1' })
    )
    expect(terminalAccessAdapter.resolveAccountTerminalAccess).toHaveBeenCalledWith(
      {
        accountId: 'designer-account',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        terminal: 'BROWSER_EXTENSION'
      },
      expect.objectContaining({ requestId: 'req-1' })
    )
    expect(terminalAccessAdapter.resolveAccountTerminalAccess).toHaveBeenCalledWith(
      {
        accountId: 'web-only-account',
        tenantId: 'tenant-2',
        scopeLevel: 'TENANT',
        terminal: 'BROWSER_EXTENSION'
      },
      expect.objectContaining({ requestId: 'req-1' })
    )
    expect(result).toEqual(
      expect.objectContaining({
        status: 'ACCOUNT_SELECTION_REQUIRED',
        accountOptions: [
          expect.objectContaining({
            accountId: 'designer-account',
            tenantId: 'tenant-1',
            scopeLevel: 'TENANT'
          })
        ]
      })
    )
  })

  it('forwards PDA employee-code PIN login to auth-service with device-bound context', async () => {
    const authAdapter = {
      loginWithEmployeeCodePin: jest.fn().mockResolvedValue({
        status: LoginStatus.LOGIN_STATUS_SUCCESS,
        userId: 'user-1',
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 900,
        loginMethod: 'EMPLOYEE_CODE_PIN',
        terminal: 'PDA',
        allowedTerminals: ['PDA']
      })
    }
    const terminalDeviceAdapter = {
      resolveLoginDeviceContext: jest.fn().mockResolvedValue({
        allowed: true,
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound'
      })
    }
    const useCase = new LoginUseCase(authAdapter as any, undefined, terminalDeviceAdapter as any)

    await useCase.execute(
      {
        method: LoginMethodDto.EMPLOYEE_CODE_PIN,
        identifier: ' EMP001 ',
        credential: '482915',
        device: {
          deviceId: 'terminal-device-1',
          deviceName: ' Warehouse PDA '
        }
      },
      { requestId: 'req-1' },
      { userAgent: ' OES-PDA/1.0 ', ipAddress: ' 10.0.0.7 ' },
      'PDA'
    )

    expect(authAdapter.loginWithEmployeeCodePin).toHaveBeenCalledWith(
      {
        employeeCode: 'EMP001',
        pin: '482915',
        deviceName: 'Warehouse PDA',
        userAgent: 'OES-PDA/1.0',
        ipAddress: '10.0.0.7',
        terminal: 'PDA',
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound',
        loginFlow: 'EMPLOYEE_CODE_PIN'
      },
      expect.objectContaining({ requestId: 'req-1' })
    )
  })

  it('preflights PDA employee-code PIN login before the PIN popup opens', async () => {
    const authAdapter = {
      preflightEmployeeCodePin: jest.fn().mockResolvedValue({
        allowed: true,
        reasonCode: 'READY_FOR_PIN',
        message: 'READY_FOR_PIN'
      })
    }
    const terminalDeviceAdapter = {
      resolveLoginDeviceContext: jest.fn().mockResolvedValue({
        allowed: true,
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound'
      })
    }
    const useCase = new LoginUseCase(authAdapter as any, undefined, terminalDeviceAdapter as any)

    await expect(
      useCase.preflightEmployeeCodePin(
        {
          employeeCode: ' EMP-0AF-0001 ',
          device: {
            deviceId: 'terminal-device-1',
            deviceName: ' Warehouse PDA '
          }
        },
        { requestId: 'req-1' },
        { userAgent: ' OES-PDA/1.0 ', ipAddress: ' 10.0.0.7 ' },
        'PDA'
      )
    ).resolves.toEqual({
      allowed: true,
      reasonCode: 'READY_FOR_PIN',
      message: 'READY_FOR_PIN'
    })

    expect(authAdapter.preflightEmployeeCodePin).toHaveBeenCalledWith(
      {
        employeeCode: 'EMP-0AF-0001',
        terminal: 'PDA',
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound',
        loginFlow: 'EMPLOYEE_CODE_PIN'
      },
      expect.objectContaining({ requestId: 'req-1' })
    )
  })

  it('denies PDA employee-code preflight before auth-service when the managed device is unavailable', async () => {
    const authAdapter = {
      preflightEmployeeCodePin: jest.fn()
    }
    const terminalDeviceAdapter = {
      resolveLoginDeviceContext: jest.fn().mockResolvedValue({
        allowed: false,
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound',
        reasonCode: 'DEVICE_LOST'
      })
    }
    const useCase = new LoginUseCase(authAdapter as any, undefined, terminalDeviceAdapter as any)

    await expect(
      useCase.preflightEmployeeCodePin(
        {
          employeeCode: 'EMP-0AF-0001',
          device: {
            deviceId: 'terminal-device-1'
          }
        },
        { requestId: 'req-1' },
        {},
        'PDA'
      )
    ).resolves.toEqual({
      allowed: false,
      reasonCode: 'TERMINAL_ACCESS_DENIED',
      message: 'DEVICE_LOST'
    })
    expect(authAdapter.preflightEmployeeCodePin).not.toHaveBeenCalled()
  })

  it('resolves PDA device context before calling auth-service and ignores tenant hints', async () => {
    const calls: string[] = []
    const authAdapter = {
      loginWithEmailPassword: jest.fn().mockImplementation(async () => {
        calls.push('auth')
        return {
          status: LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED,
          userId: 'user-1',
          loginMethod: 'EMAIL_PASSWORD',
          accounts: []
        }
      })
    }
    const terminalDeviceAdapter = {
      resolveLoginDeviceContext: jest.fn().mockImplementation(async () => {
        calls.push('terminal-device')
        return {
          allowed: true,
          terminalDeviceId: 'terminal-device-1',
          deviceBoundTenantId: 'tenant-bound'
        }
      })
    }

    const useCase = new LoginUseCase(authAdapter as any, undefined, terminalDeviceAdapter as any)

    await useCase.execute(
      {
        method: LoginMethodDto.EMAIL_PASSWORD,
        identifier: 'worker@example.com',
        credential: 'secret',
        tenantHint: 'frontend-selected-tenant',
        device: {
          deviceId: ' terminal-device-1 ',
          deviceName: ' Warehouse PDA ',
          identity: {
            manufacturerSerial: ' SEUIC-SN-123456 ',
            androidId: ' android-id-1 ',
            appInstallationId: ' install-1 ',
            manufacturer: ' Seuic ',
            model: ' Cruise Ge '
          },
          software: {
            androidVersion: ' 9 ',
            webViewVersion: ' 66.0.3359.158 ',
            appVersion: ' 2.0.0 '
          }
        }
      },
      { requestId: 'req-1', traceId: 'trace-1' },
      { userAgent: ' OES-PDA/1.0 ', ipAddress: ' 10.0.0.7 ' },
      'PDA'
    )

    expect(calls).toEqual(['terminal-device', 'auth'])
    expect(terminalDeviceAdapter.resolveLoginDeviceContext).toHaveBeenCalledWith({
      terminalDeviceId: 'terminal-device-1',
      deviceMetadata: expect.objectContaining({
        deviceName: 'Warehouse PDA',
        manufacturerSerial: 'SEUIC-SN-123456',
        androidId: 'android-id-1',
        appInstallationId: 'install-1',
        manufacturer: 'Seuic',
        model: 'Cruise Ge',
        androidVersion: '9',
        webViewVersion: '66.0.3359.158',
        appVersion: '2.0.0',
        userAgent: 'OES-PDA/1.0',
        ipAddress: '10.0.0.7'
      })
    })
    expect(authAdapter.loginWithEmailPassword).toHaveBeenCalledWith(
      expect.objectContaining({
        terminal: 'PDA',
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound'
      }),
      expect.objectContaining({ requestId: 'req-1', traceId: 'trace-1' })
    )
    expect(authAdapter.loginWithEmailPassword).not.toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'frontend-selected-tenant' }),
      expect.anything()
    )
  })

  it('returns stable PDA terminal-device denial without calling auth-service', async () => {
    const authAdapter = {
      loginWithEmailPassword: jest.fn()
    }
    const terminalDeviceAdapter = {
      resolveLoginDeviceContext: jest.fn().mockResolvedValue({
        allowed: false,
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound',
        reasonCode: 'DEVICE_DISABLED'
      })
    }

    const useCase = new LoginUseCase(authAdapter as any, undefined, terminalDeviceAdapter as any)

    const result = await useCase.execute(
      {
        method: LoginMethodDto.EMAIL_PASSWORD,
        identifier: 'worker@example.com',
        credential: 'secret',
        device: {
          deviceId: 'terminal-device-1'
        }
      },
      { requestId: 'req-1' },
      {},
      'PDA'
    )

    expect(authAdapter.loginWithEmailPassword).not.toHaveBeenCalled()
    expect(result).toEqual(
      expect.objectContaining({
        status: 'DENIED',
        nextStep: 'NONE',
        reasonCode: 'TERMINAL_ACCESS_DENIED',
        accountOptions: []
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
