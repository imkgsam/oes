import { Injectable } from '@nestjs/common'
import { AuditEnvelope, flattenAuditEnvelope } from '@oes/common'
import { AppLogger } from '@oes/common/logging'
import { ItemMasterAuditWriter } from '../../../application/ports/item-master-audit-writer.port'
import { PrismaService } from '../../prisma/prisma.service'

/** PrismaItemMasterAuditRepository persists local command audit envelopes and mirrors them into structured logs. */
@Injectable()
export class PrismaItemMasterAuditRepository implements ItemMasterAuditWriter {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger
  ) {}

  async append(envelope: AuditEnvelope): Promise<void> {
    const flat = flattenAuditEnvelope(envelope)

    await this.prisma.getExecutionClient().auditEvent.create({
      data: {
        id: flat.eventId,
        service: flat.service,
        module: flat.module,
        eventType: flat.eventType,
        occurredAt: flat.occurredAt,
        result: flat.result,
        operatorId: flat.operatorId,
        operatorType: flat.operatorType,
        tenantId: flat.tenantId,
        orgId: flat.orgId,
        traceId: flat.traceId,
        resourceType: flat.resourceType,
        resourceId: flat.resourceId,
        details: flat.details as any,
        createdAt: flat.occurredAt
      }
    })

    this.logger.info(`Item master audit event: ${flat.eventType}`, {
      module: 'item-master-service',
      operation: 'item-master.audit',
      traceId: flat.traceId ?? undefined,
      details: flat
    })
  }
}
