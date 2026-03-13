import { Body, Controller, Post } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { InjectGrpcClient } from '@oes/common/transport'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { Public } from '@oes/common/auth'

@Public()
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @InjectGrpcClient('auth-service')
    private readonly authClient: ClientGrpc
  ) {}

  // TODO: bind gRPC service stubs after proto definitions are finalized

  @Post('login/email-password')
  @ApiOperation({ summary: 'Login with email and password' })
  async loginWithEmailPassword() {
    // const authSvc = this.authClient.getService<AuthService>('AuthService')
    // return firstValueFrom(authSvc.loginWithEmailPassword(dto))
  }
}
