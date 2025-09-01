import { Module } from '@nestjs/common'
import { ClientModule } from '@oes/common/modules/clients/client.module'
import { ServiceKeys } from '@oes/common/modules/clients/service-map'
import { IdentityServiceAdaptor } from '../adaptors'
import { PermissionServiceAdaptor } from '../adaptors'
import { IDENTITY_SERVICE, PERMISSION_SERVICE } from '@oes/common/constants/service.symbols'

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
      ServiceKeys.AUDIT_TCP
    ])
  ],
  providers: [
    {
      provide: IDENTITY_SERVICE,
      useClass: IdentityServiceAdaptor
    },
    {
      provide: PERMISSION_SERVICE,
      useClass: PermissionServiceAdaptor
    }
  ],
  exports: [IDENTITY_SERVICE, PERMISSION_SERVICE]
})
export class ExternalServicesModule {}
