import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../prisma/generated/prisma'
import { AnnotationAuditPort } from '../../application/ports/annotation-audit.port'
import { PrismaService } from '../prisma/prisma.service'

/** LocalAnnotationAuditRepository persists Annotation P1 command audit envelopes locally. */
@Injectable()
export class LocalAnnotationAuditRepository implements AnnotationAuditPort {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: Parameters<AnnotationAuditPort['record']>[0]): Promise<void> {
    await this.prisma.collaborationAnnotationAuditEnvelope.create({
      data: {
        tenantId: input.tenantId,
        annotationId: input.annotationId,
        action: input.action,
        result: input.result,
        operatorAccountId: input.operatorAccountId,
        authorAccountId: input.authorAccountId,
        objectOwnerService: input.objectOwnerService,
        objectType: input.objectType,
        objectId: input.objectId,
        traceId: input.traceId,
        auditId: input.auditId,
        reasonSnapshot: input.reasonSnapshot,
        payload: input.payload as Prisma.InputJsonValue | undefined
      }
    })
  }
}
