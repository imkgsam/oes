import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../prisma/generated/prisma'
import { TaskAuditPort } from '../../application/ports/task-audit.port'
import { PrismaService } from '../prisma/prisma.service'

/** LocalTaskAuditRepository persists Task P1 command audit envelopes in collaboration-service storage. */
@Injectable()
export class LocalTaskAuditRepository implements TaskAuditPort {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: Parameters<TaskAuditPort['record']>[0]): Promise<void> {
    await this.prisma.collaborationTaskAuditEnvelope.create({
      data: {
        tenantId: input.tenantId,
        taskId: input.taskId,
        action: input.action,
        result: input.result,
        operatorAccountId: input.operatorAccountId,
        createdByAccountId: input.createdByAccountId,
        assigneeAccountId: input.assigneeAccountId,
        traceId: input.traceId,
        auditId: input.auditId,
        reasonSnapshot: input.reasonSnapshot,
        payload: input.payload as Prisma.InputJsonValue | undefined
      }
    })
  }
}
