import { randomUUID } from 'node:crypto'
import { createOesCloudEvent } from '@oes/common/events'
import {
  AUTH_EXECUTION_TOKEN_REVOKED_EVENT_CONTRACT,
  type AuthExecutionTokenRevokedEventData,
} from '@oes/common/contracts'
import { PrismaService } from '../../prisma/prisma.service'

/** Carries Auth persistence correlation separately from the shared public event payload. */
export interface ExecutionTokenRevocationRecordInput {
  readonly data: AuthExecutionTokenRevokedEventData
  readonly auditRef: string
  readonly traceId: string
  readonly correlationId?: string
}

/** Persists one Auth emergency-revocation decision, audit fact, and Event-owned outbox intent atomically. */
export class PrismaExecutionTokenRevocationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Records an irreversible selector version without publishing directly to a transport provider. */
  async record(input: ExecutionTokenRevocationRecordInput): Promise<void> {
    const { data, auditRef, traceId, correlationId } = input
    const event = createOesCloudEvent({
      contract: AUTH_EXECUTION_TOKEN_REVOKED_EVENT_CONTRACT,
      eventId: randomUUID(),
      occurredAt: data.effectiveAt,
      executionScope: 'SYSTEM',
      traceId,
      correlationId,
      auditRef,
      data,
    })
    const prisma = this.prisma as unknown as { $transaction(work: (tx: any) => Promise<void>): Promise<void> }
    await prisma.$transaction(async (tx) => {
      const selector = { selectorKind: data.selectorKind, selectorRef: data.selectorRef }
      const existing = await tx.executionTokenRevocation.findUnique({ where: { selectorKind_selectorRef: selector } })
      const persisted = await tx.executionTokenRevocation.upsert({
        where: { selectorKind_selectorRef: selector },
        create: { selectorKind: data.selectorKind, selectorRef: data.selectorRef, revocationVersion: data.revocationVersion, effectiveAt: new Date(data.effectiveAt), denyUntil: new Date(data.denyUntil), reasonCode: data.reasonCode, auditRef, traceId, correlationId: correlationId ?? null },
        update: {},
      })
      const update = await tx.executionTokenRevocation.updateMany({
        where: { ...selector, revocationVersion: { lt: data.revocationVersion } },
        data: { revocationVersion: data.revocationVersion, effectiveAt: new Date(data.effectiveAt), denyUntil: new Date(data.denyUntil), reasonCode: data.reasonCode, auditRef, traceId, correlationId: correlationId ?? null },
      })
      if (existing && update.count === 0 && persisted.revocationVersion >= data.revocationVersion) return
      await tx.auditEvent.create({ data: { id: auditRef, service: 'auth-service', module: 'execution_token', eventType: 'EXECUTION_TOKEN_REVOKED', occurredAt: new Date(data.effectiveAt), result: 'SUCCEEDED', operatorId: null, operatorType: 'SYSTEM', tenantId: null, orgId: null, traceId, resourceType: 'execution_token_revocation', resourceId: data.selectorRef, details: data } })
      await tx.authEventOutbox.create({ data: { eventId: event.id, eventType: event.type, eventVersion: event.oeseventversion, payload: event, occurredAt: new Date(event.time) } })
    })
  }
}
