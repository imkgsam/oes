import { Body, Controller, Post } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { InjectGrpcClient } from '@oes/common/transport/grpc/grpc-client.decorator'
import { ApiTags } from '@nestjs/swagger'
import {
  EmailPasswordLoginRequestDto,
  GoogleLoginRequestDto,
  EmailOtpLoginRequestDto,
  PhoneOtpLoginRequestDto,
  WechatLoginRequestDto,
  PhonePasswordLoginRequestDto
} from '@oes/common/dtos/auth-service/all.dto'
import { AUTH_MESSAGES } from '@oes/common/constants/messages/auth.message'
import { Public } from '@oes/common/auth/decorators/is-public.decorator'
@Public()
@ApiTags('身份认证')
@Controller('auth')
export class AuthController {
  constructor(
    @InjectGrpcClient('auth-service')
    private readonly authClient: ClientGrpc
  ) {}

  // TODO: Implement gRPC service stubs after proto definitions are finalized
  // @Post('login/email-password')
  // async loginWithEmailPassword(@Body() dto: EmailPasswordLoginRequestDto) {
  //   const authSvc = this.authClient.getService<AuthService>('AuthService')
  //   return firstValueFrom(authSvc.loginWithEmailPassword(dto))
  // }
}
