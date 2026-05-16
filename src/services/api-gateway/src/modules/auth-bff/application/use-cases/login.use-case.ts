import { BadRequestException, Injectable, Optional } from '@nestjs/common'
import { TerminalLoginFlow } from '@oes/common/auth'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import { TenantOrgQueryGrpcAdapter } from '../../infrastructure/downstream/tenant-org-service/tenant-org-query-grpc.adapter'
import { TerminalDeviceAccessAdapter } from '../../infrastructure/downstream/terminal-device-service/terminal-device-access.adapter'
import { LoginDto, LoginMethodDto } from '../../interfaces/http/dtos/login.dto'
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

export type LoginTerminal = 'KIOSK' | 'PDA' | 'WEB'

interface PdaLoginDeviceContext {
  terminalDeviceId: string
  deviceBoundTenantId: string
}

@Injectable()
// Executes the primary login submission and normalizes downstream auth flow responses for HTTP clients.
export class LoginUseCase {
  constructor(
    private readonly authAdapter: AuthGrpcAdapter,
    private readonly tenantOrgAdapter?: TenantOrgQueryGrpcAdapter,
    @Optional()
    private readonly terminalDeviceAdapter?: TerminalDeviceAccessAdapter
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
    const hydratedResult = await hydrateAuthResponseTenantNames(
      result,
      source,
      this.tenantOrgAdapter
    )
    return toAuthResponseViewModel(hydratedResult)
  }

  private dispatch(
    dto: LoginDto,
    source: DownstreamRequestSource,
    clientContext: LoginClientContext,
    terminal: LoginTerminal,
    pdaDeviceContext?: PdaLoginDeviceContext
  ) {
    const loginFlow = this.toLoginFlow(dto.method)
    const authDeviceContext = pdaDeviceContext
      ? {
          terminalDeviceId: pdaDeviceContext.terminalDeviceId,
          deviceBoundTenantId: pdaDeviceContext.deviceBoundTenantId,
          loginFlow
        }
      : undefined
    const identifier = dto.identifier.trim()
    const credential = dto.credential.trim()
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
            ...authDeviceContext
          },
          source
        )
      case LoginMethodDto.EMAIL_OTP:
        return this.authAdapter.loginWithEmailOtp(
          identifier,
          credential,
          terminal,
          source,
          authDeviceContext
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
            ...authDeviceContext
          },
          source
        )
      case LoginMethodDto.PHONE_OTP:
        return this.authAdapter.loginWithPhoneOtp(
          identifier,
          credential,
          terminal,
          source,
          authDeviceContext
        )
      default:
        throw new BadRequestException('Unsupported login method')
    }
  }

  // Maps the fixed frontend login method to the platform terminal login flow recorded by auth-service.
  private toLoginFlow(method: LoginMethodDto): TerminalLoginFlow {
    switch (method) {
      case LoginMethodDto.EMAIL_PASSWORD:
        return TerminalLoginFlow.EmailPassword
      case LoginMethodDto.EMAIL_OTP:
        return TerminalLoginFlow.EmailOtp
      case LoginMethodDto.PHONE_PASSWORD:
        return TerminalLoginFlow.PhonePassword
      case LoginMethodDto.PHONE_OTP:
        return TerminalLoginFlow.PhoneOtp
    }
  }

  // Resolves the managed PDA device tenant binding when the fixed terminal requires it.
  private async resolvePdaDeviceContextIfNeeded(
    dto: LoginDto,
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
      deviceMetadata: {
        ...(deviceName ? { deviceName } : {}),
        ...(userAgent ? { userAgent } : {}),
        ...(ipAddress ? { ipAddress } : {})
      }
    })
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
