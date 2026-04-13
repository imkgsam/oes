import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { AppLogger } from '@oes/common/logging'
import { IdentityAuditEvent } from '../../application/events/identity-audit.event'
import { IdentityAuditService } from '../../application/services/identity-audit.service'
import { PrismaIdentityAuditRepository } from '../repositories/prisma/prisma.identity-audit.repository'

@Injectable()
export class IdentityAuditListener {
  constructor(
    private readonly logger: AppLogger,
    private readonly repository: PrismaIdentityAuditRepository
  ) {}

  @OnEvent(IdentityAuditService.EVENT_NAME)
  handle(event: IdentityAuditEvent): void {
    void this.repository
      .append(event)
      .then(() => {
        this.logger.info(`Identity audit event: ${event.eventType}`, {
          module: 'identity-service',
          operation: 'identity.audit',
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
        this.logger.error(`Failed to persist identity audit event: ${event.eventType}`, {
          module: 'identity-service',
          operation: 'identity.audit.persist',
          details: {
            eventId: event.eventId,
            error: error instanceof Error ? error.message : String(error)
          }
        })
      })
  }
}
