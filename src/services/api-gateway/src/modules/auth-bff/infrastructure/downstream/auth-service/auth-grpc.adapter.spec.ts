import { of } from 'rxjs'
import { MfaBindingType } from '@oes/common/generated/auth_service'
import { AuthGrpcAdapter } from './auth-grpc.adapter'

describe('AuthGrpcAdapter', () => {
  it('forwards PDA device-bound context on email-password login', async () => {
    const svc = {
      loginWithEmailPassword: jest.fn().mockReturnValue(of({ userId: 'user-1' }))
    }
    const adapter = new AuthGrpcAdapter(
      { getService: jest.fn().mockReturnValue(svc) } as any,
      { createInternalCallMetadata: jest.fn().mockReturnValue({}) } as any
    )
    adapter.onModuleInit()

    await adapter.loginWithEmailPassword(
      {
        email: 'worker@example.com',
        password: 'secret',
        terminal: 'PDA',
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound'
      },
      { requestId: 'req-1' }
    )

    expect(svc.loginWithEmailPassword).toHaveBeenCalledWith(
      expect.objectContaining({
        terminal: 'PDA',
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound'
      }),
      expect.anything()
    )
  })

  it('forwards PDA employee-code PIN login without exposing HR or identity orchestration', async () => {
    const svc = {
      loginWithEmployeeCodePin: jest.fn().mockReturnValue(of({ userId: 'user-1' }))
    }
    const adapter = new AuthGrpcAdapter(
      { getService: jest.fn().mockReturnValue(svc) } as any,
      { createInternalCallMetadata: jest.fn().mockReturnValue({}) } as any
    )
    adapter.onModuleInit()

    await adapter.loginWithEmployeeCodePin(
      {
        employeeCode: 'EMP001',
        pin: '482915',
        terminal: 'PDA',
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound',
        loginFlow: 'EMPLOYEE_CODE_PIN'
      },
      { requestId: 'req-1' }
    )

    expect(svc.loginWithEmployeeCodePin).toHaveBeenCalledWith(
      {
        employeeCode: 'EMP001',
        pin: '482915',
        terminal: 'PDA',
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-bound',
        loginFlow: 'EMPLOYEE_CODE_PIN'
      },
      expect.anything()
    )
  })

  it('forwards terminal PIN self-service mutations with request metadata', async () => {
    const svc = {
      setOwnTerminalPin: jest.fn().mockReturnValue(of({ success: true })),
      resetOwnTerminalPin: jest.fn().mockReturnValue(of({ success: true })),
      setOwnTerminalPinEnabled: jest.fn().mockReturnValue(of({ success: true }))
    }
    const metadataFactory = {
      createInternalCallMetadata: jest.fn().mockReturnValue({ internal: true })
    }
    const adapter = new AuthGrpcAdapter({ getService: jest.fn().mockReturnValue(svc) } as any, metadataFactory as any)
    adapter.onModuleInit()

    await adapter.setOwnTerminalPin(
      {
        userId: 'user-1',
        currentPassword: 'CurrentSecret123!',
        newPin: '482915',
        mfaGrantToken: 'step-up-grant-1'
      },
      { requestId: 'req-1' }
    )
    await adapter.resetOwnTerminalPin(
      {
        userId: 'user-1',
        currentPassword: 'CurrentSecret123!',
        newPin: '739204',
        mfaGrantToken: 'step-up-grant-2'
      },
      { requestId: 'req-2' }
    )
    await adapter.setOwnTerminalPinEnabled(
      {
        userId: 'user-1',
        enabled: false
      },
      { requestId: 'req-3' }
    )

    expect(svc.setOwnTerminalPin).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        currentPassword: 'CurrentSecret123!',
        newPin: '482915',
        mfaGrantToken: 'step-up-grant-1'
      },
      { internal: true }
    )
    expect(svc.resetOwnTerminalPin).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        currentPassword: 'CurrentSecret123!',
        newPin: '739204',
        mfaGrantToken: 'step-up-grant-2'
      },
      { internal: true }
    )
    expect(svc.setOwnTerminalPinEnabled).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        enabled: false
      },
      { internal: true }
    )
  })

  it('forwards terminal policy management calls with operator-scoped metadata', async () => {
    const svc = {
      getPlatformTerminalLoginPolicy: jest.fn().mockReturnValue(of({ entries: [] })),
      updatePlatformTerminalLoginPolicy: jest.fn().mockReturnValue(of({ entries: [] })),
      updateTenantTerminalMfaPolicy: jest.fn().mockReturnValue(of({ tenantId: 'tenant-1', entries: [] }))
    }
    const adapter = new AuthGrpcAdapter(
      { getService: jest.fn().mockReturnValue(svc) } as any,
      {
        createInternalCallMetadata: jest.fn().mockReturnValue({ internal: true }),
        createOperatorScopedMetadata: jest.fn().mockReturnValue({ operator: true })
      } as any
    )
    adapter.onModuleInit()

    await adapter.getPlatformTerminalLoginPolicy({ user: { sub: 'operator-1' } } as any)
    await adapter.updatePlatformTerminalLoginPolicy(
      { entries: [{ terminal: 'WEB', enabledLoginFlows: ['EMAIL_PASSWORD'] }] },
      { user: { sub: 'operator-1' } } as any
    )
    await adapter.updateTenantTerminalMfaPolicy(
      {
        tenantId: 'tenant-1',
        entries: [
          {
            terminal: 'PDA',
            loginMfaRequired: false,
            newDeviceMfaRequired: false,
            allowedFactors: ['EMAIL_OTP'],
            factorPriority: ['EMAIL_OTP']
          }
        ]
      },
      { user: { sub: 'operator-1' } } as any
    )

    expect(svc.getPlatformTerminalLoginPolicy).toHaveBeenCalledWith({}, { operator: true })
    expect(svc.updatePlatformTerminalLoginPolicy).toHaveBeenCalledWith(
      {
        entries: [
          {
            terminal: 'WEB',
            enabledLoginFlows: ['EMAIL_PASSWORD']
          }
        ]
      },
      { operator: true }
    )
    expect(svc.updateTenantTerminalMfaPolicy).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        entries: [
          {
            terminal: 'PDA',
            loginMfaRequired: false,
            newDeviceMfaRequired: false,
            allowedFactors: [MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP],
            factorPriority: [MfaBindingType.MFA_BINDING_TYPE_EMAIL_OTP]
          }
        ]
      },
      { operator: true }
    )
  })

  it('forwards external API-key exchange with the signed MACHINE root context', async () => {
    const metadataFactory = {
      createInternalCallMetadata: jest.fn().mockReturnValue({ internal: true }),
    }
    const trustedClient = {
      issueExchangeToken: jest.fn().mockResolvedValue('sts-token'),
      exchangeExternalApiKey: jest.fn().mockResolvedValue({ accessToken: 'signed' })
    }
    const adapter = new AuthGrpcAdapter(
      { getService: jest.fn().mockReturnValue({}) } as any,
      metadataFactory as any,
      trustedClient as any
    )
    adapter.onModuleInit()

    await adapter.exchangeExternalApiKey(
      { presentedApiKey: 'oek_live_identifier.secret' },
      { requestId: 'req-1', traceId: 'trace-1' }
    )

    expect(trustedClient.issueExchangeToken).toHaveBeenCalledWith({ internal: true })
    expect(trustedClient.exchangeExternalApiKey).toHaveBeenCalledWith(
      { presentedApiKey: 'oek_live_identifier.secret' },
      { internal: true },
      'sts-token'
    )
  })
})
