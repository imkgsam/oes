import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { AppLogger } from '@oes/common/logging'
import { AuthAuditEvent } from 'src/application/events/auth-audit.event'

@Injectable()
export class AuthAuditListener {
  constructor(private readonly logger: AppLogger) {}

  @OnEvent('auth.audit')
  handle(event: AuthAuditEvent): void {
    this.logger.info(`Auth audit event: ${event.type}`, {
      module: 'auth-service',
      operation: 'auth.audit',
      details: {
        type: event.type,
        occurredAt: event.occurredAt.toISOString(),
        ...event.details
      }
    })
  }
}
