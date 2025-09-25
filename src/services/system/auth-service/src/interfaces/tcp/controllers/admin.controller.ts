import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { IAuthServiceRpcAdminPort } from '@oes/common/interfaces/services/auth-service.interface'
@Controller()
export class TcpPermissionController implements IAuthServiceRpcAdminPort {
  constructor() {}
}
