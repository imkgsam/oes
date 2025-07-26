import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ServiceKeys } from '@oes/common/modules/clients/service-map';
import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { safeRpcCall } from '@oes/common/helpers/rpc.helper';
import { AUTH_MESSAGES } from '@oes/common/constants/messages/auth.message'

@Injectable()
export class AuthServiceService {
  constructor(
    @InjectServiceClient(ServiceKeys.AUTH_TCP)
    private readonly authClient: ClientProxy
  ) { }

  async getAllLoginMethods() {
    return safeRpcCall(this.authClient.send(AUTH_MESSAGES.LIST_LOGINMETHODS, {}))
  }

  async getAllCredentials() {
    return safeRpcCall(this.authClient.send(AUTH_MESSAGES.LIST_CREDENTIALS, {}))
  }

  async getAllOTPs() {
    return safeRpcCall(this.authClient.send(AUTH_MESSAGES.LIST_OTPS, {}))
  }

}

