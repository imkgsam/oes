import { randomUUID } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { captureEventTraceContext } from '@oes/common/tracing'
import { AuditEventEntity } from '../../domain/entities/audit-event.entity'
import { DecisionEventEntity } from '../../domain/entities/decision-event.entity'
import { PermissionAuditEvent, PermissionAuditModule } from '../events/permission-audit.event'
import { PrismaPermissionAuditRepository } from '../../infrastructure/repositories/prisma/prisma.permission-audit.repository'

type AuditActorType = 'USER' | 'SERVICE' | 'SYSTEM'
type AuditTargetType = 'ROLE' | 'PERMISSION' | 'POLICY' | 'ACCOUNT_ROLE' | 'ROLE_PERMISSION'
type EvaluationModeValue = 'RBAC' | 'RBAC_ABAC'
type DecisionValue = 'ALLOW' | 'DENY'

/**
 * PermissionAuditService emits management audit envelopes and persists decision events for permission-service.
 */
@Injectable()
export class PermissionAuditService {
  static readonly MANAGEMENT_EVENT_NAME = 'permission.audit.management'

  private readonly logger = new Logger(PermissionAuditService.name)

  constructor(
    private readonly repository: PrismaPermissionAuditRepository,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * emitManagementMutation publishes permission management audit facts through the local audit event pipeline.
   */
  emitManagementMutation(input: {
    actorId: string
    actorType?: AuditActorType
    tenantId?: string
    action: string
    targetType: AuditTargetType
    targetId: string
    targetCode?: string
    beforeData?: Record<string, unknown>
    afterData?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }): void {
    const traceContext = captureEventTraceContext()

    this.eventEmitter.emit(
      PermissionAuditService.MANAGEMENT_EVENT_NAME,
      new PermissionAuditEvent(
        randomUUID(),
        this.resolveManagementModule(input.targetType),
        input.action,
        new Date(),
        'SUCCEEDED',
        {
          operatorId: input.actorId,
          operatorType: (input.actorType ?? 'USER') === 'USER' ? 'HUMAN' : 'SYSTEM'
        },
        {
          tenantId: input.tenantId ?? null,
          orgId: null
        },
        {
          traceId: traceContext.traceId,
          spanId: traceContext.spanId
        },
        {
          resourceType: input.targetType.toLowerCase(),
          resourceId: input.targetId
        },
        {
          targetCode: input.targetCode ?? null,
          beforeData: input.beforeData ?? null,
          afterData: input.afterData ?? null,
          metadata: input.metadata ?? null
        }
      )
    )
  }

  /**
   * emitAuthorizationDecision persists runtime authorization decisions directly until decision auditing is promoted.
   */
  emitAuthorizationDecision(input: {
    accountId: string
    permissionCode: string
    evaluationMode: EvaluationModeValue
    decision: DecisionValue
    tenantId?: string
    resourceType?: string
    resourceId?: string
    matchedPolicyId?: string
    matchedPolicyName?: string
    reason?: string
    requestContext?: Record<string, unknown>
  }): void {
    const event = new DecisionEventEntity(
      randomUUID(),
      input.accountId,
      input.permissionCode,
      input.evaluationMode,
      input.decision,
      new Date(),
      input.tenantId,
      input.resourceType,
      input.resourceId,
      input.matchedPolicyId,
      input.matchedPolicyName,
      input.reason,
      input.requestContext
    )

    void this.repository.appendDecision(event).catch((error: unknown) => {
      this.logger.error(
        `Failed to persist authorization decision: ${input.permissionCode}`,
        error as Error
      )
    })
  }

  /**
   * resolveManagementModule groups management mutations into stable audit modules for query and browsing.
   */
  private resolveManagementModule(targetType: AuditTargetType): PermissionAuditModule {
    if (targetType === 'POLICY') {
      return 'policy'
    }

    if (targetType === 'PERMISSION') {
      return 'permission'
    }

    return 'role'
  }
}
