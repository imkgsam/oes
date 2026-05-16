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
})
