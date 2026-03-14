import { Controller, UseFilters } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { permission_service } from '@oes/common/generated'

import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter, OtelExceptionFilter } from '@oes/common/filters'
import { CheckPermissionQuery } from '../../application/queries/authorization/check-permission.query'
import { CheckPermissionWithContextQuery } from '../../application/queries/authorization/check-permission-with-context.query'

@Controller()
@UseFilters(OtelExceptionFilter, GrpcExceptionFilter)
@permission_service.PermissionCheckServiceControllerMethods()
export class PermissionCheckGrpcController
  implements permission_service.PermissionCheckServiceController
{
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async checkPermission(
    request: permission_service.CheckPermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<permission_service.AuthorizationDecisionResponse> {
    const allowed = await this.queryBus.execute(
      new CheckPermissionQuery(request.accountId!, request.permissionCode!)
    )

    return {
      allowed,
      evaluationMode: 1,
      matchedPolicy: '',
      reason: allowed ? 'RBAC_GRANTED' : 'RBAC_DENIED'
    }
  }

  async checkPermissionWithContext(
    request: permission_service.CheckPermissionWithContextRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<permission_service.AuthorizationDecisionResponse> {
    const decision = await this.queryBus.execute(
      new CheckPermissionWithContextQuery({
        accountId: request.accountId!,
        permissionCode: request.permissionCode!,
        tenantId: request.tenantId || undefined,
        subject: request.subjectAttributes ?? {},
        resource: request.resourceAttributes ?? {},
        environment: request.environmentAttributes ?? {},
        action: request.actionAttributes ?? {}
      })
    )

    return {
      allowed: decision.allowed,
      evaluationMode: 2,
      matchedPolicy: decision.matchedPolicy ?? '',
      reason: decision.reason ?? ''
    }
  }
}
