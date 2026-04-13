import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { AppLogger } from '@oes/common/logging'
import { AuthAuditEvent } from '../../application/events/auth-audit.event'
import { PrismaAuthAuditRepository } from '../repositories/prisma/prisma.auth-audit.repository'

/**
 * AuthAuditListener writes auth audit events into the structured log stream for later review.
 */
@Injectable()
export class AuthAuditListener {
  constructor(
    private readonly logger: AppLogger,
    private readonly repository: PrismaAuthAuditRepository
  ) {}

  @OnEvent('auth.audit')
  handle(event: AuthAuditEvent): void {
    void this.repository
      .append(event)
      .then(() => {
        this.logger.info(`Auth audit event: ${event.type}`, {
          module: 'auth-service',
          operation: 'auth.audit',
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
        this.logger.error(`Failed to persist auth audit event: ${event.type}`, {
          module: 'auth-service',
          operation: 'auth.audit.persist',
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
