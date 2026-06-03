import { CommandBus } from '@nestjs/cqrs'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { LoginMethodType } from '@oes/common/constants'
import { CredentialType } from '../../../../prisma/generated/prisma'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { Credential } from '../../../domain/entities/credential.entity'
import {
  DisableUserTerminalPinCommand,
  DisableUserTerminalPinHandler,
  RequireTerminalPinResetCommand,
  RequireTerminalPinResetHandler,
  ResetOwnTerminalPinCommand,
  ResetOwnTerminalPinHandler,
  SetOwnTerminalPinCommand,
  SetOwnTerminalPinEnabledCommand,
  SetOwnTerminalPinEnabledHandler,
  SetOwnTerminalPinHandler
} from './terminal-pin-management.handler'

describe('Terminal PIN management handlers', () => {
  it('sets a user-scoped terminal PIN after current password step-up', async () => {
    const passwordMethod = await buildPasswordMethod('user-1', 'Current123')
    const saved: LoginMethod[] = []
    const loginMethods = {
      findByUserId: jest.fn().mockResolvedValue([passwordMethod]),
      findByUserIdAndType: jest.fn().mockResolvedValue(null),
      save: jest.fn(async (method: LoginMethod) => {
        saved.push(method)
        return method
      })
    }
    const resetRequirements = { complete: jest.fn() }
    const audit = { emitTerminalPinChanged: jest.fn() }

    const handler = new SetOwnTerminalPinHandler(
      loginMethods as any,
      resetRequirements as any,
      audit as any
    )

    await handler.execute(
      new SetOwnTerminalPinCommand({
        userId: 'user-1',
        newPin: '482915',
        currentPassword: 'Current123'
      })
    )

    expect(saved[0].type).toBe(LoginMethodType.TERMINAL_PIN)
    expect(saved[0].identifier).toBe('user-1')
    expect(saved[0].isEnabled()).toBe(true)
    expect(saved[0].getCredentialByType(CredentialType.TERMINAL_PIN)?.getSecret()).not.toBe(
      '482915'
    )
    expect(resetRequirements.complete).toHaveBeenCalledWith('user-1')
    expect(audit.emitTerminalPinChanged).toHaveBeenCalledWith('user-1', 'SET')
  })

  it('rejects setting a weak terminal PIN before saving', async () => {
    const passwordMethod = await buildPasswordMethod('user-1', 'Current123')
    const loginMethods = {
      findByUserId: jest.fn().mockResolvedValue([passwordMethod]),
      findByUserIdAndType: jest.fn(),
      save: jest.fn()
    }
    const handler = new SetOwnTerminalPinHandler(
      loginMethods as any,
      { complete: jest.fn() } as any,
      { emitTerminalPinChanged: jest.fn() } as any
    )

    await expect(
      handler.execute(
        new SetOwnTerminalPinCommand({
          userId: 'user-1',
          newPin: '123456',
          currentPassword: 'Current123'
        })
      )
    ).rejects.toThrow('TERMINAL_PIN_WEAK')

    expect(loginMethods.save).not.toHaveBeenCalled()
  })

  it('resets a forgotten terminal PIN from web account security and clears reset-required state', async () => {
    const passwordMethod = await buildPasswordMethod('user-1', 'Current123')
    const terminalPinMethod = await buildTerminalPinMethod('user-1', '482915')
    const loginMethods = {
      findByUserId: jest.fn().mockResolvedValue([passwordMethod, terminalPinMethod]),
      findByUserIdAndType: jest.fn().mockResolvedValue(terminalPinMethod),
      save: jest.fn(async (method: LoginMethod) => method)
    }
    const resetRequirements = { complete: jest.fn() }
    const audit = { emitTerminalPinChanged: jest.fn() }
    const handler = new ResetOwnTerminalPinHandler(
      loginMethods as any,
      resetRequirements as any,
      audit as any
    )

    await handler.execute(
      new ResetOwnTerminalPinCommand({
        userId: 'user-1',
        newPin: '739184',
        currentPassword: 'Current123'
      })
    )

    expect(loginMethods.save).toHaveBeenCalledWith(terminalPinMethod)
    expect(resetRequirements.complete).toHaveBeenCalledWith('user-1')
    expect(audit.emitTerminalPinChanged).toHaveBeenCalledWith('user-1', 'RESET')
  })

  it('lets the user enable or disable their own terminal PIN login method', async () => {
    const terminalPinMethod = await buildTerminalPinMethod('user-1', '482915')
    const loginMethods = {
      findByUserIdAndType: jest.fn().mockResolvedValue(terminalPinMethod),
      save: jest.fn(async (method: LoginMethod) => method)
    }
    const audit = { emitTerminalPinEnabledChanged: jest.fn() }
    const handler = new SetOwnTerminalPinEnabledHandler(loginMethods as any, audit as any)

    await handler.execute(new SetOwnTerminalPinEnabledCommand('user-1', false))

    expect(terminalPinMethod.isEnabled()).toBe(false)
    expect(audit.emitTerminalPinEnabledChanged).toHaveBeenCalledWith('user-1', 'user-1', false)
  })

  it('passes terminal PIN enablement commands through CQRS whitelist validation', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue({ success: true })
    } as unknown as CommandBus
    const validatingCommandBus = new ValidatingCommandBus(commandBus)

    await expect(
      validatingCommandBus.execute(new SetOwnTerminalPinEnabledCommand('user-1', false))
    ).resolves.toEqual({ success: true })

    expect(commandBus.execute).toHaveBeenCalledTimes(1)
  })

  it('lets an administrator require reset or disable without plaintext PIN material', async () => {
    const terminalPinMethod = await buildTerminalPinMethod('user-1', '482915')
    const resetRequirements = { requireReset: jest.fn() }
    const requireAudit = { emitTerminalPinResetRequired: jest.fn() }
    const requireHandler = new RequireTerminalPinResetHandler(
      resetRequirements as any,
      requireAudit as any
    )

    await requireHandler.execute(new RequireTerminalPinResetCommand('admin-1', 'user-1'))

    expect(resetRequirements.requireReset).toHaveBeenCalledWith({
      userId: 'user-1',
      reason: 'ADMIN_RESET',
      requiredBy: 'admin-1'
    })
    expect(requireAudit.emitTerminalPinResetRequired).toHaveBeenCalledWith('admin-1', 'user-1')

    const loginMethods = {
      findByUserIdAndType: jest.fn().mockResolvedValue(terminalPinMethod),
      save: jest.fn(async (method: LoginMethod) => method)
    }
    const disableAudit = { emitTerminalPinEnabledChanged: jest.fn() }
    const disableHandler = new DisableUserTerminalPinHandler(loginMethods as any, disableAudit as any)

    await disableHandler.execute(new DisableUserTerminalPinCommand('admin-1', 'user-1'))

    expect(terminalPinMethod.isEnabled()).toBe(false)
    expect(disableAudit.emitTerminalPinEnabledChanged).toHaveBeenCalledWith(
      'admin-1',
      'user-1',
      false
    )
  })
})

async function buildPasswordMethod(userId: string, plainPassword: string): Promise<LoginMethod> {
  const credential = await Credential.createPasswordCredential(plainPassword)
  return new LoginMethod(
    `password-${userId}`,
    userId,
    LoginMethodType.EMAIL,
    `${userId}@example.com`,
    true,
    true,
    new Date(),
    new Date(),
    [credential]
  )
}

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
