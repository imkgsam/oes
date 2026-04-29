import { Injectable } from '@nestjs/common'
import { AuditEnvelope, flattenAuditEnvelope } from '@oes/common'
import { FinanceAuditWriter } from '../../application/ports/finance-audit-writer.port'
import { PrismaService } from '../prisma/prisma.service'

/** PrismaFinanceAuditRepository persists local finance command audit envelopes inside the service database. */
@Injectable()
export class PrismaFinanceAuditRepository implements FinanceAuditWriter {
  constructor(private readonly prisma: PrismaService) {}

  async append(envelope: AuditEnvelope): Promise<void> {
    const flat = flattenAuditEnvelope(envelope)

    await this.prisma.getExecutionClient().financeAuditEnvelope.create({
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
        details: flat.details as never,
        createdAt: flat.occurredAt
      }
    })
  }
}
