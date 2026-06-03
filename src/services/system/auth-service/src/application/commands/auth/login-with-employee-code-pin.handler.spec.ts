import { LoginMethodEnum, LoginMethodType, TerminalLoginFlow } from '@oes/common/constants'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { Credential } from '../../../domain/entities/credential.entity'
import { LoginWithEmployeeCodePinCommand } from './login-with-employee-code-pin.command'
import { LoginWithEmployeeCodePinHandler } from './login-with-employee-code-pin.handler'

describe('LoginWithEmployeeCodePinHandler', () => {
  it('resolves active employee and bound account before issuing a PDA session with terminal PIN', async () => {
    const terminalPinMethod = await buildTerminalPinMethod('user-1', '482915')
    const terminalPolicy = { assertFlowAllowed: jest.fn() }
    const loginRisk = {
      assertPasswordLoginAllowed: jest.fn(),
      clearPasswordLoginFailures: jest.fn()
    }
    const hr = {
      resolveActiveEmployeeByCode: jest.fn().mockResolvedValue({
        employeeId: 'employee-1',
        employeeCode: 'EMP001',
        employmentId: 'employment-1'
      })
    }
    const identity = {
      resolveEmployeeLoginAccount: jest.fn().mockResolvedValue({
        employeeId: 'employee-1',
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT',
        displayName: 'Operator One',
        isEnabled: true
      })
    }
    const loginMethods = {
      findByUserIdAndType: jest.fn().mockResolvedValue(terminalPinMethod)
    }
    const resetRequirements = { findActiveByUserId: jest.fn().mockResolvedValue(null) }
    const audit = { emitLoginFailed: jest.fn() }
    const pdaCompletion = {
      complete: jest.fn().mockResolvedValue({
        status: 'SUCCESS',
        userId: 'user-1',
        accountId: 'account-1',
        tenantId: 'tenant-1'
      })
    }

    const handler = new LoginWithEmployeeCodePinHandler(
      terminalPolicy as any,
      loginRisk as any,
      hr as any,
      identity as any,
      loginMethods as any,
      resetRequirements as any,
      audit as any,
      pdaCompletion as any
    )

    const result = await handler.execute(
      new LoginWithEmployeeCodePinCommand('EMP001', '482915', {
        terminal: 'PDA',
        terminalDeviceId: 'terminal-device-1',
        deviceBoundTenantId: 'tenant-1',
        deviceName: 'Cruise Ge'
      })
    )

    expect(terminalPolicy.assertFlowAllowed).toHaveBeenCalledWith(
      'PDA',
      TerminalLoginFlow.EmployeeCodePin
    )
    expect(hr.resolveActiveEmployeeByCode).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      employeeCode: 'EMP001'
    })
    expect(identity.resolveEmployeeLoginAccount).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      employeeId: 'employee-1'
    })
    expect(pdaCompletion.complete).toHaveBeenCalledWith({
      userId: 'user-1',
      loginMethod: LoginMethodEnum.EmployeeCodePin,
      deviceName: 'Cruise Ge',
      userAgent: undefined,
      ipAddress: undefined,
      terminalDeviceId: 'terminal-device-1',
      deviceBoundTenantId: 'tenant-1',
      loginFlow: TerminalLoginFlow.EmployeeCodePin
    })
    expect(result).toMatchObject({ status: 'SUCCESS', userId: 'user-1' })
    expect(loginRisk.clearPasswordLoginFailures).toHaveBeenCalledWith(
      LoginMethodType.TERMINAL_PIN,
      'user-1:EMPLOYEE_CODE_PIN'
    )
  })

  it('records a generic failed login when employee code cannot resolve', async () => {
    const handler = new LoginWithEmployeeCodePinHandler(
      { assertFlowAllowed: jest.fn() } as any,
      { assertPasswordLoginAllowed: jest.fn(), recordPasswordLoginFailure: jest.fn() } as any,
      { resolveActiveEmployeeByCode: jest.fn().mockResolvedValue(null) } as any,
      { resolveEmployeeLoginAccount: jest.fn() } as any,
      { findByUserIdAndType: jest.fn() } as any,
      { findActiveByUserId: jest.fn() } as any,
      { emitLoginFailed: jest.fn() } as any,
      { complete: jest.fn() } as any
    )

    await expect(
      handler.execute(
        new LoginWithEmployeeCodePinCommand('EMP404', '482915', {
          terminal: 'PDA',
          terminalDeviceId: 'terminal-device-1',
          deviceBoundTenantId: 'tenant-1'
        })
      )
    ).rejects.toThrow('Invalid credentials')
  })

  it('records a disabled bound account before terminal PIN lookup', async () => {
    const audit = { emitLoginFailed: jest.fn() }
    const loginMethodRepository = { findByUserIdAndType: jest.fn() }
    const handler = new LoginWithEmployeeCodePinHandler(
      { assertFlowAllowed: jest.fn() } as any,
      { assertPasswordLoginAllowed: jest.fn(), recordPasswordLoginFailure: jest.fn() } as any,
      {
        resolveActiveEmployeeByCode: jest.fn().mockResolvedValue({
          employeeId: 'employee-1',
          employeeCode: 'EMP001',
          employmentId: 'employment-1'
        })
      } as any,
      {
        resolveEmployeeLoginAccount: jest.fn().mockResolvedValue({
          employeeId: 'employee-1',
          userId: 'user-1',
          accountId: 'account-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          isEnabled: false
        })
      } as any,
      loginMethodRepository as any,
      { findActiveByUserId: jest.fn() } as any,
      audit as any,
      { complete: jest.fn() } as any
    )

    await expect(
      handler.execute(
        new LoginWithEmployeeCodePinCommand('EMP001', '482915', {
          terminal: 'PDA',
          terminalDeviceId: 'terminal-device-1',
          deviceBoundTenantId: 'tenant-1'
        })
      )
    ).rejects.toThrow('Invalid credentials')

    expect(audit.emitLoginFailed).toHaveBeenCalledWith(
      'EMP001',
      'EMPLOYEE_ACCOUNT_DISABLED',
      expect.objectContaining({ userId: 'user-1' })
    )
    expect(loginMethodRepository.findByUserIdAndType).not.toHaveBeenCalled()
  })

  it('rejects missing, disabled, reset-required or invalid terminal PIN before session issuance', async () => {
    const terminalPinMethod = await buildTerminalPinMethod('user-1', '482915')
    terminalPinMethod.disable()
    const pdaCompletion = { complete: jest.fn() }
    const handler = new LoginWithEmployeeCodePinHandler(
      { assertFlowAllowed: jest.fn() } as any,
      { assertPasswordLoginAllowed: jest.fn(), recordPasswordLoginFailure: jest.fn() } as any,
      {
        resolveActiveEmployeeByCode: jest.fn().mockResolvedValue({
          employeeId: 'employee-1',
          employeeCode: 'EMP001',
          employmentId: 'employment-1'
        })
      } as any,
      {
        resolveEmployeeLoginAccount: jest.fn().mockResolvedValue({
          employeeId: 'employee-1',
          userId: 'user-1',
          accountId: 'account-1',
          tenantId: 'tenant-1',
          scopeLevel: 'TENANT',
          isEnabled: true
        })
      } as any,
      { findByUserIdAndType: jest.fn().mockResolvedValue(terminalPinMethod) } as any,
      { findActiveByUserId: jest.fn().mockResolvedValue(null) } as any,
      { emitLoginFailed: jest.fn() } as any,
      pdaCompletion as any
    )

    await expect(
      handler.execute(
        new LoginWithEmployeeCodePinCommand('EMP001', '482915', {
          terminal: 'PDA',
          terminalDeviceId: 'terminal-device-1',
          deviceBoundTenantId: 'tenant-1'
        })
      )
    ).rejects.toThrow('Invalid credentials')
    expect(pdaCompletion.complete).not.toHaveBeenCalled()
  })
})

async function buildTerminalPinMethod(userId: string, plainPin: string): Promise<LoginMethod> {
  const credential = await Credential.createTerminalPinCredential(plainPin)
  return new LoginMethod(
    `terminal-pin-${userId}`,
    userId,
    LoginMethodType.TERMINAL_PIN,
    userId,
    true,
    true,
    new Date(),
    new Date(),
    [credential]
  )
}
