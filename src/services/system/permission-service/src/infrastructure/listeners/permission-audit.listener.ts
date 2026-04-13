import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { AppLogger } from '@oes/common/logging'
import { PermissionAuditEvent } from '../../application/events/permission-audit.event'
import { PermissionAuditService } from '../../application/services/permission-audit.service'
import { PrismaPermissionAuditRepository } from '../repositories/prisma/prisma.permission-audit.repository'

/**
 * PermissionAuditListener persists permission management audit envelopes and mirrors them into structured logs.
 */
@Injectable()
export class PermissionAuditListener {
  constructor(
    private readonly logger: AppLogger,
    private readonly repository: PrismaPermissionAuditRepository
  ) {}

  /**
   * handle stores one permission management audit envelope and emits a structured audit log entry.
   */
  @OnEvent(PermissionAuditService.MANAGEMENT_EVENT_NAME)
  handle(event: PermissionAuditEvent): void {
    void this.repository
      .appendAudit(event)
      .then(() => {
        this.logger.info(`Permission audit event: ${event.eventType}`, {
          module: 'permission-service',
          operation: 'permission.audit',
          traceId: event.trace.traceId ?? undefined,
          spanId: event.trace.spanId ?? undefined,
          details: {
            eventId: event.eventId,
            service: event.service,
            auditModule: event.module,
            eventType: event.eventType,
            occurredAt: event.occurredAt.toISOString(),
            result: event.result,
            operator: event.operator,
            scope: event.scope,
            trace: event.trace,
            resource: event.resource,
            details: event.details
          }
        })
      })
      .catch((error: unknown) => {
        this.logger.error(`Failed to persist permission audit event: ${event.eventType}`, {
          module: 'permission-service',
          operation: 'permission.audit.persist',
          traceId: event.trace.traceId ?? undefined,
          spanId: event.trace.spanId ?? undefined,
          details: {
            eventId: event.eventId,
            error: error instanceof Error ? error.message : String(error)
          }
        })
      })
  }
}
