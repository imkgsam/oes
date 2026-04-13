import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import {
  GrpcExceptionFilter
} from '../../../../../../common/dist/core/filters'
import { InternalServiceGuard } from '@oes/common/authorization'
import {
  BatchAuthorizationDecisionResponse,
  BatchCheckPermissionRequest,
  PolicyConditionExplainNode,
  PolicyEffectExplainProto
} from '@oes/common/generated/permission_service'
import { BatchCheckPermissionQuery } from '../../application/queries/authorization/batch-check-permission.query'
import { CheckPermissionQuery } from '../../application/queries/authorization/check-permission.query'
import { CheckPermissionWithContextQuery } from '../../application/queries/authorization/check-permission-with-context.query'
import { PermissionAuditService } from '../../application/services/permission-audit.service'
import {
  PermissionCheckServiceControllerMethods,
  PermissionCheckServiceController,
  CheckPermissionRequest,
  CheckPermissionWithContextRequest,
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

  /**
   * @deprecated OUTDATED: compatibility endpoint for the historical context RPC.
   * New business resource authorization should use application-level checkResource / buildQueryScope.
   */
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

    this.permissionAuditService.emitAuthorizationDecision({
      accountId: request.accountId!,
      permissionCode: request.permissionCode!,
      evaluationMode: decision.evaluationMode ?? 'RBAC_ABAC',
      decision: decision.allowed ? 'ALLOW' : 'DENY',
      tenantId: request.tenantId || undefined,
      resourceType:
        (request.resourceAttributes?.resource_type as string | undefined) ??
        (request.resourceAttributes?.type as string | undefined),
      resourceId:
        (request.resourceAttributes?.resource_id as string | undefined) ??
        (request.resourceAttributes?.id as string | undefined),
      matchedPolicyName: decision.matchedPolicy ?? undefined,
      reason: decision.reason ?? undefined,
      requestContext: {
        subject: request.subjectAttributes ?? {},
        resource: request.resourceAttributes ?? {},
        environment: request.environmentAttributes ?? {},
        action: request.actionAttributes ?? {}
      }
    })

    return {
      allowed: decision.allowed,
      evaluationMode: decision.evaluationMode === 'RBAC' ? 1 : 2,
      matchedPolicy: decision.matchedPolicy ?? '',
      reason: decision.reason ?? '',
      explainCode: decision.explainCode ?? '',
      matchedPolicyId: decision.matchedPolicyId ?? '',
      policyExplainEntries: (decision.policyExplainEntries ?? []).map((entry) => ({
        policyId: entry.policyId,
        policyName: entry.policyName,
        effect:
          entry.effect === 'DENY'
            ? PolicyEffectExplainProto.POLICY_EFFECT_EXPLAIN_PROTO_DENY
            : PolicyEffectExplainProto.POLICY_EFFECT_EXPLAIN_PROTO_ALLOW,
        priority: entry.priority,
        applicable: entry.applicable,
        matched: entry.matched,
        reasonCode: entry.reasonCode,
        conditionExplainTree: entry.conditionExplainTree
          ? this.toPolicyConditionExplainNode(entry.conditionExplainTree)
          : undefined
      }))
    }
  }

  private toPolicyConditionExplainNode(
    node: {
      nodeType: string
      path: string
      matched: boolean
      reasonCode: string
      source?: string
      key?: string
      operator?: string
      actualValue?: unknown
      expectedValue?: unknown
      children?: any[]
    }
  ): PolicyConditionExplainNode {
    return {
      nodeType: node.nodeType,
      path: node.path,
      matched: node.matched,
      reasonCode: node.reasonCode,
      source: node.source ?? '',
      key: node.key ?? '',
      operator: node.operator ?? '',
      actualValueJson:
        typeof node.actualValue === 'undefined' ? '' : JSON.stringify(node.actualValue),
      expectedValueJson:
        typeof node.expectedValue === 'undefined' ? '' : JSON.stringify(node.expectedValue),
      children: (node.children ?? []).map((child) => this.toPolicyConditionExplainNode(child))
    }
  }
}
