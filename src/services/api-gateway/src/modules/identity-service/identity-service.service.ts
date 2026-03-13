import { Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { InjectGrpcClient } from '@oes/common/transport'

@Injectable()
export class IdentityServiceService implements OnModuleInit {
  constructor(
    @InjectGrpcClient('identity-service')
    private readonly identityClient: ClientGrpc
  ) {}

  onModuleInit() {
    // TODO: bind gRPC service stubs after proto definitions are finalized
    // this.identitySvc = this.identityClient.getService<IdentityService>('IdentityService')
  }

  async getAllUsers() {
    // TODO: replace with gRPC call
    // return safeGrpcCall(this.identitySvc.listUsers({}), { ... })
    return []
  }
}
