import { BadRequestException, Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import { TenantOrgQueryGrpcAdapter } from '../../infrastructure/downstream/tenant-org-service/tenant-org-query-grpc.adapter'
import { LoginDto, LoginMethodDto } from '../../interfaces/http/dtos/login.dto'
import { AuthResponseViewModel } from '../../interfaces/http/view-models/auth-response.view-model'
import { toAuthResponseViewModel } from './auth-response.mapper'
import { hydrateAuthResponseTenantNames } from './auth-response-tenant-name.hydrator'

interface LoginClientContext {
  userAgent?: string
  ipAddress?: string
}

@Injectable()
// Executes the primary login submission and normalizes downstream auth flow responses for HTTP clients.
export class LoginUseCase {
  constructor(
    private readonly authAdapter: AuthGrpcAdapter,
    private readonly tenantOrgAdapter?: TenantOrgQueryGrpcAdapter
  ) {}

  async execute(
    dto: LoginDto,
    source: DownstreamRequestSource,
    clientContext: LoginClientContext
  ): Promise<AuthResponseViewModel> {
    const result = await this.dispatch(dto, source, clientContext)
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
    clientContext: LoginClientContext
  ) {
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
            ipAddress
          },
          source
        )
      case LoginMethodDto.EMAIL_OTP:
        return this.authAdapter.loginWithEmailOtp(identifier, credential, source)
      case LoginMethodDto.PHONE_PASSWORD:
        return this.authAdapter.loginWithPhonePassword(
          {
            phone: identifier,
            password: credential,
            deviceName,
            userAgent,
            ipAddress
          },
          source
        )
      case LoginMethodDto.PHONE_OTP:
        return this.authAdapter.loginWithPhoneOtp(identifier, credential, source)
      default:
        throw new BadRequestException('Unsupported login method')
    }
  }
}
