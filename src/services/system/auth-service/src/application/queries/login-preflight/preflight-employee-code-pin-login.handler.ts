import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TerminalLoginFlow } from '@oes/common/auth'
import { HR_SERVICE, IDENTITY_SERVICE, LoginMethodType } from '@oes/common/constants'
import { Type } from 'class-transformer'
import { IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator'
import { CredentialType } from '../../../../prisma/generated/prisma'
import { REPO } from '../../../common/constants'
import { ILoginMethodRepository } from '../../../domain/repositories/loginmethod.repository'
import { TerminalPinResetRequirementRepository } from '../../../domain/repositories/terminal-pin-reset-requirement.repository'
import { IHrServicePort } from '../../ports/hr-service.port'
import { IIdentityServicePort } from '../../ports/identity-service.port'
import { TerminalLoginPolicyService } from '../../services/terminal-login-policy.service'

export type EmployeeCodePinPreflightReasonCode =
  | 'READY_FOR_PIN'
  | 'DEVICE_BOUND_TENANT_REQUIRED'
  | 'EMPLOYEE_CODE_LOGIN_UNAVAILABLE'
  | 'TERMINAL_PIN_NOT_CONFIGURED'
  | 'TERMINAL_PIN_RESET_REQUIRED'

export type EmployeeCodePinPreflightResult = {
  allowed: boolean
  reasonCode: EmployeeCodePinPreflightReasonCode
  message: string
}

// Carries optional terminal context for employee-code PIN preflight validation.
export class PreflightEmployeeCodePinLoginOptions {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  readonly terminal?: string

  @IsOptional()
  @IsString()
  @MaxLength(128)
  readonly terminalDeviceId?: string

  @IsOptional()
  @IsString()
  @MaxLength(128)
  readonly deviceBoundTenantId?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  readonly loginFlow?: string

  constructor(input: PreflightEmployeeCodePinLoginOptions = {}) {
    this.terminal = input.terminal
    this.terminalDeviceId = input.terminalDeviceId
    this.deviceBoundTenantId = input.deviceBoundTenantId
    this.loginFlow = input.loginFlow
  }
}

// Carries the employee barcode and terminal context used to decide whether PIN entry may be shown.
export class PreflightEmployeeCodePinLoginQuery {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  readonly employeeCode: string

  @ValidateNested()
  @Type(() => PreflightEmployeeCodePinLoginOptions)
  readonly options: PreflightEmployeeCodePinLoginOptions

  constructor(
    employeeCode: string,
    options: PreflightEmployeeCodePinLoginOptions = {}
  ) {
    this.employeeCode = employeeCode
    this.options = new PreflightEmployeeCodePinLoginOptions(options)
  }
}

@QueryHandler(PreflightEmployeeCodePinLoginQuery)
// Checks whether a scanned employee code can proceed to PDA terminal PIN entry without validating the PIN or creating a session.
export class PreflightEmployeeCodePinLoginHandler
  implements IQueryHandler<PreflightEmployeeCodePinLoginQuery, EmployeeCodePinPreflightResult>
{
  constructor(
    private readonly terminalLoginPolicyService: TerminalLoginPolicyService,
    @Inject(HR_SERVICE)
    private readonly hrService: IHrServicePort,
    @Inject(IDENTITY_SERVICE)
    private readonly identityService: IIdentityServicePort,
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepository: ILoginMethodRepository,
    @Inject(REPO.TERMINAL_PIN_RESET_REQUIREMENT)
    private readonly resetRequirementRepository: TerminalPinResetRequirementRepository
  ) {}

  async execute(query: PreflightEmployeeCodePinLoginQuery): Promise<EmployeeCodePinPreflightResult> {
    const terminal = query.options.terminal || 'PDA'
    const loginFlow = query.options.loginFlow || TerminalLoginFlow.EmployeeCodePin
    const tenantId = query.options.deviceBoundTenantId?.trim()
    const employeeCode = query.employeeCode.trim()

    await this.terminalLoginPolicyService.assertFlowAllowed(terminal, loginFlow)
    if (!tenantId) {
      return this.deny('DEVICE_BOUND_TENANT_REQUIRED')
    }

    const employee = await this.hrService.resolveActiveEmployeeByCode({ tenantId, employeeCode })
    if (!employee) {
      return this.deny('EMPLOYEE_CODE_LOGIN_UNAVAILABLE')
    }

    const account = await this.identityService.resolveEmployeeLoginAccount({
      tenantId,
      employeeId: employee.employeeId
    })
    if (!account?.userId || !account.isEnabled) {
      return this.deny('EMPLOYEE_CODE_LOGIN_UNAVAILABLE')
    }

    const terminalPinMethod = await this.loginMethodRepository.findByUserIdAndType(
      account.userId,
      LoginMethodType.TERMINAL_PIN
    )
    const terminalPin = terminalPinMethod?.getCredentialByType(CredentialType.TERMINAL_PIN)
    if (!terminalPinMethod?.isEnabled() || !terminalPin?.isEnabled()) {
      return this.deny('TERMINAL_PIN_NOT_CONFIGURED')
    }

    const resetRequired = await this.resetRequirementRepository.findActiveByUserId(account.userId)
    if (resetRequired) {
      return this.deny('TERMINAL_PIN_RESET_REQUIRED')
    }

    return {
      allowed: true,
      reasonCode: 'READY_FOR_PIN',
      message: 'READY_FOR_PIN'
    }
  }

  private deny(reasonCode: EmployeeCodePinPreflightReasonCode): EmployeeCodePinPreflightResult {
    return {
      allowed: false,
      reasonCode,
      message: reasonCode
    }
  }
}
