import { Body, Controller, Get, Post } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { AUTH_MESSAGES } from '@oes/common/constants/messages/auth.message'
import {
  TestingWithParamsRequestDto,
  TestingWithParamsResponseDto
} from '@oes/common/dtos/auth-service/all.dto'
import { safeRpcCall2 } from '@oes/common/helpers/rpc.helper'
import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'

@Controller('test')
export class TestController {
  constructor(
    @InjectServiceClient(ServiceKeys.AUTH_TCP)
    private readonly authClient: ClientProxy
  ) {}

  @Get('1')
  async test() {
    const k = await safeRpcCall2(this.authClient, AUTH_MESSAGES.TESTING, {})
    return k.data
  }

  @Post('2')
  async testingWithParams(@Body() dto: TestingWithParamsRequestDto) {
    const k = await safeRpcCall2<TestingWithParamsRequestDto, TestingWithParamsResponseDto>(
      this.authClient,
      AUTH_MESSAGES.TESTING_WITH_PARAMS,
      dto
    )
    return k
  }
}
