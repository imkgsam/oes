import { AuditEventRecord } from '@oes/common/generated/auth_service'
import { AuditEventView } from '../../application/queries'

/**
 * AuthGrpcPresenter converts auth-service query views into generated gRPC response records.
 */
export class AuthGrpcPresenter {
  /**
   * toAuditEventRecord maps one auth audit view into the generated audit record payload.
   */
  static toAuditEventRecord(event: AuditEventView): AuditEventRecord {
    return {
      eventId: event.eventId,
      service: event.service,
      module: event.module,
      eventType: event.eventType,
      occurredAt: event.occurredAt.toISOString(),
      result: event.result,
      operatorId: event.operatorId ?? '',
      operatorType: event.operatorType,
      tenantId: event.tenantId ?? '',
      orgId: event.orgId ?? '',
      traceId: event.traceId ?? '',
      resourceType: event.resourceType,
      resourceId: event.resourceId ?? '',
      detailsJson: JSON.stringify(event.details)
    }
  }
}
