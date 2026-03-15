import { Controller, UseFilters } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter, OtelExceptionFilter } from '@oes/common/filters'
import { CheckPermissionQuery } from '../../application/queries/authorization/check-permission.query'
import { CheckPermissionWithContextQuery } from '../../application/queries/authorization/check-permission-with-context.query'
import {
  PermissionCheckServiceControllerMethods,
  PermissionCheckServiceController,
  CheckPermissionRequest,
  CheckPermissionWithContextRequest,
  AuthorizationDecisionResponse
} from '@oes/common/generated/permission_service'

@Controller()
@UseFilters(OtelExceptionFilter, GrpcExceptionFilter)
@PermissionCheckServiceControllerMethods()
export class PermissionCheckGrpcController implements PermissionCheckServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async checkPermission(
    request: CheckPermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<AuthorizationDecisionResponse> {
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
    request: CheckPermissionWithContextRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<AuthorizationDecisionResponse> {
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
