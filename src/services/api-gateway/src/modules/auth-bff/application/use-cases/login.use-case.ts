import { BadRequestException, Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import { LoginDto, LoginMethodDto } from '../../interfaces/http/dtos/login.dto'
import { AuthResponseViewModel } from '../../interfaces/http/view-models/auth-response.view-model'
import { toAuthResponseViewModel } from './auth-response.mapper'

@Injectable()
// Executes the primary login submission and normalizes downstream auth flow responses for HTTP clients.
export class LoginUseCase {
  constructor(private readonly authAdapter: AuthGrpcAdapter) {}

  async execute(dto: LoginDto, source: DownstreamRequestSource): Promise<AuthResponseViewModel> {
    const result = await this.dispatch(dto, source)
    return toAuthResponseViewModel(result)
  }

  private dispatch(dto: LoginDto, source: DownstreamRequestSource) {
    const identifier = dto.identifier.trim()
    const credential = dto.credential.trim()

    switch (dto.method) {
      case LoginMethodDto.EMAIL_PASSWORD:
        return this.authAdapter.loginWithEmailPassword(identifier, credential, source)
      case LoginMethodDto.EMAIL_OTP:
        return this.authAdapter.loginWithEmailOtp(identifier, credential, source)
      case LoginMethodDto.PHONE_PASSWORD:
        return this.authAdapter.loginWithPhonePassword(identifier, credential, source)
      case LoginMethodDto.PHONE_OTP:
        return this.authAdapter.loginWithPhoneOtp(identifier, credential, source)
      default:
        throw new BadRequestException('Unsupported login method')
    }
  }
}
