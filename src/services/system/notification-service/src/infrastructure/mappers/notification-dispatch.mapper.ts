import { NotificationDispatch } from '../../domain/aggregates/notification-dispatch.aggregate'

type PrismaNotificationDispatchRecord = {
  id: string
  channel: 'EMAIL' | 'SMS'
  category: 'AUTH_OTP' | 'AUTH_SECURITY_ALERT' | 'WORKFLOW_REMINDER' | 'BUSINESS_STATUS'
  sourceService: string
  tenantId: string
  orgId: string | null
  traceId: string | null
  requestId: string | null
  recipientAddress: string
  recipientDisplayName: string | null
  templateKey: string
  variablePayload: unknown
  idempotencyKey: string
  status: 'ACCEPTED' | 'QUEUED' | 'REJECTED'
  rejectionReason: string | null
  subjectOverride: string | null
  providerRoute: string | null
  createdAt: Date
  updatedAt: Date
  acceptedAt: Date | null
}

export class NotificationDispatchMapper {
  static toDomain(record: PrismaNotificationDispatchRecord): NotificationDispatch {
    return new NotificationDispatch({
      id: record.id,
      channel: record.channel,
      category: record.category,
      sourceService: record.sourceService,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      traceId: record.traceId ?? undefined,
      requestId: record.requestId ?? undefined,
      recipientAddress: record.recipientAddress,
      recipientDisplayName: record.recipientDisplayName ?? undefined,
      templateKey: record.templateKey,
      variablePayload: (record.variablePayload as Record<string, string>) ?? {},
      idempotencyKey: record.idempotencyKey,
      status: record.status,
      rejectionReason: record.rejectionReason ?? undefined,
      subjectOverride: record.subjectOverride ?? undefined,
      providerRoute: record.providerRoute ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      acceptedAt: record.acceptedAt ?? undefined
    })
  }

  static toPersistence(dispatch: NotificationDispatch) {
    const props = dispatch.getProps()

    return {
      id: props.id,
      channel: props.channel,
      category: props.category,
      sourceService: props.sourceService,
      tenantId: props.tenantId,
      orgId: props.orgId ?? null,
      traceId: props.traceId ?? null,
      requestId: props.requestId ?? null,
      recipientAddress: props.recipientAddress,
      recipientDisplayName: props.recipientDisplayName ?? null,
      templateKey: props.templateKey,
      variablePayload: props.variablePayload,
      idempotencyKey: props.idempotencyKey,
      status: props.status,
      rejectionReason: props.rejectionReason ?? null,
      subjectOverride: props.subjectOverride ?? null,
      providerRoute: props.providerRoute ?? null,
      acceptedAt: props.acceptedAt ?? null
    }
  }
}
