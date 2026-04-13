import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ACCESS_DENIED, ExceptionFactory, InfrastructureException } from '../../core/exceptions'
import {
  OPERATOR_PERMISSION_RESOLVER,
  REQUIRE_PERMISSION_METADATA_KEY
} from '../constants'
import { OPERATOR_CONTEXT_MISSING, PERMISSION_DEPENDENCY_UNAVAILABLE } from '../exceptions'
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
    const permissions = await this.resolvePermissions(operatorContext, requiredPermission)

    if (!permissions.includes(requiredPermission)) {
      throw ExceptionFactory.application(ACCESS_DENIED, {
        requiredPermission
      })
    }

    return true
  }

  private getOperatorContext(context: ExecutionContext): OperatorContextPayload {
    const rpcData = context.switchToRpc().getData()
    const operatorContext = getAuthenticatedGrpcRequestContext(rpcData)?.operatorContext

    if (!operatorContext) {
      throw ExceptionFactory.application(OPERATOR_CONTEXT_MISSING)
    }

    return operatorContext
  }

  private async resolvePermissions(
    operatorContext: OperatorContextPayload,
    requiredPermission: string
  ): Promise<string[]> {
    try {
      return await this.permissionResolver.resolvePermissions(operatorContext)
    } catch (error) {
      if (error instanceof InfrastructureException) {
        throw ExceptionFactory.infrastructure(PERMISSION_DEPENDENCY_UNAVAILABLE, {
          requiredPermission,
          operatorId: operatorContext.operator_id,
          tenantId: operatorContext.tenant_id
        })
      }

      throw error
    }
  }
}
