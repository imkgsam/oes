import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { NotificationModule } from './modules/notification/notification.module'

@Module({
  imports: [
    RegistryModule,
    LoggingModule.forRoot({ serviceName: 'notification-service' }),
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true
    }),
    NotificationModule
  ]
})
/**
 * AppModule wires notification-service infrastructure and enables service-scoped logging metadata.
 */
export class AppModule {}
