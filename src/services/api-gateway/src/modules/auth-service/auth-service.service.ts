import { Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { InjectGrpcClient } from '@oes/common/transport'

@Injectable()
export class AuthServiceService implements OnModuleInit {
  constructor(
    @InjectGrpcClient('auth-service')
    private readonly authClient: ClientGrpc
  ) {}

  onModuleInit() {
    // Initialize gRPC service stubs here
    // e.g., this.authSvc = this.authClient.getService<AuthService>('AuthService')
  }
}
