import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TerminalLoginFlow } from '@oes/common/auth'
import { HR_SERVICE, IDENTITY_SERVICE, LoginMethodEnum, LoginMethodType } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CredentialType } from '../../../../prisma/generated/prisma'
import { REPO } from '../../../common/constants'
import { AUTH_INVALID_CREDENTIALS } from '../../../common/constants/exception-enums'
import { ILoginMethodRepository } from '../../../domain/repositories/loginmethod.repository'
import { TerminalPinResetRequirementRepository } from '../../../domain/repositories/terminal-pin-reset-requirement.repository'
import { IHrServicePort } from '../../ports/hr-service.port'
import { IIdentityServicePort } from '../../ports/identity-service.port'
import { AuthAuditService } from '../../services/auth-audit.service'
import { LoginRiskThrottleService } from '../../services/login-risk-throttle.service'
import {
  PdaPrimaryLoginCompletionResult,
  PdaPrimaryLoginCompletionService
} from '../../services/pda-primary-login-completion.service'
import { TerminalLoginPolicyService } from '../../services/terminal-login-policy.service'
import { LoginWithEmployeeCodePinCommand } from './login-with-employee-code-pin.command'

@CommandHandler(LoginWithEmployeeCodePinCommand)
// Orchestrates PDA employee-code login using HR employee facts, identity account binding, and auth-owned terminal PIN.
export class LoginWithEmployeeCodePinHandler
  implements ICommandHandler<LoginWithEmployeeCodePinCommand, PdaPrimaryLoginCompletionResult>
{
  constructor(
    private readonly terminalLoginPolicyService: TerminalLoginPolicyService,
    private readonly loginRiskThrottleService: LoginRiskThrottleService,
    @Inject(HR_SERVICE)
    private readonly hrService: IHrServicePort,
    @Inject(IDENTITY_SERVICE)
    private readonly identityService: IIdentityServicePort,
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepository: ILoginMethodRepository,
    @Inject(REPO.TERMINAL_PIN_RESET_REQUIREMENT)
    private readonly resetRequirementRepository: TerminalPinResetRequirementRepository,
    private readonly authAuditService: AuthAuditService,
    private readonly pdaPrimaryLoginCompletionService: PdaPrimaryLoginCompletionService
  ) {}

  async execute(command: LoginWithEmployeeCodePinCommand): Promise<PdaPrimaryLoginCompletionResult> {
    const terminal = command.terminal || 'PDA'
    const loginFlow = command.loginFlow || TerminalLoginFlow.EmployeeCodePin
    const tenantId = command.deviceBoundTenantId?.trim()
    const employeeCode = command.employeeCode.trim()

    await this.terminalLoginPolicyService.assertFlowAllowed(terminal, loginFlow)
    if (!tenantId) {
      throw this.invalid(command, 'DEVICE_BOUND_TENANT_REQUIRED')
    }

    const unresolvedRiskKey = this.unresolvedRiskKey(tenantId, employeeCode, command.terminalDeviceId)
    await this.loginRiskThrottleService.assertPasswordLoginAllowed(
      LoginMethodType.TERMINAL_PIN,
      unresolvedRiskKey
    )

    const employee = await this.hrService.resolveActiveEmployeeByCode({
      tenantId,
      employeeCode
    })
    if (!employee) {
      await this.recordFailure(command, unresolvedRiskKey, 'EMPLOYEE_CODE_NOT_FOUND')
      throw this.invalid(command, 'EMPLOYEE_CODE_NOT_FOUND')
    }

    const account = await this.identityService.resolveEmployeeLoginAccount({
      tenantId,
      employeeId: employee.employeeId
    })
    if (!account?.userId) {
      await this.recordFailure(command, unresolvedRiskKey, 'EMPLOYEE_ACCOUNT_BINDING_NOT_FOUND')
      throw this.invalid(command, 'EMPLOYEE_ACCOUNT_BINDING_NOT_FOUND')
    }

    if (!account.isEnabled) {
      await this.recordFailure(command, unresolvedRiskKey, 'EMPLOYEE_ACCOUNT_DISABLED', account.userId)
      throw this.invalid(command, 'EMPLOYEE_ACCOUNT_DISABLED', account.userId)
    }

    const resolvedRiskKey = this.resolvedRiskKey(account.userId)
    await this.loginRiskThrottleService.assertPasswordLoginAllowed(
      LoginMethodType.TERMINAL_PIN,
      resolvedRiskKey
    )

    const terminalPinMethod = await this.loginMethodRepository.findByUserIdAndType(
      account.userId,
      LoginMethodType.TERMINAL_PIN
    )
    if (!terminalPinMethod?.isEnabled()) {
      await this.recordFailure(command, resolvedRiskKey, 'TERMINAL_PIN_DISABLED', account.userId)
      throw this.invalid(command, 'TERMINAL_PIN_DISABLED', account.userId)
    }

    const resetRequired = await this.resetRequirementRepository.findActiveByUserId(account.userId)
    if (resetRequired) {
      await this.recordFailure(command, resolvedRiskKey, 'TERMINAL_PIN_RESET_REQUIRED', account.userId)
      throw this.invalid(command, 'TERMINAL_PIN_RESET_REQUIRED', account.userId)
    }

    const terminalPin = terminalPinMethod.getCredentialByType(CredentialType.TERMINAL_PIN)
    if (!terminalPin?.isEnabled()) {
      await this.recordFailure(command, resolvedRiskKey, 'TERMINAL_PIN_NOT_SET', account.userId)
      throw this.invalid(command, 'TERMINAL_PIN_NOT_SET', account.userId)
    }

    if (!(await terminalPin.validate(command.pin))) {
      await this.recordFailure(command, resolvedRiskKey, 'INVALID_TERMINAL_PIN', account.userId)
      throw this.invalid(command, 'INVALID_TERMINAL_PIN', account.userId)
    }

    await this.loginRiskThrottleService.clearPasswordLoginFailures(
      LoginMethodType.TERMINAL_PIN,
      unresolvedRiskKey
    )
    await this.loginRiskThrottleService.clearPasswordLoginFailures(
      LoginMethodType.TERMINAL_PIN,
      resolvedRiskKey
    )

    return this.pdaPrimaryLoginCompletionService.complete({
      userId: account.userId,
      loginMethod: LoginMethodEnum.EmployeeCodePin,
      deviceName: command.deviceName,
      userAgent: command.userAgent,
      ipAddress: command.ipAddress,
      terminalDeviceId: command.terminalDeviceId,
      deviceBoundTenantId: tenantId,
      loginFlow
    })
  }

  private async recordFailure(
    command: LoginWithEmployeeCodePinCommand,
    riskKey: string,
    reason: string,
    userId?: string
  ): Promise<void> {
    await this.loginRiskThrottleService.recordPasswordLoginFailure(
      LoginMethodType.TERMINAL_PIN,
      riskKey
    )
    this.authAuditService.emitLoginFailed(command.employeeCode.trim(), reason, {
      method: LoginMethodEnum.EmployeeCodePin,
      userId,
      terminal: command.terminal || 'PDA',
      loginFlow: command.loginFlow || TerminalLoginFlow.EmployeeCodePin,
      deviceName: command.deviceName,
      userAgent: command.userAgent,
      ipAddress: command.ipAddress
    })
  }

  private invalid(command: LoginWithEmployeeCodePinCommand, reason: string, userId?: string) {
    return ExceptionFactory.domain(AUTH_INVALID_CREDENTIALS, {
      reason,
      userId,
      employeeCode: command.employeeCode.trim(),
      terminal: command.terminal || 'PDA',
      loginFlow: command.loginFlow || TerminalLoginFlow.EmployeeCodePin
    })
  }

  private unresolvedRiskKey(
    tenantId: string,
    employeeCode: string,
    terminalDeviceId?: string
  ): string {
    return `${tenantId}:${employeeCode}:${terminalDeviceId ?? 'UNKNOWN'}`
  }

  private resolvedRiskKey(userId: string): string {
    return `${userId}:EMPLOYEE_CODE_PIN`
  }
}
