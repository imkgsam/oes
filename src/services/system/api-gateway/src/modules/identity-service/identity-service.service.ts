import { Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { safeRpcCall2 } from '@oes/common/helpers/rpc.helper'
import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { IDENTITY_MESSAGES } from '@oes/common/constants/messages/identity.message'

@Injectable()
export class IdentityServiceService {
  constructor(
    @InjectServiceClient(ServiceKeys.IDENTITY_TCP)
    private readonly identityClient: ClientProxy
  ) {}

  async getAllUsers() {
    return safeRpcCall2(this.identityClient, IDENTITY_MESSAGES.LIST_USERS, {})
  }
}
