import { Body, Controller, Post } from '@nestjs/common'
import { ClientProxy, MessagePattern } from '@nestjs/microservices'
import {
  EmailOtpLoginDto,
  EmailPasswordLoginDto,
  GoogleLoginDto,
  PhoneOtpLoginDto,
  WechatLoginDto,
} from 'src/application/dtos/login.dto'
import { LoginMethodEnum } from 'src/domain/constants/login-method.enum'
import { AUTH_MESSAGES } from '@oes/common/constants/messages/auth.message'
import { PERMISSION_MESSAGES } from '@oes/common/constants/messages/permission.message'
import { GLOBAL_SYSTEM_ERRORS } from '@oes/common/constants/res-codes/system.errors'

import { InjectServiceClient } from '@oes/common/modules/clients/client.decorator'
import { safeRpcCall } from '@oes/common/helpers/rpc.helper'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { createBusinessException, createSystemException } from '@oes/common/helpers/exception.factory'
import { AUTH_SERVICE_ERRORS } from '@oes/common/constants/res-codes/auth-service.errors'

@Controller('test')
export class TcpTestController {
  constructor(
    @InjectServiceClient(ServiceKeys.PERMI_TCP)
    private readonly permissionClient: ClientProxy
  ) { }

  @MessagePattern(AUTH_MESSAGES.Test)
  async testing() {
    // return 123
    // throw new Error('sdfsdfds')
    // throw createBusinessException(AUTH_SERVICE_ERRORS.NOT_ALLOW_LOGIN, { message: 'banned' })
    // throw createSystemException(GLOBAL_SYSTEM_ERRORS.REDIS_OPERATION_FAILED)
    return safeRpcCall(this.permissionClient.send(PERMISSION_MESSAGES.Test, {}))
  }
}

