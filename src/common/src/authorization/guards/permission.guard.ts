import { CanActivate, ExecutionContext, Inject, Injectable, Logger } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ACCESS_DENIED, ExceptionFactory, InfrastructureException } from '../../core/exceptions'
import { OPERATOR_PERMISSION_RESOLVER, REQUIRE_PERMISSIONS_METADATA_KEY } from '../constants'
import { RequirePermissionsMetadata } from '../decorators'
import { OPERATOR_CONTEXT_MISSING, PERMISSION_DEPENDENCY_UNAVAILABLE } from '../exceptions'
import { OperatorContextPayload, OperatorPermissionResolver } from '../types'
import { getAuthenticatedGrpcRequestContext } from '../utils'

type PermissionRequirementMode = 'all' | 'any'

/** Enforces coarse-grained gRPC interface permissions against the authenticated operator context. */
@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name)

  constructor(
    private readonly reflector: Reflector,
    @Inject(OPERATOR_PERMISSION_RESOLVER)
    private readonly permissionResolver: OperatorPermissionResolver
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<RequirePermissionsMetadata>(
      REQUIRE_PERMISSIONS_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (!requiredPermissions) {
      return true
    }

    const mode = this.resolveMode(requiredPermissions)
    const requiredPermissionCodes = requiredPermissions[mode]
    const operatorContext = this.getOperatorContext(context)
    const requestTarget = this.describeRequestTarget(context)
    const permissions = await this.resolvePermissions(operatorContext, requiredPermissionCodes)
    const allowed = this.hasRequiredPermissions(mode, requiredPermissionCodes, permissions)

    if (!allowed) {
      this.logger.warn(
        `permission denied: required=${requiredPermissionCodes.join(',')}; mode=${mode}; operatorId=${operatorContext.operator_id}; tenantId=${
          operatorContext.tenant_id ?? ''
        }; issuer=${operatorContext.issuer}; target=${requestTarget}; resolvedPermissions=${permissions.length}; sample=${permissions
          .slice(0, 12)
          .join(',')}`
      )
      throw ExceptionFactory.application(ACCESS_DENIED, {
        requiredPermissions: requiredPermissionCodes,
        mode
      })
    }

    this.logger.debug(
      `permission granted: required=${requiredPermissionCodes.join(',')}; mode=${mode}; operatorId=${operatorContext.operator_id}; tenantId=${
        operatorContext.tenant_id ?? ''
      }; issuer=${operatorContext.issuer}; target=${requestTarget}; resolvedPermissions=${permissions.length}`
    )

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

  private resolveMode(metadata: RequirePermissionsMetadata): PermissionRequirementMode {
    const hasAll = Array.isArray(metadata.all)
    const hasAny = Array.isArray(metadata.any)

    if (hasAll === hasAny) {
      throw new Error('RequirePermissions metadata must declare exactly one of all or any')
    }

    return hasAll ? 'all' : 'any'
  }

  private hasRequiredPermissions(
    mode: PermissionRequirementMode,
    requiredPermissions: string[],
    permissions: string[]
  ): boolean {
    if (mode === 'all') {
      return requiredPermissions.every((permission) => permissions.includes(permission))
    }

    return requiredPermissions.some((permission) => permissions.includes(permission))
  }

  private async resolvePermissions(
    operatorContext: OperatorContextPayload,
    requiredPermissions: string[]
  ): Promise<string[]> {
    try {
      return await this.permissionResolver.resolvePermissions(operatorContext)
    } catch (error) {
      this.logger.error(
        `permission resolution failed: required=${requiredPermissions.join(',')}; operatorId=${operatorContext.operator_id}; tenantId=${
          operatorContext.tenant_id ?? ''
        }; issuer=${operatorContext.issuer}; error=${(error as Error)?.message ?? error}`
      )
      if (error instanceof InfrastructureException) {
        throw ExceptionFactory.infrastructure(PERMISSION_DEPENDENCY_UNAVAILABLE, {
          requiredPermissions,
          operatorId: operatorContext.operator_id,
          tenantId: operatorContext.tenant_id
        })
      }

      throw error
    }
  }

  private describeRequestTarget(context: ExecutionContext): string {
    const handlerName = context.getHandler()?.name ?? 'unknown_handler'
    const rpcData = context.switchToRpc().getData<Record<string, unknown> | undefined>()

    if (!rpcData || typeof rpcData !== 'object') {
      return handlerName
    }

    const targetAccountId = this.readStringField(rpcData, 'accountId')
    const targetTenantId = this.readStringField(rpcData, 'tenantId')
    const targetUserId = this.readStringField(rpcData, 'userId')

    return [
      handlerName,
      targetAccountId ? `accountId=${targetAccountId}` : '',
      targetTenantId ? `tenantId=${targetTenantId}` : '',
      targetUserId ? `userId=${targetUserId}` : ''
    ]
      .filter(Boolean)
      .join(';')
  }

  private readStringField(record: Record<string, unknown>, field: string): string | undefined {
    const value = record[field]
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
  }
}
