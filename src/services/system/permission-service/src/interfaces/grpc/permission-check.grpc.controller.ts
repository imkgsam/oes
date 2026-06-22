import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import {
  GrpcExceptionFilter
} from '../../../../../../common/dist/core/filters'
import { InternalServiceGuard } from '@oes/common/authorization'
import {
  BatchAuthorizationDecisionResponse,
  BatchCheckPermissionRequest
} from '@oes/common/generated/permission_service'
import { BatchCheckPermissionQuery } from '../../application/queries/authorization/batch-check-permission.query'
import { CheckPermissionQuery } from '../../application/queries/authorization/check-permission.query'
import { PermissionAuditService } from '../../application/services/permission-audit.service'
import {
  PermissionCheckServiceControllerMethods,
  PermissionCheckServiceController,
  CheckPermissionRequest,
  AuthorizationDecisionResponse
} from '@oes/common/generated/permission_service'

@Controller()
@UseFilters(GrpcExceptionFilter)
@UseGuards(InternalServiceGuard)
@PermissionCheckServiceControllerMethods()
export class PermissionCheckGrpcController implements PermissionCheckServiceController {
  constructor(
    private readonly queryBus: ValidatingQueryBus,
    private readonly permissionAuditService: PermissionAuditService
  ) {}

  async checkPermission(
    request: CheckPermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<AuthorizationDecisionResponse> {
    const allowed = await this.queryBus.execute(
      new CheckPermissionQuery(request.accountId!, request.permissionCode!)
    )

    this.permissionAuditService.emitAuthorizationDecision({
      accountId: request.accountId!,
      permissionCode: request.permissionCode!,
      evaluationMode: 'RBAC',
      decision: allowed ? 'ALLOW' : 'DENY',
      tenantId: request.tenantId || undefined,
      reason: allowed ? 'RBAC_GRANTED' : 'RBAC_DENIED',
      requestContext: {}
    })

    return {
      allowed,
      evaluationMode: 1,
      matchedPolicy: '',
      reason: allowed ? 'RBAC_GRANTED' : 'RBAC_DENIED',
      explainCode: allowed ? 'RBAC_GRANTED' : 'RBAC_DENIED',
      matchedPolicyId: '',
      policyExplainEntries: []
    }
  }

  async batchCheckPermission(
    request: BatchCheckPermissionRequest,
    metadata?: Metadata,
    ...rest: any
  ): Promise<BatchAuthorizationDecisionResponse> {
    const decisions = await this.queryBus.execute(
      new BatchCheckPermissionQuery(
        (request.items ?? []).map((item) => ({
          requestId: item.requestId || undefined,
          accountId: item.accountId!,
          permissionCode: item.permissionCode!,
          tenantId: item.tenantId || undefined
        }))
      )
    )

    decisions.forEach((decision, index) => {
      const item = request.items?.[index]
      if (!item) {
        return
      }

      this.permissionAuditService.emitAuthorizationDecision({
        accountId: item.accountId!,
        permissionCode: item.permissionCode!,
        evaluationMode: 'RBAC',
        decision: decision.allowed ? 'ALLOW' : 'DENY',
        tenantId: item.tenantId || undefined,
        reason: decision.reason ?? undefined,
        requestContext: {
          requestId: item.requestId || ''
        }
      })
    })

    return {
      decisions: decisions.map((decision) => ({
        requestId: decision.requestId ?? '',
        allowed: decision.allowed,
        evaluationMode: 1,
        matchedPolicy: decision.matchedPolicy ?? '',
        reason: decision.reason ?? '',
        explainCode: decision.explainCode ?? ''
      }))
    }
  }
}
