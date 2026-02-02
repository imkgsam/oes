import { Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { ServiceKeys } from '@oes/common/rpc/clients/service-map'
import { InjectServiceClient } from '@oes/common/rpc/clients/client.decorator'

@Injectable()
export class AuthServiceService {
  constructor(
    @InjectServiceClient(ServiceKeys.AUTH_TCP)
    private readonly authClient: ClientProxy
  ) {}
}
