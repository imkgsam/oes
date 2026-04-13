import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  getAuthenticatedGrpcRequestContext,
  MANAGEMENT_INTERFACE_METADATA_KEY
} from '@oes/common/authorization'
import { AccountAuthorizationService } from '../../domain/services/account-authorization.service'
import { AUTHORIZATION_DENIED } from '../../common/constants/exception-enums'
import { REQUIRE_MANAGEMENT_PERMISSION_METADATA_KEY } from '../decorators'

@Injectable()
export class ManagementAuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accountAuthorizationService: AccountAuthorizationService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isManagementInterface = this.reflector.getAllAndOverride<boolean>(
      MANAGEMENT_INTERFACE_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    )

    const requiredPermissionCode = this.reflector.getAllAndOverride<string>(
      REQUIRE_MANAGEMENT_PERMISSION_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (!isManagementInterface || !requiredPermissionCode) {
      return true
    }

    const rpcContext = context.switchToRpc()
    const authenticatedContext = getAuthenticatedGrpcRequestContext(rpcContext.getData())
    const operatorId = authenticatedContext?.operatorContext?.operator_id

    if (!operatorId) {
      throw ExceptionFactory.application(AUTHORIZATION_DENIED, {
        reason: 'authenticated operator is missing'
      })
    }

    const allowed = await this.accountAuthorizationService.checkPermission(
      operatorId,
      requiredPermissionCode
    )

    if (!allowed) {
      throw ExceptionFactory.application(AUTHORIZATION_DENIED, {
        operatorId,
        requiredPermissionCode
      })
    }

    return true
  }
}
