import { PdaAuthController } from './terminal-auth.controller'
import { LoginMethodDto } from '../dtos/login.dto'
import { BadRequestException } from '@nestjs/common'

describe('PdaAuthController', () => {
  it('submits PDA login with server-owned PDA terminal', async () => {
    const loginUseCase = {
      execute: jest.fn().mockResolvedValue({ status: 'DENIED', nextStep: 'NONE', accountOptions: [] })
    }
    const controller = new PdaAuthController(
      loginUseCase as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    )

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
    const controller = new PdaAuthController(
      {} as any,
      { execute: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    )

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
    const controller = new PdaAuthController(
      loginUseCase as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    )

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
