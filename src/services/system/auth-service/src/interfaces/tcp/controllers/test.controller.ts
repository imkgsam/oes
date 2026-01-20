import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { AUTH_MESSAGES } from '@oes/common/constants/messages/auth.message'
import { RpcRequestData } from '@oes/common/decorators/rpc-request-data.decorator'
import {
  TestingWithParamsRequestDto,
  TestingWithParamsResponseDto
} from '@oes/common/dtos/auth-service/all.dto'
import { IAuthServiceRpcTestContract } from '@oes/common/contracts/auth-service/rpc.contract'
import { HttpClient } from '@oes/common/http/client/http.client'
import { HttpServiceFactory } from '@oes/common/http/client/http.service'
@Controller('test')
export class TcpTestController implements IAuthServiceRpcTestContract {
  private readonly httpClient: HttpClient
  constructor(private readonly httpFactory: HttpServiceFactory) {
    this.httpClient = this.httpFactory.createClient({
      baseURL: 'https://jsonplaceholder.typicode.com',
      timeout: 10000,
      retries: 3
    })
  }

  @MessagePattern(AUTH_MESSAGES.TESTING_WITH_PARAMS)
  async testingWithParams(
    @RpcRequestData() dto: TestingWithParamsRequestDto
  ): Promise<TestingWithParamsResponseDto> {
    console.log('DTO ', dto)
    return await Promise.resolve({
      result: 123,
      msg: 'success'
    })
  }

  @MessagePattern(AUTH_MESSAGES.TESTING)
  async testing() {
    const res = await this.httpClient.get('/todos/1')
    console.log('res', res)
    return res
  }
}
