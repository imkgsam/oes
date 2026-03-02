import { Controller, UseFilters } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import {
  PermissionCheckServiceController,
  PermissionCheckServiceControllerMethods,
  CheckPermissionRequest,
  CheckPermissionResponse,
  CheckPermissionWithContextRequest,
  AuthzDecisionResponse
} from '@oes/common/generated/permission_service/permission_check'
import { ValidatingQueryBus } from '@oes/common/cqrs/validating-query-bus'
import { GrpcExceptionFilter } from '@oes/common/core/filters/grpc-exception.filter'
import { OtelExceptionFilter } from '@oes/common/core/filters/otel-exception.filter'
import { CheckPermissionQuery } from 'src/application/queries/authorization/check-permission.query'
import { CheckPermissionWithContextQuery } from 'src/application/queries/authorization/check-permission-with-context.query'

@Controller()
@UseFilters(OtelExceptionFilter, GrpcExceptionFilter)
@PermissionCheckServiceControllerMethods()
export class PermissionCheckGrpcController implements PermissionCheckServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async checkPermission(
    request: CheckPermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<CheckPermissionResponse> {
    const pass = await this.queryBus.execute(
      new CheckPermissionQuery(request.accountId!, request.permissionCode!)
    )
    return { pass }
  }

  async checkPermissionWithContext(
    request: CheckPermissionWithContextRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<AuthzDecisionResponse> {
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
      matchedPolicy: decision.matchedPolicy ?? '',
      reason: decision.reason ?? ''
    }
  }
}
