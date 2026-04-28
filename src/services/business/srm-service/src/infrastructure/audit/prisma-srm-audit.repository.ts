import { Injectable } from '@nestjs/common'
import { AuditEnvelope } from '@oes/common'
import { SrmAuditWriter } from '../../application/ports/srm-audit-writer.port'
import { PrismaSrmRecordMapper } from '../repositories/prisma/prisma-srm-record.mapper'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaSrmAuditRepository persists local SRM audit envelopes inside the service database. */
@Injectable()
export class PrismaSrmAuditRepository implements SrmAuditWriter {
  constructor(private readonly prisma: PrismaService) {}

  async append(envelope: AuditEnvelope): Promise<void> {
    await this.prisma.getExecutionClient().srmAuditEnvelope.create({
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
        details: PrismaSrmRecordMapper.toInputJson(envelope.details)
      }
    })
  }
}
