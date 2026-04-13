import { Injectable } from '@nestjs/common'
import { NotificationDispatch } from '../../../domain/aggregates/notification-dispatch.aggregate'
import { INotificationDispatchRepository } from '../../../domain/repositories/notification-dispatch.repository'
import { NotificationDispatchMapper } from '../../mappers/notification-dispatch.mapper'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PrismaNotificationDispatchRepository implements INotificationDispatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdempotencyKey(idempotencyKey: string): Promise<NotificationDispatch | null> {
    const record = await this.prisma.notificationDispatch.findUnique({
      where: { idempotencyKey }
    })

    return record ? NotificationDispatchMapper.toDomain(record) : null
  }

  async save(dispatch: NotificationDispatch): Promise<NotificationDispatch> {
    const persisted = NotificationDispatchMapper.toPersistence(dispatch)

    const record = await this.prisma.notificationDispatch.upsert({
      where: { id: persisted.id },
      update: persisted,
      create: persisted
    })

    return NotificationDispatchMapper.toDomain(record)
  }
}
