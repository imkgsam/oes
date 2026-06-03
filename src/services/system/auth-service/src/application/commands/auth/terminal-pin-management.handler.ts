import { randomUUID } from 'node:crypto'
import { Inject } from '@nestjs/common'
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs'
import { LoginMethodType } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator'
import { CredentialType } from '../../../../prisma/generated/prisma'
import { REPO } from '../../../common/constants'
import { AUTH_INVALID_CREDENTIALS } from '../../../common/constants/exception-enums'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { ILoginMethodRepository } from '../../../domain/repositories/loginmethod.repository'
import { TerminalPinResetRequirementRepository } from '../../../domain/repositories/terminal-pin-reset-requirement.repository'
import { AuthAuditService } from '../../services/auth-audit.service'

type TerminalPinStepUpInput = {
  currentPassword?: string
  mfaGrantToken?: string
}

type OwnTerminalPinInput = TerminalPinStepUpInput & {
  userId: string
  newPin: string
}

// Carries a self-service terminal PIN setup request from web account security.
export class SetOwnTerminalPinCommand implements ICommand {
  @IsString()
  @MinLength(1)
  readonly userId: string

  @IsString()
  @MinLength(1)
  readonly newPin: string

  @IsOptional()
  @IsString()
  readonly currentPassword?: string

  @IsOptional()
  @IsString()
  readonly mfaGrantToken?: string

  constructor(input: OwnTerminalPinInput) {
    this.userId = input.userId
    this.newPin = input.newPin
    this.currentPassword = input.currentPassword
    this.mfaGrantToken = input.mfaGrantToken
  }
}

// Carries a self-service forgotten terminal PIN reset request from web account security.
export class ResetOwnTerminalPinCommand implements ICommand {
  @IsString()
  @MinLength(1)
  readonly userId: string

  @IsString()
  @MinLength(1)
  readonly newPin: string

  @IsOptional()
  @IsString()
  readonly currentPassword?: string

  @IsOptional()
  @IsString()
  readonly mfaGrantToken?: string

  constructor(input: OwnTerminalPinInput) {
    this.userId = input.userId
    this.newPin = input.newPin
    this.currentPassword = input.currentPassword
    this.mfaGrantToken = input.mfaGrantToken
  }
}

// Carries a self-service terminal PIN enablement toggle.
export class SetOwnTerminalPinEnabledCommand implements ICommand {
  @IsString()
  @MinLength(1)
  readonly userId: string

  @IsBoolean()
  readonly enabled: boolean

  constructor(userId: string, enabled: boolean) {
    this.userId = userId
    this.enabled = enabled
  }
}

// Carries an administrator request to force a user to reset their terminal PIN.
export class RequireTerminalPinResetCommand implements ICommand {
  @IsString()
  @MinLength(1)
  readonly requiredBy: string

  @IsString()
  @MinLength(1)
  readonly userId: string

  constructor(requiredBy: string, userId: string) {
    this.requiredBy = requiredBy
    this.userId = userId
  }
}

// Carries an administrator request to disable a target user's terminal PIN login method.
export class DisableUserTerminalPinCommand implements ICommand {
  @IsString()
  @MinLength(1)
  readonly disabledBy: string

  @IsString()
  @MinLength(1)
  readonly userId: string

  constructor(disabledBy: string, userId: string) {
    this.disabledBy = disabledBy
    this.userId = userId
  }
}

@CommandHandler(SetOwnTerminalPinCommand)
// Handles first-time terminal PIN setup after an account-security step-up check.
export class SetOwnTerminalPinHandler
  implements ICommandHandler<SetOwnTerminalPinCommand, { success: boolean }>
{
  constructor(
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepository: ILoginMethodRepository,
    @Inject(REPO.TERMINAL_PIN_RESET_REQUIREMENT)
    private readonly resetRequirementRepository: TerminalPinResetRequirementRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: SetOwnTerminalPinCommand): Promise<{ success: boolean }> {
    await assertOwnTerminalPinStepUp(this.loginMethodRepository, command)
    const method = await findOrCreateTerminalPinMethod(
      this.loginMethodRepository,
      command.userId
    )
    await method.replaceTerminalPinCredential(command.newPin)
    await this.loginMethodRepository.save(method)
    await this.resetRequirementRepository.complete(command.userId)
    this.authAuditService.emitTerminalPinChanged(command.userId, 'SET')
    return { success: true }
  }
}

@CommandHandler(ResetOwnTerminalPinCommand)
// Handles forgotten terminal PIN reset from web account security after step-up.
export class ResetOwnTerminalPinHandler
  implements ICommandHandler<ResetOwnTerminalPinCommand, { success: boolean }>
{
  constructor(
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepository: ILoginMethodRepository,
    @Inject(REPO.TERMINAL_PIN_RESET_REQUIREMENT)
    private readonly resetRequirementRepository: TerminalPinResetRequirementRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: ResetOwnTerminalPinCommand): Promise<{ success: boolean }> {
    await assertOwnTerminalPinStepUp(this.loginMethodRepository, command)
    const method = await findOrCreateTerminalPinMethod(
      this.loginMethodRepository,
      command.userId
    )
    await method.replaceTerminalPinCredential(command.newPin)
    await this.loginMethodRepository.save(method)
    await this.resetRequirementRepository.complete(command.userId)
    this.authAuditService.emitTerminalPinChanged(command.userId, 'RESET')
    return { success: true }
  }
}

@CommandHandler(SetOwnTerminalPinEnabledCommand)
// Handles the current user's enable/disable switch for the terminal PIN login method.
export class SetOwnTerminalPinEnabledHandler
  implements ICommandHandler<SetOwnTerminalPinEnabledCommand, { success: boolean }>
{
  constructor(
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepository: ILoginMethodRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: SetOwnTerminalPinEnabledCommand): Promise<{ success: boolean }> {
    const method = await this.loginMethodRepository.findByUserIdAndType(
      command.userId,
      LoginMethodType.TERMINAL_PIN
    )
    if (!method || !method.getCredentialByType(CredentialType.TERMINAL_PIN)) {
      throw ExceptionFactory.domain(AUTH_INVALID_CREDENTIALS, {
        reason: 'TERMINAL_PIN_NOT_SET',
        userId: command.userId
      })
    }

    if (command.enabled) {
      method.enable()
    } else {
      method.disable()
    }

    await this.loginMethodRepository.save(method)
    this.authAuditService.emitTerminalPinEnabledChanged(
      command.userId,
      command.userId,
      command.enabled
    )
    return { success: true }
  }
}

@CommandHandler(RequireTerminalPinResetCommand)
// Handles administrator governance that requires the target user to reset their own terminal PIN.
export class RequireTerminalPinResetHandler
  implements ICommandHandler<RequireTerminalPinResetCommand, { success: boolean }>
{
  constructor(
    @Inject(REPO.TERMINAL_PIN_RESET_REQUIREMENT)
    private readonly resetRequirementRepository: TerminalPinResetRequirementRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: RequireTerminalPinResetCommand): Promise<{ success: boolean }> {
    await this.resetRequirementRepository.requireReset({
      userId: command.userId,
      reason: 'ADMIN_RESET',
      requiredBy: command.requiredBy
    })
    this.authAuditService.emitTerminalPinResetRequired(command.requiredBy, command.userId)
    return { success: true }
  }
}

@CommandHandler(DisableUserTerminalPinCommand)
// Handles administrator governance that disables a target user's terminal PIN login method.
export class DisableUserTerminalPinHandler
  implements ICommandHandler<DisableUserTerminalPinCommand, { success: boolean }>
{
  constructor(
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepository: ILoginMethodRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: DisableUserTerminalPinCommand): Promise<{ success: boolean }> {
    const method = await this.loginMethodRepository.findByUserIdAndType(
      command.userId,
      LoginMethodType.TERMINAL_PIN
    )
    if (!method) {
      return { success: true }
    }

    method.disable()
    await this.loginMethodRepository.save(method)
    this.authAuditService.emitTerminalPinEnabledChanged(
      command.disabledBy,
      command.userId,
      false
    )
    return { success: true }
  }
}

async function findOrCreateTerminalPinMethod(
  repository: ILoginMethodRepository,
  userId: string
): Promise<LoginMethod> {
  const existing = await repository.findByUserIdAndType(userId, LoginMethodType.TERMINAL_PIN)
  if (existing) {
    return existing
  }

  return new LoginMethod(
    randomUUID(),
    userId,
    LoginMethodType.TERMINAL_PIN,
    userId,
    true,
    true,
    new Date(),
    new Date(),
    []
  )
}

async function assertOwnTerminalPinStepUp(
  repository: ILoginMethodRepository,
  command: TerminalPinStepUpInput & { userId: string }
): Promise<void> {
  if (command.mfaGrantToken?.trim()) {
    return
  }

  if (!command.currentPassword?.trim()) {
    throw ExceptionFactory.domain(AUTH_INVALID_CREDENTIALS, {
      reason: 'TERMINAL_PIN_STEP_UP_REQUIRED',
      userId: command.userId
    })
  }

  const methods = await repository.findByUserId(command.userId)
  const passwordCredentials = methods
    .map((method) => method.getPasswordCredential())
    .filter(Boolean)
  const matches = await Promise.all(
    passwordCredentials.map((credential) => credential!.validate(command.currentPassword!))
  )

  if (!matches.some(Boolean)) {
    throw ExceptionFactory.domain(AUTH_INVALID_CREDENTIALS, {
      reason: 'CURRENT_PASSWORD_INVALID',
      userId: command.userId
    })
  }
}
