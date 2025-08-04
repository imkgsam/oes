import { Module } from '@nestjs/common'
import { ClientModule } from '@oes/common/modules/clients/client.module'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { IdentityServiceAdaptor } from '../adaptors/identity-service.adaptor'
import { PermissionServiceAdaptor } from '../adaptors/permission-service.adaptor'
import { NotificationServiceAdaptor } from '../adaptors/notification-service.adaptor'
import { AuditServiceAdaptor } from '../adaptors/audit-service.adaptor'
import { IIdentityServicePort } from 'src/application/ports/identity-service.port'
import { IPermissionServicePort } from 'src/application/ports/permission-service.port'
import { INotificationServicePort } from 'src/application/ports/notification-service.port'
import { IAuditServicePort } from 'src/application/ports/audit-service.port'

/**
 * 外部服务模块
 *
 * 配置 Auth Service 依赖的外部服务客户端和适配器
 */
@Module({
  imports: [
    // 注册外部服务客户端
    ClientModule.register([
      ServiceKeys.IDENTITY_TCP,
      ServiceKeys.PERMISSION_TCP,
      ServiceKeys.NOTIFICATION_TCP,
      ServiceKeys.AUDIT_TCP,
    ]),
  ],
  providers: [
    // Identity Service 适配器
    {
      provide: IIdentityServicePort,
      useClass: IdentityServiceAdaptor,
    },
    // Permission Service 适配器
    {
      provide: IPermissionServicePort,
      useClass: PermissionServiceAdaptor,
    },
    // Notification Service 适配器
    {
      provide: INotificationServicePort,
      useClass: NotificationServiceAdaptor,
    },
    // Audit Service 适配器
    {
      provide: IAuditServicePort,
      useClass: AuditServiceAdaptor,
    },
  ],
  exports: [
    IIdentityServicePort,
    IPermissionServicePort,
    INotificationServicePort,
    IAuditServicePort,
  ],
})
export class ExternalServicesModule {}
