import { PdaDeviceEnrollmentUseCase } from './pda-device-enrollment.use-case'

describe('PdaDeviceEnrollmentUseCase', () => {
  it('activates enrollment through terminal-device-service and returns a PDA decision', async () => {
    const terminalDeviceAdapter = {
      activateEnrollment: jest.fn().mockResolvedValue({
        activated: true,
        terminalDeviceId: 'tdv-1',
        tenantId: 'tenant-1',
        terminalDeviceType: 'PDA',
        deviceStatus: 'ACTIVE',
        decisionCode: 'ALLOW'
      }),
      resolveDeviceAccessDecision: jest.fn().mockResolvedValue({
        allowed: true,
        decisionCode: 'ALLOW',
        resolvedTenantId: 'tenant-1',
        terminalDeviceId: 'tdv-1',
        terminalDeviceType: 'PDA',
        deviceStatus: 'ACTIVE',
        presenceStatus: 'UNKNOWN',
        requiredAction: 'NONE',
        shouldClearLocalSession: false,
        shouldClearLocalTerminalDeviceId: false
      })
    }
    const useCase = new PdaDeviceEnrollmentUseCase(terminalDeviceAdapter as any)

    const result = await useCase.execute(
      {
        enrollmentCode: 'ENR-123456',
        device: {
          terminalDeviceType: 'PDA',
          identity: {
            manufacturerSerial: 'SEUIC-SN-123456',
            manufacturer: 'Seuic',
            model: 'Cruise Ge'
          },
          software: {
            androidVersion: '9',
            webViewVersion: '66.0.3359.158',
            appVersion: '2.0.0'
          }
        },
        clientTime: '2026-05-16T10:00:00.000Z'
      },
      { traceId: 'trace-1' }
    )

    expect(terminalDeviceAdapter.activateEnrollment).toHaveBeenCalledWith({
      enrollmentCode: 'ENR-123456',
      device: expect.objectContaining({
        terminalDeviceType: 'PDA',
        identity: expect.objectContaining({
          manufacturerSerial: 'SEUIC-SN-123456'
        })
      }),
      traceId: 'trace-1'
    })
    expect(terminalDeviceAdapter.resolveDeviceAccessDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        terminalDeviceId: 'tdv-1',
        tenantId: 'tenant-1',
        requestPurpose: 'ENROLLMENT'
      })
    )
    expect(result).toEqual(
      expect.objectContaining({
        enrolled: true,
        terminalDeviceId: 'tdv-1',
        tenantId: 'tenant-1',
        decision: expect.objectContaining({
          allowed: true,
          decisionCode: 'ALLOW'
        })
      })
    )
  })

  it('maps rejected enrollment without decoding tenant from the QR payload', async () => {
    const terminalDeviceAdapter = {
      activateEnrollment: jest.fn().mockResolvedValue({
        activated: false,
        terminalDeviceId: '',
        tenantId: '',
        terminalDeviceType: 'PDA',
        deviceStatus: null,
        decisionCode: 'ENROLLMENT_EXPIRED'
      }),
      resolveDeviceAccessDecision: jest.fn()
    }
    const useCase = new PdaDeviceEnrollmentUseCase(terminalDeviceAdapter as any)

    const result = await useCase.execute(
      {
        enrollmentCode: 'oes-pda-enrollment://tenant-should-not-be-decoded/ENR-EXPIRED',
        device: {
          terminalDeviceType: 'PDA',
          identity: {},
          software: {
            appVersion: '2.0.0'
          }
        },
        clientTime: '2026-05-16T10:00:00.000Z'
      },
      {}
    )

    expect(terminalDeviceAdapter.activateEnrollment).toHaveBeenCalledWith(
      expect.objectContaining({
        enrollmentCode: 'oes-pda-enrollment://tenant-should-not-be-decoded/ENR-EXPIRED'
      })
    )
    expect(terminalDeviceAdapter.resolveDeviceAccessDecision).not.toHaveBeenCalled()
    expect(result).toEqual(
      expect.objectContaining({
        enrolled: false,
        terminalDeviceId: null,
        tenantId: null,
        decision: expect.objectContaining({
          allowed: false,
          decisionCode: 'ENROLLMENT_EXPIRED',
          requiredAction: 'CONTACT_ADMIN'
        })
      })
    )
  })
})
