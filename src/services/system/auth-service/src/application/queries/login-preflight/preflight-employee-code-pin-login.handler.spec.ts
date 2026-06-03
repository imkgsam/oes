import { LoginMethodType, TerminalLoginFlow } from '@oes/common/constants'
import { validate } from 'class-validator'
import { CredentialType } from '../../../../prisma/generated/prisma'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { Credential } from '../../../domain/entities/credential.entity'
import {
  PreflightEmployeeCodePinLoginQuery,
  PreflightEmployeeCodePinLoginHandler
} from './preflight-employee-code-pin-login.handler'

describe('PreflightEmployeeCodePinLoginHandler', () => {
  it('accepts employee code preflight query fields under CQRS validation', async () => {
    const query = new PreflightEmployeeCodePinLoginQuery('EMP-0AF-0001', {
      terminal: 'PDA',
      terminalDeviceId: 'terminal-device-1',
      deviceBoundTenantId: 'tenant-1',
      loginFlow: TerminalLoginFlow.EmployeeCodePin
    })

    const errors = await validate(query, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: false,
      skipMissingProperties: false
    })

    expect(errors).toHaveLength(0)
  })

  it('allows PIN entry when employee, account, terminal policy, and terminal PIN are ready', async () => {
    const terminalPinMethod = await buildTerminalPinMethod('user-1', '482915')
    const handler = new PreflightEmployeeCodePinLoginHandler(
      { assertFlowAllowed: jest.fn() } as any,
      {
        resolveActiveEmployeeByCode: jest.fn().mockResolvedValue({
          employeeId: 'employee-1',
          employeeCode: 'EMP-0AF-0001',
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
          displayName: 'Operator One',
          isEnabled: true
        })
      } as any,
      { findByUserIdAndType: jest.fn().mockResolvedValue(terminalPinMethod) } as any,
      { findActiveByUserId: jest.fn().mockResolvedValue(null) } as any
    )

    await expect(
      handler.execute(
        new PreflightEmployeeCodePinLoginQuery('EMP-0AF-0001', {
          terminal: 'PDA',
          terminalDeviceId: 'terminal-device-1',
          deviceBoundTenantId: 'tenant-1',
          loginFlow: TerminalLoginFlow.EmployeeCodePin
        })
      )
    ).resolves.toEqual({
      allowed: true,
      reasonCode: 'READY_FOR_PIN',
      message: 'READY_FOR_PIN'
    })
  })

  it('keeps unresolved employee or binding failures generic before PIN entry', async () => {
    const handler = new PreflightEmployeeCodePinLoginHandler(
      { assertFlowAllowed: jest.fn() } as any,
      { resolveActiveEmployeeByCode: jest.fn().mockResolvedValue(null) } as any,
      { resolveEmployeeLoginAccount: jest.fn() } as any,
      { findByUserIdAndType: jest.fn() } as any,
      { findActiveByUserId: jest.fn() } as any
    )

    await expect(
      handler.execute(
        new PreflightEmployeeCodePinLoginQuery('EMP-0AF-4040', {
          terminal: 'PDA',
          terminalDeviceId: 'terminal-device-1',
          deviceBoundTenantId: 'tenant-1'
        })
      )
    ).resolves.toEqual({
      allowed: false,
      reasonCode: 'EMPLOYEE_CODE_LOGIN_UNAVAILABLE',
      message: 'EMPLOYEE_CODE_LOGIN_UNAVAILABLE'
    })
  })

  it('returns a PIN setup reason without validating the PIN itself', async () => {
    const handler = new PreflightEmployeeCodePinLoginHandler(
      { assertFlowAllowed: jest.fn() } as any,
      {
        resolveActiveEmployeeByCode: jest.fn().mockResolvedValue({
          employeeId: 'employee-1',
          employeeCode: 'EMP-0AF-0001',
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
      { findByUserIdAndType: jest.fn().mockResolvedValue(null) } as any,
      { findActiveByUserId: jest.fn().mockResolvedValue(null) } as any
    )

    await expect(
      handler.execute(
        new PreflightEmployeeCodePinLoginQuery('EMP-0AF-0001', {
          terminal: 'PDA',
          terminalDeviceId: 'terminal-device-1',
          deviceBoundTenantId: 'tenant-1'
        })
      )
    ).resolves.toEqual({
      allowed: false,
      reasonCode: 'TERMINAL_PIN_NOT_CONFIGURED',
      message: 'TERMINAL_PIN_NOT_CONFIGURED'
    })
  })
})

async function buildTerminalPinMethod(userId: string, plainPin: string): Promise<LoginMethod> {
  const credential = await Credential.createTerminalPinCredential(plainPin)
  expect(credential.type).toBe(CredentialType.TERMINAL_PIN)
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
