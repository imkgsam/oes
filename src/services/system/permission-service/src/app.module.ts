import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { PermissionModule } from './modules/permission/permission.module'
import { RoleModule } from './modules/role/role.module'
import { PolicyModule } from './modules/policy/policy.module'
import { AuthorizationModule as PermissionAuthorizationModule } from './modules/authorization/authorization.module'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { ConfigModule } from '@nestjs/config'
import { NacosConfigModule } from '@oes/common/config'
import { AuthorizationModule } from '@oes/common/authorization'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['src/services/system/permission-service/.env', '.env']
    }),
    LoggingModule.forRoot({ serviceName: 'permission-service' }),
    EventEmitterModule.forRoot(),
    RegistryModule, // Nacos service registration and discovery
    NacosConfigModule, // Nacos config center
    AuthorizationModule,

    PermissionModule,
    RoleModule,
    PolicyModule,
    PermissionAuthorizationModule
  ]
})
/**
 * AppModule wires permission-service infrastructure and enables service-scoped logging metadata.
 */
export class AppModule {}
