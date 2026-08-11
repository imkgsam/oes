import { randomUUID } from 'crypto'

export type NotificationChannel = 'EMAIL' | 'SMS'
export type NotificationCategory =
  | 'AUTH_OTP'
  | 'AUTH_SECURITY_ALERT'
  | 'WORKFLOW_REMINDER'
  | 'BUSINESS_STATUS'
export type NotificationDispatchStatus = 'ACCEPTED' | 'QUEUED' | 'REJECTED'

export interface NotificationDispatchProps {
  id: string
  channel: NotificationChannel
  category: NotificationCategory
  sourceService: string
  machinePrincipal: string
  tenantId?: string
  orgId?: string
  traceId?: string
  requestId?: string
  recipientAddress: string
  recipientDisplayName?: string
  templateKey: string
  variablePayload: Record<string, never>
  commandDigest: string
  protectedPayload: string
  protectedPayloadExpiresAt: Date
  idempotencyKey: string
  status: NotificationDispatchStatus
  rejectionReason?: string
  subjectOverride?: string
  providerRoute?: string
  createdAt: Date
  updatedAt: Date
  acceptedAt?: Date
}

export class NotificationDispatch {
  constructor(private readonly props: NotificationDispatchProps) {}

  static accept(input: {
    channel: NotificationChannel
    category: NotificationCategory
    sourceService: string
    traceId?: string
    requestId?: string
    recipientAddress: string
    recipientDisplayName?: string
    templateKey: string
    idempotencyKey: string
    subjectOverride?: string
    providerRoute?: string
    machinePrincipal: string
    commandDigest: string
    protectedPayload: string
    protectedPayloadExpiresAt: Date
  }): NotificationDispatch {
    const now = new Date()

    return new NotificationDispatch({
      id: randomUUID(),
      channel: input.channel,
      category: input.category,
      sourceService: input.sourceService,
      machinePrincipal: input.machinePrincipal,
      traceId: input.traceId,
      requestId: input.requestId,
      recipientAddress: input.recipientAddress,
      recipientDisplayName: input.recipientDisplayName,
      templateKey: input.templateKey,
      variablePayload: {},
      idempotencyKey: input.idempotencyKey,
      commandDigest: input.commandDigest,
      protectedPayload: input.protectedPayload,
      protectedPayloadExpiresAt: input.protectedPayloadExpiresAt,
      status: 'QUEUED',
      subjectOverride: input.subjectOverride,
      providerRoute: input.providerRoute,
      createdAt: now,
      updatedAt: now,
      acceptedAt: now
    })
  }

  getProps(): NotificationDispatchProps {
    return { ...this.props }
  }
}
