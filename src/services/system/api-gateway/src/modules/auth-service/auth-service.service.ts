import { Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { ServiceKeys } from '@oes/common/rpc/clients/service-map'
import { InjectServiceClient } from '@oes/common/rpc/clients/client.decorator'
import { safeRpcCall } from '@oes/common/helpers/rpc.helper'
import { AUTH_MESSAGES } from '@oes/common/constants/messages/auth.message'

@Injectable()
export class AuthServiceService {
  constructor(
    @InjectServiceClient(ServiceKeys.AUTH_TCP)
    private readonly authClient: ClientProxy
  ) {}
}
