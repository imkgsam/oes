import { Controller, Get } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { AUTH_MESSAGES } from '@oes/common/constants/messages/auth.message'
import { TestingWithParamsRequestDto } from '@oes/common/dtos/auth-service/all.dto'
import { safeRpcCall2 } from '@oes/common/helpers/rpc.helper'
import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'

@Controller('auth/test')
export class TestController {
  constructor(
    @InjectServiceClient(ServiceKeys.AUTH_TCP)
    private readonly authClient: ClientProxy
  ) {}

  @Get('testing')
  async test() {
    interface testRt {
      result: number
      msg: string
    }
    const k = await safeRpcCall2<any, testRt>(this.authClient, AUTH_MESSAGES.TESTING, {})
    return k.data.result
  }

  @Get('testing-with-params')
  async testingWithParams() {
    const k = await safeRpcCall2<any, TestingWithParamsRequestDto>(
      this.authClient,
      AUTH_MESSAGES.TESTING_WITH_PARAMS
    )
    console.log(k)
    return k
  }
}
