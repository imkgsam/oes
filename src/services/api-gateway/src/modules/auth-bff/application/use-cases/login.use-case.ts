import { BadRequestException, Injectable, Optional } from '@nestjs/common'
import { TerminalLoginFlow } from '@oes/common/auth'
import { LoginStatus } from '@oes/common/generated/auth_service'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import { PermissionTerminalAccessGrpcAdapter } from '../../infrastructure/downstream/permission-service/permission-terminal-access-grpc.adapter'
import { TenantOrgQueryGrpcAdapter } from '../../infrastructure/downstream/tenant-org-service/tenant-org-query-grpc.adapter'
import { TerminalDeviceAccessAdapter } from '../../infrastructure/downstream/terminal-device-service/terminal-device-access.adapter'
import {
  EmployeeCodePinPreflightDto,
  LoginDto,
  LoginMethodDto
} from '../../interfaces/http/dtos/login.dto'
import {
  AuthNextStep,
  AuthResponseViewModel,
  AuthResultStatus
} from '../../interfaces/http/view-models/auth-response.view-model'
import { toAuthResponseViewModel } from './auth-response.mapper'
import { hydrateAuthResponseTenantNames } from './auth-response-tenant-name.hydrator'
import { toTerminalAccessDeniedAuthResponse } from './terminal-access-denial.mapper'

interface LoginClientContext {
  userAgent?: string
  ipAddress?: string
}

export type LoginTerminal = 'BROWSER_EXTENSION' | 'KIOSK' | 'PDA' | 'WEB'

interface LoginAccountCandidate {
  accountId?: string
  tenantId?: string
  tenantName?: string
  displayName?: string
  scopeLevel?: string
}

interface AccountSelectionCarrier {
  status?: LoginStatus
  accounts?: LoginAccountCandidate[]
}

interface PdaLoginDeviceContext {
  terminalDeviceId: string
  deviceBoundTenantId: string
}

type PdaDeviceMetadataCarrier = Pick<LoginDto, 'device'>

export type EmployeeCodePinPreflightViewModel = {
  allowed: boolean
  reasonCode: string
  message: string
}

@Injectable()
// Executes the primary login submission and normalizes downstream auth flow responses for HTTP clients.
export class LoginUseCase {
  constructor(
    private readonly authAdapter: AuthGrpcAdapter,
    private readonly tenantOrgAdapter?: TenantOrgQueryGrpcAdapter,
    @Optional()
    private readonly terminalDeviceAdapter?: TerminalDeviceAccessAdapter,
    @Optional()
    private readonly terminalAccessAdapter?: PermissionTerminalAccessGrpcAdapter
  ) {}

  async execute(
    dto: LoginDto,
    source: DownstreamRequestSource,
    clientContext: LoginClientContext,
    terminal: LoginTerminal = 'WEB'
  ): Promise<AuthResponseViewModel> {
    const pdaDeviceContext = await this.resolvePdaDeviceContextIfNeeded(
      dto,
      clientContext,
      terminal
    )
    if (pdaDeviceContext && !pdaDeviceContext.allowed) {
      return this.toPdaTerminalDeviceDeniedResponse(pdaDeviceContext.reasonCode)
    }

    let result: Awaited<ReturnType<LoginUseCase['dispatch']>>
    try {
      result = await this.dispatch(dto, source, clientContext, terminal, pdaDeviceContext)
    } catch (error) {
      const denial = toTerminalAccessDeniedAuthResponse(error)
      if (denial) {
        return denial
      }

      throw error
    }
    result = await this.filterExtensionAccountOptions(result, terminal, source)
    const hydratedResult = await hydrateAuthResponseTenantNames(
      result,
      source,
      this.tenantOrgAdapter
    )
    return toAuthResponseViewModel(hydratedResult)
  }

  private async filterExtensionAccountOptions<T extends AccountSelectionCarrier>(
    result: T,
    terminal: LoginTerminal,
    source: DownstreamRequestSource
  ): Promise<T> {
    if (
      terminal !== 'BROWSER_EXTENSION' ||
      result.status !== LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED ||
      !Array.isArray(result.accounts)
    ) {
      return result
    }

    const filtered = await this.filterBrowserExtensionEligibleAccounts(result.accounts, source)
    if (filtered.length > 0) {
      return { ...result, accounts: filtered }
    }

    return {
      ...result,
      status: LoginStatus.LOGIN_STATUS_DENIED,
      accounts: [],
      reasonCode: 'NO_SELECTABLE_ACCOUNT_FOR_TERMINAL',
      message: '当前账号不允许从浏览器插件登录，请联系管理员。'
    } as T
  }

  private async filterBrowserExtensionEligibleAccounts(
    accounts: LoginAccountCandidate[],
    source: DownstreamRequestSource
  ): Promise<LoginAccountCandidate[]> {
    const adapter = this.requireTerminalAccessAdapter()
    const decisions = await Promise.all(
      accounts.map(async (account) => {
        const accountId = account.accountId?.trim()
        const scopeLevel = account.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT'
        const tenantId = account.tenantId?.trim()

        if (!accountId || scopeLevel === 'SYSTEM' || !tenantId) {
          return { account, allowed: false }
        }

        const decision = await adapter.resolveAccountTerminalAccess(
          {
            accountId,
            tenantId,
            scopeLevel,
            terminal: 'BROWSER_EXTENSION'
          },
          source
        )

        return { account, allowed: decision.allowed === true }
      })
    )

    return decisions.filter((decision) => decision.allowed).map((decision) => decision.account)
  }

  private requireTerminalAccessAdapter(): PermissionTerminalAccessGrpcAdapter {
    if (!this.terminalAccessAdapter) {
      throw new BadRequestException('browser extension terminal access adapter is unavailable')
    }

    return this.terminalAccessAdapter
  }

  async preflightEmployeeCodePin(
    dto: EmployeeCodePinPreflightDto,
    source: DownstreamRequestSource,
    clientContext: LoginClientContext,
    terminal: LoginTerminal = 'WEB'
  ): Promise<EmployeeCodePinPreflightViewModel> {
    const pdaDeviceContext = await this.resolvePdaDeviceContextIfNeeded(
      dto,
      clientContext,
      terminal
    )
    if (pdaDeviceContext && !pdaDeviceContext.allowed) {
      return {
        allowed: false,
        reasonCode: 'TERMINAL_ACCESS_DENIED',
        message: pdaDeviceContext.reasonCode || 'TERMINAL_ACCESS_DENIED'
      }
    }

    const employeeCode = dto.employeeCode.trim()
    const loginFlow = this.toLoginFlow(LoginMethodDto.EMPLOYEE_CODE_PIN, terminal)
    const result = await this.authAdapter.preflightEmployeeCodePin(
      {
        employeeCode,
        terminal,
        terminalDeviceId: pdaDeviceContext?.terminalDeviceId,
        deviceBoundTenantId: pdaDeviceContext?.deviceBoundTenantId,
        loginFlow
      },
      source
    )

    return {
      allowed: Boolean(result.allowed),
      reasonCode: result.reasonCode || (result.allowed ? 'READY_FOR_PIN' : 'EMPLOYEE_CODE_LOGIN_UNAVAILABLE'),
      message: result.message || result.reasonCode || ''
    }
  }

  private dispatch(
    dto: LoginDto,
    source: DownstreamRequestSource,
    clientContext: LoginClientContext,
    terminal: LoginTerminal,
    pdaDeviceContext?: PdaLoginDeviceContext
  ) {
    const loginFlow = this.toLoginFlow(dto.method, terminal)
    const terminalLoginContext = {
      loginFlow,
      ...(pdaDeviceContext
        ? {
            terminalDeviceId: pdaDeviceContext.terminalDeviceId,
            deviceBoundTenantId: pdaDeviceContext.deviceBoundTenantId
          }
        : {})
    }
    const identifier = dto.identifier?.trim() ?? ''
    const credential = dto.credential?.trim() ?? ''
    const employeeCode = dto.employeeCode?.trim() || identifier
    const pin = dto.pin?.trim() || credential
    const deviceName = dto.device?.deviceName?.trim()
    const userAgent = clientContext.userAgent?.trim()
    const ipAddress = clientContext.ipAddress?.trim()

    switch (dto.method) {
      case LoginMethodDto.EMAIL_PASSWORD:
        return this.authAdapter.loginWithEmailPassword(
          {
            email: identifier,
            password: credential,
            deviceName,
            userAgent,
            ipAddress,
            terminal,
            ...terminalLoginContext
          },
          source
        )
      case LoginMethodDto.EMAIL_OTP:
        return this.authAdapter.loginWithEmailOtp(
          identifier,
          credential,
          terminal,
          source,
          terminalLoginContext
        )
      case LoginMethodDto.PHONE_PASSWORD:
        return this.authAdapter.loginWithPhonePassword(
          {
            phone: identifier,
            password: credential,
            deviceName,
            userAgent,
            ipAddress,
            terminal,
            ...terminalLoginContext
          },
          source
        )
      case LoginMethodDto.PHONE_OTP:
        return this.authAdapter.loginWithPhoneOtp(
          identifier,
          credential,
          terminal,
          source,
          terminalLoginContext
        )
      case LoginMethodDto.EMPLOYEE_CODE_PIN:
        return this.authAdapter.loginWithEmployeeCodePin(
          {
            employeeCode,
            pin,
            deviceName,
            userAgent,
            ipAddress,
            terminal,
            ...terminalLoginContext
          },
          source
        )
      default:
        throw new BadRequestException('Unsupported login method')
    }
  }

  // Maps the fixed frontend login method to the terminal policy flow enforced by auth-service.
  private toLoginFlow(method: LoginMethodDto, terminal: LoginTerminal): TerminalLoginFlow {
    switch (method) {
      case LoginMethodDto.EMAIL_PASSWORD:
        if (terminal !== 'WEB') {
          return TerminalLoginFlow.Password
        }
        return TerminalLoginFlow.EmailPassword
      case LoginMethodDto.EMAIL_OTP:
        return TerminalLoginFlow.EmailOtp
      case LoginMethodDto.PHONE_PASSWORD:
        if (terminal !== 'WEB') {
          return TerminalLoginFlow.Password
        }
        return TerminalLoginFlow.PhonePassword
      case LoginMethodDto.PHONE_OTP:
        return TerminalLoginFlow.PhoneOtp
      case LoginMethodDto.EMPLOYEE_CODE_PIN:
        return TerminalLoginFlow.EmployeeCodePin
    }
  }

  // Resolves the managed PDA device tenant binding when the fixed terminal requires it.
  private async resolvePdaDeviceContextIfNeeded(
    dto: PdaDeviceMetadataCarrier,
    clientContext: LoginClientContext,
    terminal: LoginTerminal
  ): Promise<(PdaLoginDeviceContext & { allowed: boolean; reasonCode?: string }) | undefined> {
    if (terminal !== 'PDA') {
      return undefined
    }

    const terminalDeviceId = dto.device?.deviceId?.trim()
    if (!terminalDeviceId) {
      throw new BadRequestException('PDA login requires terminalDeviceId')
    }
    if (!this.terminalDeviceAdapter) {
      throw new BadRequestException('PDA terminal device access adapter is unavailable')
    }

    const deviceName = dto.device?.deviceName?.trim()
    const userAgent = clientContext.userAgent?.trim()
    const ipAddress = clientContext.ipAddress?.trim()

    return this.terminalDeviceAdapter.resolveLoginDeviceContext({
      terminalDeviceId,
      deviceMetadata: this.toPdaDeviceMetadata(dto, { deviceName, userAgent, ipAddress })
    })
  }

  // Extracts PDA device identity and software hints without making auth-bff own device governance rules.
  private toPdaDeviceMetadata(
    dto: PdaDeviceMetadataCarrier,
    context: { deviceName?: string; userAgent?: string; ipAddress?: string }
  ): Record<string, unknown> {
    return {
      ...(context.deviceName ? { deviceName: context.deviceName } : {}),
      ...(context.userAgent ? { userAgent: context.userAgent } : {}),
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      ...this.normalizedObject(dto.device?.identity, [
        'manufacturerSerial',
        'androidId',
        'appInstallationId',
        'manufacturer',
        'model'
      ]),
      ...this.normalizedObject(dto.device?.software, ['androidVersion', 'webViewVersion', 'appVersion'])
    }
  }

  // Normalizes a selected subset of string fields from client-provided metadata.
  private normalizedObject(source: unknown, keys: string[]): Record<string, string> {
    if (!source || typeof source !== 'object') {
      return {}
    }

    return keys.reduce<Record<string, string>>((acc, key) => {
      const value = (source as Record<string, unknown>)[key]
      if (typeof value === 'string' && value.trim()) {
        acc[key] = value.trim()
      }
      return acc
    }, {})
  }

  // Builds the stable PDA terminal-device denial response before auth-service is called.
  private toPdaTerminalDeviceDeniedResponse(reasonCode?: string): AuthResponseViewModel {
    return {
      status: AuthResultStatus.DENIED,
      nextStep: AuthNextStep.NONE,
      session: null,
      operator: null,
      challenge: null,
      accountOptions: [],
      passwordSetupRequired: false,
      reasonCode: 'TERMINAL_ACCESS_DENIED',
      message: reasonCode || 'Terminal access denied',
      terminal: 'PDA'
    }
  }
}
