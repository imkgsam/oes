import { ExtensionAuthController, PdaAuthController } from './terminal-auth.controller'
import { LoginMethodDto } from '../dtos/login.dto'
import { BadRequestException } from '@nestjs/common'

function createPdaController(overrides: {
  loginUseCase?: unknown
  selectAccountUseCase?: unknown
  switchContextUseCase?: unknown
} = {}): PdaAuthController {
  return new PdaAuthController(
    (overrides.loginUseCase ?? {}) as any,
    (overrides.selectAccountUseCase ?? {}) as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    (overrides.switchContextUseCase ?? {}) as any,
    {} as any
  )
}

function createExtensionController(overrides: {
  loginUseCase?: unknown
  selectAccountUseCase?: unknown
  switchContextUseCase?: unknown
} = {}): ExtensionAuthController {
  return new ExtensionAuthController(
    (overrides.loginUseCase ?? {}) as any,
    (overrides.selectAccountUseCase ?? {}) as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    (overrides.switchContextUseCase ?? {}) as any,
    {} as any
  )
}

describe('PdaAuthController', () => {
  it('submits PDA login with server-owned PDA terminal', async () => {
    const loginUseCase = {
      execute: jest.fn().mockResolvedValue({ status: 'DENIED', nextStep: 'NONE', accountOptions: [] })
    }
    const controller = createPdaController({ loginUseCase })

    await controller.login(
      {
        method: LoginMethodDto.EMAIL_PASSWORD,
        identifier: 'worker@example.com',
        credential: 'secret',
        tenantHint: 'frontend-selected-tenant'
      },
      { requestId: 'req-1', traceId: 'trace-1' },
      'OES-PDA/1.0',
      '10.0.0.7'
    )

    expect(loginUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantHint: 'frontend-selected-tenant'
      }),
      { requestId: 'req-1', traceId: 'trace-1' },
      { userAgent: 'OES-PDA/1.0', ipAddress: '10.0.0.7' },
      'PDA'
    )
  })

  it('rejects PDA account selection as a normal Phase 2 path', async () => {
    const controller = createPdaController({ selectAccountUseCase: { execute: jest.fn() } })

    await expect(
      controller.selectAccount(
        {
          userId: 'user-1',
          accountId: 'account-1',
          loginMethod: LoginMethodDto.EMAIL_PASSWORD
        },
        { requestId: 'req-1' },
        'OES-PDA/1.0',
        '10.0.0.7'
      )
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('routes PDA employee-code preflight through the server-owned PDA terminal', async () => {
    const loginUseCase = {
      preflightEmployeeCodePin: jest.fn().mockResolvedValue({
        allowed: true,
        reasonCode: 'READY_FOR_PIN',
        message: 'READY_FOR_PIN'
      })
    }
    const controller = createPdaController({ loginUseCase })

    await expect(
      controller.preflightEmployeeCodePin(
        {
          employeeCode: 'EMP-0AF-0001',
          device: { deviceId: 'terminal-device-1' }
        },
        { requestId: 'req-1', traceId: 'trace-1' },
        'OES-PDA/1.0',
        '10.0.0.7'
      )
    ).resolves.toEqual({
      allowed: true,
      reasonCode: 'READY_FOR_PIN',
      message: 'READY_FOR_PIN'
    })

    expect(loginUseCase.preflightEmployeeCodePin).toHaveBeenCalledWith(
      expect.objectContaining({ employeeCode: 'EMP-0AF-0001' }),
      { requestId: 'req-1', traceId: 'trace-1' },
      { userAgent: 'OES-PDA/1.0', ipAddress: '10.0.0.7' },
      'PDA'
    )
  })
})

describe('ExtensionAuthController', () => {
  it('submits extension login with server-owned browser extension terminal', async () => {
    const loginUseCase = {
      execute: jest.fn().mockResolvedValue({ status: 'DENIED', nextStep: 'NONE', accountOptions: [] })
    }
    const controller = createExtensionController({ loginUseCase })

    await controller.login(
      {
        method: LoginMethodDto.EMAIL_PASSWORD,
        identifier: 'designer@example.com',
        credential: 'secret',
        tenantHint: 'frontend-selected-tenant'
      },
      { requestId: 'req-1', traceId: 'trace-1' },
      'Chrome Extension/1.0',
      '10.0.0.8'
    )

    expect(loginUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantHint: 'frontend-selected-tenant'
      }),
      { requestId: 'req-1', traceId: 'trace-1' },
      { userAgent: 'Chrome Extension/1.0', ipAddress: '10.0.0.8' },
      'BROWSER_EXTENSION'
    )
  })

  it('selects extension accounts with server-owned browser extension terminal', async () => {
    const selectAccountUseCase = {
      execute: jest.fn().mockResolvedValue({ status: 'SUCCESS', nextStep: 'NONE', accountOptions: [] })
    }
    const controller = createExtensionController({ selectAccountUseCase })

    await controller.selectAccount(
      {
        userId: 'user-1',
        accountId: 'account-1',
        loginMethod: LoginMethodDto.EMAIL_PASSWORD
      },
      { requestId: 'req-1' },
      'Chrome Extension/1.0',
      '10.0.0.8'
    )

    expect(selectAccountUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'account-1'
      }),
      { requestId: 'req-1', traceId: undefined },
      { userAgent: 'Chrome Extension/1.0', ipAddress: '10.0.0.8' },
      'BROWSER_EXTENSION'
    )
  })

  it('switches extension contexts with server-owned browser extension terminal', async () => {
    const switchContextUseCase = {
      execute: jest.fn().mockResolvedValue({
        status: 'SUCCESS',
        context: { accountId: 'account-2', scopeLevel: 'TENANT', tenantId: 'tenant-1' },
        session: { accessToken: 'access-2', refreshToken: 'refresh-2', expiresIn: 3600 }
      })
    }
    const controller = createExtensionController({ switchContextUseCase })

    await controller.switchContext(
      { accountId: 'account-2' },
      { requestId: 'req-1', traceId: 'trace-1' },
      'Chrome Extension/1.0',
      '10.0.0.8'
    )

    expect(switchContextUseCase.execute).toHaveBeenCalledWith(
      { accountId: 'account-2' },
      { requestId: 'req-1', traceId: 'trace-1' },
      { userAgent: 'Chrome Extension/1.0', ipAddress: '10.0.0.8' },
      'BROWSER_EXTENSION'
    )
  })
})
