import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import {
  EMAIL_PROVIDER_PORT,
  REPO_NOTIFICATION_DISPATCH,
  SMS_PROVIDER_PORT
} from '../../common/constants/injection-tokens'
import { NotificationCommandHandlers } from '../../application/commands'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaNotificationDispatchRepository } from '../../infrastructure/repositories/prisma/prisma.notification-dispatch.repository'
import { LocalEmailProviderAdaptor } from '../../infrastructure/providers/local-email-provider.adaptor'
import { LocalSmsProviderAdaptor } from '../../infrastructure/providers/local-sms-provider.adaptor'
import { NotificationGrpcController } from '../../interfaces/grpc/notification.grpc.controller'

@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [
    ValidatingCommandBus,
    { provide: REPO_NOTIFICATION_DISPATCH, useClass: PrismaNotificationDispatchRepository },
    { provide: EMAIL_PROVIDER_PORT, useClass: LocalEmailProviderAdaptor },
    { provide: SMS_PROVIDER_PORT, useClass: LocalSmsProviderAdaptor },
    LocalEmailProviderAdaptor,
    LocalSmsProviderAdaptor,
    ...NotificationCommandHandlers
  ],
  controllers: [NotificationGrpcController]
})
export class NotificationModule {}
