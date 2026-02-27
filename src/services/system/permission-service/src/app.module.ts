import { Module } from '@nestjs/common'
import { PermissionModule } from './modules/permission/permission.module'
import { RoleModule } from './modules/role/role.module'
import { PolicyModule } from './modules/policy/policy.module'
import { LoggingModule } from '@oes/common/logging/logging.module'
import { RegistryModule } from '@oes/common/registry/registry.module'
import { NacosConfigModule } from '@oes/common/config/nacos.config.module'
@Module({
  imports: [
    LoggingModule,
    RegistryModule, // Nacos service registration and discovery
    NacosConfigModule, // Nacos config center

    PermissionModule,
    RoleModule,
    PolicyModule
  ]
})
export class AppModule {}
