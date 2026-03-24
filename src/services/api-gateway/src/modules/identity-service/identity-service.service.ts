// OUTDATED: this gateway-side identity proxy is still a placeholder from the pre-contract stage.
// It is not aligned with the current identity-service gRPC contract and should not be treated as an active integration path.
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
    // OUTDATED: this placeholder never bound the real IdentityQueryService / IdentityManagementService stubs.
    // this.identitySvc = this.identityClient.getService<IdentityService>('IdentityService')
  }

  async getAllUsers() {
    // OUTDATED: identity-service no longer exposes a "listUsers" style admin endpoint.
    // Keep the empty response only as an explicit compatibility marker until the proxy is removed or redesigned.
    // return safeGrpcCall(this.identitySvc.listUsers({}), { ... })
    return []
  }
}
