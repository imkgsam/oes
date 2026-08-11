import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { createHash } from 'node:crypto'
import {
  DispatchPriority,
  DispatchStatus,
  NotificationCategory,
  SendEmailResponse
} from '@oes/common/generated/notification_service'
import { NOTIFICATION_DELIVERY_PAYLOAD_PROTECTOR, REPO_NOTIFICATION_DISPATCH } from '../../common/constants/injection-tokens'
import { NotificationDispatch, NotificationCategory as DomainCategory } from '../../domain/aggregates/notification-dispatch.aggregate'
import { INotificationDispatchRepository } from '../../domain/repositories/notification-dispatch.repository'
import { NotificationDeliveryPayloadProtector } from '../../domain/services/notification-delivery-payload-protection.port'
import { SendEmailCommand } from './send-email.command'

type PreparedDispatch = Readonly<{ recipient: string; displayName?: string; templateKey: string; variables: Record<string, string>; idempotencyKey: string; subjectOverride?: string; category: DomainCategory }>

/** Accepts only the frozen Auth EMAIL profiles and atomically queues a protected provider payload. */
@CommandHandler(SendEmailCommand)
export class SendEmailHandler implements ICommandHandler<SendEmailCommand, SendEmailResponse> {
  constructor(
    @Inject(REPO_NOTIFICATION_DISPATCH) private readonly dispatchRepository: INotificationDispatchRepository,
    @Inject(NOTIFICATION_DELIVERY_PAYLOAD_PROTECTOR) private readonly protector: NotificationDeliveryPayloadProtector
  ) {}

  async execute(command: SendEmailCommand): Promise<SendEmailResponse> {
    const prepared = prepareAuthDispatch(command.request, 'EMAIL')
    if (typeof prepared === 'string') return reject(prepared)
    try {
      const expiresAt = new Date(Date.now() + 15 * 60_000)
      const digest = canonicalDigest('EMAIL', prepared)
      const dispatch = NotificationDispatch.accept({
        channel: 'EMAIL', category: prepared.category, sourceService: command.authority.sourceService,
        machinePrincipal: command.authority.machinePrincipal, traceId: command.authority.traceId,
        requestId: command.authority.requestId, recipientAddress: prepared.recipient,
        recipientDisplayName: prepared.displayName, templateKey: prepared.templateKey,
        idempotencyKey: prepared.idempotencyKey, subjectOverride: prepared.subjectOverride,
        commandDigest: digest, protectedPayload: this.protector.protect({ recipient: prepared.recipient, displayName: prepared.displayName, variables: prepared.variables, subjectOverride: prepared.subjectOverride }, expiresAt),
        protectedPayloadExpiresAt: expiresAt
      })
      return accept(await this.dispatchRepository.accept(dispatch))
    } catch (error) {
      return reject(error instanceof Error && error.message === 'IDEMPOTENCY_CONFLICT' ? 'IDEMPOTENCY_CONFLICT' : 'DISPATCH_ACCEPTANCE_UNAVAILABLE')
    }
  }
}

/** Validates the four frozen profiles before any persistence, provider, or secret-protection work occurs. */
export function prepareAuthDispatch(request: any, channel: 'EMAIL' | 'SMS'): PreparedDispatch | string {
  const templateKey = exact(request.templateKey)
  const idempotencyKey = exact(request.idempotencyKey)
  if (!idempotencyKey || idempotencyKey.length > 160) return 'INVALID_DISPATCH_PROFILE'
  const recipient = normalizeRecipient(exact(request.recipient?.address), channel)
  if (!recipient) return 'INVALID_RECIPIENT'
  const displayName = normalizeDisplayName(request.recipient?.displayName)
  if (displayName === null) return 'INVALID_RECIPIENT'
  if (request.priority !== DispatchPriority.DISPATCH_PRIORITY_HIGH) return 'INVALID_DISPATCH_PROFILE'
  const category = categoryOf(request.category)
  const expected = channel === 'EMAIL'
    ? (templateKey === 'AUTH_OTP_EMAIL' ? { category: 'AUTH_OTP' as const, required: ['code', 'ttlMinutes', 'maskedDestination'], optional: [], limit: 192, otp: true }
      : templateKey === 'ACCOUNT_INVITATION_EMAIL' ? { category: 'AUTH_SECURITY_ALERT' as const, required: ['recipient', 'loginMode'], optional: ['displayName'], limit: 384, otp: false } : undefined)
    : (templateKey === 'AUTH_OTP_SMS' ? { category: 'AUTH_OTP' as const, required: ['code', 'ttlMinutes', 'maskedDestination'], optional: [], limit: 192, otp: true }
      : templateKey === 'ACCOUNT_INVITATION_SMS' ? { category: 'AUTH_SECURITY_ALERT' as const, required: ['recipient', 'loginMode'], optional: ['displayName'], limit: 160, otp: false } : undefined)
  if (!expected || category !== expected.category) return 'INVALID_DISPATCH_PROFILE'
  const subjectOverride = exact(request.subjectOverride)
  if (channel === 'EMAIL' && subjectOverride) return 'INVALID_DISPATCH_PROFILE'
  const variables: Record<string, string> = {}
  for (const item of request.variables ?? []) {
    const key = exact(item?.key); const value = typeof item?.value === 'string' ? item.value : undefined
    if (!key || value === undefined || Object.prototype.hasOwnProperty.call(variables, key)) return 'INVALID_TEMPLATE_VARIABLES'
    variables[key] = value
  }
  const allowed = new Set([...expected.required, ...expected.optional])
  if (Object.keys(variables).some((key) => !allowed.has(key)) || expected.required.some((key) => variables[key] === undefined)) return 'INVALID_TEMPLATE_VARIABLES'
  if (Object.values(variables).reduce((size, value) => size + Buffer.byteLength(value, 'utf8'), 0) > expected.limit) return 'INVALID_TEMPLATE_VARIABLES'
  if (expected.otp) {
    if (displayName || !/^[\x21-\x7e]{1,16}$/u.test(variables.code) || !/^(?:[1-9]|1[0-5])$/u.test(variables.ttlMinutes) || invalidDisplayText(variables.maskedDestination, 160)) return 'INVALID_TEMPLATE_VARIABLES'
  } else {
    if (variables.recipient !== recipient || variables.loginMode !== 'OTP_FIRST' || (variables.displayName ?? '') !== (displayName ?? '')) return 'INVALID_TEMPLATE_VARIABLES'
  }
  return { recipient, ...(displayName ? { displayName } : {}), templateKey, variables, idempotencyKey, ...(subjectOverride ? { subjectOverride } : {}), category }
}

function normalizeRecipient(value: string | undefined, channel: 'EMAIL' | 'SMS'): string | undefined {
  if (!value) return undefined
  if (channel === 'SMS') {
    const normalized = value.trim().replace(/[ \-()]/gu, '')
    return /^(?:\+)?\d{6,20}$/u.test(normalized) && normalized.length <= 21 ? normalized : undefined
  }
  const normalized = value.trim().normalize('NFC').toLowerCase()
  if (/\s|[\u0000\r\n\p{C}]/u.test(normalized) || normalized.length < 3 || Buffer.byteLength(normalized) > 254) return undefined
  const parts = normalized.split('@')
  return parts.length === 2 && Buffer.byteLength(parts[0]) <= 64 && parts[0].length > 0 && parts[1].length > 0 && Buffer.byteLength(parts[1]) <= 253 && parts[1].split('.').every((part) => part.length > 0) ? normalized : undefined
}

function normalizeDisplayName(value: unknown): string | null | undefined {
  if (value === undefined || value === '') return undefined
  if (typeof value !== 'string') return null
  const normalized = value.trim().normalize('NFC')
  return invalidDisplayText(normalized, 120) ? null : normalized
}
function invalidDisplayText(value: string, limit: number): boolean { return Buffer.byteLength(value, 'utf8') > limit || /[\u0000\r\n\p{C}]/u.test(value) }
function exact(value: unknown): string | undefined { return typeof value === 'string' && value.trim() === value && value.length > 0 ? value : undefined }
function categoryOf(value: NotificationCategory): DomainCategory | undefined { return value === NotificationCategory.NOTIFICATION_CATEGORY_AUTH_OTP ? 'AUTH_OTP' : value === NotificationCategory.NOTIFICATION_CATEGORY_AUTH_SECURITY_ALERT ? 'AUTH_SECURITY_ALERT' : undefined }
function canonicalDigest(channel: string, value: PreparedDispatch): string { return createHash('sha256').update(JSON.stringify({ channel, ...value, variables: Object.entries(value.variables).sort(([a], [b]) => a.localeCompare(b)) })).digest('hex') }
function accept(dispatch: NotificationDispatch): SendEmailResponse { return { accepted: true, dispatchId: dispatch.getProps().id, status: DispatchStatus.DISPATCH_STATUS_QUEUED } }
export function reject(reason: string): SendEmailResponse { return { accepted: false, dispatchId: '', status: DispatchStatus.DISPATCH_STATUS_REJECTED, rejectionReason: reason } }
