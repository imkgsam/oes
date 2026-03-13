import { Module } from '@nestjs/common'
import { PermissionModule } from './modules/permission/permission.module'
import { RoleModule } from './modules/role/role.module'
import { PolicyModule } from './modules/policy/policy.module'
import { AuthorizationModule } from './modules/authorization/authorization.module'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { ConfigModule } from '@nestjs/config'
import { NacosConfigModule } from '@oes/common/config'
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['src/services/system/permission-service/.env', '.env']
    }),
    LoggingModule,
    RegistryModule, // Nacos service registration and discovery
    NacosConfigModule, // Nacos config center

    PermissionModule,
    RoleModule,
    PolicyModule,
    AuthorizationModule
  ]
})
export class AppModule {}
