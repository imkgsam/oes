import { Injectable } from '@nestjs/common'
import { AuditEnvelope } from '@oes/common'
import { CrmAuditWriter } from '../../application/ports/crm-audit-writer.port'
import { PrismaCrmRecordMapper } from '../repositories/prisma/prisma-crm-record.mapper'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaCrmAuditRepository persists local CRM audit envelopes inside the service database. */
@Injectable()
export class PrismaCrmAuditRepository implements CrmAuditWriter {
  constructor(private readonly prisma: PrismaService) {}

  async append(envelope: AuditEnvelope): Promise<void> {
    await this.prisma.getExecutionClient().crmAuditEnvelope.create({
      data: {
        id: envelope.eventId,
        service: envelope.service,
        module: envelope.module,
        eventType: envelope.eventType,
        occurredAt: envelope.occurredAt,
        result: envelope.result,
        operatorId: envelope.operator.operatorId ?? null,
        operatorType: envelope.operator.operatorType,
        tenantId: envelope.scope.tenantId ?? null,
        orgId: envelope.scope.orgId ?? null,
        traceId: envelope.trace.traceId ?? null,
        resourceType: envelope.resource.resourceType,
        resourceId: envelope.resource.resourceId ?? null,
        details: PrismaCrmRecordMapper.toInputJson(envelope.details)
      }
    })
  }
}
