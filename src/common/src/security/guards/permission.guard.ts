import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ExceptionFactory } from '../../core/exceptions'
import {
  OPERATOR_PERMISSION_RESOLVER,
  REQUIRE_PERMISSION_METADATA_KEY
} from '../constants'
import { OPERATOR_CONTEXT_MISSING } from '../exceptions'
import { OperatorContextPayload, OperatorPermissionResolver } from '../types'
import { getAuthenticatedGrpcRequestContext } from '../utils'

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(OPERATOR_PERMISSION_RESOLVER)
    private readonly permissionResolver: OperatorPermissionResolver
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      REQUIRE_PERMISSION_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (!requiredPermission) {
      return true
    }

    const operatorContext = this.getOperatorContext(context)
    const permissions = await this.permissionResolver.resolvePermissions(operatorContext)

    return permissions.includes(requiredPermission)
  }

  private getOperatorContext(context: ExecutionContext): OperatorContextPayload {
    const rpcData = context.switchToRpc().getData()
    const operatorContext = getAuthenticatedGrpcRequestContext(rpcData)?.operatorContext

    if (!operatorContext) {
      throw ExceptionFactory.application(OPERATOR_CONTEXT_MISSING)
    }

    return operatorContext
  }
}
