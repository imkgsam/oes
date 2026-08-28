import { PdaSessionBootstrapUseCase } from './pda-session-bootstrap.use-case'

describe('PdaSessionBootstrapUseCase', () => {
  it('builds the managed PDA bootstrap payload from session context and device decision', async () => {
    const identityAdapter = {
      getAccountById: jest.fn().mockResolvedValue({
        account: {
          id: 'account-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          displayName: 'Worker One',
          isEnabled: true
        }
      })
    }
    const sessionAccessSummaryUseCase = {
      execute: jest.fn().mockResolvedValue({
        roles: [{ code: 'tenant.worker' }],
        actionCodes: ['pda.home']
      })
    }
    const terminalDeviceAdapter = {
      resolveDeviceAccessDecision: jest.fn().mockResolvedValue({
        allowed: true,
        decisionCode: 'ALLOW',
        resolvedTenantId: 'tenant-1',
        terminalDeviceId: 'terminal-device-1',
        terminalDeviceType: 'PDA',
        deviceStatus: 'ACTIVE',
        presenceStatus: 'ONLINE',
        requiredAction: 'NONE',
        shouldClearLocalSession: false,
        shouldClearLocalTerminalDeviceId: false,
        versionPolicy: {
          minSupportedAppVersion: '2.0.0',
          latestAppVersion: '2.1.0',
          upgradeRequired: false,
          upgradeRecommended: true
        }
      })
    }
    const useCase = new PdaSessionBootstrapUseCase(
      identityAdapter as any,
      sessionAccessSummaryUseCase as any,
      terminalDeviceAdapter as any
    )

    const result = await useCase.execute(
      {
        user: {
          userId: 'user-1',
          holderId: 'account-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          sid: 'session-1',
          terminal: 'PDA'
        }
      } as any,
      'terminal-device-1',
      'credential-1'
    )

    expect(terminalDeviceAdapter.resolveDeviceAccessDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        terminalDeviceId: 'terminal-device-1',
        requestPurpose: 'BOOTSTRAP',
        deviceCredential: 'credential-1',
        session: {
          accountId: 'account-1',
          sessionId: 'session-1'
        }
      })
    )
    expect(result).toEqual(
      expect.objectContaining({
        account: {
          accountId: 'account-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          displayName: 'Worker One'
        },
        session: expect.objectContaining({
          sessionId: 'session-1',
          terminal: 'PDA',
          terminalDeviceId: 'terminal-device-1',
          idleTimeoutSeconds: 900
        }),
        access: {
          roles: ['tenant.worker'],
          actionCodes: ['pda.home']
        },
        device: expect.objectContaining({
          terminalDeviceId: 'terminal-device-1',
          tenantId: 'tenant-1',
          deviceStatus: 'ACTIVE'
        }),
        decision: expect.objectContaining({
          decisionCode: 'ALLOW',
          versionPolicy: expect.objectContaining({
            minSupportedAppVersion: '2.0.0',
            latestAppVersion: '2.1.0'
          })
        }),
        workbench: {
          mode: 'FOUNDATION_ACCEPTANCE',
          enabledCards: ['SESSION', 'DEVICE', 'NETWORK', 'SCAN', 'CAMERA', 'LOGS']
        },
        serverTime: expect.any(String)
      })
    )
  })

  it.each([
    ['non-PDA terminal', { terminal: 'WEB', tenantId: 'tenant-1' }, 'tenant-1'],
    ['signed tenant mismatch', { terminal: 'PDA', tenantId: 'tenant-2' }, 'tenant-1'],
    ['device tenant mismatch', { terminal: 'PDA', tenantId: 'tenant-1' }, 'tenant-2']
  ])('fails closed for %s', async (_label, userOverrides, resolvedTenantId) => {
    const identityAdapter = {
      getAccountById: jest.fn().mockResolvedValue({
        account: { id: 'account-1', tenantId: 'tenant-1', scopeLevel: 'TENANT', isEnabled: true }
      })
    }
    const access = { execute: jest.fn().mockResolvedValue({ roles: [], actionCodes: [] }) }
    const device = {
      resolveDeviceAccessDecision: jest.fn().mockResolvedValue({
        allowed: true,
        resolvedTenantId,
        terminalDeviceId: 'terminal-device-1',
        deviceStatus: 'ACTIVE'
      })
    }
    const useCase = new PdaSessionBootstrapUseCase(
      identityAdapter as any,
      access as any,
      device as any
    )

    await expect(
      useCase.execute(
        {
          user: {
            userId: 'user-1',
            holderId: 'account-1',
            scopeLevel: 'TENANT',
            ...userOverrides
          }
        } as any,
        'terminal-device-1',
        'credential-1'
      )
    ).rejects.toThrow()
  })

  it('does not invoke Identity, Permission or Terminal dependencies for a non-PDA session', async () => {
    const identity = { getAccountById: jest.fn() }
    const access = { execute: jest.fn() }
    const device = { resolveDeviceAccessDecision: jest.fn() }
    const useCase = new PdaSessionBootstrapUseCase(identity as any, access as any, device as any)

    await expect(
      useCase.execute({ user: { terminal: 'WEB' } } as any, 'device-1', 'credential-1')
    ).rejects.toThrow('PDA bootstrap requires a PDA terminal session')
    expect(identity.getAccountById).not.toHaveBeenCalled()
    expect(access.execute).not.toHaveBeenCalled()
    expect(device.resolveDeviceAccessDecision).not.toHaveBeenCalled()
  })
})
