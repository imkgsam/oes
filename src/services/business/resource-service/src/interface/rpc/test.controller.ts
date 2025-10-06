import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { IDomainManagementRpcTestContract } from '@oes/common/interfaces/services/resource-service/rpc.contract'
import { RESOURCE_SERVICE_MESSAGES } from '@oes/common/constants/messages/resource-service.messages'

@Controller()
export class TestRpcController implements IDomainManagementRpcTestContract {
  constructor() {}

  // ==================== 测试接口 ====================

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.TESTING)
  async testing(): Promise<void> {
    console.log('Domain Management RPC testing endpoint called')
    return Promise.resolve()
  }
}
