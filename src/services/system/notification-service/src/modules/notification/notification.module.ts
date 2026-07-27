import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { NatsJetStreamModule, NatsJetStreamRuntimeConfig } from '@oes/common'
import {
  EMAIL_PROVIDER_PORT,
  REPO_NOTIFICATION_DISPATCH,
  SMS_PROVIDER_PORT
} from '../../common/constants/injection-tokens'
import { NotificationCommandHandlers } from '../../application/commands'
import { CollaborationTaskNotificationHandler } from '../../application/events/collaboration-task-notification.handler'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaNotificationInboxRepository } from '../../infrastructure/inbox/prisma-notification-inbox.repository'
import { CollaborationTaskEventConsumer } from '../../infrastructure/events/collaboration-task-event.consumer'
import { NotificationEventDlqTransfer } from '../../infrastructure/events/notification-event-dlq.transfer'
import { NotificationCollaborationTaskEventWorker } from '../../infrastructure/events/notification-collaboration-task-event.worker'
import { PrismaNotificationDispatchRepository } from '../../infrastructure/repositories/prisma/prisma.notification-dispatch.repository'
import { LocalEmailProviderAdaptor } from '../../infrastructure/providers/local-email-provider.adaptor'
import { LocalSmsProviderAdaptor } from '../../infrastructure/providers/local-sms-provider.adaptor'
import { NotificationGrpcController } from '../../interfaces/grpc/notification.grpc.controller'

@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    NatsJetStreamModule.forRoot(notificationNatsRuntimeOptions())
  ],
  providers: [
    ValidatingCommandBus,
    { provide: REPO_NOTIFICATION_DISPATCH, useClass: PrismaNotificationDispatchRepository },
    { provide: EMAIL_PROVIDER_PORT, useClass: LocalEmailProviderAdaptor },
    { provide: SMS_PROVIDER_PORT, useClass: LocalSmsProviderAdaptor },
    PrismaNotificationInboxRepository,
    {
      provide: CollaborationTaskNotificationHandler,
      useFactory: (inbox: PrismaNotificationInboxRepository) =>
        new CollaborationTaskNotificationHandler(inbox),
      inject: [PrismaNotificationInboxRepository]
    },
    NotificationEventDlqTransfer,
    {
      provide: CollaborationTaskEventConsumer,
      useFactory: (
        handler: CollaborationTaskNotificationHandler,
        dlq: NotificationEventDlqTransfer
      ) => new CollaborationTaskEventConsumer(handler, dlq),
      inject: [CollaborationTaskNotificationHandler, NotificationEventDlqTransfer]
    },
    NotificationCollaborationTaskEventWorker,
    LocalEmailProviderAdaptor,
    LocalSmsProviderAdaptor,
    ...NotificationCommandHandlers
  ],
  controllers: [NotificationGrpcController]
})
export class NotificationModule {}

/** Maps the deployment-approved Notification credential names onto the shared runtime's provider-neutral option shape. */
function notificationNatsRuntimeOptions() {
  return NatsJetStreamRuntimeConfig.fromEnvironment({
    ...process.env,
    NATS_USER: process.env.NATS_NOTIFICATION_USER,
    NATS_PASSWORD: process.env.NATS_NOTIFICATION_PASSWORD,
    NATS_CLIENT_NAME: process.env.NATS_CLIENT_NAME ?? 'notification-service'
  })
}
