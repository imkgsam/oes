import { NotificationDispatch } from '../../../domain/aggregates/notification-dispatch.aggregate';
import { INotificationDispatchRepository } from '../../../domain/repositories/notification-dispatch.repository';
import { PrismaService } from '../../prisma/prisma.service';
export declare class PrismaNotificationDispatchRepository implements INotificationDispatchRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByIdempotencyKey(idempotencyKey: string): Promise<NotificationDispatch | null>;
    save(dispatch: NotificationDispatch): Promise<NotificationDispatch>;
}
