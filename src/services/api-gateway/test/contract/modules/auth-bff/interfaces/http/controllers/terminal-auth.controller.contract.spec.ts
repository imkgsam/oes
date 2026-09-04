import { ExtensionAuthController, PdaAuthController } from '../../../../../../../src/modules/auth-bff/interfaces/http/controllers/terminal-auth.controller'
import { LoginMethodDto } from '../../../../../../../src/modules/auth-bff/interfaces/http/dtos/login.dto'
import { BadRequestException } from '@nestjs/common'
import { LoginUseCase } from '../../../../../../../src/modules/auth-bff/application/use-cases/login.use-case'

function createPdaController(
  overrides: {
    loginUseCase?: unknown
    selectAccountUseCase?: unknown
    switchContextUseCase?: unknown
  } = {}
): PdaAuthController {
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

function createExtensionController(
  overrides: {
    loginUseCase?: unknown
    selectAccountUseCase?: unknown
    switchContextUseCase?: unknown
  } = {}
): ExtensionAuthController {
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
      execute: jest
        .fn()
        .mockResolvedValue({ status: 'DENIED', nextStep: 'NONE', accountOptions: [] })
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
      'PDA',
      undefined
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

  it('forwards an opaque PDA employee-code credential to Terminal Device before Auth', async () => {
    const { authAdapter, terminalDeviceAdapter, controller } = createPdaPreflightHarness({
      allowed: true,
      terminalDeviceId: 'terminal-device-1',
      deviceBoundTenantId: 'tenant-bound'
    })

    await expect(
      controller.preflightEmployeeCodePin(
        {
          employeeCode: 'EMP-0AF-0001',
          device: { deviceId: 'terminal-device-1' }
        },
        { requestId: 'req-1', traceId: 'trace-1' },
        'OES-PDA/1.0',
        '10.0.0.7',
        ' opaque-device-credential '
      )
    ).resolves.toEqual({
      allowed: true,
      reasonCode: 'READY_FOR_PIN',
      message: 'READY_FOR_PIN'
    })

    expect(terminalDeviceAdapter.resolveLoginDeviceContext).toHaveBeenCalledWith(
      expect.objectContaining({ deviceCredential: ' opaque-device-credential ' })
    )
    expect(authAdapter.preflightEmployeeCodePin).toHaveBeenCalledTimes(1)
  })

  it('denies a missing PDA employee-code credential before owner and Auth calls', async () => {
    const { authAdapter, terminalDeviceAdapter, controller } = createPdaPreflightHarness({
      allowed: true,
      terminalDeviceId: 'terminal-device-1',
      deviceBoundTenantId: 'tenant-bound'
    })

    await expect(
      controller.preflightEmployeeCodePin(
        { employeeCode: 'EMP-0AF-0001', device: { deviceId: 'terminal-device-1' } },
        { requestId: 'req-1', traceId: 'trace-1' },
        'OES-PDA/1.0',
        '10.0.0.7'
      )
    ).resolves.toEqual({
      allowed: false,
      reasonCode: 'TERMINAL_ACCESS_DENIED',
      message: 'DEVICE_CREDENTIAL_REQUIRED'
    })
    expect(terminalDeviceAdapter.resolveLoginDeviceContext).not.toHaveBeenCalled()
    expect(authAdapter.preflightEmployeeCodePin).not.toHaveBeenCalled()
  })

  it('forwards a wrong PDA employee-code credential and denies before Auth', async () => {
    const { authAdapter, terminalDeviceAdapter, controller } = createPdaPreflightHarness({
      allowed: false,
      terminalDeviceId: 'terminal-device-1',
      deviceBoundTenantId: 'tenant-bound',
      reasonCode: 'DEVICE_CREDENTIAL_INVALID'
    })

    await expect(
      controller.preflightEmployeeCodePin(
        { employeeCode: 'EMP-0AF-0001', device: { deviceId: 'terminal-device-1' } },
        { requestId: 'req-1', traceId: 'trace-1' },
        'OES-PDA/1.0',
        '10.0.0.7',
        'wrong-device-credential'
      )
    ).resolves.toEqual({
      allowed: false,
      reasonCode: 'TERMINAL_ACCESS_DENIED',
      message: 'DEVICE_CREDENTIAL_INVALID'
    })
    expect(terminalDeviceAdapter.resolveLoginDeviceContext).toHaveBeenCalledWith(
      expect.objectContaining({ deviceCredential: 'wrong-device-credential' })
    )
    expect(authAdapter.preflightEmployeeCodePin).not.toHaveBeenCalled()
  })
})

/** Builds the HTTP-level PDA preflight path with real orchestration and observable owner/Auth calls. */
function createPdaPreflightHarness(deviceDecision: Record<string, unknown>) {
  const authAdapter = {
    preflightEmployeeCodePin: jest.fn().mockResolvedValue({
      allowed: true,
      reasonCode: 'READY_FOR_PIN',
      message: 'READY_FOR_PIN'
    })
  }
  const terminalDeviceAdapter = {
    resolveLoginDeviceContext: jest.fn().mockResolvedValue(deviceDecision)
  }
  const loginUseCase = new LoginUseCase(
    authAdapter as never,
    undefined,
    terminalDeviceAdapter as never
  )
  return {
    authAdapter,
    terminalDeviceAdapter,
    controller: createPdaController({ loginUseCase })
  }
}

describe('ExtensionAuthController', () => {
  it('submits extension login with server-owned browser extension terminal', async () => {
    const loginUseCase = {
      execute: jest
        .fn()
        .mockResolvedValue({ status: 'DENIED', nextStep: 'NONE', accountOptions: [] })
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
      'BROWSER_EXTENSION',
      undefined
    )
  })

  it('selects extension accounts with server-owned browser extension terminal', async () => {
    const selectAccountUseCase = {
      execute: jest
        .fn()
        .mockResolvedValue({ status: 'SUCCESS', nextStep: 'NONE', accountOptions: [] })
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
