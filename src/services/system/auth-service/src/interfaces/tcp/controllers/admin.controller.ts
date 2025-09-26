import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { IAuthServiceRpcAdminContract } from '@oes/common/interfaces/services/auth-service/rpc.contract'
@Controller()
export class TcpPermissionController implements IAuthServiceRpcAdminContract {
  constructor() {}
}
